/**
 * A configuration document resolved into branches: the root value, file and inline branches, array items
 * keyed by directory, diagnostics, and what the caller's objects look like afterwards.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Config, ConfigCollection } from '@beyond-js/config/main';
import { DynamicProcessor } from '@beyond-js/dynamic-processor/main';

const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixture');
const branches = { '/project': 'object', '/inline': 'object', '/modules': 'array' };

async function ready(property) {
	await property.ready;
	return property;
}

/** A temporary directory of one test, removed when the test ends, on failure as well */
async function temporary(t) {
	const dir = await realpath(await mkdtemp(join(tmpdir(), 'beyond-config-')));
	t.after(() => rm(dir, { recursive: true, force: true }));
	return dir;
}

test('the root keeps the undeclared fields; declared branches are properties of their own', async () => {
	const config = new Config(fixture, branches);
	config.data = 'config.json';
	await config.ready;
	assert.equal(config.valid, true);
	assert.deepEqual(config.value, { hello: 'world' });
	assert.deepEqual(config.preprocessed.project, 'project.json');
	assert.equal(config.has('project'), true);
	assert.equal(config.has('absent'), false);

	const project = await ready(config.get('project'));
	assert.equal(project.type, 'object');
	assert.equal(project.path, join(fixture));
	assert.deepEqual(project.value, { name: 'my-project' });

	const inline = await ready(config.get('inline'));
	assert.deepEqual(inline.value, { title: 'inline branch' });
	assert.equal(inline.path, fixture, 'an inline branch keeps the directory of its parent');

	const modules = await ready(config.get('modules'));
	assert.equal(modules.type, 'array');
	assert.equal(modules.items.size, 3, 'a file item, an inline item with a path and another file item');
	assert.deepEqual([...modules.items.keys()], ['modules/users', 'modules/inline-module', 'modules/invoices'].map(one => join(fixture, one)));

	const users = await ready(modules.items.get(join(fixture, 'modules/users')));
	assert.deepEqual(users.value, { hello: 'users' });
	const item = await ready(modules.items.get(join(fixture, 'modules/inline-module')));
	assert.deepEqual(item.value, { name: 'inline module' }, 'the path control field is not part of the value');
	config.destroy();
	config.destroy();
	assert.equal(project.destroyed, true, 'destroying the root destroys its branches');
	assert.equal(users.destroyed, true, 'and the items of its arrays');
});

test('a root of declared branches only still propagates to them; a branch-only edit reaches the branch', async t => {
	const dir = await temporary(t);
	await writeFile(join(dir, 'config.json'), '{"inline": {"a": 1}}');
	const config = new Config(dir, { '/inline': 'object' });
	config.data = 'config.json';
	await config.ready;
	assert.deepEqual(config.value, {});
	const inline = await ready(config.get('inline'));
	assert.deepEqual(inline.value, { a: 1 }, 'the branch received its data although the own value of the root is empty');

	await writeFile(join(dir, 'config.json'), '{"inline": {"a": 2}}');
	config.get('inline'); // no watcher: the root is invalidated by hand
	const file = config.children.get('file').child;
	file._invalidate();
	await file.ready;
	await config.ready;
	await inline.ready;
	assert.deepEqual(inline.value, { a: 2 }, 'a change confined to a declared branch reaches it');
	config.destroy();
});

test('the objects of the caller are not mutated, null is a diagnostic, and a path-only change relocates', async t => {
	const dir = await temporary(t);
	await writeFile(join(dir, 'config.json'), '{"inline": {"path": "sub", "a": 1}, "nothing": null}');
	const config = new Config(dir, { '/inline': 'object', '/nothing': 'object' });
	config.data = 'config.json';
	await config.ready;
	const file = config.children.get('file').child;
	assert.deepEqual(file.value.inline, { path: 'sub', a: 1 }, 'the parsed document keeps its path field');

	const inline = await ready(config.get('inline'));
	assert.equal(inline.path, join(dir, 'sub'));
	assert.deepEqual(inline.value, { a: 1 });

	const nothing = await ready(config.get('nothing'));
	assert.equal(nothing.valid, false);
	assert.deepEqual(nothing.errors.map(error => error.code), ['INVALID_TYPE']);

	inline.data = { path: 'other', a: 1 };
	await inline.ready;
	assert.equal(inline.path, join(dir, 'other'), 'a change of the path alone is a change');
	config.destroy();
});

