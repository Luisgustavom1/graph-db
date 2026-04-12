import { Edge, Graph, Node, NodeData } from "./graph";

export type PipeTypeName = "NODE" | "unique" | "property";
export type PipeArgs = string[];
export type PipeType = (graph: Graph, args: PipeArgs, gremlin: Gremlin, state: State) => string | Gremlin | boolean;
export type State = { nodes: Node[]; edges: Edge[]; gremlin: Gremlin, [k: number]: boolean };
export type Gremlin = { node: Node; state: State; result?: any; };

export class Query {
  private program: [PipeTypeName, PipeArgs][] = [];
  private _graph: Graph;
  // private state: State[] = [];
  // private gremlins: Gremlin[] = [];

  private constructor(graph: Graph) {
    this._graph = graph;
  }

  static query(graph: Graph) {
    return new Query(graph);
  }

  static gotoNode(gremlin: Gremlin, node: Node) {
    return Query.makeGremlin(node, gremlin.state);
  }

  static makeGremlin(node: Node, state: State): Gremlin {
    return { node, state };
  }

  add(type: PipeTypeName, args: PipeArgs) {
    this.program.push([type, args]);
    return this;
  }

  makeGremlin(node: any, state: any) {
    return { node, state };
  }

  simpleTraverse(dir: "out" | "in"): PipeType {
    const findMethod = dir === "out" ? "findOutEdges" : "findInEdges";
    const edgeList = dir === "out" ? "_in" : "_out";
    
    return function(g: Graph, args: PipeArgs, gremlin: Gremlin, state: State) {
      if (!gremlin && (!state.edges || !state.edges.length)) return "pull";

      if (!state.edges || !state.edges.length) {
        state.gremlin = gremlin;
        const edges: Edge[] = g[findMethod](gremlin.node);
        state.edges = g.filterEdges(edges, args[0]);
      }

      if (!state.edges.length) return "pull";

      const node = state.edges.pop()![edgeList];
      // TODO: re-evaluate this cast
      return Query.gotoNode(gremlin, node as Node);
    }
  }

  static objectFilter(thing: NodeData, filter: NodeData) {
    for (const k in filter) {
      if (thing[k] !== filter[k]) return false;
    }
    return true;
  }
}