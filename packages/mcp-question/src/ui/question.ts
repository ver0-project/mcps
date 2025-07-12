import {input, select, checkbox} from '@inquirer/prompts';
import chalk from 'chalk';
import boxen from 'boxen';
import type {
	Questionnaire,
	QuestionOpen,
	QuestionMultipleChoice,
	QuestionResponse,
	QuestionnaireResponse,
} from '../types.js';

/**
 * Display utilities for questionnaire UI.
 */
export class QuestionnaireDisplay {
	/**
	 * Display the questionnaire header.
	 */
	displayHeader(): void {
		console.log(); // Empty line for spacing

		const content = [
			chalk.bold.blue('📋 Questionnaire'),
			'',
			chalk.dim('Please answer the following questions:'),
			'',
			chalk.dim('Press Ctrl+C to cancel at any time.'),
		].join('\n');

		console.log(
			boxen(content, {
				padding: 1,
				margin: 1,
				borderStyle: 'round',
				borderColor: 'blue',
			}),
		);
	}

	/**
	 * Display a success message.
	 */
	displaySuccess(message: string): void {
		console.log(chalk.green.bold('✅ ' + message));
	}

	/**
	 * Display an error message.
	 */
	displayError(message: string): void {
		console.log(chalk.red.bold('❌ ' + message));
	}

	/**
	 * Display a warning message.
	 */
	displayWarning(message: string): void {
		console.log(chalk.yellow.bold('⚠️ ' + message));
	}

	/**
	 * Display an info message.
	 */
	displayInfo(message: string): void {
		console.log(chalk.blue('ℹ️ ' + message));
	}

	/**
	 * Format the question message with optional description.
	 */
	formatQuestionMessage(question: QuestionOpen | QuestionMultipleChoice): string {
		let message = question.prompt;

		if (question.description) {
			message += `\n${chalk.dim(question.description)}`;
		}

		return message;
	}
}

/**
 * Question executor that handles different question types.
 */
export class QuestionExecutor {
	private readonly display: QuestionnaireDisplay;

	constructor() {
		this.display = new QuestionnaireDisplay();
	}

	/**
	 * Execute a questionnaire and return responses.
	 */
	async executeQuestionnaire(questionnaire: Questionnaire): Promise<QuestionnaireResponse> {
		// Display questionnaire header
		this.display.displayHeader();

		const responses: QuestionResponse[] = [];
		let cancelled = false;
		let timedOut = false;

		try {
			// Process each question sequentially
			for (const question of questionnaire.questions) {
				// eslint-disable-next-line no-await-in-loop
				const response = await this.executeQuestion(question);
				responses.push(response);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			// Handle cancellation or timeout
			if (errorMessage.includes('cancelled') || errorMessage.includes('User cancelled')) {
				cancelled = true;
				this.display.displayWarning('Questionnaire cancelled by user.');
			} else if (errorMessage.includes('timeout')) {
				timedOut = true;
				this.display.displayWarning('Questionnaire timed out.');
			} else {
				// Re-throw unexpected errors
				throw error;
			}
		}

		return {
			responses,
			cancelled,
			timedOut,
		};
	}

	/**
	 * Execute a single question and return the response.
	 */
	async executeQuestion(question: QuestionOpen | QuestionMultipleChoice): Promise<QuestionResponse> {
		if (question.type === 'open') {
			return this.executeOpenQuestion(question);
		}

		return this.executeMultipleChoiceQuestion(question);
	}

	/**
	 * Execute an open-ended question using text input.
	 */
	async executeOpenQuestion(question: QuestionOpen): Promise<QuestionResponse> {
		const answer = await input({
			message: this.display.formatQuestionMessage(question),
			default: question.placeholder ?? '',
			validate(value: string) {
				// Apply validation rules
				if (question.minLength && value.length < question.minLength) {
					return `Answer must be at least ${question.minLength} characters long`;
				}

				if (question.maxLength && value.length > question.maxLength) {
					return `Answer must be no more than ${question.maxLength} characters long`;
				}

				return true;
			},
		});

		return {
			questionId: question.id,
			response: [answer],
		};
	}

	/**
	 * Execute a multiple choice question using select prompt.
	 */
	async executeMultipleChoiceQuestion(question: QuestionMultipleChoice): Promise<QuestionResponse> {
		const choices = question.options.map((option) => ({
			name: option.description ? `${option.label} - ${chalk.dim(option.description)}` : option.label,
			value: option.id,
			checked: option.id === question.defaultOptionID,
		}));

		// Add "Other" option if allowOwnVariant is true (default)
		const allowOwnVariant = question.allowOwnVariant ?? true;
		const otherOptionId = '__other__';

		if (allowOwnVariant) {
			choices.push({
				name: chalk.italic('Other (specify your own answer)'),
				value: otherOptionId,
				checked: false,
			});
		}

		if (question.allowMultiple) {
			// Use checkbox for multiple selections
			const answers = await checkbox({
				message: this.display.formatQuestionMessage(question),
				choices,
				validate(choices) {
					const selected = choices.filter((choice) => choice.checked).map((choice) => choice.value);
					if (question.minSelections && selected.length < question.minSelections) {
						return `Please select at least ${question.minSelections} option(s)`;
					}

					if (question.maxSelections && selected.length > question.maxSelections) {
						return `Please select no more than ${question.maxSelections} option(s)`;
					}

					return true;
				},
			});

			// Handle "Other" selection for multiple choice
			let customText: string | undefined;
			const finalAnswers = answers.filter((answer) => answer !== otherOptionId);

			if (answers.includes(otherOptionId)) {
				customText = await input({
					message: 'Please specify your own answer:',
					validate(value: string) {
						if (!value.trim()) {
							return 'Please provide a custom answer';
						}

						return true;
					},
				});
				finalAnswers.push(customText);
			}

			return {
				questionId: question.id,
				response: finalAnswers,
			};
		}

		// Use select for single selection
		const answer = await select({
			message: this.display.formatQuestionMessage(question),
			choices,
			default: question.defaultOptionID,
		});

		// Handle "Other" selection for single choice
		if (answer === otherOptionId) {
			const customText = await input({
				message: 'Please specify your own answer:',
				validate(value: string) {
					if (!value.trim()) {
						return 'Please provide a custom answer';
					}

					return true;
				},
			});

			return {
				questionId: question.id,
				response: [customText],
				customText,
			};
		}

		return {
			questionId: question.id,
			response: [answer],
		};
	}
}
