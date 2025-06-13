import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Options} from 'simple-git';
import {simpleGit} from 'simple-git';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';

// Git checkout input schema constant synced with git-checkout documentation
export const GIT_CHECKOUT_INPUT_SCHEMA = {
	repoPath: z.string().describe('Absolute path to the git repository'),
	target: z.string().describe('Branch name, commit hash, or tag to checkout'),
	force: z.boolean().optional().describe('Force checkout, throw away local modifications (-f, --force)'),
	merge: z
		.boolean()
		.optional()
		.describe('When switching branches, proceed even if index/working tree differs from HEAD (-m, --merge)'),
	detach: z
		.boolean()
		.optional()
		.describe('Check out a commit for inspection rather than switching to a branch (--detach)'),
	createBranch: z.string().optional().describe('Create a new branch and start it at <start-point> (-b <new-branch>)'),
	createBranchForce: z
		.string()
		.optional()
		.describe('Create or reset a branch and start it at <start-point> (-B <new-branch>)'),
	orphan: z.string().optional().describe('Create a new orphan branch (--orphan <new-branch>)'),
	track: z.boolean().optional().describe('Set up upstream configuration (--track)'),
	noTrack: z.boolean().optional().describe('Do not set up upstream configuration (--no-track)'),
	pathspec: z.array(z.string()).optional().describe('Limit checkout to specific paths'),
};

/**
 * Git Checkout Tool
 * Provides git checkout functionality for MCP
 */
export class GitCheckoutTool {
	readonly config: ToolConfig<typeof GIT_CHECKOUT_INPUT_SCHEMA, never> = {
		description: 'Switch branches, commits, or restore working tree files.',
		inputSchema: GIT_CHECKOUT_INPUT_SCHEMA,
		annotations: {
			title: 'Checkout',
			readOnlyHint: false,
		},
	};

	get name() {
		return 'checkout';
	}

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	/**
	 * Transform checkout input parameters to git command options
	 */
	public inputToOptions(input: z.infer<z.ZodObject<typeof GIT_CHECKOUT_INPUT_SCHEMA>>) {
		const options: Options = {};

		if (input.force) {
			options['--force'] = null;
		}

		if (input.merge) {
			options['--merge'] = null;
		}

		if (input.detach) {
			options['--detach'] = null;
		}

		if (input.track) {
			options['--track'] = null;
		}

		if (input.noTrack) {
			options['--no-track'] = null;
		}

		// Handle branch creation options
		if (input.createBranch) {
			options['-b'] = input.createBranch;
		} else if (input.createBranchForce) {
			options['-B'] = input.createBranchForce;
		} else if (input.orphan) {
			options['--orphan'] = input.orphan;
		}

		// Add pathspec if provided
		if (input.pathspec && input.pathspec.length > 0) {
			options['--'] = input.pathspec;
		}

		return options;
	}

	readonly #handle: ToolCallback<typeof GIT_CHECKOUT_INPUT_SCHEMA> = async (input) => {
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

		// Execute checkout with transformed options and target
		await sg.checkout(input.target, this.inputToOptions(input));

		return {
			content: [
				{
					type: 'text',
					text: 'Checkout completed successfully',
				},
			],
		};
	};
}
