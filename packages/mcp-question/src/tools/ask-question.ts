import path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {ErrorCode, McpError} from '@modelcontextprotocol/sdk/types.js';
import type {ToolConfig, Questionnaire, QuestionnaireResponse} from '../types.js';
import {TerminalSpawner} from '../terminal/spawn-terminal.js';

// Zod schema for question option validation
const questionOptionSchema = z.object({
	id: z.string().describe('Unique identifier for the option'),
	label: z.string().describe('Display text for the option'),
	description: z.string().optional().describe('Optional description for the option'),
});

// Zod schema for open question validation
const questionOpenSchema = z.object({
	type: z.literal('open'),
	id: z.string().describe('Unique identifier for the question'),
	prompt: z.string().describe('The question prompt text to display to the user'),
	description: z.string().optional().describe('Optional description or additional context'),
	placeholder: z.string().optional().describe('Placeholder text to show in the input field'),
	minLength: z.number().int().min(0).optional().describe('Minimum length for the answer'),
	maxLength: z.number().int().min(1).optional().describe('Maximum length for the answer'),
});

// Zod schema for multiple choice question validation
const questionMultipleChoiceSchema = z.object({
	type: z.literal('multiple_choice'),
	id: z.string().describe('Unique identifier for the question'),
	prompt: z.string().describe('The question prompt text to display to the user'),
	description: z.string().optional().describe('Optional description or additional context'),
	options: z.array(questionOptionSchema).min(1).describe('Array of available choices'),
	defaultOptionID: z.string().optional().describe('ID of the option selected by default'),
	allowMultiple: z.boolean().optional().describe('Whether multiple selections are allowed'),
	minSelections: z.number().int().min(1).optional().describe('Minimum number of selections required'),
	maxSelections: z.number().int().min(1).optional().describe('Maximum number of selections allowed'),
	allowOwnVariant: z
		.boolean()
		.optional()
		.describe('Whether to allow user to provide their own variant/answer (default: true)'),
});

// Union schema for all question types
const questionSchema = z.union([questionOpenSchema, questionMultipleChoiceSchema]);

// Questionnaire input schema
export const ASK_QUESTION_INPUT_SCHEMA = {
	questions: z.array(questionSchema).min(1).max(10).describe('Array of questions to ask the user'),
};

/**
 * Ask Question Tool
 * Allows agents to ask users questions through terminal interface
 */
export class AskQuestionTool {
	readonly config: ToolConfig<typeof ASK_QUESTION_INPUT_SCHEMA, never> = {
		description:
			'Interactive user questionnaire system that spawns a terminal window for direct user input. ' +
			'Supports open-ended text questions and multiple choice questions with customizable options. ' +
			'Handles validation, defaults, and multi-selection scenarios. ' +
			'Returns structured responses with user input and metadata. ' +
			'Great to use when you need to ask a question to the user and get a response in situations of unclear context or decision making.',
		inputSchema: ASK_QUESTION_INPUT_SCHEMA,
		annotations: {
			title: 'Ask Question',
			readOnlyHint: false,
		},
	};

	private readonly questionnaireWorkloadPath: string;

	constructor() {
		// Get the path to the questionnaire workload
		const currentDir = path.dirname(fileURLToPath(import.meta.url));
		this.questionnaireWorkloadPath = path.join(currentDir, '../ui/runner.js');
	}

	get name() {
		return 'ask-question';
	}

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	/**
	 * Handle the ask question tool request
	 */
	readonly #handle: ToolCallback<typeof ASK_QUESTION_INPUT_SCHEMA> = async (input) => {
		// Validate input and create questionnaire
		const questionnaire: Questionnaire = {
			questions: input.questions,
		};

		// Create terminal spawner with questionnaire workload
		const spawner = new TerminalSpawner<Questionnaire, QuestionnaireResponse>({
			scriptPath: this.questionnaireWorkloadPath,
			inputData: questionnaire,
			ttlMs: 300_000, // 5 minutes timeout
		});

		// Execute questionnaire through terminal interface
		const result = await spawner.spawn().catch((error: unknown) => {
			throw new McpError(ErrorCode.InternalError, `Failed to spawn terminal for questionnaire.\n${String(error)}`);
		});

		// Check if questionnaire was cancelled or timed out
		if (result.timedOut) {
			throw new McpError(ErrorCode.RequestTimeout, 'Questionnaire timed out waiting for user input.');
		}

		if (!result.isSuccess) {
			throw new McpError(ErrorCode.InternalError, `Questionnaire failed for unknown reason.\n ${String(result.error)}`);
		}

		// Check if user cancelled
		if (result.output.cancelled) {
			throw new McpError(ErrorCode.InvalidRequest, 'Questionnaire was cancelled by the user.');
		}

		// Return successful response
		return {
			content: [
				{
					type: 'text',
					text: 'Questionnaire completed successfully.',
				},
				{
					type: 'text',
					text: JSON.stringify(result.output, null, 2),
				},
			],
		};
	};
}
