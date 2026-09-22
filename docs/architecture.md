# Configuration architecture

Config resolves a root JSON document into independently addressable object and array branches. Each branch is a Dynamic Processor with its own data, value, errors and readiness. A declared branch may hold inline data or name a file; undeclared string fields are ordinary values.

## Public module and object model

[main/module.json](../modules/main/module.json) declares `@beyond-js/config/main`. [The entry](../modules/main/index.ts) marks `Config` and `ConfigCollection` public; [types.ts](../modules/main/types.ts) marks the branch, property and value types. `Property`, `ObjectProperty`, `ArrayProperty` and their collections are internal.

`new Config(rootPath, branches?, watcher?)` extends `ObjectProperty`. `rootPath` is the configuration directory; `branches` maps branch paths (`/project`, `/modules`, `/modules/children/settings`) to `object` or `array`; `watcher` is `{ watcher?, listener? }` as `@beyond-js/file/dynamic` accepts it. Assign `config.data` a file name; a root given an inline object throws.

[BranchesSpec](../modules/main/property/branches-specs.ts) defaults the root to `object` and adds `<array>/children` as `object` for every array branch. Types must be `array` or `object`. Intermediate branches are not synthesized: declare each level.

A property exposes `data`, `value`, `path`, `rootPath`, `branch`, `type`, `parent`, `id`, `branches`, `errors`, `warnings`, `valid`, `watcher` and the Dynamic Processor lifecycle. An object property adds `get(name)`, `has(name)`, `properties` and `preprocessed`; an array property adds `items`. `valid` reads the property's own errors; descendants are read individually.

## Data, values and paths

Assigning `data` to a property:

1. An inline object is copied before its `path` field is taken from it, so the caller's object, which may be the parsed value of a file, is never mutated.
2. The branch path is computed: for a file name, the directory of the file joined to the parent's path or the root; for an inline object with `path`, that path joined to the parent's; otherwise the parent's path.
3. When neither the data nor the path changed, nothing happens; otherwise the property is invalidated. A change of the path alone is a change.

`ObjectProperty.value` is a shallow copy of the parsed value with the declared child branches removed; `preprocessed` is the copy before removal. The declared branches always receive their data from `preprocessed` after a processing, whether or not the own value changed, and each compares and decides for itself: a change confined to a declared branch reaches it, and a root that holds declared branches only still propagates on its first processing. The own `change` of an object announces the change of its own value.

A file-backed branch owns a `DynamicFileObject` from `@beyond-js/file/dynamic`, registered as its child and created with the watcher specification the root received. That file is released when the data no longer names the same absolute file: a same-directory replacement reads the new file, and a branch turned inline holds no file. A document that is not an object is the file's diagnostic; `null` data is `INVALID_TYPE` of the property.

Paths are joined, not validated as a containment boundary; an application that accepts documents from outside validates them at its own boundary.

## Arrays and item identity

[ArrayPropertyItems](../modules/main/array/items.ts) keys items by the absolute directory of each entry: the directory of a file name, or the `path` of an inline object, joined to the array's path. An inline object without `path` is skipped; two file names in one directory collide on one key. Items are object properties of the `<branch>/children` schema, created with the watcher specification. A falsy array is empty; a truthy non-array is `INVALID_TYPE` with no items. An item whose key left the array is destroyed; reordering alone is not a change.

## Collection adapters

[ConfigCollection](../modules/main/collection/index.ts) extends `DynamicProcessor(Map)` over an array property and is described in [the collection guide](../collection.md). Its removal hook is structural: an item with a `destroy()` is destroyed, which covers Dynamic Processor mixin objects, which are not instances of a class the collection could test.

## Watching and destruction

The watcher specification given to the root reaches every file-backed descendant: object branches, array items and their branches. With a `watcher`, each file creates a listener of its own directory and releases it; with a `listener`, each file shares it. Config starts no watcher service.

`destroy()` of any property destroys its processor, its file and its children, and is ignored when repeated. Destroying the root destroys everything under it.

## Build and validation

[package.json](../package.json) declares the Dynamic Processor, Equal and File dependencies and the Node distributions; [beyond.json](../beyond.json) selects it. The tests under [tests/](../tests/README.md) import the compiled public module; [validation](validation.md) maps each contract to its test and states what is not established.
