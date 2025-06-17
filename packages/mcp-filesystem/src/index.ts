import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ReadTool } from './tools/read.js';
import { StatTool } from './tools/stat.js';

const server = new McpServer({
	name: 'mcp-filesystem',
	version: '0.1.0',
});

// Register filesystem tools
new ReadTool().register(server);
new StatTool().register(server);

const transport = new StdioServerTransport();
await server.connect(transport);
