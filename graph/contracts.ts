export type Error = (msg: string) => boolean

export type NodeInput = number | Node;

export type Node = { 
  _id: number;
  _out?: Edge[];
  _in?: Edge[];
  [key: string]: unknown;
};

export type NodeData = Record<string, unknown>;

export type EdgeInput = [number, number] | Edge;

export type Edge = {
  _label?: string;
  _out?: NodeInput;
  _in?: NodeInput;
}
