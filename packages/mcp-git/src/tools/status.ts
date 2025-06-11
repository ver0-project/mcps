import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {simpleGit} from 'simple-git';
import type {TaskOptions} from 'simple-git';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';

// Git status input schema constant
export const GIT_STATUS_INPUT_SCHEMA = {
	repoPath: z.string().describe('Absolute path to the git repository'),
	short: z.boolean().optional().describe('Give the output in the short-format (-s, --short)'),
	branch: z.boolean().optional().describe('Show the branch and tracking info even in short-format (-b, --branch)'),
	showStash: z.boolean().optional().describe('Show the number of entries currently stashed away (--show-stash)'),
	long: z.boolean().optional().describe('Give the output in the long-format (--long, default)'),
	verbose: z
		.union([z.boolean(), z.number().int().min(0).max(2)])
		.optional()
		.describe('Show textual changes that are staged to be committed (-v, --verbose, can be specified twice)'),
	untrackedFiles: z
		.union([z.boolean(), z.enum(['no', 'normal', 'all'])])
		.optional()
		.describe('Show untracked files (-u[<mode>], --untracked-files[=<mode>])'),
	ignoreSubmodules: z
		.enum(['none', 'untracked', 'dirty', 'all'])
		.optional()
		.describe('Ignore changes to submodules (--ignore-submodules[=<when>])'),
	ignored: z
		.union([z.boolean(), z.enum(['traditional', 'no', 'matching'])])
		.optional()
		.describe('Show ignored files as well (--ignored[=<mode>])'),
	aheadBehind: z
		.boolean()
		.optional()
		.describe('Display detailed ahead/behind counts relative to upstream branch (--ahead-behind, --no-ahead-behind)'),
	renames: z.boolean().optional().describe('Turn on/off rename detection (--renames, --no-renames)'),
	findRenames: z
		.union([z.boolean(), z.number().int().min(0).max(100)])
		.optional()
		.describe('Turn on rename detection, optionally set similarity threshold (--find-renames[=<n>])'),
	nullTerminated: z.boolean().optional().describe('Terminate entries with NUL (ASCII 0x00) byte instead of LF (-z)'),
	column: z
		.union([z.boolean(), z.string()])
		.optional()
		.describe('Display untracked files in columns (--column[=<options>], --no-column)'),
	pathspec: z.array(z.string()).optional().describe('Limit the output to the given paths'),
};

// Git status output schema constant matching StatusResult type
export const GIT_STATUS_OUTPUT_SCHEMA = {
	current: z.string().nullable().describe('Current branch name (null if detached)'),
	tracking: z.string().nullable().describe('Tracking branch name (null if not tracking)'),
	ahead: z.number().int().min(0).describe('Number of commits ahead of tracking branch'),
	behind: z.number().int().min(0).describe('Number of commits behind tracking branch'),
	detached: z.boolean().describe('Detached status of the working copy'),
	staged: z.array(z.string()).describe('List of staged files'),
	not_added: z.array(z.string()).describe('List of untracked files'),
	conflicted: z.array(z.string()).describe('List of conflicted files'),
	created: z.array(z.string()).describe('List of newly created files'),
	deleted: z.array(z.string()).describe('List of deleted files'),
	modified: z.array(z.string()).describe('List of modified files'),
	ignored: z
		.array(z.string())
		.optional()
		.describe('List of ignored files (only present when --ignored option is used)'),
	renamed: z
		.array(
			z.object({
				from: z.string().describe('Original file path'),
				to: z.string().describe('New file path'),
			})
		)
		.describe('List of renamed files with from/to paths'),
	files: z
		.array(
			z.object({
				path: z.string().describe('File path'),
				index: z.string().describe('Index status character'),
				working_dir: z.string().describe('Working directory status character'),
			})
		)
		.describe('Detailed file status information'),
	isClean: z.boolean().describe('True if working directory is clean'),
};

/**
 * Git Status Tool
 * Provides git status functionality for MCP
 */
export class GitStatusTool {
	get name() {
		return 'status';
	}

	readonly config: ToolConfig<typeof GIT_STATUS_INPUT_SCHEMA, typeof GIT_STATUS_OUTPUT_SCHEMA> = {
		description: 'Get the current git repository status.',
		inputSchema: GIT_STATUS_INPUT_SCHEMA,
		outputSchema: GIT_STATUS_OUTPUT_SCHEMA,
		annotations: {
			title: 'Status',
			readOnlyHint: true,
		},
	};

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	/**
	 * Transform status input parameters to git command options
	 */
	// eslint-disable-next-line complexity
	public inputToOptions(input: z.infer<z.ZodObject<typeof GIT_STATUS_INPUT_SCHEMA>>) {
		const options: TaskOptions = [];

		if (input.short) {
			options.push('--short');
		}

		if (input.branch) {
			options.push('--branch');
		}

		if (input.showStash) {
			options.push('--show-stash');
		}

		if (input.long) {
			options.push('--long');
		}

		if (input.verbose !== undefined) {
			if (typeof input.verbose === 'boolean' && input.verbose) {
				options.push('--verbose');
			} else if (typeof input.verbose === 'number') {
				// Add multiple -v flags for verbose level
				for (let i = 0; i < input.verbose; i++) {
					options.push('-v');
				}
			}
		}

		if (input.untrackedFiles !== undefined) {
			if (typeof input.untrackedFiles === 'boolean') {
				options.push(input.untrackedFiles ? '--untracked-files' : '--untracked-files=no');
			} else {
				options.push(`--untracked-files=${input.untrackedFiles}`);
			}
		}

		if (input.ignoreSubmodules) {
			options.push(`--ignore-submodules=${input.ignoreSubmodules}`);
		}

		if (input.ignored !== undefined) {
			if (typeof input.ignored === 'boolean') {
				options.push(input.ignored ? '--ignored' : '--no-ignored');
			} else {
				options.push(`--ignored=${input.ignored}`);
			}
		}

		if (input.aheadBehind !== undefined) {
			options.push(input.aheadBehind ? '--ahead-behind' : '--no-ahead-behind');
		}

		if (input.renames !== undefined) {
			options.push(input.renames ? '--renames' : '--no-renames');
		}

		if (input.findRenames !== undefined) {
			if (typeof input.findRenames === 'boolean') {
				options.push(input.findRenames ? '--find-renames' : '--no-find-renames');
			} else {
				options.push(`--find-renames=${input.findRenames}`);
			}
		}

		if (input.nullTerminated) {
			options.push('-z');
		}

		if (input.column !== undefined) {
			if (typeof input.column === 'boolean') {
				options.push(input.column ? '--column' : '--no-column');
			} else {
				options.push(`--column=${input.column}`);
			}
		}

		// Add pathspec at the end
		if (input.pathspec && input.pathspec.length > 0) {
			options.push('--', ...input.pathspec);
		}

		return options;
	}

	readonly #handle: ToolCallback<typeof GIT_STATUS_INPUT_SCHEMA> = async (input) => {
		const sg = simpleGit(input.repoPath);

		const isRepo = await sg.checkIsRepo();
		if (!isRepo) {
			return {
				isError: true,
				content: [
					{
						type: 'text',
						text: 'Not a git repository',
					},
				],
			};
		}

		const statusOptions = this.inputToOptions(input);
		const status = await sg.status(statusOptions);

		return {
			content: [
				{
					type: 'text',
					text: `Status for repo is available in structured content.`,
				},
			],
			structuredContent: {
				...status,
				isClean: status.isClean(),
			},
		};
	};
}
