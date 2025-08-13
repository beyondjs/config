export interface IDiagnostic {
	code: string;
	message: string;
}

export /*bundle*/ type BranchType = 'array' | 'object';

/**
 * A map that specifies the type of each configuration branch.
 * The key is the branch path (e.g., '/applications/children'), and the value is 'array' or 'object'.
 */
export /*bundle*/ type BranchesSpecType = { [branch: string]: BranchType };

/**
 * A configuration object, which can have any string keys with any values.
 * This type is used to represent inline configuration objects.
 */
export /*bundle*/ type PropertyObjectType = Record<string, any>;

/**
 * An item from a configuration array. Each item can be a file path (string)
 * or an inline configuration object (PropertyObjectType).
 */
export /*bundle*/ type PropertyArrayItemType = string | PropertyObjectType;

/**
 * An array of configuration items, where each item can be a string path or an object.
 * This type represents a configuration branch of type 'array'.
 */
export /*bundle*/ type PropertyArrayType = PropertyArrayItemType[];

/**
 * The raw data provided to a property. This can be a file path, an inline object,
 * or an array of items, each of which can be a path or an object.
 */
export /*bundle*/ type PropertyDataType = string | PropertyObjectType | PropertyArrayType;

/**
 * The processed value of the configuration after file parsing and data resolution.
 * This can be an object or an array of processed items.
 */
export /*bundle*/ type PropertyValueType = PropertyObjectType | PropertyArrayType;
