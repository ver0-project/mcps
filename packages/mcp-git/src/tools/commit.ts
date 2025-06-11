import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Options} from 'simple-git';
import {simpleGit} from 'simple-git';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';

// Git commit input schema constant
export const GIT_COMMIT_INPUT_SCHEMA = {
	repoPath: z.string().describe('Absolute path to the git repository'),
	message: z.string().describe('Commit message (-m, --message)'),
	all: z.boolean().optional().describe('Automatically stage modified and deleted files (-a, --all)'),
	reuseMessage: z.string().optional().describe('Reuse message from existing commit (-C, --reuse-message)'),
	reeditMessage: z.string().optional().describe('Like reuseMessage but invoke editor (-c, --reedit-message)'),
	fixup: z.string().optional().describe('Create fixup commit for specified commit (--fixup)'),
	squash: z.string().optional().describe('Create squash commit for specified commit (--squash)'),
	file: z.string().optional().describe('Read commit message from file (-F, --file)'),
	author: z.string().optional().describe('Override author (--author)'),
	date: z.string().optional().describe('Override author date (--date)'),
	amend: z.boolean().optional().describe('Amend the previous commit (--amend)'),
	allowEmpty: z.boolean().optional().describe('Allow empty commits (--allow-empty)'),
	allowEmptyMessage: z.boolean().optional().describe('Allow empty commit messages (--allow-empty-message)'),
	noVerify: z.boolean().optional().describe('Bypass pre-commit and commit-msg hooks (-n, --no-verify)'),
	verbose: z.boolean().optional().describe('Show unified diff of changes (-v, --verbose)'),
	quiet: z.boolean().optional().describe('Suppress commit summary message (-q, --quiet)'),
	dryRun: z.boolean().optional().describe('Show what would be committed (--dry-run)'),
	cleanup: z
		.enum(['strip', 'whitespace', 'verbatim', 'scissors', 'default'])
		.optional()
		.describe('Cleanup mode (--cleanup)'),
	noStatus: z.boolean().optional().describe('Do not include status in commit message template (--no-status)'),
	include: z.boolean().optional().describe('Include given paths in addition to index (-i, --include)'),
	only: z.boolean().optional().describe('Commit only specified paths (-o, --only)'),
	pathspec: z.array(z.string()).optional().describe('Limit commit to specified paths'),
	gpgSign: z.union([z.boolean(), z.string()]).optional().describe('GPG sign commit (-S, --gpg-sign)'),
	noGpgSign: z.boolean().optional().describe('Do not GPG sign commit (--no-gpg-sign)'),
	trailers: z.array(z.string()).optional().describe('Add trailers to commit message (--trailer)'),
};

/**
 * Git Commit Tool
 * Provides git commit functionality for MCP
 */
export class GitCommitTool {
	get name() {
		return 'commit';
	}

	readonly config: ToolConfig<typeof GIT_COMMIT_INPUT_SCHEMA, never> = {
		description: 'Commit staged changes to the git repository.',
		inputSchema: GIT_COMMIT_INPUT_SCHEMA,
		annotations: {
			title: 'Commit',
			readOnlyHint: false,
		},
	};

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	/**
	 * Transform commit input parameters to git command options
	 */
	// eslint-disable-next-line complexity
	public inputToOptions(input: z.infer<z.ZodObject<typeof GIT_COMMIT_INPUT_SCHEMA>>) {
		const options: Options = {};

		if (input.all) {
			options['--all'] = null;
		}

		if (input.reuseMessage) {
			options['--reuse-message'] = input.reuseMessage;
		}

		if (input.reeditMessage) {
			options['--reedit-message'] = input.reeditMessage;
		}

		if (input.fixup) {
			options['--fixup'] = input.fixup;
		}

		if (input.squash) {
			options['--squash'] = input.squash;
		}

		if (input.file) {
			options['--file'] = input.file;
		}

		if (input.author) {
			options['--author'] = input.author;
		}

		if (input.date) {
			options['--date'] = input.date;
		}

		if (input.amend) {
			options['--amend'] = null;
		}

		if (input.allowEmpty) {
			options['--allow-empty'] = null;
		}

		if (input.allowEmptyMessage) {
			options['--allow-empty-message'] = null;
		}

		if (input.noVerify) {
			options['--no-verify'] = null;
		}

		if (input.verbose) {
			options['--verbose'] = null;
		}

		if (input.quiet) {
			options['--quiet'] = null;
		}

		if (input.dryRun) {
			options['--dry-run'] = null;
		}

		if (input.cleanup) {
			options['--cleanup'] = input.cleanup;
		}

		if (input.noStatus) {
			options['--no-status'] = null;
		}

		if (input.include) {
			options['--include'] = null;
		}

		if (input.only) {
			options['--only'] = null;
		}

		if (input.gpgSign !== undefined) {
			if (typeof input.gpgSign === 'boolean') {
				if (input.gpgSign) {
					options['--gpg-sign'] = null;
				} else {
					options['--no-gpg-sign'] = null;
				}
			} else {
				options['--gpg-sign'] = input.gpgSign;
			}
		}

		if (input.noGpgSign) {
			options['--no-gpg-sign'] = null;
		}

		if (input.trailers && input.trailers.length > 0) {
			// For multiple trailers, we can use an array of values
			options['--trailer'] = input.trailers;
		}

		return options;
	}

	readonly #handle: ToolCallback<typeof GIT_COMMIT_INPUT_SCHEMA> = async (input) => {
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

		const result = await sg.commit(input.message, input.pathspec, this.inputToOptions(input));

		return {
			content: [
				{
					type: 'text',
					text: `Changes committed successfully.`,
				},
				{
					type: 'text',
					text: JSON.stringify(result),
				},
			],
		};
	};
}
