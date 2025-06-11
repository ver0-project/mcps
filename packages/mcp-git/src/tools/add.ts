import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {simpleGit} from 'simple-git';
import type {TaskOptions} from 'simple-git';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';

// Git add input schema constant
export const GIT_ADD_INPUT_SCHEMA = {
	repoPath: z.string().describe('Absolute path to the git repository'),
	files: z.array(z.string()).describe('List of pathspecs to add'),
};

/**
 * Git Add Tool
 * Provides git add functionality for MCP
 */
export class GitAddTool {
	get name() {
		return 'add';
	}

	readonly config: ToolConfig<typeof GIT_ADD_INPUT_SCHEMA, never> = {
		description: 'Add files to the git staging area.',
		inputSchema: GIT_ADD_INPUT_SCHEMA,
		annotations: {
			title: 'Add',
			readOnlyHint: false,
		},
	};

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	readonly #handle: ToolCallback<typeof GIT_ADD_INPUT_SCHEMA> = async (input) => {
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

		// Execute git add
		const result = await sg.add(input.files);

		console.log('result', result);

		return {
			content: [
				{
					type: 'text',
					text: `Files added to staging area. ${JSON.stringify(result)}`,
				},
			],
		};
	};
}
