import { Graph } from "./graph";
import { EdgeInput, NodeInput } from "./graph/contracts";
import { Dagoba } from "./type"

const Dagoba: Dagoba = {
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
  }
}

const N: NodeInput[] = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 ]
const E: EdgeInput[] = [ [1,2], [1,3],  [2,4],  [2,5],  [3,6],  [3,7],  [4,8]
    , [4,9], [5,10], [5,11], [6,12], [6,13], [7,14], [7,15] ]

const g = Dagoba.graph(N, E)

console.log(g)

const q = g.nodeQuery()
console.log(q)