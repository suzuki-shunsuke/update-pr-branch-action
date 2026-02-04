import * as core from "@actions/core";
import { minimatch } from "minimatch";
import { CompareResult } from "./compare";

export const checkUpdated = (
  files: string[],
  compareResult: CompareResult,
  maxBehindBy: number,
): boolean => {
  if (maxBehindBy >= 0 && compareResult.behindBy > maxBehindBy) {
    // If maxBehindBy is negative, it means no limit is set
    core.info(
      `Branch is behind by ${compareResult.behindBy} commits (limit: ${maxBehindBy})`,
    );
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
