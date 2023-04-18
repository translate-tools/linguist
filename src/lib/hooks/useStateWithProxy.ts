import { DependencyList, Dispatch, SetStateAction, useState } from 'react';
import { useImmutableCallback } from 'react-elegant-ui/esm/hooks/useImmutableCallback';

/**
 * Like `useState` but with proxy
 *
 * Return [value, setterWithProxy, originalSetter]
 */
export const useStateWithProxy = <S>(
	initialState: S | (() => S),
	proxy?: (value: React.SetStateAction<S>, setter: Dispatch<SetStateAction<S>>) => void,
	deps?: DependencyList,
): [S, Dispatch<SetStateAction<S>>, Dispatch<SetStateAction<S>>] => {
	const [value, setter] = useState<S>(initialState);

	// Define proxy
	const proxySetter: Dispatch<SetStateAction<S>> = useImmutableCallback(
		(newValue) => {
			if (proxy !== undefined) {
				proxy(newValue, setter);
			} else {
				setter(newValue);
			}
		},

		// Ignore spread
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[proxy, ...(deps ?? [])],
	);

	return [value, proxySetter, setter];
};
