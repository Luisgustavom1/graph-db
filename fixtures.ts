import { Graph } from "./graph/index.ts";
import type { EdgeInput, NodeInput } from "./graph/contracts.ts";
import { Query } from "./graph/query.ts";
import type { LgDB as DbType } from "./type.ts";

const db: DbType = {
  version: "0.0.1",
  graph: function (n: NodeInput[], e: EdgeInput[]) {
    const graph = Graph.create(this.error);

    graph.populate(n, e)

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

export function createQuery(g: Graph, startNodeId: number) {
  const q = g.query([startNodeId]);
  const qWithPipetype = q
    .addPipetype("node", function(g, args = [], gremlin, state) {
      if (!state.nodes)
        state.nodes = g.findNodes(args);

      if (!state.nodes.length) return "done";

      const node = state.nodes.pop();
      return Query.makeGremlin(node!, (typeof gremlin === "object") ? gremlin.state : {});
    })
    .addPipetype('out', q.simpleTraversal('out'))
    .addPipetype('in',  q.simpleTraversal('in'))
    .addPipetype("property", function(_g, args = [], gremlin, _state) {
      if (!gremlin || typeof gremlin !== "object") return "pull";
      // args = [propertyName]
      const propertyName = args[0];
      if (typeof propertyName !== "object") return "pull";
      gremlin.result = gremlin.node[propertyName];
      return gremlin.result === null ? false : gremlin
    })
    .addPipetype("unique", function(_g, _args, gremlin, state) {
      if (!gremlin || typeof gremlin !== "object") return "pull";
      const nodeId = Number(typeof gremlin.node !== "object" ? gremlin.node : gremlin.node._id); 
      if (state[nodeId]) return 'pull';
      state[nodeId] = true;
      return gremlin;
    })
    .addAlias("children", [["in"]])
    .addAlias("parents", [["out"]])
    
    // TODO: descomentar e testar
  // .addAlias('grandparents', [['out', ['parent']], ['out', ['parent']]])
  //   Dagoba.addAlias('siblings',     [ ['as', 'me'], ['out', 'parent']
  //                                 , ['in', 'parent'], ['except', 'me']])
  // Dagoba.addAlias('cousins',      [ ['out', 'parent'], ['as', 'folks']
  //                                 , ['out', 'parent'], ['in', 'parent']
  //                                 , ['except', 'folks'], ['in', 'parent']
  //                                 , ['unique']])
  // testar mas isso aqui não vai funcionar
  // Dagoba.addAlias('cousins',      [ 'parents', ['as', 'folks']
  //                                 , 'parents', 'children'
  //                                 , ['except', 'folks'], 'children', 'unique'])

  return qWithPipetype;
}
