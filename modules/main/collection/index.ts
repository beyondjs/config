import type { ArrayProperty } from '../array';
import type { Property } from '../property';
import type { PropertyObjectType, IDiagnostic } from '../types';
import { DynamicProcessorImplementation } from '@beyond-js/dynamic-processor/main';
import { DynamicProcessor } from '@beyond-js/dynamic-processor/main';

export /*bundle*/ type CollectionItemsType = Map<string, Property>;

export class ConfigCollection<ItemType extends { path: string }> extends DynamicProcessor(
	Map<string, Record<string, any>>
) {
	get dp() {
		return '@beyond-js/config/collection';
	}

	#property: ArrayProperty;
	get property(): ArrayProperty {
		return this.#property;
	}

	get errors(): IDiagnostic[] {
		return this.#property.errors;
	}

	get warnings(): IDiagnostic[] {
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
	_createItem(config: PropertyObjectType): ItemType {
		void config;
		throw new Error('This method should be overridden');
	}

	get(key: string): ItemType {
		return <ItemType>super.get(key);
	}

	forEach(callback: (value: ItemType, key: string, map: Map<string, ItemType>) => void, thisArg?: any): void {
		super.forEach((value, key, map) => callback(<ItemType>value, key, <Map<string, ItemType>>map), thisArg);
	}

	_deleteItem(item: ItemType) {
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
			const item: Record<string, any> = this.has(path) ? this.get(path) : this._createItem(property);
			if (item.path !== path) throw new Error(`Item must specify its path`);
			updated.set(path, item);
		}

		// Destroy unused items
		this.forEach(item => !updated.has(item.path) && this._deleteItem(<ItemType>item));

		// Set the updated data into the collection
		super.clear(); // Do not use this.clear(), as it would destroy libraries still being used
		updated.forEach((value, key) => this.set(key, value));
	}

	clear() {
		// Destroy all items in the collection if they are instances of DynamicProcessor
		this.forEach(item => {
			if (!(item instanceof DynamicProcessorImplementation)) return;
			(<DynamicProcessorImplementation>item).destroy();
		});

		super.clear();
	}

	destroy() {
		super.destroy();
		this.clear();
	}
}
