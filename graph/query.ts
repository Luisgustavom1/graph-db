import type { Edge, Graph, Node, NodeData, NodeInput } from "./index.ts";
import { Transformers } from "./tranformers.ts";

export type PipeArgs = PipeArgsItem[];
export type PipeArgsItem = string | number
export type PipeTypeName = string;
export type State = { nodes?: Node[]; edges?: Edge[]; gremlin?: Gremlin, [k: number]: boolean };
export type PipeType = (graph: Graph, args: PipeArgs | undefined, gremlin: Gremlin | undefined, state: State) => Gremlin | "pull" | "done" | undefined;
export type Gremlin = { node: Node; state: State; result?: any; };
export type Program<T extends PipeTypeName> = [T, PipeArgs] | [T];

const FAUX_PIPETYPE: PipeType = function(_a, _b, maybe_gremlin) {
  return maybe_gremlin || "pull";
}

type PipetypeBase<T extends PipeTypeName = never> = Query<T> & {
  [x in T]: (...args: PipeArgs) => PipetypeBase<T>
};

export class Query<PipeTypes extends PipeTypeName = never>{
  private program: Program<PipeTypes>[] = [];
  private _graph: Graph;
  private state: State[] = [];
  private _pipeTypes: Record<PipeTypes, PipeType> = {} as Record<PipeTypes, PipeType>;
  private _transformers: Transformers = new Transformers();
  
  private constructor(graph: Graph) {
    this._graph = graph;
  }

  static query(graph: Graph) {
    return new Query(graph);
  }

  static gotoNode(gremlin: Gremlin | undefined, node: NodeInput) {
    return Query.makeGremlin(node, gremlin?.state);
  }

  static makeGremlin(node: NodeInput, state: State = {}): Gremlin {
    return { node: typeof node === "object" ? node : { _id: node }, state };
  }

  static objectFilter(thing: NodeData, filter: NodeData) {
    for (const k in filter) {
      if (thing[k] !== filter[k]) return false;
    }
    return true;
  }

  add<T extends PipeTypeName>(type: T, args: PipeArgs) {
    const tmp = this as PipetypeBase<PipeTypes | T>;
    tmp.program.push([type, args]);
    return tmp;
  }

  makeGremlin(node: any, state: any) {
    return { node, state };
  }

  simpleTraversal(dir: "out" | "in"): PipeType {
    const findMethod = dir === "out" ? "findOutEdges" : "findInEdges";
    const edgeList = dir === "out" ? "_in" : "_out";
    
    return (function(g, args = [], gremlin, state) {
      if (!state) return "pull";
      if (!gremlin && (!state.edges || !state.edges.length)) return "pull";

      if (gremlin) {
        state.gremlin = gremlin;
        const edges: Edge[] = g[findMethod](gremlin.node);
        state.edges = g.filterEdges(edges, args[0]);
      }
      
      const node = state.edges?.pop()![edgeList];
      if (!node) return "pull";
      return Query.gotoNode(gremlin, node);
    } as PipeType)
  }

  addPipetype<T extends PipeTypeName>(name: T, pipetype: PipeType) {
    const tmp = this as PipetypeBase<PipeTypes | T>;
    tmp._pipeTypes[name] = pipetype;
    tmp[name] = ((...args: PipeArgs) => {
      tmp.add(name, args);
      return tmp;
    }) as PipetypeBase<PipeTypes | T>[T];

    return tmp;
  }

  getPipetype(name: PipeTypes) {
    const pipetype = this._pipeTypes[name];

    if (!pipetype) this._graph.error('unknown pipetype ' + name);

    return pipetype || FAUX_PIPETYPE;
  }

  addAlias<T extends PipeTypeName>(alias: T, newProgram: Program<PipeTypes>[]) {
    const parsedProgram = newProgram.map(step => {
      return [step[0], step.slice(1)] as Program<PipeTypes>;
    })
    
    this._transformers.addTransformer((program) => {
      return program.reduce((acc, step) => {
        if (step[0] === alias) acc.push(...parsedProgram)
        else acc.push(step);
        
        return acc;
      }, [] as Program<PipeTypes | T>[])
    }, 100)

    return this.addPipetype(alias, function() {
      return "pull";
    });
  }

  extend(args: PipeArgs, defaults: string[]) {
    return Object.keys(defaults).reduce((acc, key) => {
      const index = parseInt(key);
      if (args[index] !== undefined) return acc;
      acc[index] = defaults[index];
      return acc;
    }, args);
  }

  run() {
    this.program = this._transformers.transform(this.program);

    const max = this.program.length - 1;
    let maybe_gremlin: Gremlin | undefined;
    let pc = max;
    const results: Gremlin[] = [];
    let done = -1;
    let step, state, pipetype: PipeType;

    while (done < max) {
      let ts = this.state;
      step = this.program[pc];
      ts[pc] = ts[pc] || {};
      state = ts[pc];

      const [pipename, pipeargs] = step;
      
      pipetype = this.getPipetype(pipename);
      let new_gremlin = pipetype(this._graph, pipeargs, maybe_gremlin, state as unknown as State);

      if (new_gremlin === "pull") {
        new_gremlin = undefined;
        if (pc - 1 > done) {
          pc--;
          maybe_gremlin = new_gremlin
          continue;
        } else {
          done = pc;
        }
      }

      if (new_gremlin === "done") {
        new_gremlin = undefined;
        done = pc;
      }

      pc++;
      if (pc > max) {
        if (new_gremlin) results.push(new_gremlin as Gremlin);
        new_gremlin = undefined;
        pc--;
      }

      maybe_gremlin = new_gremlin;
    }

    return results.map(gremlin => gremlin.result || gremlin.node);
  }
}