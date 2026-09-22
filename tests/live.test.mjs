/**
 * A configuration followed through the real watchers service: the root document and a nested file branch
 * are edited on disk and their properties update, because the watcher given to the root reaches every
 * file-backed descendant.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WatchersService } from '@beyond-js/watchers/service';
import { WatcherClient } from '@beyond-js/watchers/client';
import { Config } from '@beyond-js/config/main';

const NAME = 'watchers-config-test';
const service = new WatchersService(NAME);
before(() => service.start());
after(() => service.stop());

/**
 * Resolves once the observed state holds, or fails naming what did not happen: a bounded wait over state
 * the objects expose, checked every few milliseconds, never a wait for time
 */
async function until(condition, what, ms = 8000) {
	const deadline = Date.now() + ms;
	while (!condition()) {
		if (Date.now() > deadline) throw new Error(`Timed out waiting for ${what}`);
		await new Promise(resolve => setTimeout(resolve, 10));
	}
}

/** A temporary directory of one test, removed when the test ends, on failure as well */
async function temporary(t) {
	const dir = await realpath(await mkdtemp(join(tmpdir(), 'beyond-config-live-')));
	t.after(() => rm(dir, { recursive: true, force: true }));
	return dir;
}

test('edits of the root document and of a nested file branch propagate through the watcher of the root', async t => {
	const dir = await temporary(t);
	await mkdir(join(dir, 'a'));
	await writeFile(join(dir, 'a', 'module.json'), '{"n": 1}');
	await writeFile(join(dir, 'config.json'), '{"title": "one", "project": "project.json", "modules": ["a/module.json"]}');
	await writeFile(join(dir, 'project.json'), '{"name": "first"}');

	const client = new WatcherClient(NAME, { is: 'test', path: dir });
	const config = new Config(dir, { '/project': 'object', '/modules': 'array' }, { watcher: client });
	config.data = 'config.json';
	await config.ready;
	const project = config.get('project');
	const modules = config.get('modules');
	await project.ready;
	await modules.ready;
	const item = modules.items.get(join(dir, 'a'));
	await item.ready;
	assert.deepEqual(config.value, { title: 'one' });
	assert.deepEqual(project.value, { name: 'first' });
	assert.deepEqual(item.value, { n: 1 });

	await writeFile(join(dir, 'config.json'), '{"title": "two", "project": "project.json", "modules": ["a/module.json"]}');
	await until(() => config.value?.title === 'two', 'the root value');

	await writeFile(join(dir, 'project.json'), '{"name": "second"}');
	await until(() => project.value?.name === 'second', 'the nested file branch');

	await writeFile(join(dir, 'a', 'module.json'), '{"n": 2}');
	await until(() => item.value?.n === 2, 'the array item file');

	await writeFile(join(dir, 'config.json'), '{"title": "two", "project": "project.json", "modules": []}');
	await until(() => modules.items.size === 0, 'the removed item');
	assert.equal(item.destroyed, true);

	config.destroy();
	await client.destroy();
});
