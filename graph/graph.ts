import { Edge, EdgeInput, GraphState, Node, NodeInput, Error } from "./contracts";

const DEFAULT_ERROR: Error = (msg: string) => {
  console.error(msg);
  return false;
}

export class Graph implements GraphState {
  private _nodes: Node[];
  private _edges: Edge[];
  private _vertexIndex: Record<number, Node>;
  private _autoIncId: number;
  private readonly error: Error = DEFAULT_ERROR;

  private constructor(error?: Error) {
    this._nodes = [];
    this._edges = [];
    this._vertexIndex = {};
    this._autoIncId = 1;
    
    this.error = error || this.error;
  }

  static create(error?: Error) {
    return new Graph(error);
  }

  addNodes(ns: NodeInput[]) {
    for (const n of ns) {
      this.addNode(n);
    }
  }

  addEdges(es: EdgeInput[]) {
    for (const e of es) {
      this.addEdge(e);
    }
  }

  addNode(v: NodeInput) {
    const node = typeof v === 'number' ? { _id: v } : v;

    if (!node._id) node._id = this._autoIncId++;
    else if (this.findNodeById(node._id))
      return this.error('already exists node with _id ' + node._id);

    this._nodes.push(node);
    this._vertexIndex[node._id] = node;
    node._out = [];
    node._in = [];
    return node._id;
  }

  addEdge(e: EdgeInput) {
    const edge: Edge = Array.isArray(e) ? { _out: e[0], _in: e[1] } : e;
    const inNode = this.findNodeById(edge._in);
    const outNode = this.findNodeById(edge._out);

    if (!inNode || !outNode)
      return this.error('edge is not connected to two nodes');

    outNode._out?.push(edge);
    inNode._in?.push(edge);

    this._edges.push(edge);
    return true;
  }

  findNodeById(id?: NodeInput) {
    if (!id) return undefined;
    if (typeof id === 'number') return this._vertexIndex[id];
    return this._vertexIndex[id._id]
  }
}