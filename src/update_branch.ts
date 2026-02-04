import * as core from "@actions/core";
import * as github from "@actions/github";
import { update as updateBranchAction } from "@csm-actions/update-branch-action";
import { Inputs } from "./input";

export const updateBranch = async (
  octokit: ReturnType<typeof github.getOctokit>,
  inputs: Inputs,
) => {
  if (inputs.csmAppPrivateKey) {
    await updateBranchAction({
      appID: inputs.csmAppID,
      appPrivateKey: inputs.csmAppPrivateKey,
      serverRepositoryName: inputs.csmServerRepoName,
      serverRepositoryOwner: inputs.csmServerRepoOwner,
      owner: inputs.repoOwner,
      repo: inputs.repoName,
      pullRequestNumber: inputs.prNumber,
    });
    return;
  }
  // update branch
  core.info("updating branch");
  await octokit.rest.pulls.updateBranch({
    owner: inputs.repoOwner,
    repo: inputs.repoName,
    pull_number: inputs.prNumber,
  });
};
