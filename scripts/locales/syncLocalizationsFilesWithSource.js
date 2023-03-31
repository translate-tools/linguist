const { syncLocalizationsFilesWithSource } = require('./utils/syncLocalizations');
const { sortLocalizationFiles } = require('./utils/sortLocalizations');

syncLocalizationsFilesWithSource()
	.then(sortLocalizationFiles)
	.then(() => {
		console.log('Done! Review the result now');
	});
