export type Dagoba = {
  version: string;
  G: Graph;
  graph: (n: NodeInput[], e: EdgeInput[]) => Graph;
  error: (msg: string) => boolean;
};

export type Graph = {
  nodes: Node[];
  edges: Edge[];
  vertexIndex: Record<number, Node>;
  autoIncId: number;

  addNodes: (ns: NodeInput[]) => void;
  addEdges: (es: EdgeInput[]) => void;

  addNode: (v: NodeInput) => boolean | number;
  addEdge: (e: EdgeInput) => boolean;
  findNodeById: (id?: NodeInput) => Node | undefined;
} 

export type NodeInput = number | Node;

export type Node = { 
  _id: number;
  _out?: Edge[];
  _in?: Edge[];
}

export type EdgeInput = [number, number] | Edge;

export type Edge = {
  _out?: NodeInput;
  _in?: NodeInput;
}