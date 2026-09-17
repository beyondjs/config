# @beyond-js/config

Config models a JSON configuration as independent object/array branches backed by DynamicProcessor. Declared branches can be inline values or file references; ordinary fields remain in the owning object's value.

The public Beyond module is `@beyond-js/config/main`. Root configuration data must name a file. Read [architecture and API behavior](docs/architecture.md) before relying on automatic watching: branch propagation, file replacement and watcher forwarding currently have important limitations. [Collection adapters](collection.md) explains ConfigCollection.

The repository is authored with Beyond and has no standalone npm start/test script. Build/distribution configuration is in [package.json](package.json); the architecture guide describes loader, dependency and fixture requirements.
