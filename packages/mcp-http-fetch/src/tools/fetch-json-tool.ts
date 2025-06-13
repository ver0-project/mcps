import type {McpServer, ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {ToolConfig} from '../types.js';
import {HTTP_FETCH_INPUT_SCHEMA, inputToRequestOptions} from './common.js';

const JSON_ACCEPT_HEADER = 'application/json, text/json, */*;q=0.8';
const BROWSER_USER_AGENT =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export class FetchJsonTool {
	get name() {
		return 'fetch-json';
	}

	readonly config: ToolConfig<typeof HTTP_FETCH_INPUT_SCHEMA, never> = {
		description: 'Fetch a URI over HTTP and return the raw response body as text with response metadata.',
		inputSchema: HTTP_FETCH_INPUT_SCHEMA,
		annotations: {
			title: 'Fetch JSON',
			readOnlyHint: false,
			openWorldHint: true,
		},
	};

	register(srv: McpServer) {
		srv.registerTool(this.name, this.config, this.#handle);
	}

	readonly #handle: ToolCallback<typeof HTTP_FETCH_INPUT_SCHEMA> = async (input) => {
		const options = inputToRequestOptions(input);

		options.headers = new Headers(options.headers);
		if (!options.headers.has('Accept')) {
			options.headers.set('Accept', JSON_ACCEPT_HEADER);
		}
		if (!options.headers.has('User-Agent')) {
			options.headers.set('User-Agent', BROWSER_USER_AGENT);
		}

		const response = await fetch(input.uri, options);
		const metadata: Record<string, unknown> = {
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries()),
			url: response.url,
			type: response.type,
			redirected: response.redirected,
		};

		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(metadata),
				},
				{
					type: 'text',
					text: await response.text(),
				},
			],
		};
	};
}
