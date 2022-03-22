import { useRef } from 'react';

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
