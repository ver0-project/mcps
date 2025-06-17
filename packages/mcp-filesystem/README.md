# MCP Filesystem Server

An MCP (Model Context Protocol) server that provides comprehensive filesystem capabilities as tools for AI assistants and applications. This server enables AI systems to read, write, search, and manage files and directories on the filesystem with proper security considerations.

## Tools

### File Operations
- **`read`** - Read contents of a single file with encoding support
- **`read-many`** - Read multiple files concurrently with batch processing
- **`write`** - Write content to a single file with create/overwrite/append modes
- **`write-many`** - Write multiple files with transaction-like behavior

### Directory Operations  
- **`list-directory`** - List directory contents with filtering and metadata
- **`stat`** - Get detailed file/directory metadata (size, dates, permissions)

### Search Operations
- **`find`** - Search for files and directories using patterns and criteria
- **`grep`** - Search text content within files using regex or literal patterns

### File Management Operations
- **`mkdir`** - Create directories with recursive option and permission settings
- **`diff-file`** - Compare files and show differences with various output formats
- **`move`** - Move/rename files and directories with collision handling
- **`copy`** - Copy files and directories with recursive and preserve options

## Security Considerations

This server implements several security measures:
- Path validation and sanitization to prevent directory traversal
- Access controls to restrict operations to authorized paths
- Resource limits to prevent abuse
- Proper error handling without exposing sensitive system information

## Installation

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@ver0/mcp-filesystem"]
    }
  }
}
```

## Development Status

🚧 **Under Development** - This package is currently being implemented. See the development plan in the project repository for detailed implementation progress.