import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {simpleGit} from 'simple-git';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';

// Git show input schema constant
export const GIT_SHOW_INPUT_SCHEMA = {
	repoPath: z
		.string()
		.describe('Absolute path to the git repository. Path must be a valid system path in the style of the host OS.'),
	commit: z.string().optional().describe('Commit hash, branch, or tag to show (defaults to HEAD)'),
	format: z
		.enum(['oneline', 'short', 'medium', 'full', 'fuller', 'email', 'raw'])
		.optional()
		.describe('Pretty-print format for commit'),
	nameOnly: z.boolean().optional().describe('Show only names of changed files (--name-only)'),
	nameStatus: z.boolean().optional().describe('Show names and status of changed files (--name-status)'),
	stat: z.boolean().optional().describe('Show diffstat (--stat)'),
	pathspec: z.array(z.string()).optional().describe('Limit show to specific paths'),
};

/**
 * Git Show Tool
 * Provides git show functionality for MCP
 */
export class GitShowTool {
	readonly config: ToolConfig<typeof GIT_SHOW_INPUT_SCHEMA, never> = {
		description: 'Display commit details and changes.',
		inputSchema: GIT_SHOW_INPUT_SCHEMA,
		annotations: {
			title: 'Git Show',
			readOnlyHint: true,
		},
	};

	get name() {
		return 'show';
	}

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	readonly #handle: ToolCallback<typeof GIT_SHOW_INPUT_SCHEMA> = async (input) => {
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

		const args: string[] = [];

		if (input.format) {
			args.push(`--pretty=${input.format}`);
		}

		if (input.nameOnly) {
			args.push('--name-only');
		}

		if (input.nameStatus) {
			args.push('--name-status');
		}

		if (input.stat) {
			args.push('--stat');
		}

		const commit = input.commit ?? 'HEAD';
		args.push(commit);

		if (input.pathspec && input.pathspec.length > 0) {
			args.push('--', ...input.pathspec);
		}

		const result = await sg.show(args);

		return {
			content: [
				{
					type: 'text',
					text: result || `No information found for ${commit}`,
				},
			],
		};
	};
}
