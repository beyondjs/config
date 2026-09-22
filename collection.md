# ConfigCollection adapters

Import `ConfigCollection` from `@beyond-js/config/main`. The collection adapts an array branch into a map of domain objects keyed by the directory of each item.

```ts
import { ConfigCollection } from '@beyond-js/config/main';

class Modules extends ConfigCollection {
    _createItem(property) {
        return new Module(property);          // property: the ObjectProperty of the item, with path, value, errors, ready
    }
}
const modules = new Modules(config.get('modules'));
await modules.ready;
```

`_createItem(property)` receives the item's **property**, not a plain value; the item must expose the same `path` and observe the property's readiness and changes itself. `_processConfig(items)` receives a shallow map of path to property and may filter or replace it. Existing items are reused by path; an item whose path left the array is released with `_deleteItem(item)`, whose default destroys any item that has a `destroy()` and is not destroyed, whether it is a Dynamic Processor mixin object or something else. `clear()` releases every item; `destroy()` destroys the collection and its items.

Two files in one directory collide on the same key; an inline item without `path` is skipped by the array. Define directory identity deliberately.
