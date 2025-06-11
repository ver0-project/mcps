import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {simpleGit} from 'simple-git';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';

// Git reset input schema constant
export const GIT_RESET_INPUT_SCHEMA = {
	repoPath: z.string().describe('Absolute path to the git repository'),
	target: z
		.string()
		.optional()
		.describe('Target commit, branch, or tag to reset to (defaults to HEAD)')
		.default('HEAD'),
	mode: z
		.enum(['soft', 'mixed', 'hard'])
		.optional()
		.default('mixed')
		.describe('Reset mode: soft (keep changes staged), mixed (unstage changes), hard (discard changes)'),
	pathspec: z.array(z.string()).optional().describe('Limit reset to specific paths'),
};

/**
 * Git Reset Tool
 * Provides git reset functionality for MCP
 */
export class GitResetTool {
	get name() {
		return 'reset';
	}

	readonly config: ToolConfig<typeof GIT_RESET_INPUT_SCHEMA, never> = {
		description: 'Reset repository state (soft, mixed, hard).',
		inputSchema: GIT_RESET_INPUT_SCHEMA,
		annotations: {
			title: 'Git Reset',
			readOnlyHint: false,
		},
	};

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	readonly #handle: ToolCallback<typeof GIT_RESET_INPUT_SCHEMA> = async (input) => {
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

		const target = input.target ?? 'HEAD';
		const args = [`--${input.mode}`, target];

		if (input.pathspec && input.pathspec.length > 0) {
			args.push('--', ...input.pathspec);
		}

		const result = await sg.reset(args);

		return {
			content: [
				{
					type: 'text',
					text: `Reset ${input.mode} to ${target}${input.pathspec ? ` (paths: ${input.pathspec.join(', ')})` : ''}`,
				},
				{
					type: 'text',
					text: JSON.stringify(result),
				},
			],
		};
	};
}
