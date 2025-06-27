import {buildConfig} from '@ver0/eslint-config';
import {defineConfig, globalIgnores} from 'eslint/config';

export default defineConfig(
	globalIgnores(['dist', 'node_modules', '.yarn', 'coverage']),
	...buildConfig({
		globals: 'node',
		prettier: true,
		typescript: true,
		vitest: true,
	}),
	{
		files: ['README.md'],
		language: 'markdown/gfm',
		rules: {
			'markdown/no-missing-label-refs': 'off',
		},
	},
	{
		files: ['**/*.js', '**/*.ts'],
		rules: {
			'n/no-missing-import': 'off', // mcp sdk has weird exports definition, that trips this rule
		},
	}
);
