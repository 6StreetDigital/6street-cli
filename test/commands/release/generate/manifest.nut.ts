import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
// import { expect } from 'chai';

describe('release generate manifest NUTs', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create();
  });

  after(async () => {
    await session?.clean();
  });

  it('does not test anything meaningful yet', () => {
    const branch = 'develop';
    const command = `release generate manifest --source ${branch}`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    // expect(output).to.contain(name);
  });
});
