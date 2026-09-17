# Configuration architecture

Config resolves a root JSON object into independently addressable object/array branches. Each branch is a DynamicProcessor with its own data, value, errors and readiness. A declared branch may contain inline data or refer to a file; ordinary undeclared string fields remain ordinary values. Config does not automatically treat every string anywhere in JSON as a file reference.

## Public module and object model

The [manifest](../modules/main/module.json) declares `@beyond-js/config/main`. [Entry source](../modules/main/index.ts) marks `Config` and `ConfigCollection` public; [types](../modules/main/types.ts) mark BranchType, BranchesSpecType, PropertyObjectType, PropertyArrayItemType, PropertyArrayType, PropertyDataType and PropertyValueType. `IFileListenerSpec` and `CollectionItemsType` are also marked in their internal files. IDiagnostic and the internal Property/ObjectProperty/ArrayProperty classes are not independently published modules.

`new Config(rootPath, branches?, watcherSpec?)` extends ObjectProperty. `rootPath` is the configuration directory. Assign `config.data` a filename string; a root inline object assignment throws. Its inherited public surfaces include `data`, `value`, `path`, `rootPath`, `branch`, `type`, `parent`, `id`, `branches`, `errors`, `warnings`, `valid` and DynamicProcessor readiness/events. Object properties add `get(name)`, `has(name)`, `properties` and `preprocessed`. Array properties add `items` and aggregate item-collection errors. Validity checks this property's errors, not all descendants automatically.

[BranchesSpec](../modules/main/property/branches-specs.ts) creates a Map from declared paths, defaults `''` to object, and adds `<array-branch>/children` as object. Types must be `array` or `object`. The supplied branches object is mutated to add the root entry; automatic array-child entries and explicit entries follow insertion order. Declaring a deeply nested branch alone does not synthesize all missing intermediate object branches.

For example, `{ '/project': 'object', '/modules': 'array', '/modules/children/settings': 'object' }` declares a project object, a modules array and settings under each module item. `get('project')` returns a Property, not its resolved plain value. There is no slash-path getter; traverse child `get` calls.

## Data, values and paths

[Property.data](../modules/main/property/index.ts) computes branch path before comparing raw data with the previous value. For string data, path is the directory of `join(parent.path || rootPath, data)`; the actual file is joined from that root and filename. For inline objects, a truthy `path` field changes the branch directory and is deleted from the supplied object. Arrays also pass through this object branch. This mutates caller-owned data. Null passes the JavaScript object-type check but property access on null throws.

The `path` control field is handled by the **data setter for inline objects**, not by a second pass over parsed file content. A `path` field inside root JSON does not automatically redefine the root. Paths are joined, not validated as a containment boundary. FileData's own path validation is also limited; reject unwanted paths at the owning application boundary.

[ObjectProperty](../modules/main/object/index.ts) exposes a shallow copy with declared child branch names removed as `value`. `preprocessed` holds a shallow copy before removal. [Properties](../modules/main/object/properties.ts) constructs direct child properties from the branch schema, then assigns child data from preprocessed. Declared branches are therefore accessed separately; `config.value` is not a recursively merged configuration tree.

The file-backed path creates a DynamicFileObject from `@beyond-js/file/dynamic`; it parses object-shaped JSON. A file containing a top-level array is rejected by that dependency, even when the property schema says array. Inline arrays can be used as object fields. JSON null is accepted by the current file dependency and is not a valid substitute for a normal configuration object.

## Processing and change propagation

1. Assigning changed data invalidates its Property.
2. `_begin()` waits for parent readiness where applicable.
3. `_prepared()` registers a DynamicFileObject child when data is a filename.
4. `_process()` obtains inline data or file value/errors; ObjectProperty separates declared branches, while ArrayProperty updates its item map.
5. Consumers await each needed property's ready state and inspect its diagnostics. DynamicProcessor owns scheduling and events; it does not make Config's incomplete update paths correct automatically.

Known update limitations:

- ObjectProperty returns before updating preprocessed/children when its branch-stripped value is unchanged. A change confined to declared branches can be lost. A root containing only declared branches can likewise skip initial propagation because the remaining object compares equal to an empty previous value.
- Property recomputes path and removes an inline path field before data equality comparison. Path-only edits can change path without invalidating dependents.
- File replacement uses `file.root === root || file.relative === data` as its retain condition. A same-root filename change therefore retains the old file. `file.relative` is an object, not a filename string. Switching from a filename to inline data may also keep an irrelevant file child alive.
- Warnings are exposed but this implementation does not populate a warning pipeline. Child errors do not automatically become root errors. ObjectProperty can suppress a processing-change result even when only diagnostics changed.

These are implementation limitations to repair before relying on dynamic edits. Do not work around them by assuming ready or change events imply all branches converged.

