import { Graph } from "./graph/index.ts";
import type { EdgeInput, NodeInput } from "./graph/contracts.ts";
import { Query } from "./query.ts";
import type { Gremlin, PipeArgs, State } from "./query.ts";
import type { LgDB as DbType } from "./type.ts";

const db: DbType = {
  version: "0.0.1",
  graph: function (n: NodeInput[], e: EdgeInput[]) {
    const graph = Graph.create(this.error);

    if (Array.isArray(n)) graph.addNodes(n);
    if (Array.isArray(e)) graph.addEdges(e);

    return graph;
  },
  error: function (msg: string) {
    console.error("[lgdb] " + msg);
    return false;
  },
};

export const N: NodeInput[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
export const E: EdgeInput[] = [
  [1, 2],
  [1, 3],
  [2, 4],
  [2, 5],
  [3, 6],
  [3, 7],
  [4, 8],
  [4, 9],
  [5, 10],
  [5, 11],
  [6, 12],
  [6, 13],
  [7, 14],
  [7, 15],
];

export function createSampleGraph() {
  return db.graph(N, E);
}

export function registerDefaultPipes(q: Query) {
  q.addPipetype("node", function(g: Graph, args: PipeArgs, gremlin: Gremlin, state: State) {
    if (!state.nodes)
      state.nodes = g.findNodes(args);

    if (!state.nodes.length) return "done";

    const node = state.nodes.pop();
    return Query.makeGremlin(node!, gremlin.state);
  })

  q.addPipetype('out', q.simpleTraversal('out'))
  q.addPipetype('in',  q.simpleTraversal('in'))

  q.addPipetype("property", function(_g, args, gremlin, _state) {
    if (!gremlin) return "pull";
    // args = [propertyName]
    const propertyName = args[0]
    if (typeof propertyName !== "string") return "pull";
    gremlin.result = gremlin.node[propertyName];
    return gremlin.result === null ? false : gremlin
  })

  q.addPipetype("unique", function(_g, _args, gremlin, state) {
    if (!gremlin) return "pull";
    const nodeId = typeof gremlin.node === "number" ? gremlin.node : gremlin.node._id; 
    if (state[nodeId]) return 'pull';
    state[nodeId] = true;
    return gremlin;
  })
}

export function createQuery(g: Graph, startNodeId: number) {
  const q = g.query(startNodeId);
  registerDefaultPipes(q);
  return q;
}
