import type { BranchesSpec } from '../property/branches-specs';
import type { ObjectProperty } from './';
import type { ArrayProperty } from '../array';

interface IError {
	code: string;
	text: string;
}

export class Properties extends Map<string, ObjectProperty | ArrayProperty> {
	#property: ObjectProperty;
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

	#initialise(branches: BranchesSpec) {
		branches.forEach((type, branch) => {
			if (!branch.startsWith(`${this.#property.branch}/`)) return;
			const split = branch.slice(this.#property.branch.length + 1).split('/');
			if (split.length !== 1) return;
			const child = split[0];

			// Variable type can be 'object' or 'array'
			const pmod = require(`../${type}`);
			const Property = type === 'object' ? pmod.ObjectProperty : pmod.ArrayProperty;
			const property = new Property(undefined, undefined, branch, this.#property);
			this.set(child, property);
		});
	}

	constructor(property: ObjectProperty) {
		super();
		this.#property = property;
		this.#initialise(this.#property.branches);
	}

	update() {
		if (this.#destroyed) throw new Error('Properties are destroyed');
		let { preprocessed: value } = this.#property;

		const values = typeof value === 'object' ? new Map(Object.entries(value)) : new Map();
		for (const [branch, property] of this) {
			const child = branch.split('/').pop();
			property.data = values.has(child) ? values.get(child) : void 0;
		}
	}

	destroy() {
		if (this.#destroyed) throw new Error('Properties already destroyed');
		this.#destroyed = true;

		this.forEach(property => property.destroy());
		super.clear();
	}
}
