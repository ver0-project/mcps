import type {ToolAnnotations} from '@modelcontextprotocol/sdk/types.js';
import type {ZodRawShape} from 'zod';

export type ToolConfig<InputArgs extends ZodRawShape, OutputArgs extends ZodRawShape> = {
	description?: string;
	inputSchema?: InputArgs;
	outputSchema?: OutputArgs;
	annotations?: ToolAnnotations;
};
