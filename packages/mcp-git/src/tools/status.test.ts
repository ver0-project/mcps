import {describe, it, expect, beforeEach} from 'vitest';
import {z} from 'zod';
import {simpleGit} from 'simple-git';
import {GitStatusTool} from './status.js';

describe('GitStatusTool', () => {
	it('should have correct name', () => {
		const tool = new GitStatusTool();
		expect(tool.name).toBe('status');
	});

	it('should have description in config', () => {
		const tool = new GitStatusTool();
		expect(tool.config.description).toBe('Get the current git repository status.');
	});

	it('should have read-only hint annotation', () => {
		const tool = new GitStatusTool();
		expect(tool.config.annotations?.readOnlyHint).toBe(true);
	});

	it('should pass output schema validation', async () => {
		const schema = z.object(new GitStatusTool().config.outputSchema!).strict();
		const sg = simpleGit();
		const status = await sg.status();
		expect(schema.parse({...status, isClean: status.isClean()})).toBeDefined();
	});

	describe('inputToOptions', () => {
		let tool: GitStatusTool;

		beforeEach(() => {
			tool = new GitStatusTool();
		});

		it('should return empty array for minimal input', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
			});
			expect(result).toEqual([]);
		});

		it('should handle boolean options correctly', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				short: true,
				branch: true,
				showStash: true,
				long: true,
				nullTerminated: true,
			});
			expect(result).toEqual(['--short', '--branch', '--show-stash', '--long', '-z']);
		});

		it('should handle verbose as boolean', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				verbose: true,
			});
			expect(result).toEqual(['--verbose']);
		});

		it('should handle verbose as number', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				verbose: 2,
			});
			expect(result).toEqual(['-v', '-v']);
		});

		it('should handle untrackedFiles options', () => {
			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					untrackedFiles: true,
				})
			).toEqual(['--untracked-files']);

			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					untrackedFiles: false,
				})
			).toEqual(['--untracked-files=no']);

			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					untrackedFiles: 'all',
				})
			).toEqual(['--untracked-files=all']);
		});

		it('should handle ignoreSubmodules option', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				ignoreSubmodules: 'dirty',
			});
			expect(result).toEqual(['--ignore-submodules=dirty']);
		});

		it('should handle ignored options', () => {
			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					ignored: true,
				})
			).toEqual(['--ignored']);

			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					ignored: false,
				})
			).toEqual(['--no-ignored']);

			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					ignored: 'matching',
				})
			).toEqual(['--ignored=matching']);
		});

		it('should handle aheadBehind option', () => {
			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					aheadBehind: true,
				})
			).toEqual(['--ahead-behind']);

			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					aheadBehind: false,
				})
			).toEqual(['--no-ahead-behind']);
		});

		it('should handle renames option', () => {
			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					renames: true,
				})
			).toEqual(['--renames']);

			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					renames: false,
				})
			).toEqual(['--no-renames']);
		});

		it('should handle findRenames options', () => {
			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					findRenames: true,
				})
			).toEqual(['--find-renames']);

			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					findRenames: false,
				})
			).toEqual(['--no-find-renames']);

			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					findRenames: 50,
				})
			).toEqual(['--find-renames=50']);
		});

		it('should handle column options', () => {
			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					column: true,
				})
			).toEqual(['--column']);

			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					column: false,
				})
			).toEqual(['--no-column']);

			expect(
				tool.inputToOptions({
					repoPath: '/test/repo',
					column: 'auto',
				})
			).toEqual(['--column=auto']);
		});

		it('should handle pathspec correctly', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				pathspec: ['src/', 'test/'],
			});
			expect(result).toEqual(['--', 'src/', 'test/']);
		});

		it('should handle complex combination of options', () => {
			const result = tool.inputToOptions({
				repoPath: '/test/repo',
				short: true,
				branch: true,
				verbose: 1,
				untrackedFiles: 'all',
				ignored: 'matching',
				pathspec: ['src/'],
			});
			expect(result).toEqual([
				'--short',
				'--branch',
				'-v',
				'--untracked-files=all',
				'--ignored=matching',
				'--',
				'src/',
			]);
		});
	});
});
