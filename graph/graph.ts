import { Query } from "./query.ts";
import type { Edge, EdgeInput, Node, NodeInput, Error, NodeData } from "./contracts.ts";

const DEFAULT_ERROR: Error = (msg: string) => {
  console.error(msg);
  return false;
}

export class Graph {
  private _nodes: Node[];
  private _edges: Edge[];
  private _vertexIndex: Record<number, Node>;
  private _autoIncId: number;
  readonly error: Error = DEFAULT_ERROR;

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

  filterEdges(edges: Edge[], filter: string[] | string) {
    return edges.filter((edge: Edge) => {
      if (!filter) return true;

      if (typeof filter === "string") return edge._label === filter;

      if (Array.isArray(filter))
        return filter.indexOf(edge._label || "") !== -1;

      return Query.objectFilter(edge, filter);
    });
  }

  get edges() {
    return this._edges;
  }

  get nodes() {
    return this._nodes;
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

  query() {
    const q = Query.query(this);
    q.add('node', [].slice.call(arguments));
    return q;
  }

  // g.v('Thor', 'Odin').run()
  // g.v({_id:'Thor'}).run()
  // g.v({species: 'Aesir'}).run()
  findNodes(args: (number | NodeData)[]): Node[] {
    if (typeof args[0] === "object") return this.searchNodes(args[0])
    else if (!args.length) return this.nodes.slice();
    else return this.findNodeByIds(args as number[]);
  }

  searchNodes(query: NodeData) {
    return this.nodes.filter(node => {
      return Query.objectFilter(node, query);
    })
  }

  findNodeByIds(ids: number[]) {
    if (ids.length === 1) {
      const maybeNode = this.findNodeById(ids[0]);
      return maybeNode ? [maybeNode] : [];
    }
    return ids.map(id => this.findNodeById(id)).filter(Boolean) as Node[];
  }

  findOutEdges(node: NodeInput) {
    const maybeNode = this.findNodeById(node);
    return maybeNode?._out || [];
  }

  findInEdges(node: NodeInput) {
    const maybeNode = this.findNodeById(node);
    return maybeNode?._in || [];
  }
}