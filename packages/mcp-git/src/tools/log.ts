import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Options} from 'simple-git';
import {simpleGit} from 'simple-git';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';

// Git log input schema constant
export const GIT_LOG_INPUT_SCHEMA = {
	repoPath: z
		.string()
		.describe('Absolute path to the git repository. Path must be a valid system path in the style of the host OS.'),
	maxCount: z.number().int().min(1).optional().describe('Limit the number of commits to output (-n, --max-count)'),
	skip: z
		.number()
		.int()
		.min(0)
		.optional()
		.describe('Skip number commits before starting to show the commit output (--skip)'),
	since: z.string().optional().describe('Show commits more recent than a specific date (--since)'),
	until: z.string().optional().describe('Show commits older than a specific date (--until)'),
	author: z
		.string()
		.optional()
		.describe('Limit the commits output to ones with author/committer matching the pattern (--author)'),
	grep: z
		.string()
		.optional()
		.describe('Limit the commits output to ones with commit message matching the pattern (--grep)'),
	format: z
		.enum(['oneline', 'short', 'medium', 'full', 'fuller', 'email', 'raw'])
		.optional()
		.describe('Pretty-print format for commits (--pretty)'),
	graph: z.boolean().optional().describe('Draw a text-based graphical representation (--graph)'),
	stat: z.boolean().optional().describe('Generate a diffstat (--stat)'),
	shortStat: z.boolean().optional().describe('Output only the summary line of --stat (--shortstat)'),
	nameOnly: z.boolean().optional().describe('Show only names of changed files (--name-only)'),
	nameStatus: z.boolean().optional().describe('Show only names and status of changed files (--name-status)'),
	abbrevCommit: z
		.boolean()
		.optional()
		.describe(
			'Show only a partial prefix instead of the full 40-byte hexadecimal commit object name (--abbrev-commit)'
		),
	noMerges: z.boolean().optional().describe('Do not print commits with more than one parent (--no-merges)'),
	merges: z.boolean().optional().describe('Print only merge commits (--merges)'),
	firstParent: z
		.boolean()
		.optional()
		.describe('Follow only the first parent commit upon seeing a merge commit (--first-parent)'),
	all: z.boolean().optional().describe('Show commits from all branches (--all)'),
	branches: z.array(z.string()).optional().describe('Show commits from specific branches'),
	pathspec: z.array(z.string()).optional().describe('Limit commits to those that affect the given paths'),
};

/**
 * Git Log Tool
 * Provides git log functionality for MCP
 */
export class GitLogTool {
	readonly config: ToolConfig<typeof GIT_LOG_INPUT_SCHEMA, never> = {
		description: 'View commit history and log information from a git repository.',
		inputSchema: GIT_LOG_INPUT_SCHEMA,
		annotations: {
			title: 'Log',
			readOnlyHint: true,
		},
	};

	get name() {
		return 'log';
	}

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	/**
	 * Transform log input parameters to git log options
	 */
	// eslint-disable-next-line complexity
	public inputToOptions(input: z.infer<z.ZodObject<typeof GIT_LOG_INPUT_SCHEMA>>) {
		const options: Options = {};

		if (input.maxCount) {
			options['--max-count'] = input.maxCount;
		}

		if (input.skip) {
			options['--skip'] = input.skip;
		}

		if (input.since) {
			options['--since'] = input.since;
		}

		if (input.until) {
			options['--until'] = input.until;
		}

		if (input.author) {
			options['--author'] = input.author;
		}

		if (input.grep) {
			options['--grep'] = input.grep;
		}

		if (input.format) {
			options['--pretty'] = input.format;
		}

		if (input.graph) {
			options['--graph'] = null;
		}

		if (input.stat) {
			options['--stat'] = null;
		}

		if (input.shortStat) {
			options['--shortstat'] = null;
		}

		if (input.nameOnly) {
			options['--name-only'] = null;
		}

		if (input.nameStatus) {
			options['--name-status'] = null;
		}

		if (input.abbrevCommit) {
			options['--abbrev-commit'] = null;
		}

		if (input.noMerges) {
			options['--no-merges'] = null;
		}

		if (input.merges) {
			options['--merges'] = null;
		}

		if (input.firstParent) {
			options['--first-parent'] = null;
		}

		if (input.all) {
			options['--all'] = null;
		}

		if (input.branches && input.branches.length > 0) {
			// Add each branch as a separate argument
			options.branches = input.branches;
		}

		if (input.pathspec && input.pathspec.length > 0) {
			options['--'] = input.pathspec;
		}

		return options;
	}

	readonly #handle: ToolCallback<typeof GIT_LOG_INPUT_SCHEMA> = async (input) => {
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

		const logResult = await sg.log(this.inputToOptions(input));

		return {
			content: [
				{
					type: 'text',
					text: 'Git log retrieved successfully',
				},
				{
					type: 'text',
					text: JSON.stringify(logResult),
				},
			],
		};
	};
}
