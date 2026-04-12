import { Graph } from "./graph";
import { EdgeInput, NodeInput } from "./graph/contracts";
import { Gremlin, PipeArgs, Query, State } from "./query";
import { LgDB as db } from "./type"

const db: db = {
  version: '0.0.1',
  graph: function (n: NodeInput[], e: EdgeInput[]) {
    const graph = Graph.create(this.error);

    if (Array.isArray(n)) graph.addNodes(n);
    if (Array.isArray(e)) graph.addEdges(e); 

    return graph;
  },
  error: function (msg: string) {
    console.error("[dagoba] " + msg);
    return false;
  },
}

const N: NodeInput[] = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 ]
const E: EdgeInput[] = [ [1,2], [1,3],  [2,4],  [2,5],  [3,6],  [3,7],  [4,8]
    , [4,9], [5,10], [5,11], [6,12], [6,13], [7,14], [7,15] ]

const g = db.graph(N, E)

console.log(g)

const q = g.node()
console.log(q)

g.addPipetype("NODE", function(g: Graph, args: PipeArgs, gremlin: Gremlin, state: State) {
  if (!state.nodes)
    state.nodes = g.findNodes(args);

  if (!state.nodes.length) return "done";

  const node = state.nodes.pop();
  return Query.makeGremlin(node!, gremlin.state);
})

g.addPipetype("property", function(_g, args, gremlin, _state) {
  if (!gremlin) return "pull";
  // args = [propertyName]
  const propertyName = args[0]
  if (typeof propertyName !== "string") return "pull";
  gremlin.result = gremlin.node[propertyName];
  return gremlin.result === null ? false : gremlin
})

g.addPipetype("unique", function(_g, _args, gremlin, state) {
  if (!gremlin) return "pull";
  if (state[gremlin.node._id]) return 'pull';
  state[gremlin.node._id] = true;
  return gremlin;
})