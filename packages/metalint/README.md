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

## What can it do?

`metalint` can already do a few things for you.

* lint config files such as `package.json` and `lerna.json`
* check that configuration of multiple sub-packages are consistent
* lint LICENSE files as well as notices in each source file

For the later, you need to specify some configuration in `.metalint.json`, for
example:

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
