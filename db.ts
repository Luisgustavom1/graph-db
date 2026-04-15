import { createQuery, createSampleGraph } from "./fixtures.ts";

const g = createSampleGraph();

console.log(JSON.stringify(g, null, 2));

console.log(
  createQuery(g, 4).in().in().out().out().unique().run() // [7, 6, 5, 4]
);