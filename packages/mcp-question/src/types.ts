import type {ToolAnnotations} from '@modelcontextprotocol/sdk/types.js';
import type {ZodRawShape} from 'zod';

export type ToolConfig<InputArgs extends ZodRawShape, OutputArgs extends ZodRawShape> = {
	description?: string;
	inputSchema?: InputArgs;
	outputSchema?: OutputArgs;
	annotations?: ToolAnnotations;
};

/**
 * Base question interface with common properties.
 */
export type BaseQuestion = {
	/** Unique identifier for the question */
	id: string;
	/** The question prompt text to display to the user */
	prompt: string;
	/** Optional description or additional context for the question */
	description?: string;
};

/**
 * Open-ended question that accepts text input from the user.
 */
export type QuestionOpen = {
	type: 'open';
	/** Placeholder text to show in the input field */
	placeholder?: string;
	/** Minimum length for the answer (default: 0) */
	minLength?: number;
	/** Maximum length for the answer (default: 1000) */
	maxLength?: number;
} & BaseQuestion;

/**
 * Multiple choice question with predefined options.
 */
export type QuestionMultipleChoice = {
	type: 'multiple_choice';
	/** Array of available choices */
	options: QuestionOption[];
	/** ID of the option selected by default */
	defaultOptionID?: string;
	/** Whether multiple selections are allowed (default: false) */
	allowMultiple?: boolean;
	/** Minimum number of selections required (default: 1) */
	minSelections?: number;
	/** Maximum number of selections allowed (default: 1, or options.length if allowMultiple) */
	maxSelections?: number;
	/** Whether to allow user to provide their own variant/answer (default: true) */
	allowOwnVariant?: boolean;
} & BaseQuestion;

/**
 * Option for multiple choice questions.
 */
export type QuestionOption = {
	/** Unique identifier for the option */
	id: string;
	/** Display text for the option */
	label: string;
	/** Optional description for the option */
	description?: string;
};

/**
 * Complete questionnaire definition.
 */
export type Questionnaire = {
	/** Array of questions in the questionnaire */
	questions: Array<QuestionOpen | QuestionMultipleChoice>;
};

/**
 * Response to a question.
 */
export type QuestionResponse = {
	questionId: string;
	response: string[];
	/** Custom text provided when user selected "other" option */
	customText?: string;
};

/**
 * Complete questionnaire response.
 */
export type QuestionnaireResponse = {
	/** Array of responses to each question */
	responses: QuestionResponse[];
	/** Whether the questionnaire was cancelled by the user */
	cancelled: boolean;
	/** Whether the questionnaire timed out */
	timedOut: boolean;
};
