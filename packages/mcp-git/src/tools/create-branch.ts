import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {simpleGit} from 'simple-git';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';

// Git create branch input schema constant
export const GIT_CREATE_BRANCH_INPUT_SCHEMA = {
	repoPath: z.string().describe('Absolute path to the git repository'),
	branchName: z.string().describe('Name of the new branch to create'),
	startPoint: z
		.string()
		.optional()
		.describe('Starting point for new branch (commit, branch, or tag). Defaults to current HEAD'),
	switchToBranch: z
		.boolean()
		.optional()
		.default(true)
		.describe('Switch to the new branch after creation (default: true)'),
	force: z.boolean().optional().describe('Force create branch, resetting it if it already exists (-B flag)'),
};

/**
 * Git Create Branch Tool
 * Provides git branch creation functionality for MCP
 */
export class GitCreateBranchTool {
	readonly config: ToolConfig<typeof GIT_CREATE_BRANCH_INPUT_SCHEMA, never> = {
		description: 'Create a new git branch, optionally from a specific starting point.',
		inputSchema: GIT_CREATE_BRANCH_INPUT_SCHEMA,
		annotations: {
			title: 'Create Branch',
			readOnlyHint: false,
		},
	};

	get name() {
		return 'create-branch';
	}

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	readonly #handle: ToolCallback<typeof GIT_CREATE_BRANCH_INPUT_SCHEMA> = async (input) => {
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

		const startPoint = input.startPoint ?? 'HEAD';

		// Force create branch with switch (equivalent to git checkout -B)
		if (input.force && input.switchToBranch) {
			await sg.checkout(['-B', input.branchName, startPoint]);
			return {
				content: [
					{
						type: 'text',
						text: `Force created and switched to branch '${input.branchName}' from '${startPoint}'`,
					},
				],
			};
		}

		// Force create branch without switch
		if (input.force) {
			const result = await sg.branch(['-B', input.branchName, startPoint]);
			return {
				content: [
					{
						type: 'text',
						text: `Force created branch '${input.branchName}' from '${startPoint}'`,
					},
					{
						type: 'text',
						text: JSON.stringify(result),
					},
				],
			};
		}

		// Regular branch creation with switch
		if (input.switchToBranch) {
			await (input.startPoint
				? sg.checkoutBranch(input.branchName, input.startPoint)
				: sg.checkoutLocalBranch(input.branchName));
			return {
				content: [
					{
						type: 'text',
						text: `Created and switched to branch '${input.branchName}'${input.startPoint ? ` from '${input.startPoint}'` : ''}`,
					},
				],
			};
		}

		// Regular branch creation without switch
		const result = await sg.branch([input.branchName, startPoint]);

		return {
			content: [
				{
					type: 'text',
					text: `Created branch '${input.branchName}' from '${startPoint}'`,
				},
				{
					type: 'text',
					text: JSON.stringify(result),
				},
			],
		};
	};
}
