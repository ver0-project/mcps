import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {AskQuestionTool} from './tools/ask-question.js';

const server = new McpServer({
	name: 'mcp-question',
	version: '0.1.0',
});

// Register the ask question tool
new AskQuestionTool().register(server);

const transport = new StdioServerTransport();
await server.connect(transport);
