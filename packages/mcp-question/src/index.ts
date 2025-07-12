import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
	name: 'mcp-question',
	version: '0.1.0',
});

const transport = new StdioServerTransport();
await server.connect(transport);
