import * as core from "@actions/core";
import { updatePRBranch } from "@suzuki-shunsuke/update-pr-branch";
import { getInputs } from "./input";

export const main = async () => {
  const inputs = getInputs();
  const result = await updatePRBranch(inputs);
  core.setOutput("updated", result.updated);
  if (inputs.prNumber === inputs.contextPRNumber) {
    core.setFailed("PR branch is updated");
  }
};
