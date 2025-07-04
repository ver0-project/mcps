import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';
import {TerminalQuestionnaire} from '../terminal/terminal.js';

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
			'Ask user questions through terminal interface and get responses. Supports text input and multiple choice questions.',
		inputSchema: ASK_QUESTION_INPUT_SCHEMA,
		annotations: {
			title: 'Ask Question',
			readOnlyHint: false,
		},
	};

	private readonly terminalQuestionnaire: TerminalQuestionnaire;

	constructor() {
		this.terminalQuestionnaire = new TerminalQuestionnaire();
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
		try {
			// Validate input and create questionnaire
			const questionnaire = {
				questions: input.questions,
			};

			// Execute questionnaire through terminal interface
			const response = await this.terminalQuestionnaire.execute(questionnaire);

			// Check if questionnaire was cancelled or timed out
			if (response.cancelled) {
				return {
					isError: true,
					content: [
						{
							type: 'text',
							text: 'Questionnaire was cancelled by the user.',
						},
					],
				};
			}

			if (response.timedOut) {
				return {
					isError: true,
					content: [
						{
							type: 'text',
							text: 'Questionnaire timed out waiting for user input.',
						},
					],
				};
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
						text: JSON.stringify(response, null, 2),
					},
				],
			};
		} catch (error) {
			// Handle unexpected errors
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

			return {
				isError: true,
				content: [
					{
						type: 'text',
						text: `Failed to execute questionnaire: ${errorMessage}`,
					},
				],
			};
		}
	};
}
