import {describe, expect, it, test} from 'vitest';
import type {HttpFetchInput} from './common.js';
import {inputToRequestOptions, trimString} from './common.js';

describe('common', () => {
	describe('inputToRequestOptions', () => {
		it('should transform minimal input with defaults', () => {
			const input: HttpFetchInput = {
				uri: 'https://example.com',
				method: 'GET',
				followRedirects: true,
				credentials: 'same-origin',
				mode: 'cors',
				referrerPolicy: 'strict-origin-when-cross-origin',
			};

			const result = inputToRequestOptions(input);

			expect(result).toEqual({
				method: 'GET',
				headers: undefined,
				body: undefined,
				redirect: 'follow',
				credentials: 'same-origin',
				cache: undefined,
				mode: 'cors',
			});
		});

		it('should transform string body correctly', () => {
			const input: HttpFetchInput = {
				uri: 'https://example.com',
				method: 'POST',
				body: 'raw string data',
				followRedirects: true,
				credentials: 'same-origin',
				mode: 'cors',
				referrerPolicy: 'strict-origin-when-cross-origin',
			};

			const result = inputToRequestOptions(input);

			expect(result.body).toBe('raw string data');
			expect(result.method).toBe('POST');
		});

		it('should stringify object body correctly', () => {
			const input: HttpFetchInput = {
				uri: 'https://example.com',
				method: 'POST',
				body: {name: 'test', value: 123},
				followRedirects: true,
				credentials: 'same-origin',
				mode: 'cors',
				referrerPolicy: 'strict-origin-when-cross-origin',
			};

			const result = inputToRequestOptions(input);

			expect(result.body).toBe('{"name":"test","value":123}');
		});

		it('should handle custom headers', () => {
			const input: HttpFetchInput = {
				uri: 'https://example.com',
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer token123',
				},
				followRedirects: true,
				credentials: 'same-origin',
				mode: 'cors',
				referrerPolicy: 'strict-origin-when-cross-origin',
			};

			const result = inputToRequestOptions(input);

			expect(result.headers).toEqual({
				'Content-Type': 'application/json',
				Authorization: 'Bearer token123',
			});
		});

		it('should set redirect to manual when followRedirects is false', () => {
			const input: HttpFetchInput = {
				uri: 'https://example.com',
				method: 'GET',
				followRedirects: false,
				credentials: 'same-origin',
				mode: 'cors',
				referrerPolicy: 'strict-origin-when-cross-origin',
			};

			const result = inputToRequestOptions(input);

			expect(result.redirect).toBe('manual');
		});

		it('should handle all credentials options', () => {
			for (const credentials of ['omit', 'same-origin', 'include'] as const) {
				const input: HttpFetchInput = {
					uri: 'https://example.com',
					method: 'GET',
					credentials,
					followRedirects: true,
					mode: 'cors',
					referrerPolicy: 'strict-origin-when-cross-origin',
				};

				const result = inputToRequestOptions(input);
				expect(result.credentials).toBe(credentials);
			}
		});

		it('should handle all cache options', () => {
			for (const cache of ['default', 'no-store', 'reload', 'no-cache', 'force-cache'] as const) {
				const input: HttpFetchInput = {
					uri: 'https://example.com',
					method: 'GET',
					cache,
					followRedirects: true,
					credentials: 'same-origin',
					mode: 'cors',
					referrerPolicy: 'strict-origin-when-cross-origin',
				};

				const result = inputToRequestOptions(input);
				expect(result.cache).toBe(cache);
			}
		});

		it('should handle all mode options', () => {
			for (const mode of ['cors', 'no-cors', 'same-origin'] as const) {
				const input: HttpFetchInput = {
					uri: 'https://example.com',
					method: 'GET',
					mode,
					followRedirects: true,
					credentials: 'same-origin',
					referrerPolicy: 'strict-origin-when-cross-origin',
				};

				const result = inputToRequestOptions(input);
				expect(result.mode).toBe(mode);
			}
		});

		it('should handle all HTTP methods', () => {
			for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'] as const) {
				const input: HttpFetchInput = {
					uri: 'https://example.com',
					method,
					followRedirects: true,
					credentials: 'same-origin',
					mode: 'cors',
					referrerPolicy: 'strict-origin-when-cross-origin',
				};

				const result = inputToRequestOptions(input);
				expect(result.method).toBe(method);
			}
		});

		it('should handle complex nested object body', () => {
			const complexBody = {
				user: {
					name: 'John Doe',
					preferences: {
						theme: 'dark',
						notifications: true,
					},
				},
				metadata: {
					timestamp: '2023-01-01T00:00:00.000Z',
					version: '1.0.0',
				},
				items: [1, 2, 3, 'test'],
			};

			const input: HttpFetchInput = {
				uri: 'https://example.com',
				method: 'POST',
				body: complexBody,
				followRedirects: true,
				credentials: 'same-origin',
				mode: 'cors',
				referrerPolicy: 'strict-origin-when-cross-origin',
			};

			const result = inputToRequestOptions(input);

			expect(result.body).toBe(JSON.stringify(complexBody));
		});

		it('should handle undefined/null body', () => {
			const input: HttpFetchInput = {
				uri: 'https://example.com',
				method: 'GET',
				followRedirects: true,
				credentials: 'same-origin',
				mode: 'cors',
				referrerPolicy: 'strict-origin-when-cross-origin',
			};

			const result = inputToRequestOptions(input);

			expect(result.body).toBeUndefined();
		});

		it('should handle empty object body', () => {
			const input: HttpFetchInput = {
				uri: 'https://example.com',
				method: 'POST',
				body: {},
				followRedirects: true,
				credentials: 'same-origin',
				mode: 'cors',
				referrerPolicy: 'strict-origin-when-cross-origin',
			};

			const result = inputToRequestOptions(input);

			expect(result.body).toBe('{}');
		});

		it('should handle empty string body', () => {
			const input: HttpFetchInput = {
				uri: 'https://example.com',
				method: 'POST',
				body: '',
				followRedirects: true,
				credentials: 'same-origin',
				mode: 'cors',
				referrerPolicy: 'strict-origin-when-cross-origin',
			};

			const result = inputToRequestOptions(input);

			expect(result.body).toBeUndefined();
		});
	});

	describe('trimString', () => {
		test.each<{
			name: string;
			input: string;
			start: number | undefined;
			end: number | undefined;
			expected: string;
		}>([
			// Basic functionality
			{
				name: 'return full string when no parameters provided',
				input: 'Hello, World!',
				start: undefined,
				end: undefined,
				expected: 'Hello, World!',
			},
			{name: 'apply start only', input: '0123456789', start: 3, end: undefined, expected: '3456789'},
			{name: 'apply end only', input: '0123456789', start: 0, end: 5, expected: '01234'},
			{name: 'apply both start and end', input: '0123456789abcdef', start: 3, end: 9, expected: '345678'},
			{name: 'handle zero start', input: 'abcdef', start: 0, end: 3, expected: 'abc'},
			{name: 'handle start equal to end', input: 'abcdef', start: 2, end: 2, expected: ''},
			{name: 'handle single character string', input: 'a', start: 0, end: 1, expected: 'a'},

			// Edge cases
			{name: 'start beyond string length', input: 'short', start: 10, end: undefined, expected: ''},
			{name: 'end larger than string length', input: '0123456789', start: 5, end: 100, expected: '56789'},
			{name: 'start equal to string length', input: 'test', start: 4, end: undefined, expected: ''},
			{name: 'start greater than end', input: 'abcdef', start: 4, end: 2, expected: ''},
			{name: 'empty string input', input: '', start: 2, end: 5, expected: ''},

			// Negative indices
			{name: 'negative start', input: 'abcdef', start: -3, end: 6, expected: 'def'},
			{name: 'negative end', input: 'abcdef', start: 0, end: -2, expected: 'abcd'},
			{name: 'both negative start and end', input: 'abcdef', start: -4, end: -1, expected: 'cde'},

			// Special content
			{name: 'unicode characters', input: '🚀🎉💻🔥⭐', start: 2, end: 8, expected: '🎉💻🔥'},
			{
				name: 'multiline strings',
				input: 'Line 1\nLine 2\nLine 3\nLine 4',
				start: 7,
				end: 19,
				expected: 'Line 2\nLine ',
			},
			{
				name: 'special characters and whitespace',
				input: '  Hello,   World!  \n\t',
				start: 2,
				end: 12,
				expected: 'Hello,   W',
			},
		])('should $name', ({input, start, end, expected}) => {
			expect(trimString(input, start, end)).toBe(expected);
		});
	});
});
