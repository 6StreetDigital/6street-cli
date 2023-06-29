import { execSync } from 'child_process';
import fs from 'fs';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';
import chalk from 'chalk';
import { getCurrentBranch, isARepository } from '../../../shared/sourceControl';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@6street/6street-cli', 'release.validate.manifest');

export type ReleaseValidateManifestResult = {
  path: string;
  output: string;
};

export default class ReleaseValidateManifest extends SfCommand<ReleaseValidateManifestResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    force: Flags.boolean({
      summary: messages.getMessage('flags.force.summary'),
      char: 'f',
      required: false,
    }),
    'output-dir': Flags.directory({
      summary: messages.getMessage('flags.output-dir.summary'),
      char: 'd',
      default: './manifest',
    }),
    // @TODO: add support for source branch if needed?
    'target-org': Flags.string({
      summary: messages.getMessage('flags.target-org.summary'),
      char: 'o',
      required: true, // @TODO: make optional if we can detect the default org
    }),
  };

  public async run(): Promise<ReleaseValidateManifestResult> {
    const { flags } = await this.parse(ReleaseValidateManifest);
    const targetOrg = flags['target-org'];

    if (!isARepository()) {
      throw new SfError('This command must be run from within a git repository.');
    }

    const currentBranch = getCurrentBranch();

    let outputFolder = flags['output-dir'];
    if (outputFolder === './manifest') {
      const branchPath = currentBranch.split('/');
      outputFolder += '/' + branchPath[branchPath.length - 1];
    }
    const manifestPath = `${outputFolder}/package.xml`;

    if (!fs.existsSync(manifestPath) || flags.force) {
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
      }
      this.log(`Generating ${outputFolder}/package.xml ...`);
      try {
        execSync('sf release generate manifest --force', { stdio: 'inherit' }); // @TODO: make this configurable
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new SfError(`error generating package.xml: ${err.toString()}`);
        }
      }
    }

    this.log(chalk.blueBright('Validating deployment with a checkonly/dry-run...'));
    this.log(`Manifest: ${manifestPath}`);
    this.log(`Target Org: ${targetOrg}`);
    this.log(chalk.yellow.italic('Note: this may take some time to start if other deployments are queued'));
    try {
      execSync(
        `sf project deploy start --dry-run --ignore-conflicts -w 10 --manifest ${manifestPath} --target-org ${targetOrg}`,
        {
          stdio: 'inherit',
        }
      ); // @TODO: make this configurable

      this.log(
        chalk.greenBright(
          'Deployment validation succeeded.  Ensure you commit any changes to manifest files and include profile changes as necessary!'
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new SfError(`error in deployment: ${err.toString()}`);
      }
    }

    // Return an object to be displayed with --json
    return {
      path: __filename,
      output: outputFolder,
    };
  }
}
