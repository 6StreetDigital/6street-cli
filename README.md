# 6street-cli

[![NPM](https://img.shields.io/npm/v/6street-cli.svg?label=6street-cli)](https://www.npmjs.com/package/@6street/6street-cli)
[![Downloads/week](https://img.shields.io/npm/dw/6street-cli.svg)](https://npmjs.org/package/6street-cli)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/6street-cli/main/LICENSE.txt)
[![Known Vulnerabilities](https://snyk.io/test/github/6street/6street-cli/badge.svg)](https://snyk.io/test/github/6street/6street-cli)

## Install

```bash
sf plugins install @6street/6street-cli@x.y.z
```

## Issues

Please report any issues at https://github.com/6street/6street-cli/issues

## Contributing

1. Please read Salesforce's [Code of Conduct](CODE_OF_CONDUCT.md)
2. Create a new issue before starting your project so that we can keep track of
   what you are trying to add/fix. That way, we can also offer suggestions or
   let you know if there is already an effort in progress.
3. Fork this repository.
4. [Build the plugin locally](#build)
5. Create a _topic_ branch in your fork. Note, this step is recommended but technically not required if contributing using a fork.
6. Edit the code in your fork.
7. Write appropriate tests for your changes. Try to achieve at least 95% code coverage on any new code. No pull request will be accepted without unit tests.
8. Send us a pull request when you are done. We'll review your code, suggest any needed changes, and merge it in.

### Build

To build the plugin locally, make sure to have yarn installed and run the following commands:

```bash
# Clone the repository
git clone git@github.com:6street/6street-cli

# Install the dependencies and compile
yarn && yarn build
```

To use your plugin, run using the local `./bin/dev` or `./bin/dev.cmd` file.

```bash
# Run using local run file.
./bin/dev release generate manifest
```

There should be no differences when running via the Salesforce CLI or using the local run file. However, it can be useful to link the plugin to do some additional testing or run your commands from anywhere on your machine.

```bash
# Link your plugin to the sf cli
sf plugins link .
# To verify
sf plugins
```

## Commands

<!-- commands -->

- [`sf release generate manifest`](#sf-release-generate-manifest)

## `sf release generate manifest`

Generates a package.xml manifest based on git changes made in a branch.

```
USAGE
  $ sf release generate manifest [--json] [-f] [-d <value>] [-s <value>]

FLAGS
  -d, --output-dir=<value>  [default: ./manifest] Selected output folder for the manifest file.
  -f, --force               Overwrites an existing package.xml in the output folder if it exists.
  -s, --source=<value>      Branch or commit we're comparing to for the diff.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Generates a package.xml manifest based on git changes made in a branch.

  Uses the Salesforce Git Delta package to help generate a package.xml manifest based on git changes made in a branch.

EXAMPLES
  $ sf release generate manifest
```

<!-- commandsstop -->
