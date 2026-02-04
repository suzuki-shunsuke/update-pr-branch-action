import * as github from "@actions/github";
import { Inputs, getInputs } from "./input";

type PullRequest = {
  base: string;
  head: string;
};

export const getPullRequest = async (
  octokit: ReturnType<typeof github.getOctokit>,
  inputs: Inputs,
): Promise<PullRequest> => {
  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner: inputs.repoOwner,
    repo: inputs.repoName,
    pull_number: inputs.prNumber,
  });
  return {
    base: pullRequest.base.ref,
    head: pullRequest.head.ref,
  };
};
