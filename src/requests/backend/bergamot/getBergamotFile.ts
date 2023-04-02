import { buildBackendRequest } from '../../utils/requestBuilder';

import { getFile, FileSearchParams } from './data';

export const [getBergamotFileFactory, getBergamotFile] = buildBackendRequest(
	'getBergamotFile',
	{
		factoryHandler: () => async (searchParams: FileSearchParams) => {
			console.log('FILE REQUESTED');
			const start = performance.now();
			const file = await getFile(searchParams);
			console.log('FILE RECEIVED', performance.now() - start);
			return file;
		},
	},
);
