import { useRef } from 'react';

/**
 * Use for cases, when you need to use dependencies.
 * For example, to skip some actions while first render in complexity `useEffect`
 */
export const useIsFirstRenderRef = () => {
	const response = useRef(true);

	const isFirstRender = useRef(true);
	if (isFirstRender.current) {
		response.current = true;
		isFirstRender.current = false;
	} else {
		response.current = false;
	}

	return response;
};
