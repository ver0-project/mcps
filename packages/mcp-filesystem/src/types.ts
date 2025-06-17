import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShape } from 'zod';

export type ToolConfig<InputArgs extends ZodRawShape, OutputArgs extends ZodRawShape> = {
	description?: string;
	inputSchema?: InputArgs;
	outputSchema?: OutputArgs;
	annotations?: ToolAnnotations;
};

// Common filesystem types
export interface FileInfo {
	path: string;
	name: string;
	size: number;
	type: 'file' | 'directory' | 'symlink' | 'other';
	isReadable: boolean;
	isWritable: boolean;
	isExecutable: boolean;
	createdAt: string;
	modifiedAt: string;
	accessedAt: string;
}

export interface ReadResult {
	path: string;
	content: string;
	encoding: string;
	size: number;
}

export interface WriteResult {
	path: string;
	bytesWritten: number;
	created: boolean;
}

// Error types for filesystem operations
export class ToolError extends Error {
	constructor(
		message: string,
		public readonly code?: string,
	) {
		super(message);
		this.name = 'ToolError';
	}
}

export class PathValidationError extends ToolError {
	constructor(message: string, public readonly path: string) {
		super(message, 'PATH_VALIDATION_ERROR');
		this.name = 'PathValidationError';
	}
}

export class FileSystemError extends ToolError {
	constructor(
		message: string,
		public readonly operation: string,
		public readonly path?: string,
	) {
		super(message, 'FILESYSTEM_ERROR');
		this.name = 'FileSystemError';
	}
}
