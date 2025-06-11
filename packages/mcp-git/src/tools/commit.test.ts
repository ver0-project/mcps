import {describe, it, expect, beforeEach} from 'vitest';
import {GitCommitTool} from './commit.js';

describe('GitCommitTool', () => {
	it('should have correct name', () => {
		const tool = new GitCommitTool();
		expect(tool.name).toBe('commit');
	});

	it('should have description in config', () => {
		const tool = new GitCommitTool();
		expect(tool.config.description).toBe('Commit staged changes to the git repository.');
	});

	it('should not have read-only hint annotation', () => {
		const tool = new GitCommitTool();
		expect(tool.config.annotations?.readOnlyHint).toBe(false);
	});

	describe('inputToOptions', () => {
		let tool: GitCommitTool;

		beforeEach(() => {
			tool = new GitCommitTool();
		});

		it('should return empty object for minimal input', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
			});
			expect(result).toEqual({});
		});

		it('should handle boolean flag options correctly', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
				all: true,
				amend: true,
				allowEmpty: true,
				allowEmptyMessage: true,
				noVerify: true,
				verbose: true,
				quiet: true,
				dryRun: true,
			});
			expect(result).toEqual({
				'--all': null,
				'--amend': null,
				'--allow-empty': null,
				'--allow-empty-message': null,
				'--no-verify': null,
				'--verbose': null,
				'--quiet': null,
				'--dry-run': null,
			});
		});

		it('should handle string value options correctly', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
				reuseMessage: 'abc123',
				reeditMessage: 'def456',
				fixup: 'ghi789',
				squash: 'jkl012',
				file: 'commit-msg.txt',
				author: 'John Doe <john@example.com>',
				date: '2023-01-01',
				cleanup: 'strip',
			});
			expect(result).toEqual({
				'--reuse-message': 'abc123',
				'--reedit-message': 'def456',
				'--fixup': 'ghi789',
				'--squash': 'jkl012',
				'--file': 'commit-msg.txt',
				'--author': 'John Doe <john@example.com>',
				'--date': '2023-01-01',
				'--cleanup': 'strip',
			});
		});

		it('should handle cleanup enum values', () => {
			const cleanupModes = ['strip', 'whitespace', 'verbatim', 'scissors', 'default'] as const;

			for (const mode of cleanupModes) {
				const result = tool.inputToOptions({
					repoPath: '/test/repo',
					message: 'test commit',
					cleanup: mode,
				});
				expect(result).toEqual({
					'--cleanup': mode,
				});
			}
		});

		it('should handle gpgSign boolean option', () => {
			const resultTrue = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
				gpgSign: true,
			});
			expect(resultTrue).toEqual({
				'--gpg-sign': null,
			});

			const resultFalse = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
				gpgSign: false,
			});
			expect(resultFalse).toEqual({
				'--no-gpg-sign': null,
			});
		});

		it('should handle gpgSign string option', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
				gpgSign: 'my-key-id',
			});
			expect(result).toEqual({
				'--gpg-sign': 'my-key-id',
			});
		});

		it('should handle noGpgSign option', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
				noGpgSign: true,
			});
			expect(result).toEqual({
				'--no-gpg-sign': null,
			});
		});

		it('should handle include and only options', () => {
			const resultInclude = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
				include: true,
			});
			expect(resultInclude).toEqual({
				'--include': null,
			});

			const resultOnly = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
				only: true,
			});
			expect(resultOnly).toEqual({
				'--only': null,
			});
		});

		it('should handle noStatus option', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
				noStatus: true,
			});
			expect(result).toEqual({
				'--no-status': null,
			});
		});

		it('should handle trailers as array', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
				trailers: ['Signed-off-by: John Doe <john@example.com>', 'Reviewed-by: Jane Smith <jane@example.com>'],
			});
			expect(result).toEqual({
				'--trailer': ['Signed-off-by: John Doe <john@example.com>', 'Reviewed-by: Jane Smith <jane@example.com>'],
			});
		});

		it('should handle empty trailers array', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
				trailers: [],
			});
			expect(result).toEqual({});
		});

		it('should ignore undefined options', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
				all: undefined,
				author: undefined,
				trailers: undefined,
			});
			expect(result).toEqual({});
		});

		it('should ignore false boolean options (except gpgSign)', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'test commit',
				all: false,
				amend: false,
				verbose: false,
				dryRun: false,
			});
			expect(result).toEqual({});
		});

		it('should handle complex combination of options', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				message: 'feat: add new feature',
				all: true,
				author: 'John Doe <john@example.com>',
				date: '2023-01-01T12:00:00Z',
				verbose: true,
				gpgSign: true,
				cleanup: 'strip',
				trailers: ['Signed-off-by: John Doe <john@example.com>'],
				noVerify: true,
			});
			expect(result).toEqual({
				'--all': null,
				'--author': 'John Doe <john@example.com>',
				'--date': '2023-01-01T12:00:00Z',
				'--verbose': null,
				'--gpg-sign': null,
				'--cleanup': 'strip',
				'--trailer': ['Signed-off-by: John Doe <john@example.com>'],
				'--no-verify': null,
			});
		});

		it('should handle all boolean flag combinations', () => {
			const booleanFlags = {
				all: '--all',
				amend: '--amend',
				allowEmpty: '--allow-empty',
				allowEmptyMessage: '--allow-empty-message',
				noVerify: '--no-verify',
				verbose: '--verbose',
				quiet: '--quiet',
				dryRun: '--dry-run',
				include: '--include',
				only: '--only',
				noStatus: '--no-status',
				noGpgSign: '--no-gpg-sign',
			};

			for (const [inputKey, expectedFlag] of Object.entries(booleanFlags)) {
				const input = {
					repoPath: '/test/repo',
					message: 'test commit',
					[inputKey]: true,
				};
				const result = tool.inputToOptions(input);
				expect(result).toEqual({
					[expectedFlag]: null,
				});
			}
		});
	});
});
