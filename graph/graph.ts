import { PipeType, PipeTypeName, Query } from "../query";
import { Edge, EdgeInput, Node, NodeInput, Error, NodeData } from "./contracts";

const DEFAULT_ERROR: Error = (msg: string) => {
  console.error(msg);
  return false;
}

const FAUX_PIPETYPE: PipeType = function(_a, _b, maybe_gremlin) {
  return maybe_gremlin || "pull";
}

export class Graph {
  private _nodes: Node[];
  private _edges: Edge[];
  private _vertexIndex: Record<number, Node>;
  private _autoIncId: number;
  private _pipetypes: Record<string, PipeType> = {};
  private _queries: Record<string, Function> = {};
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

  node() {
    const q = Query.query(this);
    // TODO: não entendi esse porra voltar pra entender
    q.add("NODE", [].slice.call(arguments));
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

  findOutEdges(node: Node) {
    return node._out || [];
  }

  findInEdges(node: Node) {
    return node._in || [];
  }

  // TODO: não sei se isso aqui deveria estar na classe do grafo
  addPipetype(name: PipeTypeName, pipetype: PipeType) {
    this._pipetypes[name] = pipetype;
    this._queries[name] = function() {
      return this.add(name, [].slice.apply(arguments))
    };
  }

  getPipetype(name: PipeTypeName) {
    const pipetype = this._pipetypes[name];

    if (!pipetype) this.error('unknown pipetype ' + name);

    return pipetype || FAUX_PIPETYPE;
  }
}