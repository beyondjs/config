import type { BranchType, BranchesSpecType } from '../types';

export class BranchesSpec extends Map<string, BranchType> {
	constructor(branches: BranchesSpecType) {
		super();

		branches = branches ? branches : {};
		if (typeof branches !== 'object') throw new Error('Invalid parameters');
		branches[''] = branches[''] ? branches[''] : 'object';

		Object.entries(branches).forEach(([branch, type]) => {
			if (!['array', 'object'].includes(type))
				throw new Error(`Branch "${branch}" must be "array" or "object" but "${type}" was specified`);

			this.set(branch, type);
			type === 'array' && this.set(`${branch}/children`, 'object');
		});
	}
}
