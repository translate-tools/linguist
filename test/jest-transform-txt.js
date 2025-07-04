const fs = require('fs');

module.exports = {
	process(src, filename) {
		const content = fs.readFileSync(filename, 'utf8');
		return {
			code: `module.exports = ${JSON.stringify(content)};`,
		};
	},
};
