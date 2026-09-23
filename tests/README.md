# Tests

`node:test` files importing `@beyond-js/config/main` under BEE Node from an Engine development server that compiles this package, with `@beyond-js/dynamic-processor`, `@beyond-js/equal`, `@beyond-js/file` and `@beyond-js/watchers` served or installed. `live.test.mjs` starts the real watchers service process and needs `@beyond-js/ipc` and `chokidar` resolvable from the working directory. `fixture/` is the permanent document `static.test.mjs` reads.

```sh
BEE_URL=<servers> BEE_ADAPTER=engine node --import "$BEE_NODE_DIR/register.mjs" --test tests/*.test.mjs
```

Inside the Beyond Suite, `node utils/validation/run.mjs config` prepares the servers and runs every file. [The validation guide](../docs/validation.md) maps each file to its contracts.

## Conventions

These files follow the normative conventions of the Beyond Suite testing guide (testing v1): Node's own test runner, one process per file; the public specifier a consumer imports and never a source file; readiness, events and answers awaited rather than time, with the runner's timeout bounding every wait; whatever a test creates (a directory, a process, a service) removed with `t.after`, on failure as well; and outcomes asserted, error paths by their diagnostic code where the object reports one. They are not run by `beyond test`: that command tests the packages Packages compiles, and this one is compiled by Engine, so the runner is given the loader and the servers instead. For the same reason the files sit in `tests/` and not beside the module sources, since Engine takes every file of a module directory as an input.

## Fixtures

`fixture/` is the permanent project `static.test.mjs` reads in place and never writes. It sits outside `modules/`, so Engine never takes it as a module input, and keeps the name `fixture/` because the test files refer to it by that name.

| File | Role |
| --- | --- |
| `fixture/config.json` | The root document: a plain property (`hello`), a `project` branch that points to `project.json`, an `inline` branch, and a `modules` collection of two file entries and one inline entry (`modules/inline-module`) |
| `fixture/project.json` | The document the `project` branch loads |
| `fixture/modules/users/module.json`, `fixture/modules/invoices/module.json` | The two file entries of the collection, in declared order around the inline entry |

## Inline inputs

`static.test.mjs` and `live.test.mjs` write one-line JSON documents to a unique temporary directory (`mkdtemp`) and read, change or watch them there, removing the directory with `t.after`. They are small input values and short edits, so they stay inline.

## Test organization and source fixtures

These rules are shared by every Beyond repository.

- Contract/unit and integration tests live in `test/` or `tests/`; complete journeys against an installed, composed or exported product live in `acceptance/`, with a README of their own. Harness infrastructure (servers, registries, process lifecycle, copying and substitution) lives in a `support/` directory of the consuming area.
- Applications, packages, modules, documents and assets a test exercises are checked-in files with their real extensions and directory structure under the consuming area's `fixtures/`. Each fixture group has a README naming its purpose, entry modules, the tests that use it, their command, the expected behavior and any intentionally invalid part. A reader inspects the example without running or decoding a generator.
- A harness copies the fixtures it runs or edits to a unique temporary directory, substitutes only explicit values such as versions, ports or origins, and never writes the checked-in files, even when a run fails. Credentials, machine paths and build output are never fixture source.
- Small input values, expected values, protocol payloads and short edits stay inline. Source is generated only when generation is the behavior under test (size or memory stress, combinations, deliberately malformed input); the guide states why, the parameters that reproduce it and how to inspect what was generated.
- Fixtures stay out of the repository's production compilation, discovery and packaging.
- Migrating a test preserves its scenario identities, its positive, negative and recovery cases and its real execution path; an existing failure stays reported as a failure.
