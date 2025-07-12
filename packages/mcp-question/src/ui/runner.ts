/* eslint-disable n/no-process-exit */
/* eslint-disable unicorn/no-process-exit */
import process from 'node:process';
import os from 'node:os';
import type {Questionnaire, QuestionnaireResponse} from '../types.js';
import {QuestionExecutor, QuestionnaireDisplay} from './question.js';

/**
 * Questionnaire workload function compatible with terminal-runner.ts.
 * This is the default export that gets called by the terminal spawning system.
 */
export default async function questionnaireWorkload(
	inputData: Questionnaire,
	writeOutput: (data: QuestionnaireResponse) => Promise<void>,
): Promise<void> {
	const executor = new QuestionExecutor();
	const display = new QuestionnaireDisplay();

	try {
		// Execute questionnaire
		const response = await executor.executeQuestionnaire(inputData);

		// Write response to output
		await writeOutput(response);

		// Success message
		display.displaySuccess('Questionnaire completed successfully!');

		if (os.platform() === 'darwin') {
			display.displayInfo('You can close this window now.');
		} else {
			display.displayInfo('Window will close automatically in 3 seconds.');
		}

		// Keep terminal open briefly so user can see the result
		setTimeout(() => {
			process.exit(0);
		}, 3000);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		display.displayError(`Error: ${errorMessage}`);

		// Write error response
		const errorResponse: QuestionnaireResponse = {
			responses: [],
			cancelled: false,
			timedOut: false,
		};

		try {
			await writeOutput(errorResponse);
		} catch (writeError) {
			console.error('Failed to write error response:', writeError);
		}

		// Re-throw error to be handled by terminal-runner
		throw error;
	}
}
