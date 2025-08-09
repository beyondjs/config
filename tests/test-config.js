const { join } = require('path');

const BEE = require('@beyond-js/bee');
BEE('http://localhost:1110', { inspect: 4000 });

(async () => {
	const { Config } = await bimport('@beyond-js/config/main');

	// Process the settings for the package-a and the workspace set in the current working directory
	const cwd = process.cwd();

	console.log(cwd, Config);
})().catch(exc => console.error(exc.stack));
