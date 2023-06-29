import { execSync } from 'child_process';
import { SfError } from '@salesforce/core';
import { Ux } from '@salesforce/sf-plugins-core';
import chalk from 'chalk';

const ux = new Ux();

export function getCurrentBranch(): string {
  ux.spinner.start('Determining current branch');
  try {
    const currentBranch = execSync('git symbolic-ref --short HEAD').toString().trim();
    ux.spinner.stop(`${currentBranch}`);
    return currentBranch;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new SfError(`error getting branch name: ${err.toString()}`);
    }
    throw new SfError('error getting branch name');
  }
}

export async function getSourceBranch(currentBranch: string): Promise<string> {
  ux.spinner.start(`Finding source branch for ${currentBranch}...`);
  const commands = [
    'git show-branch -a', //  Get git branch
    "grep '*'",
    `grep -v "${currentBranch}"`,
    'head -n1',
    "sed 's/.*\\[\\(.*\\)\\].*/\\1/'",
    "sed 's/[\\^~].*//'",
  ];

  let selectedBranch: string;
  try {
    selectedBranch = execSync(commands.join(' | '), { stdio: [null, 'pipe', 'pipe'] })
      .toString()
      .trim();
    if (!selectedBranch) throw new Error('No source branch found');
  } catch (err: unknown) {
    ux.spinner.stop(chalk.yellow('No source branch was found or too many open branches...'));
    const answers = await ux.prompter.prompt<{ selectedBranch: string }>({
      type: 'input',
      name: 'selectedBranch',
      default: 'develop', // Default to 'develop' if we can't find the source branch
      message: 'Please enter the name of the branch you wish to compare the current branch against:',
    });
    ux.log(`Selected answer: ${answers.selectedBranch}`);
    selectedBranch = answers.selectedBranch;
  }
  return selectedBranch;
}

export function getSourceCommit(sourceBranch: string, currentBranch: string): string {
  ux.log(`Finding common ancestor commit for ${currentBranch}...`);
  const sourceCommit = execSync(`git merge-base ${sourceBranch} ${currentBranch}`);
  return sourceCommit.toString().trim();
}

export function hasUncommittedChanges(): boolean {
  const currentStatus = execSync('git status --untracked-files=no --porcelain').toString().trim();
  // @TODO: support other source folders besides force-app
  if (currentStatus.length > 0 && currentStatus.split('\n').length > 0 && currentStatus.includes('force-app')) {
    ux.log(chalk.red("There are uncommitted changes in your repository's project source folder:"));
    ux.log(currentStatus);
    return true;
  } else if (currentStatus.length > 0 && currentStatus.split('\n').length > 0 && !currentStatus.includes('force-app')) {
    ux.log(
      chalk.dim(
        'There are uncommitted changes in your repository, but they appear to be outside of the project source folder. Ignoring...'
      )
    );
    ux.log(chalk.dim(currentStatus));
  }
  return false;
}

export function isARepository(): boolean {
  return execSync('git rev-parse --is-inside-work-tree').toString().trim() === 'true';
}
