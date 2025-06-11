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
	get name() {
		return 'create-branch';
	}

	readonly config: ToolConfig<typeof GIT_CREATE_BRANCH_INPUT_SCHEMA, never> = {
		description: 'Create a new git branch, optionally from a specific starting point.',
		inputSchema: GIT_CREATE_BRANCH_INPUT_SCHEMA,
		annotations: {
			title: 'Create Branch',
			readOnlyHint: false,
		},
	};

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

		try {
			let message: string;
			let switched = false;
			const startPoint = input.startPoint || 'HEAD';

			// Create the branch
			if (input.force) {
				// Force create branch (equivalent to git checkout -B)
				if (input.switchToBranch) {
					await sg.checkout(['-B', input.branchName, startPoint]);
					switched = true;
					message = `Force created and switched to branch '${input.branchName}' from '${startPoint}'`;
				} else {
					await sg.branch(['-B', input.branchName, startPoint]);
					message = `Force created branch '${input.branchName}' from '${startPoint}'`;
				}
			} else {
				// Regular branch creation
				if (input.switchToBranch) {
					if (input.startPoint) {
						await sg.checkoutBranch(input.branchName, input.startPoint);
					} else {
						await sg.checkoutLocalBranch(input.branchName);
					}
					switched = true;
					message = `Created and switched to branch '${input.branchName}'${input.startPoint ? ` from '${input.startPoint}'` : ''}`;
				} else {
					await sg.branch([input.branchName, startPoint]);
					message = `Created branch '${input.branchName}' from '${startPoint}'`;
				}
			}

			return {
				content: [
					{
						type: 'text',
						text: message,
					},
				],
			};
		} catch (error) {
			return {
				isError: true,
				content: [
					{
						type: 'text',
						text: `Branch creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
					},
				],
			};
		}
	};
}
