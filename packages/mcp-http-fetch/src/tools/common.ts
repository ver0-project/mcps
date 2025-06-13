import {z} from 'zod';

// Input schema for HTTP fetch tool
export const HTTP_FETCH_INPUT_SCHEMA = {
	uri: z.string().url().describe('The target URI to fetch.'),
	method: z
		.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'])
		.default('GET')
		.describe('HTTP method to use.'),
	headers: z.record(z.string()).optional().describe('HTTP headers to include in the request.'),
	body: z
		.union([z.string(), z.record(z.any())])
		.optional()
		.describe('Request body. String for raw data, object for JSON.'),
	followRedirects: z.boolean().optional().default(true).describe('Whether to follow redirects.'),
	credentials: z
		.enum(['omit', 'same-origin', 'include'])
		.optional()
		.default('same-origin')
		.describe('Credentials policy.'),
	cache: z
		.enum(['default', 'no-store', 'reload', 'no-cache', 'force-cache'])
		.optional()
		.describe('Cache mode for the request.'),
	mode: z.enum(['cors', 'no-cors', 'same-origin']).optional().default('cors').describe('CORS mode.'),
	referrer: z.string().url().optional().describe('Request referrer URL.'),
	referrerPolicy: z
		.enum([
			'no-referrer',
			'no-referrer-when-downgrade',
			'origin',
			'origin-when-cross-origin',
			'same-origin',
			'strict-origin',
			'strict-origin-when-cross-origin',
			'unsafe-url',
		])
		.optional()
		.default('strict-origin-when-cross-origin')
		.describe('Referrer policy.'),
};

export type HttpFetchInput = z.infer<z.ZodObject<typeof HTTP_FETCH_INPUT_SCHEMA>>;

/**
 * Transforms input parameters to RequestInit options
 */
export function inputToRequestOptions(input: HttpFetchInput): RequestInit {
	const body = input.body ? (typeof input.body === 'string' ? input.body : JSON.stringify(input.body)) : undefined;

	return {
		method: input.method,
		headers: input.headers,
		body,
		redirect: input.followRedirects ? 'follow' : 'manual',
		credentials: input.credentials,
		cache: input.cache,
		mode: input.mode,
	};
}

export function trimString(input: string, start = 0, end = input.length): string {
	return input.slice(start, end);
}

const HTML_CONTENT_TYPES = new Set(['text/html', 'application/xhtml+xml', 'application/xhtml']);
/**
 * Checks if the given content type indicates HTML content
 */
export function isHtmlContentType(contentType: string | null): boolean {
	if (!contentType) {
		return false;
	}

	// as content type can contain additional data separated with a semicolon,
	// we need to trim the string to get the actual content type
	const trimmedContentType = contentType.toLowerCase().split(';')[0].trim();

	return HTML_CONTENT_TYPES.has(trimmedContentType);
}
