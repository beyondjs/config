# ConfigCollection adapters

Import ConfigCollection from `@beyond-js/config/main`. There is no separate public `@beyond-js/config/collection` module.

The collection accepts an array Property and maps each configuration directory to a domain object. `_createItem` receives that item's Property, not a plain resolved configuration value. The item must expose the same `path` and observe its own property's readiness/change lifecycle.

```ts
import { ConfigCollection } from '@beyond-js/config/main';

class Modules extends ConfigCollection<{ path: string; config: any }> {
    _createItem(config: any) {
        return { path: config.path, config };
    }
}
```

This example only stores property references. Await each stored `config.ready` and check `config.valid` before reading values; it does not implement subscriptions or resource disposal. The inherited constructor takes the array property returned by an appropriate declared Config branch.

`_processConfig` receives a shallow Map of path → Property and can return a filtered/replaced Map. Existing items are reused by directory key. Pathless inline objects are skipped by the upstream array implementation, and multiple files in one directory collide. Include deliberate directory identity in the input and define collision behavior before extending it.

The default removal hook uses instanceof against the DynamicProcessor factory, which can throw with the current arrow-function factory. Clear tests DynamicProcessorImplementation, which does not match the outer mixin instances. Removed domain objects therefore are not uniformly destroyed. Override lifecycle ownership when items retain subscriptions or other resources. See [array identity](docs/architecture.md#arrays-and-item-identity), [collection hooks](docs/architecture.md#collection-adapters) and [watcher/destruction limitations](docs/architecture.md#watchers-and-destruction).
