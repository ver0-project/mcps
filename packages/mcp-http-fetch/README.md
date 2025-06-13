# MCP HTTP Fetch Server

An MCP (Model Context Protocol) server that provides HTTP fetching capabilities as tools for AI assistants and applications. This server enables AI systems to fetch and process web content through a structured, validated interface.

## Tools

The server provides the following HTTP fetch operations:

### Available Tools

1. **`fetch-html`** ✅ - Fetch HTML content with optional minification

### Planned Tools

2. **`fetch-text`** 🚧 - Fetch plain text content
3. **`fetch-markdown`** 🚧 - Fetch and process Markdown content  
4. **`fetch-json`** 🚧 - Fetch and parse JSON content

## Tool Details

### fetch-html

Fetches HTML content from a URL with optional minification and content limiting to save tokens.

**Features:**
- Automatic browser-like headers (Accept, User-Agent) if not provided
- Optional HTML minification using `@minify-html/node`
- Start and end parameters to limit content or retrieve it in chunks.

**Inputs:**

- `uri` (string): The URL to fetch
- `method` (string, optional): HTTP method (default: GET)
- `headers` (object, optional): Custom HTTP headers
- `body` (string, optional): Request body for POST/PUT requests
- `followRedirects` (boolean, optional): Whether to follow redirects (default: true)
- `timeout` (number, optional): Request timeout in milliseconds
- `minify` (boolean, optional): Whether to minify HTML response to save tokens (default: false)
- `start` (number, optional): Start character position to return from the HTML content, defaults to 0.
- `end` (number, optional): End character position to return from the HTML content, defaults to content length.

**Auto-set Headers:**
- `Accept`: Set to HTML types if not provided
- `User-Agent`: Set to browser-like string if not provided

## Installation

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "http-fetch": {
      "command": "npx",
      "args": ["-y", "@ver0/mcp-http-fetch"]
    }
  }
}
```