## Arrays and item identity

[ArrayPropertyItems](../modules/main/array/items.ts) keys items by **absolute directory**, not array index, item name or full filename. A string uses `dirname(data)`; an inline object requires a truthy `path`. Inline objects without path are silently skipped. Two filenames in one directory collide in the same key; the updated map retains one entry and may create an unused duplicate property on first processing. A filename such as `module.json` has directory `.` and shares the parent's directory identity.

Items are ObjectProperty instances using the `<branch>/children` schema. Missing/falsy array data becomes an empty list. A truthy nonarray produces `INVALID_TYPE` and an empty item map. Removed items are destroyed. Change reporting compares key membership/count and errors, not every child's processed value. Reordering alone is not reported as a change, although insertion order can change when the map is rebuilt.

Inline path fields are deleted during assignment. Reusing the same mutated input object or reprocessing the same array can remove the identity used to include it. Consumers should not infer stable array semantics from the PropertyArrayType alias alone.

## Collection adapters

`ConfigCollection` is exported from `@beyond-js/config/main`, not a separate `/collection` module. It extends DynamicProcessor applied to Map and receives an ArrayProperty. It registers that property as a child, proxies its errors/warnings/validity, and offers these hooks:

| Hook | Actual argument/result |
| --- | --- |
| `_processConfig(items)` | A new shallow Map of path → Property; return a filtered/transformed Map, or falsy for empty. |
| `_createItem(config)` | Receives the **Property instance**, despite a broad PropertyObjectType annotation; return an item whose `path` equals its map key. |
| `_deleteItem(item)` | Intended removal hook; default implementation tests `instanceof DynamicProcessor`, even though DynamicProcessor is a class factory. |

Existing items are retained by path and are not passed to `_createItem` again when values change. An item must observe its Property or participate in its dependency lifecycle. The collection does not await individual item-property readiness before construction. Invalid source property calls clear. `clear()` destroys only instances of DynamicProcessorImplementation; arbitrary objects with a destroy method are not destroyed. The current DynamicProcessor implementation is an arrow-function mixin factory; using it on the right-hand side of instanceof can throw for an object because the factory has no constructor prototype. Its mixin instances wrap, rather than inherit from, DynamicProcessorImplementation, so clear's separate implementation-class check also skips those normal instances. These are consumer/dependency compatibility defects. Override ownership deliberately rather than assuming every removed item is released.

The [collection guide](../collection.md) gives a minimal adapter shape and explains these constraints.

## Watchers and destruction

`IFileListenerSpec` contains optional `watcher` and `listener`. Config passes its root spec to its own file, but Properties constructs child branches without forwarding that spec, and ArrayProperty constructs its item collection without a watcher spec. Nested files are therefore not watched automatically.

The referenced File utility additionally returns from its listener constructor unless **both** watcher and listener are supplied; watcher-only setup does not currently watch. Config itself neither starts a watcher service nor creates a filesystem monitor. Applications must define watcher lifecycle and repair the forwarding/guard paths to provide reliable change propagation.

Property.destroy destroys its file but omits DynamicProcessor's super.destroy. Object/Array subclasses then destroy child collections. Those collections reject repeated destroy calls. Full processor subscription teardown is therefore incomplete, and destroy is not uniformly idempotent. ConfigCollection does call its base destroy, then clear; item and property ownership still require deliberate handling.

## Build and tests

[package.json](../package.json) supplies Beyond authoring configuration and Node/Node-ts distribution ports 1110/1111. [beyond.json](../beyond.json) selects that manifest. The checkout has no npm scripts or Node root export entry. Use compiled public module `@beyond-js/config/main`, not the old README's root CommonJS import. The utility depends on DynamicProcessor, Equal and File; watcher types are development dependencies. A fresh checkout needs a compatible Beyond compiler/loader and those dependencies; no sibling directory is required.

The [devcontainer](../.devcontainer/Dockerfile) uses Node 18/Beyond 1.2.4. The [publish workflow](../.github/workflows/publish.yml) builds an npm distribution although the manifest does not explicitly declare one, so compiler convention must be checked before using that recipe. It is not a general local development command.

[Current test script](../tests/test-config/index.js) uses legacy BEE/1110/inspector 4000, prints property state and catches exceptions. Its fixture references an absent invoices module. It does not assert branch-only updates, watch behavior or cleanup. Retained tests under trash import a removed relative root entry and use old application manifests; they are historical fixtures, not an active test runner.

Acceptance should cover initial branch-only objects, independent branch/file edits, same-root file replacement, inline path changes, array collisions/removals, parse-error recovery, descendant diagnostics, watcher propagation and destruction. Preserve the Config → Property → Properties/Items → Collection structure while correcting those contracts.
