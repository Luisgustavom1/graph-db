export interface GraphState {
  // _nodes: Node[];
  // _edges: Edge[];
  // _vertexIndex: Record<number, Node>;
  // _autoIncId: number;
  // error: Error;

  addNodes: (ns: NodeInput[]) => void;
  addEdges: (es: EdgeInput[]) => void;

  addNode: (v: NodeInput) => boolean | number;
  addEdge: (e: EdgeInput) => boolean;
  findNodeById: (id?: NodeInput) => Node | undefined;
} 

export type Error = (msg: string) => boolean

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