import * as fs from 'fs';
import { execSync } from 'child_process';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';

import sgd from 'sfdx-git-delta';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('6street-cli', 'release.generate.manifest');

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

    if (this.hasUncommittedChanges()) {
      throw new SfError('This folder has uncommitted changes - please commit before running this command.');
    }

    const currentBranch = this.getCurrentBranch();

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

    const fromCommit = flags.source ?? (await this.getSourceCommit(currentBranch));

    this.log(`Calculating difference between HEAD and branch/commit: ${fromCommit}...`);
    try {
      await sgd({
        to: 'HEAD', // commit sha to where the diff is done. [default : "HEAD"]
        from: fromCommit, // (required) commit sha from where the diff is done. [default : git rev-list --max-parents=0 HEAD]
        output: outputFolder, // source package specific output. [default : "./output"]
        //   apiVersion: 'latest', // salesforce API version. [default : latest]
        repo: '.', // git repository location. [default : "."]
        source: '.',
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new SfError(`error getting diff: ${err.toString()}`);
      }
    }
    this.log(`Manifest data written to ${outputFolder}.`);

    this.cleanupFiles(outputFolder);

    this.styledHeader('Processing complete.');
    this.log(`Manifest data is available in ${outputFolder}`);

    // @TODO: Handle the /profiles?
    // @TODO Output a .csv based on the package.xml for easy paste into the deployment doc?

    // Return an object to be displayed with --json
    return {
      path: 'E:\\Projects\\sfdx\\plugins\\6street-cli\\src\\commands\\release\\generate\\manifest.ts',
      output: outputFolder,
    };
  }

  private async getSourceCommit(currentBranch: string): Promise<string> {
    this.log(`Finding common ancestor commit for ${currentBranch}...`);

    const commands = [
      'git show-branch -a', //  Get git branch
      "grep '*'",
      `grep -v "${currentBranch}"`,
      'head -n1',
      "sed 's/.*\\[\\(.*\\)\\].*/\\1/'",
      "sed 's/[\\^~].*//'",
    ];

    let sourceBranch = execSync(commands.join(' | '), { stdio: [null, 'pipe', 'pipe'] })
      .toString()
      .trim();

    if (!sourceBranch) {
      this.log('No source branch was found or too many open branches...');
      const answers = await this.prompt<{ selectedBranch: string }>({
        type: 'input',
        name: 'selectedBranch',
        default: 'develop', // Default to 'develop' if we can't find the source branch
        message: 'Please enter the name of the branch you wish to compare the current branch against:',
      });
      this.log('Selected answer: ' + answers.selectedBranch);
      sourceBranch = answers.selectedBranch;
    }

    const sourceCommit = execSync(`git merge-base ${sourceBranch} ${currentBranch}`);
    return sourceCommit.toString().trim();
  }

  private hasUncommittedChanges(): boolean {
    this.styledHeader('Checking for uncommitted changes...');
    const matchingLines = execSync('git status --untracked-files=no --porcelain | wc -l').toString();
    return parseInt(matchingLines, 10) > 0;
  }

  private getCurrentBranch(): string {
    this.styledHeader('Determining current branch name...');
    try {
      const currentBranch = execSync('git symbolic-ref --short HEAD').toString().trim();
      this.log(`Current branch detected: ${currentBranch}`);
      return currentBranch;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new SfError(`error getting branch name: ${err.toString()}`);
      }
      throw new SfError('error getting branch name');
    }
  }

  private cleanupFiles(outputFolder: string): void {
    this.styledHeader(`Cleaning up ${outputFolder}...`);

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
      this.log('No destructive changes found. Suppressing output...');
      fs.rmSync(`${destructiveChangeFolder}`, { recursive: true });
    }
  }
}
