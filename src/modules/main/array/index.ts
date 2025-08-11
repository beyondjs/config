import type { IDiagnostic, BranchesSpecType } from '../types';
import type { IFileListenerSpec } from '../property';
import { Property } from '../property';
import ArrayPropertyItems from './items';

export default class ArrayProperty extends Property {
	get dp() {
		return 'utils.config.property.array';
	}

	get is() {
		return 'array';
	}

	get errors(): IDiagnostic[] {
		return super.errors.concat(this.#items.errors);
	}

	#items: ArrayPropertyItems;
	get items() {
		return this.#items;
	}

	constructor(
		path: string,
		branches: BranchesSpecType,
		branch: string,
		parent: Property,
		watcher?: IFileListenerSpec
	) {
		super(path, branches, branch, parent, watcher);
		this.#items = new ArrayPropertyItems(this);
	}

	_process() {
		if (super._process() === false) return false;
		return this.#items.update();
	}

	destroy() {
		super.destroy();
		this.#items.destroy();
	}
}
