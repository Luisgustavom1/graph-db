import { EdgeInput, NodeInput } from "./graph/contracts";
import { Graph } from "./graph";

export type Dagoba = {
  version: string;
  graph: (n: NodeInput[], e: EdgeInput[]) => Graph;
  error: (msg: string) => boolean;
};
