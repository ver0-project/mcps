import fs from 'node:fs/promises';

export type PathStats = {
	path: string;
	type: 'file' | 'directory' | 'symlink';
	created: number;
	modified: number;
	permissions: number;
} & (
	| {
			type: 'file';
			size: number;
	  }
	| {
			type: 'directory';
	  }
	| {
			type: 'symlink';
			target: string;
	  }
);

/**
 * Get the stats of a path.
 * @throws {Error} If the path type is unknown.
 */
export async function statPath(fpath: string): Promise<PathStats> {
	const stats = await fs.stat(fpath);
	if (!stats) {
		throw new Error(`Path does not exist`);
	}

	if (stats.isSymbolicLink()) {
		return {
			path: fpath,
			type: 'symlink',
			target: await fs.readlink(fpath),
			created: stats.birthtime.getTime(),
			modified: stats.mtime.getTime(),
			permissions: stats.mode,
		};
	}

	if (stats.isFile()) {
		return {
			path: fpath,
			type: 'file',
			size: stats.size,
			created: stats.birthtime.getTime(),
			modified: stats.mtime.getTime(),
			permissions: stats.mode,
		};
	}

	if (stats.isDirectory()) {
		return {
			path: fpath,
			type: 'directory',
			created: stats.birthtime.getTime(),
			modified: stats.mtime.getTime(),
			permissions: stats.mode,
		};
	}

	throw new Error(`Unknown path type`);
}
