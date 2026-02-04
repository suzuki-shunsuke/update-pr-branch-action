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
  core.info(
    `compare two commits by GitHub API ${inputs.repoOwner}/${inputs.repoName} ${inputs.headBranch}...${inputs.baseBranch}`,
  );
  // compare two commits API returns commits and files.
  // The API supports pagination, but this is for commits, not files.
  // All files are returned in the first page.
  // Note that only 300 files can be fetched by this API.
  const { data: commits } = await octokit.rest.repos.compareCommitsWithBasehead(
    {
      owner: inputs.repoOwner,
      repo: inputs.repoName,
      // This is not a bug. Check if the base branch is updated
      basehead: `${inputs.headBranch}...${inputs.baseBranch}`,
    },
  );
  return {
    files: commits.files ?? [],
    behindBy: commits.ahead_by, // This is not a bug.
  };
};
