import { execSync } from 'node:child_process';
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
  const answers = await ux.prompter.prompt<{ selectedBranch: string }>({
    type: 'input',
    name: 'selectedBranch',
    default: 'develop', // Default to 'develop' if we can't find the source branch
    message: `Please enter the name of the branch you wish to compare branch ${currentBranch} against:`,
  });
  ux.log(`Selected answer: ${answers.selectedBranch}`);
  return answers.selectedBranch;
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
        'There are uncommitted changes in your repository, but they appear to be outside of the project source folder. Ignoring...',
      ),
    );
    ux.log(chalk.dim(currentStatus));
  }
  return false;
}

export function isARepository(): boolean {
  return execSync('git rev-parse --is-inside-work-tree').toString().trim() === 'true';
}
