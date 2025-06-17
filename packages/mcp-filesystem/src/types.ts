import type {ToolAnnotations} from '@modelcontextprotocol/sdk/types.js';
import type {ZodRawShape} from 'zod';

export type ToolConfig<InputArgs extends ZodRawShape, OutputArgs extends ZodRawShape> = {
	description?: string;
	inputSchema?: InputArgs;
	outputSchema?: OutputArgs;
	annotations?: ToolAnnotations;
};

/**
 * Common filesystem operation error types
 */
export class FilesystemError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly path?: string,
	) {
		super(message);
		this.name = 'FilesystemError';
	}
}

/**
 * File/directory statistics interface
 */
export interface FileStats {
	path: string;
	type: 'file' | 'directory' | 'symlink';
	size: number;
	created: string;
	modified: string;
	permissions: string;
	exists: boolean;
}

/**
 * Directory listing entry
 */
export interface DirectoryEntry {
	name: string;
	type: 'file' | 'directory';
	size?: number;
	modified?: string;
}

/**
 * File read result with metadata
 */
export interface FileReadResult {
	path: string;
	content: string;
	encoding: string;
	size: number;
}

/**
 * Search result entry
 */
export interface SearchResult {
	path: string;
	type: 'file' | 'directory';
	matches?: number;
	line?: number;
	content?: string;
}
