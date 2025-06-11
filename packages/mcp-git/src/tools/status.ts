import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {simpleGit} from 'simple-git';
import type {Options, TaskOptions} from 'simple-git';
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
	column: z
		.union([z.boolean(), z.string()])
		.optional()
		.describe('Display untracked files in columns (--column[=<options>], --no-column)'),
	pathspec: z.array(z.string()).optional().describe('Limit the output to the given paths'),
};

/**
 * Git Status Tool
 * Provides git status functionality for MCP
 */
export class GitStatusTool {
	get name() {
		return 'status';
	}

	readonly config: ToolConfig<typeof GIT_STATUS_INPUT_SCHEMA, never> = {
		description: 'Get the current git repository status.',
		inputSchema: GIT_STATUS_INPUT_SCHEMA,
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
		const options: Options = {};

		if (input.short) {
			options['--short'] = null;
		}

		if (input.branch) {
			options['--branch'] = null;
		}

		if (input.showStash) {
			options['--show-stash'] = null;
		}

		if (input.long) {
			options['--long'] = null;
		}

		if (input.verbose !== undefined) {
			if (typeof input.verbose === 'boolean' && input.verbose) {
				options['--verbose'] = null;
			} else if (typeof input.verbose === 'number') {
				// For numeric verbose levels, we can use -v multiple times
				// Create array of -v flags for the specified level
				const verboseFlags = Array.from({length: input.verbose}, () => '-v');
				options['-v'] = verboseFlags;
			}
		}

		if (input.untrackedFiles !== undefined) {
			if (typeof input.untrackedFiles === 'boolean') {
				options['--untracked-files'] = input.untrackedFiles ? null : 'no';
			} else {
				options['--untracked-files'] = input.untrackedFiles;
			}
		}

		if (input.ignoreSubmodules) {
			options['--ignore-submodules'] = input.ignoreSubmodules;
		}

		if (input.ignored !== undefined) {
			if (typeof input.ignored === 'boolean') {
				if (input.ignored) {
					options['--ignored'] = null;
				} else {
					options['--no-ignored'] = null;
				}
			} else {
				options['--ignored'] = input.ignored;
			}
		}

		if (input.aheadBehind !== undefined) {
			if (input.aheadBehind) {
				options['--ahead-behind'] = null;
			} else {
				options['--no-ahead-behind'] = null;
			}
		}

		if (input.renames !== undefined) {
			if (input.renames) {
				options['--renames'] = null;
			} else {
				options['--no-renames'] = null;
			}
		}

		if (input.findRenames !== undefined) {
			if (typeof input.findRenames === 'boolean') {
				if (input.findRenames) {
					options['--find-renames'] = null;
				} else {
					options['--no-find-renames'] = null;
				}
			} else {
				options['--find-renames'] = input.findRenames;
			}
		}

		if (input.column !== undefined) {
			if (typeof input.column === 'boolean') {
				if (input.column) {
					options['--column'] = null;
				} else {
					options['--no-column'] = null;
				}
			} else {
				options['--column'] = input.column;
			}
		}

		// Add pathspec - for status, pathspec can be added as additional arguments
		if (input.pathspec && input.pathspec.length > 0) {
			// Simple-git handles pathspec as additional arguments
			// We'll add them as an array to be spread into the command
			options['--'] = input.pathspec;
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

		const status = await sg.status(this.inputToOptions(input));

		return {
			content: [
				{
					type: 'text',
					text: 'Git status retrieved successfully',
				},
				{
					type: 'text',
					text: JSON.stringify(status, null, 2),
				},
			],
		};
	};
}
