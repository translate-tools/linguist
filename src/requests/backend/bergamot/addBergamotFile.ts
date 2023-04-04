import { buildBackendRequest } from '../../utils/requestBuilder';

import { addFile, File } from './data';

export const [addBergamotFileFactory, addBergamotFile] = buildBackendRequest(
	'addBergamotFile',
	{
		factoryHandler: () => (data: Omit<File, 'timestamp'>) => {
			return addFile({ ...data, timestamp: Date.now() });
		},
	},
);
