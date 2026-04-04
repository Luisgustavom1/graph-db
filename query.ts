import { Graph } from "./graph";

export type PipeType = "NODE" | "EDGE";
export type PipeArgs = unknown[];

export class Query {
  private _graph: Graph;
  private state: [] = [];
  private program: [PipeType, PipeArgs][] = [];
  private gremlins: [] = [];

  private constructor(graph: Graph) {
    this._graph = graph;
  }

  static query(graph: Graph) {
    return new Query(graph);
  }

  add(type: PipeType, args: PipeArgs) {
    this.program.push([type, args]);
    return this;
  }
}