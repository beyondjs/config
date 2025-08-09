# @beyond-js/config

A dynamic, modular configuration system for JavaScript and TypeScript.  
Manage configuration branches from inline objects or external files, with hot reloading and automatic path resolution.

## Why use it?

-   Organize configuration into independent **branches** stored in separate files or folders.
-   Automatic path resolution for nested branches.
-   Reactive updates, changes are detected instantly.

## Quick example

**`config.json`**

```json
{
	"project": "project/details.json",
	"modules": ["modules/users/module.json", "modules/invoices/module.json"]
}
```

**`project/details.json`**

```json
{ "name": "My Awesome Project", "version": "1.0.0" }
```

Usage

```ts
import { Config } from '@beyond-js/config'; import path from 'path';

const config = new Config(path.join(\_\_dirname, 'config-project'), { '/project': 'object', '/modules': 'array' });

config.data = 'config.json';

const project = config.get('project'); await project.ready; console.log(project.value.name); // 'My Awesome Project'
```

📚 Full documentation, advanced examples, and API details: 👉 View on GitHub
[View on GitHub](https://github.com/beyondjs/config#readme)
