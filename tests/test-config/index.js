const { join } = require('path');

const BEE = require('@beyond-js/bee');
BEE('http://localhost:1110', { inspect: 4000 });

(async () => {
	const { Config } = await bimport('@beyond-js/config/main');

	const path = join(__dirname, 'files');
	const config = new Config(path, { '/project': 'object', '/modules': 'array' });
	config.data = 'config.json';

	await config.ready;
	console.log('Config data:', config.data.value);
})().catch(exc => console.error(exc.stack));
