# summary

Validates a package.xml manifest against a target org

# description

Performs a dry-run against a target org for the current branch using a standard location for package.xml, generating the package using `release generate manifest` if it does not exist yet.

# examples

- <%= config.bin %> <%= command.id %>

# flags.force.summary

Overwrites an existing package.xml in the output folder if it exists.

# flags.output-dir.summary

Selected output folder for the manifest file.

# flags.target-org.summary

Selected target org to perform the validation against
