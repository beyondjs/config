import type { BranchesSpecType } from './branches-specs';
import { BranchesSpec } from './branches-specs';
import { DynamicProcessor } from '@beyond-js/dynamic-processor/main';
import { equal } from '@beyond-js/equal/main';
import PropertyFile from './file';

interface IErrorType {
	code: string;
	message: string;
}

type PropertyDataType = string | object | (string | object)[];

// The autoincrement is just to have an id in the config objects that is useful in development to trace the code
let autoincrement = 0;

/**
 * The abstract `Property` class serves as the base for handling configuration data.
 * It extends `DynamicProcessor` to enable automatic updates when its data or dependencies change.
 * This class handles file-based configurations, hierarchical structures, and error management.
 */
export default class Property extends DynamicProcessor() {
	get dp() {
		return 'utils.config.property';
	}

	// Unique ID for the property instance.
	#id = autoincrement++;
	get id() {
		return this.#id.toString();
	}

	// Reference to the parent property in the configuration hierarchy.
	#parent: Property;
	get parent() {
		return this.#parent;
	}

	// A map defining the expected types ('array' or 'object') for configuration branches.
	#branches: BranchesSpec;
	get branches() {
		return this.#branches;
	}

	#errors: IErrorType[] = [];
	get errors() {
		return this.#errors;
	}

	get valid() {
		return !this.errors.length;
	}

	#warnings: IErrorType[] = [];
	get warnings() {
		return this.#warnings;
	}

	// The root path for the configuration, only defined for the top-level property.
	#rootPath: string;
	get rootPath() {
		return this.#rootPath;
	}

	// The full path of the property. For a root property, it's the root path.
	// For child properties, it's derived from the parent's path and the property's data.
	#path: string;
	get path() {
		return this.#path;
	}

	// Can be 'array' or 'object'
	#type;
	get type() {
		return this.#type;
	}

	// The relative path of the configuration branch (e.g., '/applications/children').
	#branch: string;
	get branch() {
		return this.#branch;
	}

	// An instance of `PropertyFile` used to manage the configuration file if the data is a string.
	#file: PropertyFile;

	// The processed value of the configuration.
	#value: any;
	get value() {
		return this.#value;
	}

	// The raw data provided to the property. It can be a string (file path), an object, or undefined.
	#data: PropertyDataType;
	get data() {
		return this.#data;
	}

	set data(value: PropertyDataType) {
		// Validation for root property: data must be a string pointing to a file.
		if (typeof value !== 'string' && !this.#parent) {
			throw new Error('Data must be the file to be processed when refers to a root configuration object');
		}

		// Determine the property's path.
		this.#path = (() => {
			if (!['object', 'string'].includes(typeof value)) return;

			const { join, dirname } = require('path');
			const root = this.#parent ? this.#parent.path : this.#rootPath;

			if (typeof value === 'object') {
				const path = value.path ? join(root, value.path) : root;
				delete value.path;
				return path;
			} else if (typeof value === 'string') {
				return dirname(join(root, value));
			}
		})();

		// If the data has not changed, do nothing.
		// Once the path is set, and removed from the value, then we can compare with the previous value
		// to check if the configuration has changed
		if (equal(value, this.#data)) return;

		this.#data = value;

		// Invalidate the processor to trigger a re-processing cycle.
		this._invalidate();
	}

	/**
	 * Configuration property constructor
	 *
	 * @param rootPath {string=} The path where the configuration file is located.
	 * (only if the property is the root, otherwise it must be undefined).
	 * Once the initial path is configured in the root property, the child nodes that have their
	 * configuration in files, calculates its path with respect to its location.
	 * @param branches {BranchesSpecType} The list of properties that can be stored in independents files.
	 * The key is the branch, and the value can be 'array' or 'object'
	 * (only if the property is the root, otherwise it should be undefined)
	 * @param branch {string=} The branch of the current property.
	 * Ex: '/applications/children/template'
	 * (if the property is the root, then an empty string ('') can be specified, or undefined)
	 * @param parent {Property} The parent property.
	 * (only if the property is a branch, otherwise it should be undefined)
	 */
	constructor(rootPath: string, branches: BranchesSpecType, branch: string, parent: Property) {
		branch = branch ? branch : '';
		if (typeof branch !== 'string') throw new Error('Invalid "branch" parameter');
		if ((rootPath && parent) || (!rootPath && !parent)) throw new Error('Invalid parameters');
		super();

		this.#rootPath = rootPath;
		this.#branches = parent ? parent.branches : new BranchesSpec(branches);

		this.#branch = branch;
		this.#parent = parent;

		if (!this.#branches.has(branch)) throw new Error(`Branch "${branch}" not found`);
		this.#type = this.#branches.get(branch);
	}

	/**
	 * The `_begin` method is part of the `DynamicProcessor` lifecycle.
	 * It ensures the parent property is ready before processing the current one.
	 */
	async _begin() {
		await this.#parent?.ready;
	}

	/**
	 * The `_prepared` method is called after dependencies are ready.
	 * It manages the `PropertyFile` instance, creating or destroying it as needed based on the data type.
	 */
	_prepared() {
		// Unregister the old file child if its path has changed.
		(() => {
			if (!this.#file) return;

			const file = this.#file;
			const root = this.#parent ? this.#parent.path : this.#rootPath;
			if (file.root === root || file.relative === this.#data) return;

			this.children.unregister(['file']);
			this.#file = void 0;
			file.destroy();
		})();

		// Register a new file child if the data is a string (a file path) and no file is registered yet.
		(() => {
			if (this.#file || typeof this.#data !== 'string') return;

			const root = this.#parent ? this.#parent.path : this.#rootPath;
			const file = (this.#file = new PropertyFile(root, this.#data));
			this.children.register(new Map([['file', { child: file }]]));
		})();
	}

	/**
	 * The `_process` method is the core logic for processing the configuration data.
	 * It handles different data types (object, string) and updates the property's value and errors.
	 * @returns A boolean indicating if the processed value has changed.
	 */
	_process(): boolean {
		const done = ({ value, errors }) => {
			errors = errors ? errors : [];
			const changed = !equal({ value: this.#value, errors: this.#errors }, { value, errors });
			this.#value = value;
			this.#errors = errors;
			return changed;
		};

		if (['object', 'undefined'].includes(typeof this.#data)) {
			return done({ value: this.#data });
		} else if (typeof this.#data === 'string') {
			const file = this.#file;
			const { errors, value } = file;
			return done({ errors, value });
		} else {
			const error =
				`Configuration value is invalid, value type must be an object, ` +
				`a string or undefined, but it is "${typeof this.#data}"`;
			return done({ errors: [error] });
		}
	}

	destroy() {
		this.#file?.destroy();
	}
}
