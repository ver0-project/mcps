import {describe, it, expect, vi, beforeEach} from 'vitest';
import {fs, vol} from 'memfs';
import {statPath} from './stat.js';

// tell vitest to use fs mock from __mocks__ folder
// this can be done in a setup file if fs should always be mocked
vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('statPath', () => {
	beforeEach(() => {
		// reset the state of in-memory fs
		vol.reset();
	});

	describe('file stats', () => {
		it('should return file stats for a regular file', async () => {
			// Create a file in the virtual filesystem
			const testPath = '/test/file.txt';
			const testContent = 'Hello World';

			vol.fromJSON({
				[testPath]: testContent,
			});

			const result = await statPath(testPath);

			expect(result.path).toBe(testPath);
			expect(result.type).toBe('file');
			if (result.type === 'file') {
				expect(result.size).toBe(testContent.length);
			}
			expect(typeof result.created).toBe('number');
			expect(typeof result.modified).toBe('number');
			expect(typeof result.permissions).toBe('number');
		});

		it('should handle files with different sizes', async () => {
			const testPath = '/usr/bin/test';
			const largeContent = 'x'.repeat(2048); // 2KB content

			vol.fromJSON({
				[testPath]: largeContent,
			});

			const result = await statPath(testPath);

			expect(result.path).toBe(testPath);
			expect(result.type).toBe('file');
			if (result.type === 'file') {
				expect(result.size).toBe(largeContent.length);
			}
			expect(typeof result.created).toBe('number');
			expect(typeof result.modified).toBe('number');
			expect(typeof result.permissions).toBe('number');
		});

		it('should handle empty files', async () => {
			const testPath = '/empty/file.txt';

			vol.fromJSON({
				[testPath]: '',
			});

			const result = await statPath(testPath);

			expect(result.path).toBe(testPath);
			expect(result.type).toBe('file');
			if (result.type === 'file') {
				expect(result.size).toBe(0);
			}
			expect(typeof result.created).toBe('number');
			expect(typeof result.modified).toBe('number');
			expect(typeof result.permissions).toBe('number');
		});
	});

	describe('directory stats', () => {
		it('should return directory stats for a directory', async () => {
			const testPath = '/test/directory';

			vol.fromJSON({
				[`${testPath}/file.txt`]: 'content',
			});

			const result = await statPath(testPath);

			expect(result.path).toBe(testPath);
			expect(result.type).toBe('directory');
			expect(typeof result.created).toBe('number');
			expect(typeof result.modified).toBe('number');
			expect(typeof result.permissions).toBe('number');
		});

		it('should handle empty directories', async () => {
			const testPath = '/empty/directory';

			// Create directory by setting it as null
			vol.fromJSON({
				[testPath]: null,
			});

			const result = await statPath(testPath);

			expect(result.path).toBe(testPath);
			expect(result.type).toBe('directory');
			expect(typeof result.created).toBe('number');
			expect(typeof result.modified).toBe('number');
			expect(typeof result.permissions).toBe('number');
		});

		it('should handle nested directories', async () => {
			const testPath = '/deep/nested/path';

			vol.fromJSON({
				[`${testPath}/file.txt`]: 'nested content',
			});

			const result = await statPath(testPath);

			expect(result.type).toBe('directory');
			expect(result.path).toBe(testPath);
		});
	});

	describe('symlink stats', () => {
		it.skip('symlink tests skipped - memfs not consistent with symlinks', () => {
			// Skip symlink tests due to memfs inconsistencies
		});
	});

	describe('error handling', () => {
		it('should throw error for nonexistent paths', async () => {
			await expect(statPath('/nonexistent/file')).rejects.toThrow();
		});

		it('should throw error for invalid paths', async () => {
			await expect(statPath('')).rejects.toThrow();
		});
	});

	describe('edge cases', () => {
		it('should handle paths with special characters', async () => {
			const testPath = '/test/special chars & symbols!';

			vol.fromJSON({
				[`${testPath}/file.txt`]: 'content',
			});

			const result = await statPath(testPath);

			expect(result.path).toBe(testPath);
			expect(result.type).toBe('directory');
		});

		it('should handle unicode paths', async () => {
			const testPath = '/测试/файл.txt';

			vol.fromJSON({
				[testPath]: 'unicode content',
			});

			const result = await statPath(testPath);

			expect(result.path).toBe(testPath);
			expect(result.type).toBe('file');
		});

		it('should handle very deep paths', async () => {
			const deepPath = '/very/deep/nested/directory/structure/file.txt';

			vol.fromJSON({
				[deepPath]: 'deep content',
			});

			const result = await statPath(deepPath);

			expect(result.path).toBe(deepPath);
			expect(result.type).toBe('file');
		});

		it('should handle paths with dots and double dots', async () => {
			const testPath = '/test/../test/./file.txt';

			vol.fromJSON({
				[testPath]: 'path with dots',
			});

			const result = await statPath(testPath);

			expect(result.path).toBe(testPath);
			expect(result.type).toBe('file');
		});

		it('should handle files with no extension', async () => {
			const testPath = '/test/README';

			vol.fromJSON({
				[testPath]: 'file without extension',
			});

			const result = await statPath(testPath);

			expect(result.path).toBe(testPath);
			expect(result.type).toBe('file');
		});

		it('should handle very long filenames', async () => {
			const longName = 'a'.repeat(255); // Maximum filename length on most systems
			const testPath = `/test/${longName}`;

			vol.fromJSON({
				[testPath]: 'long filename content',
			});

			const result = await statPath(testPath);

			expect(result.path).toBe(testPath);
			expect(result.type).toBe('file');
		});
	});
});
