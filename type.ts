import type { EdgeInput, NodeInput } from "./graph/contracts.ts";
import type { Graph } from "./graph/index.ts";

export type LgDB = {
  version: string;
  graph: (n: NodeInput[], e: EdgeInput[]) => Graph;
  error: (msg: string) => boolean;
};
