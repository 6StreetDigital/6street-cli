# summary

Generates a package.xml manifest based on git changes made in a branch.

# description

Uses the Salesforce Git Delta package to help generate a package.xml manifest based on git changes made in a branch.

# examples

- <%= config.bin %> <%= command.id %>

# flags.ignore.summary

Ignores uncommitted changes to repository files when calculating the SGD diff

# flags.force.summary

Overwrites an existing package.xml in the output folder if it exists.

# flags.output-dir.summary

Selected output folder for the manifest file.

# flags.source.summary

Branch or commit we're comparing to for the diff. If this flag is omitted, this command will attempt to look through the git log and guess where this branch originated from - this may be unreliable.
