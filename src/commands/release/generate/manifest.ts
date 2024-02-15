import fs from 'node:fs';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';
import chalk from 'chalk';
import sgd from 'sfdx-git-delta';
import {
  getCurrentBranch,
  getSourceBranch,
  getSourceCommit,
  hasUncommittedChanges,
  isARepository,
} from '../../../shared/sourceControl';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@6street/6street-cli', 'release.generate.manifest');

export type ReleaseGenerateManifestResult = {
  path: string;
  output: string;
};

export default class ReleaseGenerateManifest extends SfCommand<ReleaseGenerateManifestResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    force: Flags.boolean({
      summary: messages.getMessage('flags.force.summary'),
      char: 'f',
      required: false,
    }),
    ignore: Flags.boolean({
      summary: messages.getMessage('flags.ignore.summary'),
      char: 'i',
      required: false,
    }),
    'output-dir': Flags.directory({
      summary: messages.getMessage('flags.output-dir.summary'),
      char: 'd',
      default: './manifest',
    }),
    source: Flags.string({
      summary: messages.getMessage('flags.source.summary'),
      char: 's',
    }),
  };

  public async run(): Promise<ReleaseGenerateManifestResult> {
    const { flags } = await this.parse(ReleaseGenerateManifest);

    this.log(chalk.blueBright('Analyzing current project branch and structure...'));

    if (!isARepository()) {
      throw new SfError('This command must be run from within a git repository.');
    }
    if (hasUncommittedChanges() && !flags.ignore) {
      throw new SfError('This project has uncommitted changes - please commit or stash before running this command.');
    }

    const currentBranch = getCurrentBranch();

    let outputFolder = flags['output-dir'];
    if (outputFolder === './manifest') {
      const branchPath = currentBranch.split('/');
      outputFolder += '/' + branchPath[branchPath.length - 1];
    }

    if (fs.existsSync(outputFolder) && !flags.force) {
      throw new SfError(`Directory already exists: ${outputFolder}. Use --force to overwrite.`);
    } else if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }

    const sourceBranch = flags.source ?? (await getSourceBranch(currentBranch));
    const fromCommit = getSourceCommit(sourceBranch, currentBranch);

    this.spinner.start(`Calculating difference between HEAD and branch/commit: ${fromCommit}...`);
    try {
      // Below commented lines are being reported as essential by TS but should have safe failover from SGD
      await sgd({
        to: 'HEAD', // commit sha to where the diff is done. [default : "HEAD"]
        from: fromCommit, // (required) commit sha from where the diff is done. [default : git rev-list --max-parents=0 HEAD]
        output: outputFolder, // source package specific output. [default : "./output"]
        repo: '.', // git repository location. [default : "."]
        source: '.',
        // apiVersion: 59.0, // salesforce API version. [default : latest]
        // ignore: '',
        // ignoreDestructive: '',
        // ignoreWhitespace: true,
        // generateDelta: false,
        // include: '',
        // includeDestructive: '',
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new SfError(`error getting diff: ${err.toString()}`);
      }
    }
    this.spinner.stop();

    this.cleanupFiles(outputFolder);
    this.log(chalk.greenBright(`Processing complete. Manifest data is available in ${outputFolder}`));

    // @TODO: Handle the /profiles?
    // @TODO Output a .csv based on the package.xml for easy paste into the deployment doc?

    // Return an object to be displayed with --json
    return {
      path: __filename,
      output: outputFolder,
    };
  }

  private cleanupFiles(outputFolder: string): void {
    this.log(`Cleaning up ${outputFolder}...`);

    const oldPackageFolder = outputFolder + '/package';
    const oldFile = oldPackageFolder + '/package.xml';
    const newFile = outputFolder + '/package.xml';

    // Clean up package.xml into the root of the outputFolder
    fs.renameSync(oldFile, newFile);
    fs.rmSync(oldPackageFolder, { recursive: true });

    // Also remove the entire destructiveChanges folder if we don't actually have anything
    const destructiveChangeFolder = outputFolder + '/destructiveChanges';
    const destructiveChangesFile = fs.readFileSync(`${destructiveChangeFolder}/destructiveChanges.xml`);
    if (!destructiveChangesFile.includes('<types>')) {
      this.log(chalk.dim('No destructive changes found - removing empty folder.'));
      fs.rmSync(`${destructiveChangeFolder}`, { recursive: true });
    }
  }
}
