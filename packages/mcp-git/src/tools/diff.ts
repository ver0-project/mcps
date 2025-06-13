import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {simpleGit} from 'simple-git';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';

// Git diff input schema constant
export const GIT_DIFF_INPUT_SCHEMA = {
	repoPath: z.string().describe('Absolute path to the git repository'),
	from: z.string().optional().describe('Source commit, branch, or tag (defaults to working directory)'),
	to: z.string().optional().describe('Target commit, branch, or tag (defaults to HEAD)'),
	pathspec: z.array(z.string()).optional().describe('Limit diff to specific paths'),
	staged: z.boolean().optional().describe('Show staged changes (--cached)'),
	nameOnly: z.boolean().optional().describe('Show only names of changed files (--name-only)'),
	nameStatus: z.boolean().optional().describe('Show names and status of changed files (--name-status)'),
	stat: z.boolean().optional().describe('Show diffstat (--stat)'),
};

/**
 * Git Diff Tool
 * Provides git diff functionality for MCP
 */
export class GitDiffTool {
	readonly config: ToolConfig<typeof GIT_DIFF_INPUT_SCHEMA, never> = {
		description: 'Show differences between commits, branches, files.',
		inputSchema: GIT_DIFF_INPUT_SCHEMA,
		annotations: {
			title: 'Git Diff',
			readOnlyHint: true,
		},
	};

	get name() {
		return 'diff';
	}

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	readonly #handle: ToolCallback<typeof GIT_DIFF_INPUT_SCHEMA> = async (input) => {
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

		const options: string[] = [];

		if (input.staged) {
			options.push('--cached');
		}
		if (input.nameOnly) {
			options.push('--name-only');
		}
		if (input.nameStatus) {
			options.push('--name-status');
		}
		if (input.stat) {
			options.push('--stat');
		}

		// Build diff arguments
		const args: string[] = [...options];

		if (input.from && input.to) {
			args.push(`${input.from}..${input.to}`);
		} else if (input.from) {
			args.push(input.from);
		} else if (input.to) {
			args.push(input.to);
		}

		if (input.pathspec && input.pathspec.length > 0) {
			args.push('--', ...input.pathspec);
		}

		const result = await sg.diff(args);

		return {
			content: [
				{
					type: 'text',
					text: result || 'No differences found',
				},
			],
		};
	};
}
