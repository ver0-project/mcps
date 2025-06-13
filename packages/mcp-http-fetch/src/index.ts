import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {FetchHtmlTool} from './tools/fetch-html-tool.js';
import {FetchMarkdownTool} from './tools/fetch-markdown-tool.js';

const server = new McpServer({
	name: 'mcp-http-fetch',
	version: '0.0.0',
});

new FetchHtmlTool().register(server);
new FetchMarkdownTool().register(server);

const transport = new StdioServerTransport();
await server.connect(transport);
