import { joinRequestHandlers } from '../../utils/requestBuilder/buildBackendRequest';

import { addBergamotFileFactory } from './addBergamotFile';
import { getBergamotFileFactory } from './getBergamotFile';

export const bergamotHandlersFactory = joinRequestHandlers([
	addBergamotFileFactory,
	getBergamotFileFactory,
]);
