import { useCallback, useEffect, useRef } from 'react';

/**
 * Return immutable function to get component mount status
 * Useful to check before set state in async functions, to prevent memory leaks
 */
export const useIsMounted = () => {
	const isMountedRef = useRef(true);
	const isMounted = useCallback(() => isMountedRef.current, []);

	useEffect(() => {
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	return isMounted;
};
