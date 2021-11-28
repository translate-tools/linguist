/**
 * This function can be called only inside click event
 */
export const openFileDialog = () =>
	new Promise<FileList | null>((res) => {
		const input = document.createElement('input');
		input.type = 'file';

		let isChanged = false;
		input.onchange = () => {
			isChanged = true;
			res(input.files);
		};

		// Resolve as null by focus after click and after awaiting of 100ms
		const blurHandler = () => {
			document.removeEventListener('focusin', blurHandler);

			window.setTimeout(() => {
				if (!isChanged && (input.files === null || input.files.length === 0)) {
					res(null);
				}
			}, 100);
		};

		document.addEventListener('focusin', blurHandler);

		input.click();
	});

export const saveFile = (blob: Blob, name: string) => {
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	a.click();

	URL.revokeObjectURL(url);
};

export const readAsText = (blob: Blob) =>
	new Promise<string | null>((res, rej) => {
		const fr = new FileReader();
		fr.onload = () => {
			if (fr.result instanceof ArrayBuffer) {
				throw new TypeError('Unexpected ArrayBuffer type instead string or null');
			}
			res(fr.result);
		};
		fr.onerror = () => rej(fr.error);
		fr.readAsText(blob);
	});
