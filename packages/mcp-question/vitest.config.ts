import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		passWithNoTests: true,
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['node_modules', 'dist'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'dist/', '**/*.{test,spec}.{js,ts}'],
		},
	},
});
