import * as core from "@actions/core";
import * as github from "@actions/github";
import { Inputs } from "./input";

export type CommitFile = {
  filename: string;
  previous_filename?: string;
};

export type CompareResult = {
  files: CommitFile[];
  behindBy: number;
};

export const compareCommits = async (
  octokit: ReturnType<typeof github.getOctokit>,
  inputs: Inputs,
): Promise<CompareResult> => {
  // TODO pagination
  core.info(
    `compare two commits by GitHub API ${inputs.repoOwner}/${inputs.repoName} ${inputs.headBranch}...${inputs.baseBranch}`,
  );
  const { data: commits } = await octokit.rest.repos.compareCommits({
    owner: inputs.repoOwner,
    repo: inputs.repoName,

    // This is not a bug. Check if the base branch is updated
    base: inputs.headBranch,
    head: inputs.baseBranch,
  });
  return {
    files: commits.files ?? [],
    behindBy: commits.ahead_by, // This is not a bug.
  };
};