test('a same-directory file replacement reads the new file, and a file branch turned inline releases the file', async t => {
	const dir = await temporary(t);
	await writeFile(join(dir, 'config.json'), '{"branch": "one.json"}');
	await writeFile(join(dir, 'one.json'), '{"which": 1}');
	await writeFile(join(dir, 'two.json'), '{"which": 2}');
	const config = new Config(dir, { '/branch': 'object' });
	config.data = 'config.json';
	await config.ready;
	const branch = await ready(config.get('branch'));
	assert.deepEqual(branch.value, { which: 1 });
	const first = branch.children.get('file').child;

	branch.data = 'two.json';
	await branch.ready;
	assert.deepEqual(branch.value, { which: 2 }, 'the file named now is the one read');
	assert.equal(first.destroyed, true, 'the previous file was released');

	branch.data = { inline: true };
	await branch.ready;
	assert.deepEqual(branch.value, { inline: true });
	assert.equal(branch.children.has('file'), false, 'an inline branch holds no file');
	config.destroy();
});

test('array items are keyed by directory; a removed item is destroyed; a non-array is a diagnostic', async t => {
	const dir = await temporary(t);
	await mkdir(join(dir, 'a'));
	await mkdir(join(dir, 'b'));
	await writeFile(join(dir, 'a', 'module.json'), '{"n": "a"}');
	await writeFile(join(dir, 'b', 'module.json'), '{"n": "b"}');
	await writeFile(join(dir, 'config.json'), '{"modules": ["a/module.json", "b/module.json", {"pathless": true}]}');
	const config = new Config(dir, { '/modules': 'array' });
	config.data = 'config.json';
	await config.ready;
	const modules = await ready(config.get('modules'));
	assert.deepEqual([...modules.items.keys()], [join(dir, 'a'), join(dir, 'b')], 'an inline item without a path is skipped');
	const b = modules.items.get(join(dir, 'b'));

	modules.data = ['a/module.json'];
	await modules.ready;
	assert.deepEqual([...modules.items.keys()], [join(dir, 'a')]);
	assert.equal(b.destroyed, true);

	modules.data = { not: 'an array' };
	await modules.ready;
	assert.deepEqual(modules.errors.map(error => error.code), ['INVALID_TYPE']);
	assert.equal(modules.items.size, 0);
	config.destroy();
});

test('a collection maps array items to domain objects and destroys the ones that leave, mixin objects included', async t => {
	const dir = await temporary(t);
	for (const name of ['a', 'b']) {
		await mkdir(join(dir, name));
		await writeFile(join(dir, name, 'module.json'), `{"n": "${name}"}`);
	}
	await writeFile(join(dir, 'config.json'), '{"modules": ["a/module.json", "b/module.json"]}');
	const config = new Config(dir, { '/modules': 'array' });
	config.data = 'config.json';
	await config.ready;
	const modules = await ready(config.get('modules'));

	class Module extends DynamicProcessor() {
		get dp() {
			return 'test.module';
		}
		constructor(property) {
			super();
			this.path = property.path;
			this.property = property;
		}
	}
	class Modules extends ConfigCollection {
		_createItem(property) {
			return new Module(property);
		}
	}
	const collection = new Modules(modules);
	await collection.ready;
	assert.deepEqual([...collection.keys()], [join(dir, 'a'), join(dir, 'b')]);
	const b = collection.get(join(dir, 'b'));
	await b.property.ready;
	assert.equal(b.property.value.n, 'b', 'an item observes the readiness of its property itself');

	modules.data = ['a/module.json'];
	await modules.ready;
	await collection.ready;
	assert.deepEqual([...collection.keys()], [join(dir, 'a')]);
	assert.equal(b.destroyed, true, 'the mixin item that left the collection was destroyed');

	const a = collection.get(join(dir, 'a'));
	collection.destroy();
	assert.equal(a.destroyed, true, 'destroying the collection destroys its items');
	assert.equal(collection.size, 0);
	config.destroy();
});
