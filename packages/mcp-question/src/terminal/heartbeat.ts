import fs from 'node:fs/promises';
import path from 'node:path';
import timers from 'node:timers/promises';

/**
 * Configuration for heartbeat system.
 */
export type HeartbeatConfig = {
	/** Directory where heartbeat file is stored */
	directory: string;
	/** Name of the heartbeat file (default: heartbeat.txt) */
	filename?: string;
	/** Interval in milliseconds (default: 1000ms) */
	interval?: number;
};

/**
 * Status of the monitored target.
 */
export type HeartbeatStatus = 'unknown' | 'alive' | 'dead' | 'completed';

/**
 * Heartbeat generator that emits timestamps to a file at regular intervals.
 */
export class HeartbeatGenerator {
	private readonly config: Required<HeartbeatConfig>;
	private readonly filePath: string;
	private intervalId: NodeJS.Timeout | null = null;
	private isRunning = false;

	constructor(config: HeartbeatConfig) {
		this.config = {
			interval: 1000,
			filename: 'heartbeat.txt',
			...config,
		};
		this.filePath = path.join(this.config.directory, this.config.filename);
	}

	/**
	 * Start the heartbeat generator.
	 */
	async start(): Promise<void> {
		if (this.isRunning) {
			return;
		}

		this.isRunning = true;

		// Create directory if it doesn't exist
		await fs.mkdir(this.config.directory, {recursive: true});

		// Emit initial heartbeat
		await this.emitHeartbeat();

		// Start interval for subsequent heartbeats
		this.intervalId = setInterval(async () => {
			if (this.isRunning) {
				await this.emitHeartbeat();
			}
		}, this.config.interval);
	}

	/**
	 * Stop the heartbeat generator.
	 */
	async stop(): Promise<void> {
		if (!this.isRunning) {
			return;
		}

		this.isRunning = false;

		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}

		// Remove heartbeat file to signal completion
		try {
			await fs.unlink(this.filePath);
		} catch {
			// Ignore errors if file doesn't exist
		}
	}

	/**
	 * Emit a heartbeat by writing current timestamp to file.
	 */
	private async emitHeartbeat(): Promise<void> {
		const timestamp = Date.now();
		await fs.writeFile(this.filePath, timestamp.toString(), 'utf8');
	}

	/**
	 * Check if the generator is currently running.
	 */
	get running(): boolean {
		return this.isRunning;
	}
}

/**
 * Heartbeat watcher that monitors file changes to detect process health.
 */
export class HeartbeatWatcher {
	private readonly config: Required<HeartbeatConfig>;
	private readonly filePath: string;
	#isWatching = false;
	#status: HeartbeatStatus = 'unknown';
	#lastHeartbeat = 0;
	#missedHeartbeats = 0;

	constructor(config: HeartbeatConfig) {
		this.config = {
			interval: 1000,
			filename: 'heartbeat.txt',
			...config,
		};
		this.filePath = path.join(this.config.directory, this.config.filename);
	}

	/**
	 * Start watching for heartbeats. Promise is resolved when either heartbeat is
	 * missed or target is completed.
	 */
	async start(signal: AbortSignal): Promise<void> {
		if (this.#isWatching) {
			return;
		}

		this.#isWatching = true;

		// 5x seems reasonably enough to allow heartbeat to start, but
		// it might require adjustment in the future.
		await timers.setTimeout(this.config.interval * 5);

		// start polling heartbeat file
		for await (const _ of timers.setInterval(this.config.interval)) {
			if (!this.#isWatching || signal.aborted) {
				return;
			}

			const heartbeat = await this.readHeartbeat();
			if (heartbeat === null && this.#lastHeartbeat === 0) {
				// we've already waited for sometime, if file not created - we
				// assume it is dead
				this.#status = 'dead';
				return;
			}

			if (heartbeat === null) {
				// here we already had previous heartbeat, and file is gone
				// we assume terminal exited "normally"
				this.#status = 'completed';
				return;
			}

			if (heartbeat > this.#lastHeartbeat) {
				// heartbeat is newer than previous one, so it is alive
				this.#status = 'alive';
				this.#missedHeartbeats = 0;
				this.#lastHeartbeat = heartbeat;

				continue;
			}

			// heartbeat not changed - treat as a miss
			this.#missedHeartbeats++;

			if (this.#missedHeartbeats > 2) {
				// we've missed too many heartbeats, so we assume it is dead
				this.#status = 'dead';
				return;
			}
		}
	}

	/**
	 * Stop watching for heartbeats.
	 */
	async stop(): Promise<void> {
		this.#isWatching = false;
	}

	/**
	 * Read heartbeat from file.
	 *
	 * @returns timestamp or null if file doesn't exist
	 */
	private async readHeartbeat(): Promise<number | null> {
		try {
			const content = await fs.readFile(this.filePath, 'utf8');
			return Number.parseInt(content.trim(), 10);
		} catch {
			return null;
		}
	}

	/**
	 * Check if the watcher is currently running.
	 */
	get isWatching(): boolean {
		return this.#isWatching;
	}

	/**
	 * Get the current number of missed heartbeats.
	 */
	get missedBeats(): number {
		return this.#missedHeartbeats;
	}

	get status(): HeartbeatStatus {
		return this.#status;
	}
}
