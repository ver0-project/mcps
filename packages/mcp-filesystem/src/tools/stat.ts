import type { McpServer, ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { ToolConfig } from '../types.js';

export const STAT_INPUT_SCHEMA = {
	path: z.string().describe('Absolute path to the file to read'),
};

export class StatTool {
	readonly config: ToolConfig<typeof STAT_INPUT_SCHEMA, never> = {
		description: 'Get stats of a path.',
		inputSchema: STAT_INPUT_SCHEMA,
		annotations: {
			title: 'Stat',
			readOnlyHint: true,
		},
	};

	get name() {
		return 'stat';
	}

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	readonly #handle: ToolCallback<typeof STAT_INPUT_SCHEMA> = async ({path: fpath}) => {
		if (!path.isAbsolute(fpath)) {
			return {
				content: [
					{
						type: 'text',
						text: `Error: path must be absolute.`,
					},
				],
			};
		}

		let result: Record<string, any>;

		try {
			const stats = await fs.stat(fpath);
			result = {
				...stats,
				isFile: stats.isFile(),
				isDirectory: stats.isDirectory(),
				isBlockDevice: stats.isBlockDevice(),
				isCharacterDevice: stats.isCharacterDevice(),
				isSymbolicLink: stats.isSymbolicLink(),
				isFIFO: stats.isFIFO(),
				isSocket: stats.isSocket(),
			};
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: `Error while fetching path stats.\n${String(error)}`,
					},
				],
			};
		}

		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(result),
				},
			],
		};
	};
}
