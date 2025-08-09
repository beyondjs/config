import type { BranchesSpecType } from './types';
import type { IFileListenerSpec } from './property';
import ObjectProperty from './object';
import Collection from './collection';

export /*bundle*/ class Config extends ObjectProperty {
	constructor(rootPath: string, branches?: BranchesSpecType, watcher?: IFileListenerSpec) {
		// Paramters `branch` and `parent` are not used in the root property, so they are set to undefined.
		super(rootPath, branches, void 0, void 0, watcher);
	}
}

export /*bundle*/ const ConfigCollection = Collection;
