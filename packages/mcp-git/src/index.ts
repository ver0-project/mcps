import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {GitAddTool} from './tools/add.js';
import {GitStatusTool} from './tools/status.js';

const server = new McpServer({
	name: 'mcp-git',
	version: '0.1.0',
});

// register tools
new GitStatusTool().register(server);
new GitAddTool().register(server);

const transport = new StdioServerTransport();
await server.connect(transport);
