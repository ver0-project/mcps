import {promises as fs} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {inspect} from 'node:util';
import spawn from 'cross-spawn';
import type {Questionnaire, QuestionnaireResponse} from '../types.js';

/**
 * Terminal interface for executing questionnaires in new spawned terminal windows.
 */
export class TerminalQuestionnaire {
	/**
	 * Execute a questionnaire in a new terminal window and return the user's responses.
	 *
	 * @param questionnaire - The questionnaire to execute
	 * @returns Promise resolving to the questionnaire response
	 */
	async execute(questionnaire: Questionnaire): Promise<QuestionnaireResponse> {
		// Create temporary file for questionnaire data
		const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp-questionnaire-'));
		const questionnaireFile = path.join(tempDir, 'questionnaire.json');
		const responseFile = path.join(tempDir, 'response.json');
		// Reference the compiled runner in the same directory when running from dist
		const currentDir = path.dirname(fileURLToPath(import.meta.url));
		const runnerScript = path.join(currentDir, 'runner.js');

		try {
			// Write questionnaire data to temporary file
			await fs.writeFile(questionnaireFile, JSON.stringify(questionnaire, null, 2));

			// Spawn terminal with the questionnaire runner and wait for completion
			await this.spawnTerminal(runnerScript, questionnaireFile, responseFile);

			// Read response file after process completes
			return await this.readResponse(responseFile);
		} finally {
			// Clean up temporary files
			await this.cleanupTempFiles(tempDir);
		}
	}

	/**
	 * Spawn a new Node.js process with the questionnaire runner and wait for completion.
	 */
	private async spawnTerminal(runnerScript: string, questionnaireFile: string, responseFile: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const asc = new AbortController();

			// Spawn a new Node.js process with the runner script
			const child = spawn('node', [runnerScript, questionnaireFile, responseFile], {
				detached: true,
				stdio: 'ignore',
				shell: true,
				signal: asc.signal,
			});

			const timeoutId = setTimeout(() => {
				asc.abort();
				child.kill();

				reject(new Error('Questionnaire timed out - process was terminated'));
			}, 300_000); // 5 minutes timeout

			const cleanup = () => {
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
			};

			child.on('error', (error: any) => {
				cleanup();

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				if (error.name === 'AbortError' && error.code === 'ABORT_ERR') {
					resolve();
				}

				reject(new Error('Failed to spawn Node.js process', {cause: error}));
			});

			child.on('exit', (code: number | null) => {
				cleanup();

				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`Process exited with code ${code ?? 'unknown'}`));
				}
			});
		});
	}

	/**
	 * Read the response file after the process has completed.
	 */
	private async readResponse(responseFile: string): Promise<QuestionnaireResponse> {
		try {
			const responseData = await fs.readFile(responseFile, 'utf8');
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			const response = JSON.parse(responseData) as QuestionnaireResponse;
			return response;
		} catch {
			// If file doesn't exist, return a default cancelled response
			return {
				responses: [],
				cancelled: true,
				timedOut: false,
			};
		}
	}

	/**
	 * Clean up temporary files and directory.
	 */
	private async cleanupTempFiles(tempDir: string): Promise<void> {
		try {
			await fs.rm(tempDir, {recursive: true, force: true});
		} catch (error) {
			// Log but don't throw - cleanup failure shouldn't break the main flow
			console.warn('Failed to cleanup temporary files:', error);
		}
	}
}
