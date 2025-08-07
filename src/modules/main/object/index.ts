import type { BranchesSpecType } from '../types';
import type { IFileListenerSpec } from '../property';
import { equal } from '@beyond-js/equal/main';
import Property from '../property';
import Properties from './properties';

export default class ObjectProperty extends Property {
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

	has(name: string): boolean {
		return this.#properties.has(name);
	}

	get(name: string): Property | undefined {
		return this.#properties.get(name);
	}

	constructor(
		path: string,
		branches?: BranchesSpecType,
		branch?: string,
		parent?: Property,
		watcher?: IFileListenerSpec
	) {
		super(path, branches, branch, parent, watcher);
		this.#properties = new Properties(this);
	}

	/**
	 * Processes the configuration data for the current property.
	 *
	 * This method extends the base `Property._process()` logic to handle nested object properties.
	 * It first calls the parent method to process the core value and then performs a specific
	 * comparison to detect changes, excluding nested child properties.
	 *
	 * @returns {boolean} A boolean indicating if the property's value has changed.
	 */
	_process(): boolean {
		let previous: Record<string, any> = this.value;
		if (super._process() === false) return false;

		// Check for changes in the current object's properties, excluding nested branches.
		// Nested branches are managed independently by their own `Property` instances.
		const changed = (() => {
			previous = Object.assign({}, previous);
			const actual: Record<string, any> = Object.assign({}, this.value);

			// Remove child branches from the comparison, as they have their own processors.
			[...this.branches.keys()].forEach(branch => {
				if (!branch.startsWith(`${this.branch}/`)) return;
				const child = branch.slice(this.branch.length + 1).split('/')[0];
				delete previous[child];
				delete actual[child];
			});

			return !equal(actual, previous);
		})();

		this.#properties.update();
		return changed;
	}

	destroy() {
		super.destroy();
		this.#properties.destroy();
	}
}
