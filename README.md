# update-pr-branch-action

[action.yaml](action.yaml)

`update-branch-action` is a GitHub Action that updates a pull request branch when the head branch is too far behind the base branch, or when certain specified files are updated in the base branch.

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
      - uses: suzuki-shunsuke/update-branch-action@latest
        with:
          files: |
            foo/**
          app_id: ${{ vars.APP_ID }}
          app_private_key: ${{ secrets.APP_PRIVATE_KEY }}
```

## Inputs / Outputs

See [action.yaml](action.yaml).

## Hot It Works

1. [Call GitHub's Compare Two Commits API](https://docs.github.com/en/rest/commits/commits#compare-two-commits)
   1. Compare the pull request base branch and head branch
1. If some of given files are updated in the base branch, update the pull request branch

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

## Update Branch by csm-actions/update-branch-action

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
