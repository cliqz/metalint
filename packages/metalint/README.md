# Metalint

The opinionated project linter from Cliqz. This projects aims at encouraging and
enforcing best practices across projects. It currently focuses on *mono
repositories* managed using `lerna` but will support normal repositories as well
in the future.

## Getting Started

1. [optional] install `@cliqz/metalint` as a development dependency in your project: `npm install --save-dev @cliqz/metalint`.
2. create a `.metalint.json` configuration file at the root: `echo '{}' > .metalint.json`
3. get linting! `npx metalint`

With this single command, `metalint` will identify the structure of your
project, load config, lint all sub-packages and auto-fix what it can. There is
currently *no way to change this behavior*; the project is still early stage.

## What can it do for you?

`metalint` can already do a few things for you.

* lint `package.json`:
    * make sure that namespaces are used consistently across packages
    * make sure that sub-package names are consistent with folder names
    * make sure mandatory fields are specified: `name`, `description`, `author`, etc.
    * make sure that fields have consistent values across packages: `author`, `contributors`, etc.
    * make sure dependencies used in multiple packages have the same version
      (including `dependencies`, `devDependencies` and `peerDependencies` fields)
    * normalize fields using [normalize-package-data](https://github.com/npm/normalize-package-data)
* lint `lerna.json`:
    * make sure `version` field is specified
    * make sure lerna is configured using `workspaces` with `yarn`
    * detect unknown fields (useful for typos)
* lint LICENSE files as well as notices in each source file (using specification
  in `.metalint.json`, see below)
* allow to define `package.json` fields in `.metalint.json` to keep them
  consistent across all sub-projects

Linting licenses and copyright notices. Specify the following configuration in `.metalint.json`:

```json
{
  "license": {
    "name": "MPL-2.0",
    "date": "2019",
    "owner": "Cliqz GmbH",
    "include": [
      "./packages/*/LICENSE",
      "./packages/*/jest.config.js",
      "./packages/*/rollup.config.js",
      "./packages/*/{src,test}/**/*.ts"
    ],
    "exclude": []
  }
}
```

Centralized fields for `package.json` in all workspaces:

```json
{
  "workspaces": {
    "pkg": {
      "author": "John Doe!"
    }
  }
}
```

Running `metalint` will apply changes across your project!
