# Purpose

The purpose of this document is to provide a high-level overview of the internal architecture and implementation of the
`@beyond-js/config` package.

---

# 1. General Architecture

The `@beyond-js/config` package is designed to manage configurations in a hierarchical and dynamic manner. Its
architecture is built around a system of **nested dynamic processors**. Instead of loading a single static configuration
file, the system breaks down the configuration into individual properties. Each property is a `DynamicProcessor` that
can monitor its own dependencies (such as external configuration files) and update its value asynchronously and in
real-time.

When a nested property changes, only that specific property (and any processors dependent on it) is updated, which
avoids reloading the entire configuration and ensures optimal performance.

---

# 2. The Abstract `Property` Class

`Property` is the abstract base class for all configuration properties. It is not meant to be instantiated directly. Its
primary responsibilities include:

-   **Data Management (`#data` vs. `#value`)**: The `#data` property stores the raw input of the configuration, which
    can be an inline object or a string representing a file path. The `#value` property stores the final, processed
    value. If `#data` is a string, `Property` uses an instance of the `PropertyFile` class to read the file, and
    `#value` becomes the parsed file content.
-   **Processor Hierarchy**: It maintains a reference to its parent property (`#parent`) and resolves its own path
    (`#path`) based on the parent's path.
-   **Error Handling**: It holds arrays for storing errors (`#errors`) and warnings (`#warnings`) that occur during
    processing, and a `valid` property to check the configuration's state.

---

# 3. Specialized Classes: `Object` and `Array`

The `Object` and `Array` classes extend the base `Property` class to handle specific configuration data types.

-   **`Object` (`src/main/object/index.ts`)**: This class handles `object`-type configuration branches. It manages
    **nested properties** by initializing an instance of `Properties`. The `Properties` class then creates new
    `Property` instances (either `Object` or `Array`) for each nested branch defined in the branches specification. When
    the object's value changes, it iterates through its nested properties and updates their data, triggering a cascading
    processing cycle.
-   **`Array` (`src/main/array/index.ts`)**: This class specializes in managing `array`-type configuration branches. It
    contains an instance of the `Items` class, which is responsible for managing the elements of the array. Each element
    is also treated as a nested `Property`. When the array data changes, the `Items` class creates, updates, or destroys
    the corresponding nested properties for the array elements, allowing each item to be processed independently and
    dynamically.
