# @beyond-js/config

A dynamic configuration processor for managing complex configuration objects and collections.

## Installation

```bash
npm install @beyond-js/config
```

## Features

-   Dynamic processing of configuration objects and arrays
-   File-based configuration support
-   Hierarchical configuration structure
-   Error and warning handling
-   Watching for file changes

## Usage

```javascript
const { Config, ConfigCollection } = require('@beyond-js/config');

// Create a configuration object
const config = new Config('/path/to/config/root', {
	applications: 'array',
	'applications/children': 'object'
});

// Set configuration data
config.data = 'config.json';

// Access configuration properties
config.ready.then(() => {
	console.log(config.value);
	console.log(config.errors);
	console.log(config.warnings);
});

// Create a configuration collection
class MyCollection extends ConfigCollection {
	_createItem(config) {
		return new MyItem(config);
	}
}

const collection = new MyCollection(config);

// Process the collection
collection.ready.then(() => {
	console.log(collection.size);
	for (const [key, item] of collection) {
		console.log(key, item);
	}
});
```

## API

### Config

-   `constructor(rootPath, branchesSpecs)`
-   `data`: Get/set the configuration data
-   `value`: Get the processed configuration value
-   `errors`: Get configuration errors
-   `warnings`: Get configuration warnings
-   `valid`: Check if the configuration is valid

### ConfigCollection

-   `constructor(config)`
-   `config`: Get the underlying configuration object
-   `errors`: Get collection errors
-   `warnings`: Get collection warnings
-   `valid`: Check if the collection is valid

## License

MIT © [[BeyondJS](https://beyondjs)]
