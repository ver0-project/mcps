import minifyHTML from '@minify-html/node';
import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import {z} from 'zod';
import type {ToolConfig} from '../types.js';
import {HTTP_FETCH_INPUT_SCHEMA, inputToRequestOptions, trimString, isHtmlContentType} from './common.js';

const HTML_ACCEPT_HEADER = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
const BROWSER_USER_AGENT =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const HTML_FETCH_INPUT_SCHEMA = {
	...HTTP_FETCH_INPUT_SCHEMA,
	minify: z
		.boolean()
		.optional()
		.default(false)
		.describe('Whether to minify the HTML response to save tokens. Only applied when response content-type is HTML.'),
	start: z
		.number()
		.int()
		.min(0)
		.optional()
		.default(0)
		.describe('Start character position to return from the HTML content, defaults to 0.'),
	end: z
		.number()
		.int()
		.positive()
		.optional()
		.describe('End character position to return from the HTML content, defaults to content length.'),
};

const minifierOptions: Parameters<typeof minifyHTML.minify>[1] = {
	preserve_brace_template_syntax: true,
	preserve_chevron_percent_template_syntax: true,
	allow_noncompliant_unquoted_attribute_values: true,
	minify_css: true,
	minify_js: true,
	minify_doctype: true,
	keep_comments: true,
	keep_closing_tags: true,
	keep_html_and_head_opening_tags: true,
	keep_input_type_text_attr: true,
	keep_ssi_comments: true,
};

export class FetchHtmlTool {
	get name() {
		return 'fetch-html';
	}

	readonly config: ToolConfig<typeof HTML_FETCH_INPUT_SCHEMA, never> = {
		description: 'Fetch a URI over HTTP and return both response metadata and raw HTML/text body.',
		inputSchema: HTML_FETCH_INPUT_SCHEMA,
		annotations: {
			title: 'Fetch HTML',
			readOnlyHint: false,
		},
	};

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	readonly #handle: ToolCallback<typeof HTML_FETCH_INPUT_SCHEMA> = async (input) => {
		const options = inputToRequestOptions(input);

		options.headers = new Headers(options.headers);
		if (!options.headers.has('Accept')) {
			options.headers.set('Accept', HTML_ACCEPT_HEADER);
		}
		if (!options.headers.has('User-Agent')) {
			options.headers.set('User-Agent', BROWSER_USER_AGENT);
		}

		const response = await fetch(input.uri, options);
		const originalHTML = await response.text();
		let outputHTML = originalHTML;

		const metadata: Record<string, unknown> = {
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries()),
			url: response.url,
			type: response.type,
			redirected: response.redirected,
			minified: false,
		};

		const result: CallToolResult = {
			content: [],
		};

		// Get content type from response
		const contentType = response.headers.get('content-type');
		const isHtmlContent = isHtmlContentType(contentType);

		if (input.minify && isHtmlContent) {
			try {
				outputHTML = minifyHTML.minify(Buffer.from(originalHTML), minifierOptions).toString('utf8');
				metadata.minified = true;
			} catch (error) {
				outputHTML = originalHTML;
				result.content.push({
					type: 'text',
					text: `Minification failed, responding with original HTML.\nError: ${String(error)}`,
				});
			}
		} else if (input.minify && !isHtmlContent) {
			// Add a note that minification was skipped due to non-HTML content type
			result.content.push({
				type: 'text',
				text: `Minification skipped: Content type '${contentType}' is not HTML.`,
			});
		}

		if (input.start !== undefined || input.end !== undefined) {
			metadata.contentLength = originalHTML.length;
			if (metadata.minified) {
				metadata.minifiedLength = outputHTML.length;
			}

			outputHTML = trimString(outputHTML, input.start, input.end);
		}

		result.content.push(
			{
				type: 'text',
				text: JSON.stringify(metadata),
			},
			{
				type: 'text',
				text: outputHTML,
			}
		);

		return result;
	};
}
