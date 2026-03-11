import React, { useEffect, useRef } from 'react';

export const useElementAttentionTracker = <T extends HTMLElement>({
	ref,
	minTime,
	onEngagement,
}: {
	ref: React.RefObject<T>;
	minTime: number;
	onEngagement: () => void;
}) => {
	const callback = useRef(onEngagement);
	callback.current = onEngagement;

	useEffect(() => {
		if (!ref.current) return;

		let timeout: number | null = null;
		const observer = new IntersectionObserver(
			(e) => {
				const { isIntersecting } = e[0];

				if (timeout) {
					window.clearTimeout(timeout);
					timeout = null;
				}

				if (isIntersecting) {
					timeout = window.setTimeout(() => {
						timeout = null;
						callback.current();
					}, minTime);
				}
			},
			{ threshold: 0.5 },
		);

		observer.observe(ref.current);
		return () => {
			observer.disconnect();
			if (timeout) window.clearTimeout(timeout);
		};
	}, [minTime, ref]);
};
