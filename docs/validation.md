# Validation

The contracts of Config and the tests that establish them. **Component test**: a `node:test` file run against the compiled public module with no watcher, invalidating by hand where a change must propagate. **Live**: the same with the real watchers service process. Inside the Beyond Suite, `node utils/validation/run.mjs config` prepares both; [the tests guide](../tests/README.md) states the prerequisites.

| Contract or risk | Test | Observed |
| --- | --- | --- |
| Root value without declared fields; file, inline and array branches; item keys; the `path` field removed from a value; root destruction reaches every descendant | `static` 1 | as documented |
| A root of declared branches only propagates; a branch-only edit reaches the branch | `static` 2 | branch value `{a:1}` then `{a:2}` |
| The caller's object is not mutated; `null` is `INVALID_TYPE`; a path-only change relocates | `static` 3 | parsed document keeps `path`; error code; new path |
| Same-directory file replacement reads the new file and releases the old; a branch turned inline holds no file | `static` 4 | `{which:2}`; first file destroyed; no `file` child |
| Array keys by directory; a pathless inline item skipped; a removed item destroyed; non-array is `INVALID_TYPE` | `static` 5 | as documented |
| A collection maps items to domain objects, reuses them, destroys the ones that leave and its own on destroy, mixin objects included | `static` 6 | as documented |
| Edits of the root, of a nested file branch and of an array item file propagate through the root's watcher; a removed item is destroyed | `live` 1 | every value updated; item destroyed |

## Not established

- Warnings: no code path populates `warnings`; the getter is kept for the public surface.
- Deeply nested declared branches (`/a/b/c`) beyond one level under an array item: the schema supports them and no test exercises three levels.
- Two file items in one directory: the collision is documented, not tested.
- A `listener` shared by the root: only the `watcher` form is exercised live.
