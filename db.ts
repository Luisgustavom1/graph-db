import { Dagoba, Edge, EdgeInput, Graph, Node, NodeInput } from "./type"

const Dagoba: Dagoba = {
  version: '0.0.1',
  G: {} as Graph,
  graph: function (n: NodeInput[], e: EdgeInput[]) {
    const graph: Graph = Object.create(Dagoba.G)
    
    graph.edges = [];
    graph.nodes = [];
    graph.vertexIndex = {}; // _id -> node (lookup table)

    graph.autoIncId = 1

    if (Array.isArray(n)) graph.addNodes(n);
    if (Array.isArray(e)) graph.addEdges(e); 

    return graph;
  },
  error: function (msg: string) {
    console.error(msg);
    return false;
  }
}

Dagoba.G.addNodes = function(ns: NodeInput[]) {
  for (const n of ns) {
    this.addNode(n);
  }
}

Dagoba.G.addEdges = function(es: EdgeInput[]) {
  for (const e of es) {
    this.addEdge(e);
  }
}

Dagoba.G.addNode = function(v: NodeInput) {
  v = typeof v === 'number' ? { _id: v } : v;

  if (!v._id) v._id = this.autoIncId++;
  else if (this.findNodeById(v._id))
    return Dagoba.error('already exists node with _id ' + v._id);

  this.nodes.push(v);
  this.vertexIndex[v._id] = v;
  v._out = []; v._in = [];
  return v._id;
}

Dagoba.G.addEdge = function(e: EdgeInput) {
  e = Array.isArray(e) ? { _out: e[0], _in: e[1] } : e;

  e._in = this.findNodeById(e._in)
  e._out = this.findNodeById(e._out)

  if (!e._in || !e._out)
    return Dagoba.error('edge is not connected to two nodes');

  e._out._out?.push(e);
  e._in._in?.push(e)

  this.edges.push(e);
  return true;
}

Dagoba.G.findNodeById = function(id?: NodeInput) {
  if (!id) return undefined;
  if (typeof id === 'number') return this.vertexIndex[id];
  return this.vertexIndex[id._id]
}

const N: NodeInput[] = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 ]
const E: EdgeInput[] = [ [1,2], [1,3],  [2,4],  [2,5],  [3,6],  [3,7],  [4,8]
    , [4,9], [5,10], [5,11], [6,12], [6,13], [7,14], [7,15] ]

const g = Dagoba.graph(N, E)

console.log(g)