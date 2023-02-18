/**
 * Helper which prevent overflow cursor to viewport
 */
export const fixPosToPreventOverflow = (left: number, top: number) => {
	const fixLeft = (left: number) => {
		const viewportWidth = document.documentElement.clientWidth;

		// Left
		if (left < 0) {
			left = 0;
		}

		// Right
		if (left > viewportWidth) {
			const extra = left - viewportWidth;

			// Decrease indent
			left = left > extra ? left - extra : 0;
		}

		return left;
	};

	const fixTop = (top: number) => {
		const pageHeight = document.documentElement.scrollHeight;

		// Top
		if (top < 0) {
			top = 0;
		}

		// Bottom
		if (top > pageHeight) {
			const extra = top - pageHeight;

			// Decrease indent
			top = top > extra ? top - extra : 0;
		}

		return top;
	};

	return {
		left: fixLeft(left),
		top: fixTop(top),
	};
};
