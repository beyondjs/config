# @beyond-js/config

The `@beyond-js/config` package allows for a modular and dynamic approach to managing project configurations. One of its
key features is its ability to handle properties in two ways: as an inline data object or as a reference to an external
file. From `@beyond-js/config`'s perspective, each branch of the configuration is an independent, dynamic property. The
package's internal logic is responsible for resolving the value of each property, whether it comes from an inline object
or an external file. This process is dynamic and hot-reloading, reacting to changes via the `change` event.

---

# Configuration Flexibility

The package offers two primary methods for structuring your configuration, which can be freely combined.

## 1. Inline Configuration

For smaller projects or simple configuration branches, you can define all properties directly within a single
`config.json` file. Here, the `project` property is an object containing all its information inline.

**`config.json`**

```json
{
	"project": {
		"name": "My Awesome Project",
		"version": "1.0.0",
		"author": "BeyondJS"
	},
	"modules": [
		{
			"name": "core",
			"version": "1.0.0"
		},
		"modules/ui.json"
	]
}
```

In this example, the package resolves the `project` property from the inline object, while it resolves the
`modules/ui.json` property by reading and parsing the external file.

---

## 2. Modular Configuration with References

When a configuration grows, you can modularize it by moving branches to external files. For instance, the `project`
property can be moved to a separate file, and the main `config.json` file would simply reference it as a string.

**`config.json`**

```json
{
	"project": "project/details.json",
	"modules": [
		{
			"name": "core",
			"version": "1.0.0"
		},
		"modules/ui.json"
	]
}
```

**`project/details.json`**

```json
{
	"name": "My Awesome Project",
	"version": "1.0.0",
	"author": "BeyondJS"
}
```

The package transparently handles both scenarios for the developer. When a property's value is a string, it's treated as
a path to an external configuration file, which is then read, parsed, and used as the final value for that property.

---

# Developer Usage

A developer interacts with the configuration properties via the `Config` instance. Because the processing is
asynchronous, the underlying `@beyond-js/dynamic-processor` library guarantees that properties are ready before being
accessed and that the application can react to any changes.

```typescript
const { Config } = require('@beyond-js/config');
const path = require('path');

const config = new Config(path.join(__dirname, 'config-project'), {
	'/project': 'object',
	'/modules': 'array',
	'/modules/children': 'object'
});

config.data = 'config.json';

// Wait for the project property to be ready before accessing its value
const project = config.get('project');
await project.ready;
console.log(project.value.name); // 'My Awesome Project'

// Listen for changes on the project property
project.on('change', () => {
	console.log('Project configuration has changed!');
	console.log('New project name:', project.value.name);
});
```

This approach eliminates the need for manual file loading and parsing, while the built-in reactivity ensures that any
changes to the configuration files are automatically detected and processed.

---

# Configuration Modularity: Branches and Paths

The `@beyond-js/config` package allows for configuration to be modularized by moving branches to external files for
better organization. It is important to note that a branch can be specified in an independent folder. This allows for
advanced flexibility in structuring complex configurations, as the system is capable of resolving file paths coherently
even in nested branches.

Consider an example where the main configuration defines a list of modules, and each module has its own configuration
files in a separate folder.

**File structure:**

```
.
├── config.json
└── modules/
    ├── invoices/
    │   ├── module.json
    │   ├── settings.json
    │   └── ...module files
    └── users/
        ├── module.json
        ├── settings.json
        └── ...module files
```

**`config.json`**

```json
{
	"modules": ["modules/users/module.json", "modules/invoices/module.json"]
}
```

**`modules/users/module.json`**

```json
{
	"name": "users",
	"version": "1.0.0",
	"settings": "settings.json"
}
```

**`modules/users/settings.json`**

```json
{
	"permissions": ["read", "write"]
}
```

In this case, when `config.json` is processed, the `modules` property is read as an array. Each array element points to
an external file. For the `"modules/users/module.json"` element, the package reads the file and its content becomes the
value of the property. Inside this object, the `settings` property is in turn a reference to an external file. Since the
path context is now `modules/users/`, the `settings.json` file is resolved to `modules/users/settings.json`. This way,
each module can have its own configuration file structure without path conflicts.

---

## Modularity with the `path` Property

The `@beyond-js/config` package also considers the `path` property within a configuration object to redefine the path
root for that branch. This allows for greater flexibility in structuring the configuration, as nested paths can be
relative to the location of a configuration file rather than the project root.

For example, `config.json` could use the `path` property to set a new root:

**`config.json`**

```json
{
	"path": "modules",
	"modules": ["users/module.json", "invoices/module.json"]
}
```

In this case, the system first sets the new configuration root to the `modules` folder. From there, the references to
the modules (`"users/module.json"` and `"invoices/module.json"`) are resolved relative to `modules`, rather than the
project root. This simplifies the main configuration and improves project organization.

---

# ConfigCollection

The `ConfigCollection` class is designed to handle collections of configurations, such as a list of applications or
modules. This class simplifies the management of configuration arrays by treating them as a dynamic, reactive
collection. For detailed information on how to use `ConfigCollection`, refer to the
[collection documentation](./collection.md).
