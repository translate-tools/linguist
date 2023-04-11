import { buildBackendRequest } from '../../utils/requestBuilder';

import { getFile, FileSearchParams } from './data';

export const [getBergamotFileFactory, getBergamotFile] = buildBackendRequest(
	'getBergamotFile',
	{
		factoryHandler: () => async (searchParams: FileSearchParams) => {
			return getFile(searchParams);
		},
	},
);
