require('colors');
const { join } = require('path');

const BEE = require('@beyond-js/bee');
BEE('http://localhost:1110', { inspect: 4000 });

(async () => {
	const { Config } = await bimport('@beyond-js/config/main');

	const path = join(__dirname, 'files');
	const config = new Config(path, { '/project': 'object', '/modules': 'array' });
	config.data = 'config.json';

	console.log('Processing root config...'.green);
	console.log('  • await config.ready'.yellow);
	await config.ready;
	console.log('  • Config value:', config.valid, config.value);

	console.log('\nProcessing project config...'.green);
	const project = config.get('project');
	console.log('  • Project config processed:', project.processed);

	console.log('  • await project.ready'.yellow);
	await project.ready;
	console.log('  • Project config processed:', project.processed);
	console.log('  • Project value:', project.valid, project.value);

	console.log('\nProcessing modules config...'.green);
	const modules = config.get('modules');
	console.log('  • Modules config processed:', modules.processed);

	console.log('  • await modules.ready'.yellow);
	await modules.ready;
	console.log('  • Modules config processed:', modules.processed);
	console.log('  • Modules value:', modules.valid, modules.value);
	console.log('  • Modules items size:', modules.items.size);

	// Iterate over the modules
	console.log('\nIterating over modules...'.green, [...modules.items.keys()]);
	for (const [key, module] of modules.items) {
		console.log(`\nProcessing module "${key}"...`.green);
		await module.ready;
		if (module.valid) {
			console.log(`  • Module processed ok:`, module.value);
		} else {
			console.log(`  • Module processed with errors:`, module.errors);
		}
	}
})().catch(exc => console.error(exc.stack));
