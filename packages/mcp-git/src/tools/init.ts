import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {simpleGit} from 'simple-git';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';

// Git init input schema constant
export const GIT_INIT_INPUT_SCHEMA = {
	repoPath: z.string().describe('Absolute path where to initialize the git repository'),
	bare: z.boolean().optional().describe('Create a bare repository (--bare)'),
	initialBranch: z.string().optional().describe('Set the initial branch name (--initial-branch)'),
	template: z.string().optional().describe('Template directory to use (--template)'),
};

/**
 * Git Init Tool
 * Provides git init functionality for MCP
 */
export class GitInitTool {
	get name() {
		return 'init';
	}

	readonly config: ToolConfig<typeof GIT_INIT_INPUT_SCHEMA, never> = {
		description: 'Initialize new Git repository.',
		inputSchema: GIT_INIT_INPUT_SCHEMA,
		annotations: {
			title: 'Git Init',
			readOnlyHint: false,
		},
	};

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	readonly #handle: ToolCallback<typeof GIT_INIT_INPUT_SCHEMA> = async (input) => {
		const sg = simpleGit(input.repoPath);

		const options: string[] = [];

		if (input.bare) {
			options.push('--bare');
		}
		if (input.initialBranch) {
			options.push('--initial-branch', input.initialBranch);
		}
		if (input.template) {
			options.push('--template', input.template);
		}

		const result = await sg.init(options);

		return {
			content: [
				{
					type: 'text',
					text: `Initialized ${input.bare ? 'bare ' : ''}Git repository in ${input.repoPath}`,
				},
				{
					type: 'text',
					text: JSON.stringify(result),
				},
			],
		};
	};
}
