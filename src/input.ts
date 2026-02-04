import * as core from "@actions/core";
import * as github from "@actions/github";
import { Inputs } from "@suzuki-shunsuke/update-pr-branch";

const filterFiles = (files: string[]): Set<string> => {
  return new Set(
    files
      .map((file) => file.trim())
      .filter((file) => file !== "" && !file.startsWith("#")),
  );
};

export const getInputs = (): Inputs => {
  const keyAppID = "app_id";
  const keyAppPrivateKey = "app_private_key";
  // CSM = Client/Server Model
  const keyCSMAppID = "csm_app_id";
  const keyCSMAppPrivateKey = "csm_app_private_key";

  const inputs: Inputs = {
    files: filterFiles(core.getMultilineInput("files")),
    repoOwner: github.context.repo.owner,
    repoName: core.getInput("repo") || github.context.repo.repo,
    prNumber: github.context.issue.number,
    githubToken: core.getInput("github_token"),
    defaultGitHubToken: core.getInput("default_github_token"),
    appID: core.getInput(keyAppID),
    appPrivateKey: core.getInput(keyAppPrivateKey),
    csmServerRepoOwner: github.context.repo.owner,
    csmServerRepoName: core.getInput("csm_server"),
    csmAppID: core.getInput(keyCSMAppID),
    csmAppPrivateKey: core.getInput(keyCSMAppPrivateKey),
    baseBranch: github.context.payload.pull_request?.base.ref || "",
    headBranch: github.context.payload.pull_request?.head.ref || "",
    maxBehindBy: -1,
    contextPRNumber: github.context.issue.number,
    updateIf300Files: false,
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
  if (inputs.csmAppPrivateKey && !inputs.csmAppID) {
    throw new Error(
      `${keyCSMAppID} is required when ${keyCSMAppPrivateKey} is provided`,
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
  if (inputs.csmServerRepoName.includes("/")) {
    inputs.csmServerRepoOwner = inputs.csmServerRepoName.split("/")[0];
    inputs.csmServerRepoName = inputs.csmServerRepoName.split("/")[1];
  }
  return inputs;
};
