import path from 'node:path';
import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {ErrorCode, McpError} from '@modelcontextprotocol/sdk/types.js';
import type {ToolConfig} from '../types.js';
import {statPath} from '../utils/stat.js';

// File stat input schema constant
export const FILE_STAT_INPUT_SCHEMA = {
	path: z.string().describe('Absolute path to the file or directory to get stats for'),
};

/**
 * File Stat Tool
 * Provides file/directory statistics functionality for MCP
 */
export class FileStatTool {
	readonly config: ToolConfig<typeof FILE_STAT_INPUT_SCHEMA, never> = {
		description: 'Get stats of given path.',
		inputSchema: FILE_STAT_INPUT_SCHEMA,
		annotations: {
			title: 'File Stats',
			readOnlyHint: true,
		},
	};

	get name() {
		return 'stat';
	}

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	readonly #handle: ToolCallback<typeof FILE_STAT_INPUT_SCHEMA> = async ({path: fpath}) => {
		if (!path.isAbsolute(fpath)) {
			throw new McpError(ErrorCode.InvalidRequest, 'Path is not absolute');
		}

		try {
			const stats = await statPath(fpath);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(stats),
					},
				],
			};
		} catch (error) {
			if (error instanceof McpError) {
				throw error;
			}

			throw new McpError(ErrorCode.InternalError, `Failed to stat path.\n${String(error)}`);
		}
	};
}
