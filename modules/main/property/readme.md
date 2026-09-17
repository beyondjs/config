# Property

Property owns raw data, processed value/errors, branch context and an optional DynamicFileObject dependency. Root data must be a filename; child data can be inline or file-backed. It extends DynamicProcessor and is an internal class of `@beyond-js/config/main`.

See [data and paths](../../../docs/architecture.md#data-values-and-paths), [processing](../../../docs/architecture.md#processing-and-change-propagation) and [destruction](../../../docs/architecture.md#watchers-and-destruction) for exact semantics. Path-only invalidation, same-root file replacement, nested watcher forwarding and base cleanup require repairs; the presence of dynamic processors does not guarantee automatic convergence.
