import type { BranchType, BranchesSpecType, IErrorType, PropertyDataType, PropertyValueType } from '../types';
import { BranchesSpec } from './branches-specs';
import { DynamicProcessor } from '@beyond-js/dynamic-processor/main';
import { equal } from '@beyond-js/equal/main';
import FileProperty from './file';
import { join, dirname } from 'path';

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
	#type: BranchType;
	get type() {
		return this.#type;
	}

	// The relative path of the configuration branch (e.g., '/applications/children').
	#branch: string;
	get branch() {
		return this.#branch;
	}

	// An instance of `FileProperty` used to manage the configuration file if the data is a string.
	#file: FileProperty;

	// The raw data provided to the property. It can be a string (file path), an object, or undefined.
	#data: PropertyDataType;
	get data() {
		return this.#data;
	}

	// The processed value of the configuration.
	#value: PropertyValueType;
	get value() {
		return this.#value;
	}

	/**
	 * Sets the raw configuration data for the property.
	 *
	 * This setter is the entry point for new configuration data. It handles the following logic:
	 *
	 * - Validation: For a root property (one without a parent),
	 * the value must be a string representing the file path to be processed.
	 *
	 * - Path Resolution: It determines the full path of the property based on the `value` and
	 * the parent's path or the `rootPath`.
	 * If the value is an object, the method looks for a path property within it. If found, this path
	 * is used to create a new root for resolving file references for all nested branches.
	 * Example: if the data is `{"path": "./modules"}` for a property at the project root,
	 * and a nested branch is `"users/module.json"`, the system will resolve the file to `./modules/users/module.json`.
	 *
	 * - Change Detection: It compares the new value with the current data to prevent unnecessary processing.
	 * If the data has not changed, it returns early.
	 *
	 * - Invalidation: If the data has changed, it updates the internal `#data` and calls `_invalidate()`
	 * to trigger a new asynchronous processing cycle via the `DynamicProcessor`.
	 *
	 * @param {PropertyDataType} value The new configuration data. This can be a string (file path),
	 * an object containing configuration, or an array of strings/objects.
	 * @throws {Error} Throws an error if the root property is assigned a value that is not a string.
	 */
	set data(data: PropertyDataType) {
		// Validation for root property: data must be a string pointing to a file.
		if (typeof data !== 'string' && !this.#parent) {
			throw new Error('Data must be the file to be processed when refers to a root configuration object');
		}

		// Determine the property's path.
		// If the data is an object, it checks for a 'path' property to resolve the path relative
		// to the parent or root path. The 'path' property is then deleted from the object to prevent it
		// from being part of the value. If the data is a string (a file path), it calculates the directory
		// of that file to be used as the property's path.
		this.#path = (() => {
			if (!['object', 'string'].includes(typeof data)) return;

			const root = this.#parent ? this.#parent.path : this.#rootPath;

			if (typeof data === 'object') {
				const d = <{ path?: string }>data;
				const path = d.path ? join(root, d.path) : root;
				delete (data as any).path;
				return path;
			} else if (typeof data === 'string') {
				return dirname(join(root, data));
			}
		})();

		// If the data has not changed, do nothing.
		// Once the path is set, and removed from the data, then we can compare with the previous data
		// to check if the configuration has changed
		if (equal(data, this.#data)) return;

		this.#data = data;

		// Invalidate the processor to trigger a re-processing cycle.
		this._invalidate();
	}

	/**
	 * Configuration property constructor.
	 *
	 * @param {string} [rootPath] The root path for the configuration file. This is only
	 * specified for the root property; child properties should be `undefined`.
	 * @param {BranchesSpecType} [branches] A map defining the expected types ('array' or 'object') for
	 * configuration branches. This is only specified for the root property.
	 * @param {string} [branch] The branch path of the current property (e.g., '/applications/children/template').
	 * An empty string ('') or `undefined` can be used for the root property.
	 * @param {Property} [parent] The parent property instance. This is only specified for child
	 * properties; the root property should be `undefined`.
	 * @throws {Error} Throws an error if `rootPath` and `parent` are both defined or both undefined.
	 * @throws {Error} Throws an error if the specified `branch` is not found in the `branches` specification.
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
	 * It manages the `FileProperty` instance, creating or destroying it as needed based on the data type.
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
			const file = (this.#file = new FileProperty(root, this.#data));
			this.children.register(new Map([['file', { child: file }]]));
		})();
	}

	/**
	 * The `_process` method is the core logic for processing the configuration data.
	 * It handles different data types (object, string) and updates the property's value and errors.
	 * @returns A boolean indicating if the processed value has changed.
	 */
	_process(): boolean {
		const done = ({ value, errors }: { value?: PropertyValueType; errors?: IErrorType[] }) => {
			errors = errors ? errors : [];
			const changed = !equal({ value: this.#value, errors: this.#errors }, { value, errors });
			this.#value = value;
			this.#errors = errors;
			return changed;
		};

		if (['object', 'undefined'].includes(typeof this.#data)) {
			return done({ value: <PropertyValueType>this.#data });
		} else if (typeof this.#data === 'string') {
			const file = this.#file;
			const { errors, value } = file;
			return done({ errors, value });
		} else {
			const code = 'INVALID_TYPE';
			const message =
				`Configuration value is invalid, value type must be an object, ` +
				`a string or undefined, but it is "${typeof this.#data}"`;
			return done({ errors: [{ code, message }] });
		}
	}

	destroy() {
		this.#file?.destroy();
	}
}
