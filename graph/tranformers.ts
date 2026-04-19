import type { Program } from "./query.ts";

export type Transformer = {
  fn: (program: Program[]) => Program[];
  priority: number;
}

export class Transformers {
  private _transformers: Transformer[] = [];

  constructor () {}

  addTransformer(fn: Transformer['fn'], priority: number) {
    let i = 0;
    for (; i < this._transformers.length; i++) {
      if (priority > this._transformers[i].priority) break;
    }

    this._transformers.splice(i, 0, { fn, priority });
  }

  transform(program: Program[]) {
    return this._transformers.reduce((acc, transformer) => {
      return transformer.fn(acc);
    }, program);
  }
}