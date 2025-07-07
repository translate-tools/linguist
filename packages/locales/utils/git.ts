import { execFileSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import path from 'path';

export const findGitDirForPath = (sourcePath: string) => {
	const resolvedPath = path.resolve(sourcePath);
	const pathSegments = resolvedPath.split(path.sep);
	for (let i = 0; i < pathSegments.length - 1; i++) {
		const gitDirPath = path.join(
			(i === 0 ? pathSegments : pathSegments.slice(0, -i)).join(path.sep),
			'.git',
		);

		if (!existsSync(gitDirPath)) continue;
		if (!statSync(gitDirPath).isDirectory) continue;

		return gitDirPath;
	}

	return null;
};

export const getFileVersion = (filename: string, ref = 'master') => {
	try {
		const gitDir = findGitDirForPath(filename);
		if (!gitDir) throw new Error('.git directory is not found');

		const prevVersion = execFileSync('git', [
			'show',
			`${ref}:${filename.slice(path.dirname(gitDir).length + 1)}`,
		]).toString('utf8');

		return prevVersion;
	} catch (error) {
		return null;
	}
};
