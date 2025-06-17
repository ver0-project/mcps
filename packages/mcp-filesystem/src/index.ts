import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {FileStatTool} from './tools/stat.js';

const server = new McpServer(
	{
		name: 'mcp-filesystem',
		version: '0.1.0',
	},
	{
		instructions: 'This MCP server provides tools for filesystem operations.',
	}
);

// Register filesystem tools
new FileStatTool().register(server);

/**
 * TODO: Register additional filesystem tools here
 * Tools to implement:
 * - get_file_info (stats)
 * - read_file (read)
 * - read_multiple_files (read-many)
 * - write_file (write)
 * - write_multiple_files (write-many)
 * - list_directory (list-directory)
 * - search_files (grep)
 * - find_files (find)
 * - create_directory (mkdir)
 * - diff_files (diff-file)
 * - move_file (move)
 * - copy_file (copy)
 */

const transport = new StdioServerTransport();
await server.connect(transport);
