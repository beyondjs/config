# @beyond-js/config

Config resolves a JSON configuration document into independently addressable branches, each a Dynamic Processor with its own data, value, diagnostics and readiness. A declared branch may hold an inline object, an array of items, or the name of a file; the fields that are not declared stay in the owning object's value.

```ts
import { Config } from '@beyond-js/config/main';

const config = new Config(directory, { '/project': 'object', '/modules': 'array' }, { watcher });
config.data = 'config.json';                 // the root names a file
await config.ready;
config.value;                                // the undeclared fields of config.json
const project = config.get('project');       // a branch: inline object or a file named by the document
await project.ready;
project.value;
const modules = config.get('modules');       // an array branch: items keyed by directory
await modules.ready;
modules.items.get(join(directory, 'modules/users')).value;
config.destroy();                            // destroys every branch and item
```

The public Beyond module is `@beyond-js/config/main`, exporting `Config` and `ConfigCollection`. [Architecture and API behaviour](docs/architecture.md) explains branches and paths, propagation (a change confined to a declared branch reaches it), file replacement, array item identity, diagnostics, the watcher that the root passes down to every file-backed descendant, and destruction. [Collection adapters](collection.md) explains `ConfigCollection`. [Validation](docs/validation.md) maps each contract to its test, including a configuration edited on disk and followed through the real watchers service.

The repository is authored with Beyond; [package.json](package.json) declares the dependencies and compiler distributions. Consumers import the public module through a Beyond loader.
