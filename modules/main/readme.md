# Configuration module

This directory implements the public `@beyond-js/config/main` module. Config specializes ObjectProperty at the root; ConfigCollection adapts an array branch into a directory-keyed collection of domain objects.

The [architecture guide](../../docs/architecture.md) describes public types, branch/path processing, asynchronous dependencies and current update limitations. Property, ObjectProperty, ArrayProperty and their collections are internal collaborators, not separate public module paths.
