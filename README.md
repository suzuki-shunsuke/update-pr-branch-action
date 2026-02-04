# update-pr-branch-action

[![Ask DeepWiki](https://img.shields.io/badge/Ask_DeepWiki-000000.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==)](https://deepwiki.com/suzuki-shunsuke/update-pr-branch-action) [action.yaml](action.yaml)

`update-pr-branch-action` is a GitHub Action that updates a pull request branch when the head branch is too far behind the base branch, or when certain specified files are updated in the base branch.

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

## Hot It Works

1. Get a pull request by GitHub API if the pull request number is specified
1. [Call GitHub's Compare Two Commits API](https://docs.github.com/en/rest/commits/commits#compare-two-commits)
   1. Compare the pull request base branch and head branch
1. If the head branch is too far behind the base branch or some of given files are updated in the base branch, update the pull request branch
1. If the branch is updated and the pull request number is the same as the context pull request number, fail the action

This action doesn't use `git`, and doesn't depend on the current working directory.
So you don't need to checkout the repository.

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

## Available versions

The main branch and feature branches don't work.
[Please see the document](https://github.com/suzuki-shunsuke/release-js-action/blob/main/docs/available_versions.md).
