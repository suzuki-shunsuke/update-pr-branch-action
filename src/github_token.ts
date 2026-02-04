import * as core from "@actions/core";
import * as githubAppToken from "@suzuki-shunsuke/github-app-token";

const tokens: githubAppToken.Token[] = [];

export const revoke = async (): Promise<void> => {
  for (const token of tokens) {
    if (githubAppToken.hasExpired(token.expiresAt)) {
      core.info("skip revoking GitHub App token as it has already expired");
      continue;
    }
    core.info("revoking GitHub App token");
    await githubAppToken.revoke(token.token);
  }
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

export const getToken = async (inputs: tokenInput): Promise<string> => {
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
