import * as core from "@actions/core";
import * as github from "@actions/github";
import * as githubAppToken from "@suzuki-shunsuke/github-app-token";
import { minimatch } from "minimatch";
import { update as updateBranchAction } from "@csm-actions/update-branch-action";

type Inputs = {
  files: Set<string>;
  repoOwner: string;
  repoName: string;
  prNumber: number;
  maxBehindBy: number;
  githubToken: string;
  defaultGitHubToken: string;
  appID: string;
  appPrivateKey: string;
  securefixActionServerRepoOwner: string;
  securefixActionServerRepoName: string;
  securefixAppID: string;
  securefixAppPrivateKey: string;
  baseBranch: string;
  headBranch: string;
};

const getInputs = (): Inputs => {
  const keyAppID = "app_id";
  const keyAppPrivateKey = "app_private_key";
  const keySecurefixAppID = "securefix_app_id";
  const keySecurefixAppPrivateKey = "securefix_app_private_key";

  const inputs: Inputs = {
    files: filterFiles(core.getMultilineInput("files")),
    repoOwner: github.context.repo.owner,
    repoName: core.getInput("repo") || github.context.repo.repo,
    prNumber: github.context.issue.number,
    githubToken: core.getInput("github_token"),
    defaultGitHubToken: core.getInput("default_github_token"),
    appID: core.getInput(keyAppID),
    appPrivateKey: core.getInput(keyAppPrivateKey),
    securefixActionServerRepoOwner: github.context.repo.owner,
    securefixActionServerRepoName: core.getInput("securefix_action_server"),
    securefixAppID: core.getInput(keySecurefixAppID),
    securefixAppPrivateKey: core.getInput(keySecurefixAppPrivateKey),
    baseBranch: github.context.payload.pull_request?.base.ref || "",
    headBranch: github.context.payload.pull_request?.head.ref || "",
    maxBehindBy: 0,
  };
  const maxBehindBy = core.getInput("max_behind_by");
  if (inputs.files.size === 0 && maxBehindBy === "") {
    throw new Error("Either files or max_behind_by is required");
  }
  if (maxBehindBy) {
    inputs.maxBehindBy = parseInt(maxBehindBy);
  }

  if (inputs.appPrivateKey && !inputs.appID) {
    throw new Error(
      `${keyAppID} is required when ${keyAppPrivateKey} is provided`,
    );
  }
  if (inputs.securefixAppPrivateKey && !inputs.securefixAppID) {
    throw new Error(
      `${keySecurefixAppID} is required when ${keySecurefixAppPrivateKey} is provided`,
    );
  }

  // Set the default values
  if (inputs.repoName.includes("/")) {
    inputs.repoOwner = inputs.repoName.split("/")[0];
    inputs.repoName = inputs.repoName.split("/")[1];
  }
  const prNumber = core.getInput("pr_number");
  if (prNumber) {
    inputs.prNumber = parseInt(prNumber);
  }
  if (!inputs.prNumber) {
    throw new Error(
      "failed to get pr number. The action is not triggered by a pull request and the input pr_number is missing.",
    );
  }
  if (inputs.securefixActionServerRepoName.includes("/")) {
    inputs.securefixActionServerRepoOwner =
      inputs.securefixActionServerRepoName.split("/")[0];
    inputs.securefixActionServerRepoName =
      inputs.securefixActionServerRepoName.split("/")[1];
  }
  return inputs;
};

const filterFiles = (files: string[]): Set<string> => {
  return new Set(
    files
      .map((file) => file.trim())
      .filter((file) => file !== "" && !file.startsWith("#")),
  );
};

const tokens: githubAppToken.Token[] = [];

export const main = async () => {
  try {
    const inputs = getInputs();
    await run(inputs);
  } finally {
    for (const token of tokens) {
      if (githubAppToken.hasExpired(token.expiresAt)) {
        continue;
      }
      await githubAppToken.revoke(token.token);
    }
  }
};

type CompareResult = {
  files: CommitFile[];
  behindBy: number;
};

const compareCommits = async (
  octokit: ReturnType<typeof github.getOctokit>,
  inputs: Inputs,
): Promise<CompareResult> => {
  // TODO pagination
  const { data: commits } = await octokit.rest.repos.compareCommits({
    owner: inputs.repoOwner,
    repo: inputs.repoName,

    // This is not a bug. Check if the base branch is updated
    base: inputs.headBranch,
    head: inputs.baseBranch,
  });
  return {
    files: commits.files ?? [],
    behindBy: commits.behind_by,
  };
};

type PullRequest = {
  base: string;
  head: string;
};

const getPullRequest = async (
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
        // TODO
        getPR: inputs.baseBranch === "",
        updateBranch: inputs.securefixAppPrivateKey === "",
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
    return;
  }
  await updateBranch(octokit, inputs);
};

const updateBranch = async (
  octokit: ReturnType<typeof github.getOctokit>,
  inputs: Inputs,
) => {
  if (inputs.securefixAppPrivateKey) {
    await updateBranchAction({
      appID: inputs.securefixAppID,
      appPrivateKey: inputs.securefixAppPrivateKey,
      serverRepositoryName: inputs.securefixActionServerRepoName,
      serverRepositoryOwner: inputs.securefixActionServerRepoOwner,
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

type CommitFile = {
  filename: string;
  previous_filename?: string;
};

const checkUpdated = (
  files: string[],
  compareResult: CompareResult,
  maxBehindBy: number,
): boolean => {
  if (compareResult.behindBy > maxBehindBy) {
    core.info(`Branch is behind by ${compareResult.behindBy} commits`);
    return true;
  }
  for (const commitFile of compareResult.files ?? []) {
    for (const file of files) {
      if (minimatch(commitFile.filename, file)) {
        core.info(`${commitFile.filename} is updated`);
        return true;
      }
      if (
        commitFile.previous_filename &&
        minimatch(commitFile.previous_filename, file)
      ) {
        core.info(`${commitFile.previous_filename} is updated`);
        return true;
      }
    }
  }
  return false;
};

type tokenInput = {
  repo: {
    owner: string;
    repo: string;
  };
  githubToken: string;
  defaultGitHubToken: string;
  app: {
    id: string;
    privateKey: string;
  };
  actions: {
    getPR: boolean;
    updateBranch: boolean;
  };
};

const getToken = async (inputs: tokenInput): Promise<string> => {
  if (inputs.githubToken) {
    return inputs.githubToken;
  }
  if (!inputs.app.privateKey) {
    return inputs.defaultGitHubToken;
  }
  const permissions: githubAppToken.Permissions = {
    contents: "read", // compare two commits
  };
  if (inputs.actions.getPR) {
    permissions.pull_requests = "read"; // get pull request
  }
  if (inputs.actions.updateBranch) {
    // update branch
    permissions.contents = "write";
    permissions.pull_requests = "write";
  }
  core.info(
    `creating a GitHub App token: ${JSON.stringify({
      owner: inputs.repo.owner,
      repositories: [inputs.repo.repo],
      permissions: permissions,
    })}`,
  );
  const appToken = await githubAppToken.create({
    appId: inputs.app.id,
    privateKey: inputs.app.privateKey,
    owner: inputs.repo.owner,
    repositories: [inputs.repo.repo],
    permissions: permissions,
  });
  core.setSecret(appToken.token);
  tokens.push(appToken);
  return appToken.token;
};
