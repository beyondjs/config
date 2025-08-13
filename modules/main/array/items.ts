import type { Property } from '../property';
import type { IDiagnostic, PropertyArrayType } from '../types';
import type { IFileListenerSpec } from '../property';
import { ObjectProperty } from '../object';
import { equal } from '@beyond-js/equal/main';
import { dirname, join } from 'path';

export class ArrayPropertyItems extends Map<string, Property> {
	#property: Property;
	#watcher?: IFileListenerSpec;

	#destroyed = false;
	get destroyed() {
		return this.#destroyed;
	}

	#errors: IDiagnostic[] = [];
	get errors(): IDiagnostic[] {
		return this.#errors;
	}

	get valid() {
		return !this.errors.length;
	}

	constructor(property: Property, watcher?: IFileListenerSpec) {
		super();
		this.#property = property;
		this.#watcher = watcher;
	}

	update() {
		let value = <PropertyArrayType>this.#property.value;
		const { branch } = this.#property;

		value = value ? value : [];
		const errors: IDiagnostic[] = [];
		if (value && !(value instanceof Array)) {
			const { branch } = this.#property;
			const error = {
				code: 'INVALID_TYPE',
				message: `Items of branch "${branch}" must be an "array", however it is "${typeof value}"`
			};
			errors.push(error);
			value = [];
		}

		const updated = new Map();
		for (const data of value) {
			let path = typeof data === 'string' ? dirname(data) : data?.path;
			if (!path) continue;
			path = join(this.#property.path, path);

			const property = this.has(path)
				? this.get(path)
				: new ObjectProperty(undefined, undefined, `${branch}/children`, this.#property, this.#watcher);

			updated.set(path, property);
			property.data = data;
			if (property.path !== path) throw new Error(`Invalid property path "${property.path}" !== "${path}"`);
		}

		const changed =
			updated.size !== this.size ||
			!equal(this.#errors, errors) ||
			[...updated.keys()].reduce((prev, path) => prev || !this.has(path), false);

		this.#errors = errors;

		// Destroy unused properties
		this.forEach((property, path) => !updated.has(path) && property.destroy());

		// Copy the updated properties
		this.clear();
		updated.forEach((value, key) => this.set(key, value));
		return changed;
	}

	destroy() {
		if (this.#destroyed) throw new Error('Properties already destroyed');
		this.#destroyed = true;

		this.forEach(property => property.destroy());
		super.clear();
	}
}
