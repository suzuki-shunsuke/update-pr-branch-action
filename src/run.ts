import * as core from "@actions/core";
import * as github from "@actions/github";
import * as githubAppToken from "@suzuki-shunsuke/github-app-token";
import { Inputs, getInputs } from "./input";
import { compareCommits } from "./compare";
import { updateBranch } from "./update_branch";
import { getToken, revoke } from "./github_token";
import { getPullRequest } from "./get_pr";
import { checkUpdated } from "./check";

export const main = async () => {
  try {
    const inputs = getInputs();
    await run(inputs);
  } finally {
    await revoke();
  }
};

const run = async (inputs: Inputs) => {
  const octokit = github.getOctokit(
    await getToken({
      repo: {
        owner: inputs.repoOwner,
        repo: inputs.repoName,
      },
      githubToken: inputs.githubToken,
      defaultGitHubToken: inputs.defaultGitHubToken,
      app: {
        id: inputs.appID,
        privateKey: inputs.appPrivateKey,
      },
      actions: {
        getPR: inputs.baseBranch === "",
        updateBranch: inputs.csmAppPrivateKey === "",
      },
    }),
  );
  if (inputs.baseBranch) {
    const pr = await getPullRequest(octokit, inputs);
    inputs.baseBranch = pr.base;
    inputs.headBranch = pr.head;
  }
  const compareResult = await compareCommits(octokit, inputs);
  if (!checkUpdated([...inputs.files], compareResult, inputs.maxBehindBy)) {
    core.info("skip updating branch");
    core.setOutput("updated", false);
    return;
  }
  await updateBranch(octokit, inputs);
  core.setOutput("updated", true);
  if (inputs.prNumber === inputs.contextPRNumber) {
    core.setFailed("PR branch is updated");
  }
};
