import fs from 'node:fs/promises';
import path from 'node:path';
import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {ErrorCode, McpError} from '@modelcontextprotocol/sdk/types.js';
import {z} from 'zod';
import type {DirectoryEntry, ToolConfig} from '../types.js';

// List directory input schema constant
export const LIST_DIRECTORY_INPUT_SCHEMA = {
	path: z.string().describe('Absolute path to the directory to list'),
	includeGlobs: z
		.array(z.string())
		.optional()
		.default([])
		.describe(
			'Glob patterns to include in listing.' +
				'Globs are matched relatively to the directory being listed.' +
				'If not provided, all files and directories are included.' +
				'Works in conjunction with excludeGlobs.'
		),
	excludeGlobs: z
		.array(z.string())
		.optional()
		.default(['**/.git', '**/.DS_Store', '**/.idea', '**/.vscode', '**/node_modules'])
		.describe('Glob patterns to exclude from listing. Globs are matched relatively to the directory being listed.'),
	maxDepth: z.number().int().min(1).optional().default(1).describe('Maximum depth to traverse when recursive is true'),
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

	// returns true if the path matches any of the globs
	#matchesAnyGlob(filepath: string, globs: string[]): boolean {
		for (const glob of globs) {
			// eslint-disable-next-line n/no-unsupported-features/node-builtins
			if (path.matchesGlob(filepath, glob)) {
				return true;
			}
		}

		return false;
	}

	readonly #handle: ToolCallback<typeof LIST_DIRECTORY_INPUT_SCHEMA> = async ({
		path: dirPath,
		excludeGlobs,
		includeGlobs,
		maxDepth,
		absolutePaths,
	}) => {
		if (!path.isAbsolute(dirPath)) {
			throw new McpError(ErrorCode.InvalidRequest, 'Path is not absolute');
		}

		const absExcludeGlobs = excludeGlobs.map((pattern) => path.posix.join(dirPath, pattern));
		const absIncludeGlobs = includeGlobs.map((pattern) => path.posix.join(dirPath, pattern));

		try {
			const stats = await fs.stat(dirPath);
			if (!stats.isDirectory()) {
				throw new McpError(ErrorCode.InvalidRequest, 'Path is not a directory');
			}

			const listDir = async (result: DirectoryEntry[], currentPath: string, depth = 1) => {
				const dirents = await fs.readdir(currentPath, {withFileTypes: true});

				for (const dirent of dirents) {
					const absPath = path.join(currentPath, dirent.name);

					// handle include globs in case they are provided
					if (includeGlobs.length > 0 && !this.#matchesAnyGlob(absPath, absIncludeGlobs)) {
						continue;
					}

					// handle exclude globs
					if (this.#matchesAnyGlob(absPath, absExcludeGlobs)) {
						continue;
					}

					const name = absolutePaths ? absPath : path.relative(dirPath, absPath);

					result.push({
						name,
						type: dirent.isDirectory() ? 'directory' : 'file',
					});

					if (dirent.isDirectory() && depth < maxDepth) {
						// eslint-disable-next-line no-await-in-loop
						await listDir(result, absPath, depth + 1);
					}
				}
			};

			const entries: DirectoryEntry[] = [];
			await listDir(entries, dirPath, 1);

			const result = {
				path: dirPath,
				totalCount: entries.length,
				entries,
			};

			return {
				content: [
					{
						type: 'text',
						text: `excludeGlobs: ${excludeGlobs.join(', ')}\nincludeGlobs: ${includeGlobs.join(', ')}\n`,
					},
					{
						type: 'text',
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		} catch (error) {
			throw new McpError(ErrorCode.InternalError, `Failed to list directory.\n${String(error)}`);
		}
	};
}
