# @beyond-js/config/collection

As you know, the `@beyond-js/config` package is designed to handle different types of configuration branches, namely
`object` and `array`. The `ConfigCollection` class is specifically built to manage the `array` type branches, providing
a robust and dynamic way to work with a collection of configuration items. It acts as a bridge between a simple array of
configuration data and a reactive collection of rich, functional objects for your application.

The class extends `Map` and `@beyond-js/dynamic-processor`, allowing it to behave as a key-value collection that also
manages its own asynchronous processing lifecycle. This means the collection automatically stays up-to-date with its
source configuration.

---

## Usage

To start using `ConfigCollection`, you first define an `array` branch in your `Config` instance. For instance, consider
a configuration with a `modules` branch that can contain both inline objects and references to external files,
demonstrating the flexibility of `@beyond-js/config`.

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

Now, let's say our goal is to manage the `modules` array not just as a list of data objects, but as a collection of
`Module` class instances. We can achieve this by extending `ConfigCollection` and instantiating it with the
`ArrayProperty` instance corresponding to the `modules` branch.

**Constructor**

The constructor of `ConfigCollection` receives an `ArrayProperty` instance, which represents the `array` configuration
branch to be processed.

```typescript
class ModulesCollection extends ConfigCollection {
	// ...
}

const modulesConfig = config.get('modules'); // An ArrayProperty instance
const modules = new ModulesCollection(modulesConfig);
```

**The `_createItem` Method**

This method is the core of the collection's functionality. You must override it to tell the collection how to
instantiate each item from the configuration data. The `config` parameter passed to this method is the resolved
`Property` instance for each item in the array. This allows you to transform raw configuration data into a meaningful
object for your application.

Since `config` is an instance of `Property`, it is also a `DynamicProcessor`, allowing you to listen for changes within
that specific module's configuration.

```typescript
class Module {
	constructor(config) {
		// config is a DynamicProcessor
		this.config = config;

		config.on('change', () => {
			console.log(`Module ${config.value.name} has changed its config!`);
		});
	}
}

class ModulesCollection extends ConfigCollection {
	_createItem(config) {
		return new Module(config);
	}
}
```

As config is a dynamic processor, you can take advantage of it.

```typescript
import { DynamicProcessor } from '@beyond-js/dynamic-processor/main';

class Module extends DynamicProcessor() {
	#config;
	#name: string;

	constructor(config) {
		// config is a DynamicProcessor
		this.#config = config;

		super.setup(new Map(['config', { child: config }]));
	}

	_process() {
		this.name = this.#config.value.name;
	}
}
```

**The `_processConfig` Method**

This method can be optionally overridden to intercept and modify the configuration items _before_ they are used to
create the final collection. This provides a hook to perform actions like adding, removing, or altering configuration
entries based on custom business logic. The method receives a `Map` of items and should return a new `Map` with the
processed items.

---

# Asynchronous Processing and Reactivity

As a `DynamicProcessor`, the `ConfigCollection`'s processing is asynchronous. To ensure the collection is ready for use,
developers should use `await collection.ready` before accessing its data.

Furthermore, the collection is reactive to changes in its underlying configuration. If a developer modifies an external
file that the configuration array references, the collection automatically re-processes itself and emits a `change`
event once the update is complete. You can listen for this event to react to real-time changes in your application:

```typescript
collection.on('change', () => {
	console.log('The collection has been updated!');
	console.log('Current number of items:', collection.size);
});
```
