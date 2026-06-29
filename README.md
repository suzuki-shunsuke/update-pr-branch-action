# update-pr-branch-action

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/suzuki-shunsuke/update-pr-branch-action)
[action.yaml](action.yaml)

`update-pr-branch-action` is a GitHub Action that updates a pull request branch when the head branch is too far behind the base branch, or when certain specified files are updated in the base branch.

![image](https://github.com/user-attachments/assets/0a8ed122-1ec9-4b3d-8737-9acdf5b1972c)

```yaml
---
name: test
on: pull_request
jobs:
  test:
    runs-on: ubuntu-24.04
    permissions:
      contents: read
    steps:
      - uses: suzuki-shunsuke/update-pr-branch-action@latest
        with:
          app_id: ${{ vars.APP_ID }}
          app_private_key: ${{ secrets.APP_PRIVATE_KEY }}
          max_behind_by: 100
          files: |
            foo/**
```

## Motivation

When a PR’s feature branch is outdated compared to the base branch, it can cause issues in CI.
However, enabling `Require branches to be up to date before merging` in branch rulesets can hurt developer productivity—especially in large monorepos.

This action automatically updates the head branch only when it is significantly behind the base branch, or when specific files in the base branch have been updated.
This keeps the head branch fresh while avoiding unnecessary updates.

One common use case is monorepos.
In monorepo CI workflows that run tasks such as automatic code formatting only for directories changed in a pull request, updating the branch when those directories have changed in the base branch helps prevent inconsistent or unexpected formatting results.

## Inputs / Outputs

See [action.yaml](action.yaml).

## How It Works

1. Get a pull request by GitHub API if the pull request number is specified
1. [Call GitHub's Compare Two Commits API](https://docs.github.com/en/rest/commits/commits#compare-two-commits)
   1. Compare the pull request base branch and head branch
1. If the head branch is too far behind the base branch or some of given files are updated in the base branch, update the pull request branch
1. If the branch is updated and the pull request number is the same as the context pull request number, fail the action

This action doesn't use `git`, and doesn't depend on the current working directory.
So you don't need to checkout the repository.

## :warning: Limitations

This action uses [the Compare Two Commits GitHub API](https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#compare-two-commits) to retrieve files changed between the base and head branches.
Due to limitations of this API, it can only return up to 300 files.

> The list of changed files is only shown on the first page of results, and it includes up to 300 changed files for the entire comparison.

As a result, if more than 300 files have changed, the branch may not be updated even if files matching the `files` input were actually modified.

If the input `update_if_300_files` is `true`, the action updates the branch if more than 300 files have changed.
If the input `files` is set, `update_if_300_files` is `true` by default.
Otherwise, `update_if_300_files` is `false` by default.

## Usage

All inputs are optional.
Either `max_behind_by` or `files` is required.

### 1. `max_behind_by: 0`: Enforce the branch is up-to-date.

```yaml
- uses: suzuki-shunsuke/update-pr-branch-action@latest
  with:
    # By default, ${{github.token}} is used to update branches.
    # The permission `contents:write` and `pull-requests:write` are required.
    max_behind_by: 0 # Enforce the branch is up-to-date
```

### 2. Update branch if files on `foo` are modified in the base branch.

Each line of the input `files` is a pattern of [minimatch](https://github.com/isaacs/minimatch).

```yaml
- uses: suzuki-shunsuke/update-pr-branch-action@latest
  with:
    github_token: ${{secrets.PERSONAL_ACCESS_TOKEN}} # Use a personal access token instead of ${{github.token}}
    files: |
      # this is comment
      foo/**
```

### 3. Use GitHub App installation access token

```yaml
- uses: suzuki-shunsuke/update-pr-branch-action@latest
  with:
    app_id: ${{vars.APP_ID}}
    app_private_key: ${{secrets.APP_PRIVATE_KEY}}
    max_behind_by: 100
    files: |
      *.json
```

### 4. Update Branch by csm-actions/update-branch-action

By default, this action updates a pull request branch by [GitHub's update a pull request branch API](https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#update-a-pull-request-branch).

But you can also update a branch securely using [csm-actions/update-branch-action](https://github.com/csm-actions/update-branch-action).

1. [Set up csm-actions/update-branch-action](https://github.com/csm-actions/update-branch-action)
1. Pass inputs

```yaml
- uses: suzuki-shunsuke/update-branch-action@latest
  with:
    files: |
      foo/**
    csm_server: csm-server
    csm_app_id: ${{ vars.CSM_APP_ID }}
    csm_app_private_key: ${{ secrets.CSM_APP_PRIVATE_KEY }}
```

## GitHub Access Tokens

- github_token
- default_github_token
- GitHub App (app_id, app_private_key)
- csm-actions (csm_app_id, csm_app_private_key)

### 1. Compare two Commits

- Permissions
  - `contents: read`
- Repositories
  - `GITHUB_REPOSITORY`

Priority:

1. github_token
1. GitHub App (app_id, app_private_key)
1. default_github_token

### 2. Update Branch

Update pull request branch API

- Permissions
  - `contents: write`
  - `pull_requests: write`
- Repositories
  - `GITHUB_REPOSITORY`

Update Branch by csm-actions/update-branch-action:

- Permissions
  - `issues: write`
- Repositories
  - `GITHUB_REPOSITORY`
  - `csm_server`

Priority:

1. csm-action/update-branch-action
1. github_token
1. GitHub App (app_id, app_private_key)
1. default_github_token

## Available versions

The main branch and feature branches don't work.
[Please see the document](https://github.com/suzuki-shunsuke/release-js-action/blob/main/docs/available_versions.md).
