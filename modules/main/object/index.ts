import type { BranchesSpecType, PropertyValueType } from '../types';
import type { IFileListenerSpec } from '../property';
import { equal } from '@beyond-js/equal/main';
import { Property } from '../property';
import { Properties } from './properties';

export class ObjectProperty extends Property {
	get dp() {
		return 'utils.config.property.object';
	}

	get is() {
		return 'object';
	}

	// The value with the branches removed from the value
	#value: PropertyValueType;
	get value(): PropertyValueType {
		return this.#value;
	}

	// The value of the property before separating out nested branch properties.
	// This preprocessed value is needed so that branch properties can update their values.
	// Example: if the an object property has a branch like `/project`, the project property is removed from the value,
	// but the project data is still needed for its branch to update correctly its data.
	// Check the `Properties.update()` method.
	#preprocessed: PropertyValueType;
	get preprocessed() {
		return this.#preprocessed;
	}

	#properties: Properties;
	get properties(): Properties {
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

		const {
			changed,
			value,
			preprocessed
		}: { changed: boolean; value: PropertyValueType; preprocessed: PropertyValueType } = (() => {
			previous = Object.assign({}, previous);
			const preprocessed: Record<string, any> = Object.assign({}, super.value);
			const value: Record<string, any> = Object.assign({}, super.value);

			// Remove child branches from the comparison, as they have their own processors.
			[...this.branches.keys()].forEach(branch => {
				if (!branch.startsWith(`${this.branch}/`)) return;
				const child = branch.slice(this.branch.length + 1).split('/')[0];
				delete previous[child];
				delete value[child];
			});

			const changed = !equal(value, previous);
			return { changed, value, preprocessed };
		})();

		if (!changed) return false;

		this.#preprocessed = preprocessed;
		this.#value = value;

		// Properties must be updated after the value (preprocessed) is set
		this.#properties.update();
	}

	destroy() {
		super.destroy();
		this.#properties.destroy();
	}
}
