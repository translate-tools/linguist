/**
 * Source: https://stackoverflow.com/a/18650249
 */
export const blobToBase64 = (blob: Blob) => {
	return new Promise<string>((resolve) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result as string);
			} else {
				throw new TypeError('Unexpected type of result');
			}
		};
		reader.readAsDataURL(blob);
	});
};

/**
 * Source: https://stackoverflow.com/a/16245768
 */
export const base64ToBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
	const byteCharacters = atob(b64Data);
	const byteArrays = [];

	for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
		const slice = byteCharacters.slice(offset, offset + sliceSize);

		const byteNumbers = new Array(slice.length);
		for (let i = 0; i < slice.length; i++) {
			byteNumbers[i] = slice.charCodeAt(i);
		}

		const byteArray = new Uint8Array(byteNumbers);
		byteArrays.push(byteArray);
	}

	const blob = new Blob(byteArrays, { type: contentType });
	return blob;
};
