import TurndownService from 'turndown';
import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';
import {HTTP_FETCH_INPUT_SCHEMA, inputToRequestOptions, trimString, isHtmlContentType} from './common.js';

const MARKDOWN_ACCEPT_HEADER =
	'text/markdown,text/x-markdown,application/markdown,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
const BROWSER_USER_AGENT =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const tds = new TurndownService({
	headingStyle: 'atx',
	hr: '---',
	bulletListMarker: '-',
	codeBlockStyle: 'fenced',
	fence: '```',
	emDelimiter: '_',
	strongDelimiter: '**',
	linkStyle: 'inlined',
	linkReferenceStyle: 'full',
});

// Add custom rules for better markdown conversion
tds.addRule('strikethrough', {
	filter: ['del', 's'],
	replacement: (content) => `~~${content}~~`,
});

tds.addRule('table', {
	filter: 'table',
	replacement: (content) => `\n${content}\n`,
});

tds.remove(['head', 'script', 'style']);

const MARKDOWN_FETCH_INPUT_SCHEMA = {
	...HTTP_FETCH_INPUT_SCHEMA,
	start: z
		.number()
		.int()
		.min(0)
		.optional()
		.default(0)
		.describe('Start character position to return from the content, defaults to 0.'),
	end: z
		.number()
		.int()
		.positive()
		.optional()
		.describe('End character position to return from the content, defaults to content length.'),
};

export class FetchMarkdownTool {
	get name() {
		return 'fetch-markdown';
	}

	readonly config: ToolConfig<typeof MARKDOWN_FETCH_INPUT_SCHEMA, never> = {
		description: 'Fetch a URI over HTTP and convert HTML to markdown or return raw content with response metadata.',
		inputSchema: MARKDOWN_FETCH_INPUT_SCHEMA,
		annotations: {
			title: 'Fetch Markdown',
			readOnlyHint: false,
			openWorldHint: true,
		},
	};

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	readonly #handle: ToolCallback<typeof MARKDOWN_FETCH_INPUT_SCHEMA> = async (input) => {
		const options = inputToRequestOptions(input);

		options.headers = new Headers(options.headers);
		if (!options.headers.has('Accept')) {
			options.headers.set('Accept', MARKDOWN_ACCEPT_HEADER);
		}
		if (!options.headers.has('User-Agent')) {
			options.headers.set('User-Agent', BROWSER_USER_AGENT);
		}

		const response = await fetch(input.uri, options);
		const originalContent = await response.text();
		let outputContent = originalContent;

		const metadata: Record<string, unknown> = {
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries()),
			url: response.url,
			type: response.type,
			redirected: response.redirected,
			convertedToMarkdown: false,
		};

		const result: CallToolResult = {
			content: [],
		};

		// Get content type from response
		const contentType = response.headers.get('content-type');
		const isHtmlContent = isHtmlContentType(contentType);

		if (isHtmlContent) {
			try {
				outputContent = tds.turndown(originalContent);
				metadata.convertedToMarkdown = true;
			} catch (error) {
				outputContent = originalContent;
				result.content.push({
					type: 'text',
					text: `Markdown conversion failed, responding with original content.\nError: ${String(error)}`,
				});
			}
		} else {
			// Add a note that conversion was skipped due to non-HTML content type
			result.content.push({
				type: 'text',
				text: `Markdown conversion skipped: Content type '${contentType}' is not HTML.`,
			});
		}

		if (input.start !== undefined || input.end !== undefined) {
			metadata.contentLength = originalContent.length;
			if (metadata.convertedToMarkdown) {
				metadata.markdownLength = outputContent.length;
			}

			outputContent = trimString(outputContent, input.start, input.end);
		}

		result.content.push(
			{
				type: 'text',
				text: JSON.stringify(metadata),
			},
			{
				type: 'text',
				text: outputContent,
			}
		);

		return result;
	};
}
