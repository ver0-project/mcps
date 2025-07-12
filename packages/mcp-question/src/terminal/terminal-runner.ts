import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import process from 'node:process';
import timers from 'node:timers';
import type {TerminalSpawnConfig} from './spawn-terminal.js';
import {HeartbeatGenerator} from './heartbeat.js';

async function readInputData(filePath: string): Promise<TerminalSpawnConfig> {
	const inputData = await fs.readFile(filePath, 'utf8');

	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
		return JSON.parse(inputData) as TerminalSpawnConfig;
	} catch (error) {
		throw new Error('Failed to parse input data', {cause: error});
	}
}

const sessionId = process.argv[2];
if (!sessionId) {
	throw new Error('Session ID is required');
}

const sessionDir = path.join(os.tmpdir(), `tmp-question-terminal-${sessionId}`);
const inputFile = path.join(sessionDir, 'input.json');
const outputFile = path.join(sessionDir, 'output.json');

const input = await readInputData(inputFile);

const hbg = new HeartbeatGenerator({
	directory: sessionDir,
	interval: 1000,
});
await hbg.start();

if (input.ttlMs) {
	timers.setTimeout(async () => {
		await hbg.stop();
		throw new Error('Terminal timed out');
	}, input.ttlMs);
}

try {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const workload = await import(input.scriptPath);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	if (typeof workload.default !== 'function') {
		throw new TypeError('Workload is not a function');
	}

	async function writeOutput(data: unknown) {
		await fs.writeFile(outputFile, JSON.stringify(data), 'utf8');
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
	await workload.default(input.inputData, writeOutput);
} finally {
	await hbg.stop();
}

// eslint-disable-next-line n/no-process-exit, unicorn/no-process-exit
process.exit(0);
