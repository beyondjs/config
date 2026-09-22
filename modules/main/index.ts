import type { BranchesSpecType } from './types';
import type { IFileListenerSpec } from './property';
import { ObjectProperty } from './object';
import { ConfigCollection as Collection } from './collection';

/**
 * The root of a configuration: a JSON document, given through `data` as the name of a file or inline,
 * resolved into reactive branches.
 *
 * Declared branches are properties of their own that follow their data, a file they name included, and the
 * watcher specification given here is passed down to every file-backed descendant.
 */
export /*bundle*/ class Config extends ObjectProperty {
	constructor(rootPath: string, branches?: BranchesSpecType, watcher?: IFileListenerSpec) {
		// Paramters `branch` and `parent` are not used in the root property, so they are set to undefined.
		super(rootPath, branches, void 0, void 0, watcher);
	}
}

/**
 * A collection of domain objects built from the items of an array branch, destroyed when they leave it
 */
export /*bundle*/ const ConfigCollection = Collection;
