import type { Edge, Graph, Node, NodeData, NodeInput } from "./index.ts";
import { Transformers } from "./tranformers.ts";

export type PipeArgs = (string | number)[];
export type PipeTypeName = string;
export type PipeType = (graph: Graph, args: PipeArgs | undefined, gremlin: FullGremlin, state: State) => FullGremlin;
export type State = { nodes?: Node[]; edges?: Edge[]; gremlin?: Gremlin, [k: number]: boolean };
export type Gremlin = { node: NodeInput; state: State; result?: any; };
export type FullGremlin = Gremlin | boolean | string;
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

  static gotoNode(gremlin: Gremlin, node: NodeInput) {
    return Query.makeGremlin(node, gremlin.state);
  }

  static makeGremlin(node: NodeInput, state: State = {}): Gremlin {
    return { node, state };
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
      if (!gremlin || typeof gremlin !== "object") return "pull";

      if (!state.edges || !state.edges.length) {
        state.gremlin = gremlin;
        const edges: Edge[] = g[findMethod](gremlin.node);
        state.edges = g.filterEdges(edges, args);
      }

      if (!state.edges.length) return "pull";
      
      const node = state.edges.pop()![edgeList];
      if (!node) return "pull";
      // TODO: re-evaluate this cast
      return Query.gotoNode(gremlin as Gremlin, node);
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
    let maybe_gremlin: FullGremlin = false;
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
      maybe_gremlin = pipetype(this._graph, pipeargs, maybe_gremlin, state as unknown as State);

      if (maybe_gremlin === "pull") {
        maybe_gremlin = false;
        if (pc - 1 > done) {
          pc--;
          continue;
        } else {
          done = pc;
        }
      }

      if (maybe_gremlin === "done") {
        maybe_gremlin = false;
        done = pc;
      }

      pc++;
      if (pc > max) {
        if (maybe_gremlin && typeof maybe_gremlin === "object") results.push(maybe_gremlin);
        maybe_gremlin = false;
        pc--;
      }
    }

    return results.map(gremlin => gremlin.result || gremlin.node);
  }
}