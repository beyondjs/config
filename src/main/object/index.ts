import { equal } from '@beyond-js/equal/main';
import Property from '../property';
import Properties from './properties';

export default class Config extends Property {
	get dp() {
		return 'utils.config.property.object';
	}

	get is() {
		return 'object';
	}

	#properties: Properties;
	get properties() {
		return this.#properties;
	}

	has(name: string) {
		return this.#properties.has(name);
	}

	get(name: string) {
		return this.#properties.get(name);
	}

	constructor(path: string, branchesSpecs?: any, branch?: string, parent?: Property) {
		super(path, branchesSpecs, branch, parent);
		this.#properties = new Properties(this);
	}

	/**
	 * Check if the value of the current property has changed.
	 * To find it out, it is required to remove the children from the received data,
	 * since the children properties verify their own data.
	 */
	_process() {
		let previous = this.value;
		if (super._process() === false) return false;

		previous = Object.assign({}, previous);
		const actual = Object.assign({}, this.value);

		[...this.branchesSpecs.keys()].forEach(branch => {
			if (!branch.startsWith(`${this.branch}/`)) return;
			const child = branch.substr(this.branch.length + 1).split('/')[0];
			delete previous[child];
			delete actual[child];
		});

		const changed = !equal(actual, previous);
		this.#properties.update();
		return changed;
	}

	destroy() {
		super.destroy();
		this.#properties.destroy();
	}
}
