import type ArrayProperty from '../array';
import type Property from '../property';
import type { PropertyObjectType } from '../types';
import { DynamicProcessor } from '@beyond-js/dynamic-processor/main';

export /*bundle*/ type CollectionItemsType = Map<string, Property>;

export default class ConfigCollection<T> extends DynamicProcessor(Map) {
	get dp() {
		return '@beyond-js/config/collection';
	}

	#property: ArrayProperty;
	get property() {
		return this.#property;
	}

	get errors() {
		return this.#property.errors;
	}

	get warnings() {
		return this.#property.warnings;
	}

	get valid() {
		return this.#property.valid;
	}

	constructor(property: ArrayProperty) {
		super();

		this.#property = property;
		super.setup(new Map([['property', { child: property }]]));
	}

	// This method should be overridden to process the configuration, and also can be used
	// to alter the configuration of the items (modify, add or remove) before creating the instances
	_processConfig(items: CollectionItemsType): CollectionItemsType {
		return items;
	}

	// This method should be overridden
	_createItem(config: PropertyObjectType) {
		void config;
		throw new Error('This method should be overridden');
	}

	_deleteItem(item: T) {
		if (!(item instanceof DynamicProcessor)) return;
		(item as any).destroy?.();
	}

	_process() {
		const property = this.#property;
		if (!property.valid) {
			this.clear();
			return;
		}

		let items: CollectionItemsType = this._processConfig(new Map(property.items));
		items = items ? items : new Map();

		const updated = new Map();
		for (const [path, property] of items) {
			const item = this.has(path) ? this.get(path) : this._createItem(property);
			if (item.path !== path) throw new Error(`Item must specify its path`);
			updated.set(path, item);
		}

		// Destroy unused items
		this.forEach(item => !updated.has(item.path) && this._deleteItem(item));

		// Set the updated data into the collection
		super.clear(); // Do not use this.clear(), as it would destroy libraries still being used
		updated.forEach((value, key) => this.set(key, value));
	}

	clear() {
		this.forEach(item => item.destroy());
		super.clear();
	}

	destroy() {
		super.destroy();
		this.clear();
	}
}
