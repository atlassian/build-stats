/**
 * Allowed flags for the supported commands
 */
export interface FlagTypes {
  auth?: string;
  branch?: string;
  concurrency: number;
  json?: boolean;
  last?: number;
  period?: number;
  result?: string;
  since?: number;
  threshold?: number;
}

/**
 * Types for the main function args
 */
export interface MainTypes {
  cwd: string;
  repoSlug: Array<string>;
  command: string;
  flags?: FlagTypes;
}

export enum flagsEnum {
  auth = "auth",
  branch = "branch",
  concurrency = "concurrency",
  json = "json",
  last = "last",
  period = "period",
  result = "result",
  since = "since",
  threshold = "threshold",
}
