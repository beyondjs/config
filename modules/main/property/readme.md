# Property

Property owns raw data, the processed value and errors, the branch context, the watcher specification and an optional `DynamicFileObject` child. Root data must be a file name; child data can be inline or file-backed. Inline data is copied before its `path` field is read; a path-only change invalidates; the file child is released when the data no longer names the same file; `destroy()` destroys the processor and the file and is ignored when repeated.

See [data and paths](../../../docs/architecture.md#data-values-and-paths) and [watching and destruction](../../../docs/architecture.md#watching-and-destruction).
