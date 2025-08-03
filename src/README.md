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
