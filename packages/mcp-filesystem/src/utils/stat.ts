import fs from 'node:fs/promises';

export type PathStats = {
	path: string;
	type: 'file' | 'directory' | 'symlink';
	created: string;
	modified: string;
	permissions: string;
	uid: number;
	gid: number;
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

	const created = stats.birthtime.toISOString();
	const modified = stats.mtime.toISOString();
	// we're ensuring that permissions are always 3 digits
	// eslint-disable-next-line no-bitwise
	const permissions = (stats.mode & 0o777).toString(8).padStart(3, '0');
	const {uid, gid} = stats;

	if (stats.isSymbolicLink()) {
		return {
			path: fpath,
			type: 'symlink',
			target: await fs.readlink(fpath),
			created,
			modified,
			permissions,
			uid,
			gid,
		};
	}

	if (stats.isFile()) {
		return {
			path: fpath,
			type: 'file',
			size: stats.size,
			created,
			modified,
			permissions,
			uid,
			gid,
		};
	}

	if (stats.isDirectory()) {
		return {
			path: fpath,
			type: 'directory',
			created,
			modified,
			permissions,
			uid,
			gid,
		};
	}

	throw new Error(`Unknown path type`);
}
