import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {GitAddTool} from './tools/add.js';
import {GitCheckoutTool} from './tools/checkout.js';
import {GitCommitTool} from './tools/commit.js';
import {GitCreateBranchTool} from './tools/create-branch.js';
import {GitDiffTool} from './tools/diff.js';
import {GitInitTool} from './tools/init.js';
import {GitLogTool} from './tools/log.js';
import {GitResetTool} from './tools/reset.js';
import {GitShowTool} from './tools/show.js';
import {GitStatusTool} from './tools/status.js';

const server = new McpServer({
	name: 'mcp-git',
	version: '0.1.0',
});

// register tools
new GitStatusTool().register(server);
new GitAddTool().register(server);
new GitCommitTool().register(server);
new GitLogTool().register(server);
new GitCreateBranchTool().register(server);
new GitCheckoutTool().register(server);
new GitResetTool().register(server);
new GitDiffTool().register(server);
new GitShowTool().register(server);
new GitInitTool().register(server);

const transport = new StdioServerTransport();
await server.connect(transport);
