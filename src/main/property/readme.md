# Property

# Overview

The `Property` class is the abstract base of the `@beyond-js/config` package. It extends `DynamicProcessor` to provide a
dynamic and reactive way to manage configuration data. Its main purpose is to encapsulate the logic for resolving the
value of a configuration branch, whether the data is defined inline, in an external file, or within a hierarchical
structure.

---

# Key Concepts

## `#data` vs. `#value`

The distinction between `#data` and `#value` is fundamental to understanding the `Property` class.

-   `#data`: Stores the **raw data input** of the property. It can be an object, a string representing a file path, or
    `undefined`.
-   `#value`: Stores the **processed value** of the property. If `#data` is a string, `Property` uses the `PropertyFile`
    class to read and parse the file, and the parsed content becomes `#value`. If `#data` is already an object, `#value`
    is simply that object.

This approach allows the class to transparently handle both inline and modular, file-based configurations.

## Dynamic Processing

`Property` is a `DynamicProcessor`, which means its value is resolved asynchronously. It reacts to changes in its
dependencies (e.g., if the configuration file changes) and automatically updates its value, eliminating the need for
manual reloading.

---

# Class Properties

-   `#parent`: A reference to the parent property in the configuration hierarchy.
-   `#branches`: A map that defines the expected types (`'array'` or `'object'`) for the configuration branches, managed
    by the `BranchesSpec` class.
-   `#errors`: An array of `IErrorType` errors that occur during configuration processing.
-   `#warnings`: An array of warnings, similar to `#errors`.
-   `#file`: An instance of `PropertyFile` used when `#data` is a string to manage the configuration file.
-   `#rootPath`: The root configuration path, only defined for the top-level property.
-   `#path`: The full path of the current property, derived from the parent or the root path.

---

# Key Methods

-   **`constructor(rootPath, branches, branch, parent)`**: Creates a new `Property` instance and sets up its
    parent-child relationship, configuration branch, and specifications.
-   **`set data(value)`**: Sets the raw data of the property. This method manages the file path and triggers a new
    processing cycle via the `_invalidate()` method.
-   **`_begin()`**: Part of the `DynamicProcessor` lifecycle. It ensures the parent processor is ready before starting
    to process the current property.
-   **`_prepared()`**: Manages the `PropertyFile` instance, creating or destroying it as needed based on the data type.
-   **`_process()`**: Contains the main logic for processing configuration data, updating `#value` and `#errors` based
    on whether `#data` is an object, a string, or `undefined`.

---

# Subclasses

`Property` serves as the base class for handling different types of configuration data. It is extended to create more
specialized classes:

-   **`object/index.ts`**: The `Config` class (or `object` in the file) extends `Property` to handle `object`-type
    configuration branches.
-   **`array/index.ts`**: The `array` class extends `Property` to handle `array`-type configuration branches.
