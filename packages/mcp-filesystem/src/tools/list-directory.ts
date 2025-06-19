import path from 'node:path';
import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {FilesystemError} from '../types.js';
import type {ToolConfig} from '../types.js';

// List directory input schema constant
export const LIST_DIRECTORY_INPUT_SCHEMA = {
	path: z.string().describe('Absolute path to the directory to list'),
	recursive: z.boolean().optional().default(false).describe('Whether to list contents recursively'),
	excludePatterns: z.array(z.string()).optional().default([]).describe('Glob patterns to exclude from listing'),
	maxDepth: z.number().int().min(1).optional().describe('Maximum depth to traverse when recursive is true'),
	absolutePaths: z
		.boolean()
		.optional()
		.default(true)
		.describe('Whether to return absolute paths (true) or relative paths (false)'),
};

/**
 * List Directory Tool
 * Lists the contents of a directory with optional recursive traversal and filtering
 */
export class ListDirectoryTool {
	readonly config: ToolConfig<typeof LIST_DIRECTORY_INPUT_SCHEMA, never> = {
		description: 'List the contents of a directory with optional recursive traversal and pattern exclusion.',
		inputSchema: LIST_DIRECTORY_INPUT_SCHEMA,
		annotations: {
			title: 'List Directory',
			readOnlyHint: true,
		},
	};

	get name() {
		return 'list-directory';
	}

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	readonly #handle: ToolCallback<typeof LIST_DIRECTORY_INPUT_SCHEMA> = async ({
		path: dirPath,
		recursive,
		excludePatterns,
		maxDepth,
		absolutePaths,
	}) => {
		if (!path.isAbsolute(dirPath)) {
			return {
				isError: true,
				content: [
					{
						type: 'text',
						text: 'Path is not absolute',
					},
				],
			};
		}

		try {
			// TODO: Implement directory listing logic
			// - Check if path exists and is a directory
			// - Read directory contents
			// - Apply recursive traversal if enabled
			// - Filter out excluded patterns
			// - Respect maxDepth limit
			// - Format paths as absolute or relative based on absolutePaths flag

			const result = {
				path: dirPath,
				recursive,
				excludePatterns,
				maxDepth,
				absolutePaths,
				entries: [], // TODO: Populate with actual directory entries
				totalCount: 0, // TODO: Calculate total number of entries
			};

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				isError: true,
				content: [
					{
						type: 'text',
						text: `Failed to list directory.\n${String(error)}`,
					},
				],
			};
		}
	};
}
