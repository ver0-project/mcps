import fs from 'node:fs/promises';
import path from 'node:path';
import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';

// Read file input schema
export const READ_INPUT_SCHEMA = {
	path: z.string().describe('Absolute path to the file to read'),
	encoding: z
		.enum(['utf8', 'utf16le', 'latin1', 'ascii', 'base64', 'hex', 'binary'])
		.optional()
		.default('utf8')
		.describe('Text encoding to use when reading the file'),
};

/**
 * Read Tool
 * Reads the contents of a single file with encoding support
 */
export class ReadTool {
	readonly config: ToolConfig<typeof READ_INPUT_SCHEMA, never> = {
		description: 'Read contents of a single file with encoding support.',
		inputSchema: READ_INPUT_SCHEMA,
		annotations: {
			title: 'Read File',
			readOnlyHint: true,
		},
	};

	get name() {
		return 'read';
	}

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	readonly #handle: ToolCallback<typeof READ_INPUT_SCHEMA> = async ({path: fpath, encoding}) => {
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
			// Check if path exists and is a file
			const stats = await fs.stat(fpath);
			if (!stats.isFile()) {
				return {
					content: [
						{
							type: 'text',
							text: `Error: path is not a file: ${fpath}`,
						},
					],
				};
			}

			// Read the file content
			const content = await fs.readFile(fpath, {encoding});

			result = {
				path: fpath,
				content: content.toString(),
				encoding,
				size: stats.size,
			};
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: `Error while reading file.\n${String(error)}`,
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
				{
					type: 'resource',
					resource: {},
				},
			],
		};
	};
}
