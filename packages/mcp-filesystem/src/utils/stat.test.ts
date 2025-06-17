import {describe, it, expect, vi, beforeEach} from 'vitest';
import {fs, vol} from 'memfs';
import {statPath} from './stat.js';

// tell vitest to use fs mock from __mocks__ folder
// this can be done in a setup file if fs should always be mocked
vi.mock('node:fs');
vi.mock('node:fs/promises');

/**
 * Validates if a string is a valid ISO timestamp
 */
function expectISOTimestamp(timestamp: string): void {
	expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
}

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

			// Verify ISO timestamp format
			expectISOTimestamp(result.created);
			expectISOTimestamp(result.modified);

			// Verify 3-digit octal permissions
			expect(result.permissions).toMatch(/^\d{3}$/);
			expect(result.permissions).toHaveLength(3);

			// Verify uid/gid are numbers
			expect(typeof result.uid).toBe('number');
			expect(typeof result.gid).toBe('number');
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
			expectISOTimestamp(result.created);
			expectISOTimestamp(result.modified);
			expect(result.permissions).toMatch(/^\d{3}$/);
			expect(typeof result.uid).toBe('number');
			expect(typeof result.gid).toBe('number');
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
			expectISOTimestamp(result.created);
			expectISOTimestamp(result.modified);
			expect(result.permissions).toMatch(/^\d{3}$/);
			expect(typeof result.uid).toBe('number');
			expect(typeof result.gid).toBe('number');
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
			expectISOTimestamp(result.created);
			expectISOTimestamp(result.modified);
			expect(result.permissions).toMatch(/^\d{3}$/);
			expect(typeof result.uid).toBe('number');
			expect(typeof result.gid).toBe('number');
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
			expectISOTimestamp(result.created);
			expectISOTimestamp(result.modified);
			expect(result.permissions).toMatch(/^\d{3}$/);
			expect(typeof result.uid).toBe('number');
			expect(typeof result.gid).toBe('number');
		});

		it('should handle nested directories', async () => {
			const testPath = '/deep/nested/path';

			vol.fromJSON({
				[`${testPath}/file.txt`]: 'nested content',
			});

			const result = await statPath(testPath);

			expect(result.type).toBe('directory');
			expect(result.path).toBe(testPath);
			// Verify all fields are present with correct format
			expectISOTimestamp(result.created);
			expectISOTimestamp(result.modified);
			expect(result.permissions).toMatch(/^\d{3}$/);
			expect(typeof result.uid).toBe('number');
			expect(typeof result.gid).toBe('number');
		});
	});

	describe('field validation', () => {
		it('should ensure permissions are always 3 digits', async () => {
			const testPath = '/test/permissions.txt';
			vol.fromJSON({[testPath]: 'content'});

			const result = await statPath(testPath);

			// Permissions should always be exactly 3 digits with leading zeros if needed
			expect(result.permissions).toHaveLength(3);
			expect(result.permissions).toMatch(/^[0-7]{3}$/);
		});

		it('should return valid ISO timestamps', async () => {
			const testPath = '/test/timestamps.txt';
			vol.fromJSON({[testPath]: 'content'});

			const result = await statPath(testPath);

			// Verify timestamps can be parsed as valid dates
			expect(new Date(result.created).getTime()).toBeGreaterThan(0);
			expect(new Date(result.modified).getTime()).toBeGreaterThan(0);

			// Verify ISO format
			expect(result.created.endsWith('Z')).toBe(true);
			expect(result.modified.endsWith('Z')).toBe(true);
		});

		it('should return consistent uid/gid types', async () => {
			const testPath = '/test/ownership.txt';
			vol.fromJSON({[testPath]: 'content'});

			const result = await statPath(testPath);

			expect(Number.isInteger(result.uid)).toBe(true);
			expect(Number.isInteger(result.gid)).toBe(true);
			expect(result.uid).toBeGreaterThanOrEqual(0);
			expect(result.gid).toBeGreaterThanOrEqual(0);
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
			expectISOTimestamp(result.created);
			expect(result.permissions).toMatch(/^\d{3}$/);
		});

		it('should handle unicode paths', async () => {
			const testPath = '/测试/файл.txt';

			vol.fromJSON({
				[testPath]: 'unicode content',
			});

			const result = await statPath(testPath);

			expect(result.path).toBe(testPath);
			expect(result.type).toBe('file');
			expectISOTimestamp(result.created);
			expect(result.permissions).toMatch(/^\d{3}$/);
		});

		it('should handle very deep paths', async () => {
			const deepPath = '/very/deep/nested/directory/structure/file.txt';

			vol.fromJSON({
				[deepPath]: 'deep content',
			});

			const result = await statPath(deepPath);

			expect(result.path).toBe(deepPath);
			expect(result.type).toBe('file');
			expectISOTimestamp(result.created);
			expect(result.permissions).toMatch(/^\d{3}$/);
		});

		it('should handle paths with dots and double dots', async () => {
			const testPath = '/test/../test/./file.txt';

			vol.fromJSON({
				[testPath]: 'path with dots',
			});

			const result = await statPath(testPath);

			expect(result.path).toBe(testPath);
			expect(result.type).toBe('file');
			expectISOTimestamp(result.created);
			expect(result.permissions).toMatch(/^\d{3}$/);
		});

		it('should handle files with no extension', async () => {
			const testPath = '/test/README';

			vol.fromJSON({
				[testPath]: 'file without extension',
			});

			const result = await statPath(testPath);

			expect(result.path).toBe(testPath);
			expect(result.type).toBe('file');
			expectISOTimestamp(result.created);
			expect(result.permissions).toMatch(/^\d{3}$/);
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
			expectISOTimestamp(result.created);
			expect(result.permissions).toMatch(/^\d{3}$/);
		});
	});
});
