import {spawn} from 'node:child_process';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import timers from 'node:timers';
import os from 'node:os';
import {HeartbeatWatcher} from './heartbeat.js';

/**
 * Configuration for terminal spawning.
 */
export type TerminalSpawnConfig<TInput = unknown> = {
	/** Absolute path to the script to run within the runner */
	scriptPath: string;
	/** Input data to pass to the spawned terminal */
	inputData: TInput;
	/** Maximum time to live in milliseconds (default: 300000 = 5 minutes) */
	ttlMs?: number;
};

/**
 * Result from spawned terminal execution.
 */
export type TerminalSpawnResult<TOutput = unknown> = {
	/** Output data from the spawned terminal */
	output: TOutput;
	/** Whether the terminal timed out */
	timedOut: boolean;
	/** Whether the terminal completed successfully */
	isSuccess: boolean;
	/** Error message if execution failed */
	error?: unknown;
};

/**
 * Generic terminal spawner that creates new terminal windows with heartbeat monitoring.
 */
export class TerminalSpawner<TInput = unknown, TOutput = unknown> {
	private readonly config: Required<TerminalSpawnConfig<TInput>>;
	private readonly sessionId: string;
	private readonly sessionDir: string;
	private readonly inputFile: string;
	private readonly outputFile: string;
	private readonly runnerScript: string;
	private heartbeatWatcher: HeartbeatWatcher | null = null;

	constructor(config: TerminalSpawnConfig<TInput>) {
		this.config = {...config, ttlMs: config.ttlMs ?? 300_000}; // 5 minutes default

		// Generate unique session ID
		this.sessionId = randomUUID();
		this.sessionDir = path.join(os.tmpdir(), `tmp-question-terminal-${this.sessionId}`);
		this.inputFile = path.join(this.sessionDir, 'input.json');
		this.outputFile = path.join(this.sessionDir, 'output.json');

		// Get the runner script path relative to this file
		const currentDir = path.dirname(fileURLToPath(import.meta.url));
		this.runnerScript = path.join(currentDir, 'terminal-runner.js');
	}

	/**
	 * Spawn a new terminal and execute the script with input data.
	 *
	 * @returns Promise resolving to the execution result
	 */
	async spawn(): Promise<TerminalSpawnResult<TOutput>> {
		try {
			// Setup session environment
			await this.#setupSession();
			await this.#spawnTerminal();

			const finalStatus = await this.#monitorHeartbeat(this.config.ttlMs);
			if (finalStatus === 'dead' && this.heartbeatWatcher?.missedBeats === 0) {
				throw new Error('Spawned terminal never came live');
			}

			const output = await this.#readOutputData();
			if (output === null) {
				throw new Error('Output data is missing or corrupted');
			}

			return {
				output,
				timedOut: finalStatus === 'dead',
				isSuccess: finalStatus === 'completed',
			};
		} catch (error) {
			throw new Error('Failed to spawn terminal', {cause: error});
		} finally {
			await this.#cleanupSession();
		}
	}

	/**
	 * Monitor heartbeat of the spawned terminal.
	 *
	 * @param timeoutMs - Timeout in milliseconds for the heartbeat watcher
	 * @returns Status of the heartbeat
	 */
	async #monitorHeartbeat(timeoutMs: number) {
		this.heartbeatWatcher = new HeartbeatWatcher({
			directory: this.sessionDir,
			interval: 1000,
		});

		const ac = new AbortController();
		const timeout = timers.setTimeout(() => {
			ac.abort('Timeout');
		}, timeoutMs);

		await this.heartbeatWatcher.start(ac.signal);

		timers.clearTimeout(timeout);

		return this.heartbeatWatcher.status;
	}

	/**
	 * Spawn the terminal with platform-specific commands.
	 */
	async #spawnTerminal() {
		return new Promise<void>((resolve, reject) => {
			let command: string;
			let args: string[];

			if (process.platform === 'darwin') {
				// as macos is sPeCiAl it is not enough to just spawn shell with node.
				const script = `exec ${process.argv0} "${this.runnerScript}" "${this.sessionId}"; exit 0`
					.replaceAll('\\', '\\\\')
					.replaceAll('"', '\\"');

				command =
					'osascript ' +
					`-e 'tell application "Terminal" to activate' ` +
					`-e 'tell application "Terminal" to do script "${script}"'`;
				args = [];
			} else {
				// Other platforms: Run node directly
				command = process.argv0;
				args = [this.runnerScript, this.sessionId];
			}

			const child = spawn(command, args, {
				shell: true,
				detached: true,
				stdio: 'ignore',
			});

			const errorHandler = (error: Error) => {
				reject(new Error(`Failed to spawn terminal`, {cause: error}));
			};

			child.once('error', errorHandler);

			child.once('spawn', () => {
				child.off('error', errorHandler);
				resolve();
			});

			// Detach the child process
			child.unref();
		});
	}

	/**
	 * Write input data to the input file.
	 */
	async #writeInputData(): Promise<void> {
		await fs.writeFile(this.inputFile, JSON.stringify(this.config), 'utf8');
	}

	/**
	 * Read output data from the output file.
	 */
	async #readOutputData(): Promise<TOutput | null> {
		try {
			const content = await fs.readFile(this.outputFile, 'utf8');
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			return JSON.parse(content) as TOutput;
		} catch {
			// Return null if output file doesn't exist or is invalid
			return null;
		}
	}

	/**
	 * Setup the session environment with input files.
	 */
	async #setupSession(): Promise<void> {
		// Create session directory
		await fs.mkdir(this.sessionDir, {recursive: true});

		// Write input data to file
		await this.#writeInputData();

		console.log(`Session ${this.sessionId} set up`);
	}

	/**
	 * Cleanup session files and directory.
	 */
	async #cleanupSession(): Promise<void> {
		try {
			await this.heartbeatWatcher?.stop();
			await fs.rm(this.sessionDir, {recursive: true, force: true});
			console.log(`Session ${this.sessionId} cleaned up`);
		} catch (error) {
			// Log but don't throw - cleanup failure shouldn't break the main flow
			console.warn(`Failed to cleanup session ${this.sessionId}:`, error);
		}
	}

	/**
	 * Get the session ID for this spawner instance.
	 */
	get id(): string {
		return this.sessionId;
	}
}
