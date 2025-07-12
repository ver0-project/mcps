# MCP HTTP Fetch Server

An MCP (Model Context Protocol) server that provides HTTP fetching capabilities as tools for AI assistants and
applications. This server enables AI systems to fetch and process web content through a structured, validated interface.

## Tools

The server provides the following HTTP fetch operations:

### Available Tools

1. **`fetch-html`** ✅ - Fetch HTML content with optional minification and content limiting
2. **`fetch-markdown`** ✅ - Fetch HTML and convert to markdown with content limiting
3. **`fetch-json`** ✅ - Fetch and return the raw response body as text (no JSON parsing)

## Tool Details

### Common Input Parameters

All tools share the following input parameters (unless otherwise noted):

- `uri` (string): The target URI to fetch (required)
- `method` (string): HTTP method to use (default: GET)
- `headers` (object): HTTP headers to include in the request (optional)
- `body` (string | object): Request body for POST/PUT requests (optional; object will be JSON-stringified)
- `followRedirects` (boolean): Whether to follow redirects (default: true)
- `credentials` (string): Credentials policy (`omit`, `same-origin`, `include`; default: `same-origin`)
- `cache` (string): Cache mode (`default`, `no-store`, `reload`, `no-cache`, `force-cache`; optional)
- `mode` (string): CORS mode (`cors`, `no-cors`, `same-origin`; default: `cors`)
- `referrer` (string): Request referrer URL (optional)
- `referrerPolicy` (string): Referrer policy (default: `strict-origin-when-cross-origin`)

### Response Structure (All Tools)

Each tool returns a response with:

- `content`: Array of objects, each with `{ type: 'text', text: string }`
  - The first item is always a JSON string with response metadata (status, headers, URL, etc.)
  - The second item is the main response body (HTML, markdown, or raw text)
  - Additional items may include error or info messages

---

### fetch-html

Fetches HTML content from a URL with optional minification and content limiting.

**Additional Inputs:**

- `minify` (boolean): Whether to minify the HTML response to save tokens (default: false; only applied for HTML content)
- `start` (number): Start character position to return from the HTML content (default: 0)
- `end` (number): End character position to return from the HTML content (default: content length)

**Features:**

- Automatic browser-like headers (`Accept`, `User-Agent`) if not provided
- HTML minification using `@minify-html/node` (only for HTML content types)
- Content limiting via `start` and `end` (useful for large documents)
- Error handling: If minification fails, returns original HTML with an error message; if content type is not HTML,
  minification is skipped with a note

---

### fetch-markdown

Fetches HTML content from a URL and converts it to markdown format for better readability and token efficiency.

**Additional Inputs:**

- `start` (number): Start character position to return from the markdown content (default: 0)
- `end` (number): End character position to return from the markdown content (default: content length)

**Features:**

- Automatic markdown-prioritized headers (`Accept: text/markdown, text/x-markdown, application/markdown`, then HTML
  types)
- High-quality HTML to markdown conversion using `turndown` with:
  - ATX-style headings, fenced code blocks, proper formatting
  - Enhanced support for strikethrough (`~~text~~`) and tables
  - Removes `<head>`, `<script>`, and `<style>` tags
- Content limiting via `start` and `end`
- Error handling: If conversion fails, returns original content with an error message; if content type is not HTML,
  conversion is skipped with a note

---

### fetch-json

Fetches a URI over HTTP and returns the raw response body as text, along with response metadata.

**Features:**

- `Accept` header prefers JSON content types but will accept any response
- Returns the raw response body as text (no JSON parsing or validation)
- Error handling: Always returns text, even if the response is not valid JSON

---

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
