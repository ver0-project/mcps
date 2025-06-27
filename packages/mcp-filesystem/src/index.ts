import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {FileStatTool} from './tools/stat.js';
import {ListDirectoryTool} from './tools/list-directory.js';

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
new ListDirectoryTool().register(server);

/**
 * TODO: Register additional filesystem tools here
 * Tools implemented:
 * - stat (get file/directory stats) ✅
 * - list-directory (list directory contents) ✅ (skeleton)
 *
 * Tools to implement:
 * - read_file (read)
 * - read_multiple_files (read-many)
 * - write_file (write)
 * - write_multiple_files (write-many)
 * - search_files (grep)
 * - find_files (find)
 * - create_directory (mkdir)
 * - diff_files (diff-file)
 * - move_file (move)
 * - copy_file (copy)
 */

const transport = new StdioServerTransport();
await server.connect(transport);
