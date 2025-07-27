import type Property from '../property';
import { equal } from '@beyond-js/equal/main';
import { dirname, join } from 'path';

interface IError {
	code: string;
	text: string;
}

export default class extends Map {
	#property: Property;
	#destroyed = false;
	get destroyed() {
		return this.#destroyed;
	}

	#errors: IError[] = [];
	get errors() {
		return this.#errors;
	}

	get valid() {
		return !this.errors.length;
	}

	constructor(property: Property) {
		super();
		this.#property = property;
	}

	update() {
		let { value, branch } = this.#property;
		value = value ? value : [];
		const errors: IError[] = [];
		if (value && !(value instanceof Array)) {
			const error = {
				code: 'INVALID_TYPE',
				text: `Items of branch "${this.#property.branch}" must be an "array", however it is "${typeof value}"`
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
				: new (require('../object'))(undefined, undefined, `${branch}/children`, this.#property);

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
