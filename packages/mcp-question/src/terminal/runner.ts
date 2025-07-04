/* eslint-disable n/no-process-exit */
/* eslint-disable unicorn/no-process-exit */
import {promises as fs} from 'node:fs';
import process from 'node:process';
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
 * Questionnaire runner for spawned terminal windows.
 * This script is executed in a separate terminal process.
 */
class QuestionnaireRunner {
	/**
	 * Run the questionnaire from command line arguments.
	 */
	async run(): Promise<void> {
		try {
			// Get file paths from command line arguments
			const args = process.argv;
			const questionnaireFile = args[2];
			const responseFile = args[3];

			if (!questionnaireFile || !responseFile) {
				throw new Error('Usage: node runner.js <questionnaire-file> <response-file>');
			}

			// Load questionnaire data
			const questionnaireData = await fs.readFile(questionnaireFile, 'utf8');
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			const questionnaire = JSON.parse(questionnaireData) as Questionnaire;

			// Execute questionnaire
			const response = await this.executeQuestionnaire(questionnaire);

			// Write response to file
			await fs.writeFile(responseFile, JSON.stringify(response, null, 2));

			// Success message
			this.displaySuccess('Questionnaire completed successfully!');
			this.displayInfo('Window will be closed automatically in 3 seconds.');

			// Keep terminal open for a moment so user can see the result
			setTimeout(() => {
				// Exit process after success
				process.exit(0);
			}, 3000);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.displayError(`Error: ${errorMessage}`);

			// Write error response
			const errorResponse: QuestionnaireResponse = {
				responses: [],
				cancelled: false,
				timedOut: false,
			};

			try {
				const args = process.argv;
				const responseFile = args[3];
				if (responseFile) {
					await fs.writeFile(responseFile, JSON.stringify(errorResponse, null, 2));
				}
			} catch (writeError) {
				console.error('Failed to write error response:', writeError);
			}

			// Re-throw error to be handled by caller
			throw error;
		}
	}

	/**
	 * Execute the questionnaire and return responses.
	 */
	async executeQuestionnaire(questionnaire: Questionnaire): Promise<QuestionnaireResponse> {
		// Display questionnaire header
		this.displayHeader();

		const responses: QuestionResponse[] = [];
		let cancelled = false;
		let timedOut = false;

		try {
			// Process each question sequentially
			const processQuestions = async (): Promise<void> => {
				for (const question of questionnaire.questions) {
					// eslint-disable-next-line no-await-in-loop
					const response = await this.executeQuestion(question);
					responses.push(response);
				}
			};

			await processQuestions();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			// Handle cancellation or timeout
			if (errorMessage.includes('cancelled') || errorMessage.includes('User cancelled')) {
				cancelled = true;
				this.displayWarning('Questionnaire cancelled by user.');
			} else if (errorMessage.includes('timeout')) {
				timedOut = true;
				this.displayWarning('Questionnaire timed out.');
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
			message: this.formatQuestionMessage(question),
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

		if (question.allowMultiple) {
			// Use checkbox for multiple selections
			const answers = await checkbox({
				message: this.formatQuestionMessage(question),
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

			return {
				questionId: question.id,
				response: answers,
			};
		}

		// Use select for single selection
		const answer = await select({
			message: this.formatQuestionMessage(question),
			choices,
			default: question.defaultOptionID,
		});

		return {
			questionId: question.id,
			response: [answer],
		};
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
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
	console.log('\n');
	console.log(chalk.yellow.bold('⚠️ Questionnaire cancelled by user.'));

	// Write cancelled response
	try {
		const args = process.argv;
		const responseFile = args[3];
		if (responseFile) {
			const cancelledResponse: QuestionnaireResponse = {
				responses: [],
				cancelled: true,
				timedOut: false,
			};
			await fs.writeFile(responseFile, JSON.stringify(cancelledResponse, null, 2));
		}
	} catch (error: unknown) {
		console.error('Failed to write cancelled response:', error);
	}

	// This is a CLI app, so process.exit is appropriate here
	process.exit(0);
});

// Run the questionnaire
const runner = new QuestionnaireRunner();
await runner.run().catch((error: unknown) => {
	console.error('Unexpected error:', error);
	process.exit(1);
});
