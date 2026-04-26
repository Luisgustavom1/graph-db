import { createQuery, createSampleGraph } from "./fixtures.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { Graph } from "./graph/graph.ts";

type TestCase = {
  name: string;
  actual: () => unknown[];
  expected: unknown[];
};

const g = createSampleGraph();

const testCases: TestCase[] = [
  {
    name: "in()",
    actual: () => createQuery(g, 4).in().run(),
    expected: [{ _id: 2 }],
  },
  {
    name: "in().in()",
    actual: () => createQuery(g, 4).in().in().run(),
    expected: [{ _id: 1 }],
  },
  {
    name: "in().in().out().out().unique()",
    actual: () => createQuery(g, 4).in().in().out().out().unique().run(),
    expected: [{ _id: 7 }, { _id: 6 }, { _id: 5 }, { _id: 4 }],
  },
  {
    name: "in().in().out()",
    actual: () => createQuery(g, 4).in().in().out().run(),
    expected: [{ _id: 3 }, { _id: 2 }],
  },
  {
    name: "in().in().out().out().out()",
    actual: () => createQuery(g, 4).in().in().out().out().out().run(),
    expected: [{ _id: 15 }, { _id: 14 }, { _id: 13 }, { _id: 12 }, { _id: 11 }, { _id: 10 }, { _id: 9 }, { _id: 8 }],
  },
  {
    name: "in().out().in() (com repeticao)",
    actual: () => createQuery(g, 4).in().out().in().run(),
    expected: [{ _id: 2 }, { _id: 2 }],
  },
  {
    name: "in().out().in().unique()",
    actual: () => createQuery(g, 4).in().out().in().unique().run(),
    expected: [{ _id: 2 }],
  },
  {
    name: "property('_id')",
    actual: () => createQuery(g, 4).property("_id").run(),
    expected: [4],
  },
  {
    name: "property('_in')",
    actual: () => createQuery(g, 4).property("_in").run(),
    expected: [
     [ { _in: 4, _out: 2 }]
    ],
  },
  {
    name: "property('nonExistent')",
    actual: () => createQuery(g, 4).property("nonExistent").run(),
    expected: [],
  },
  {
    name: "in().property('_id')",
    actual: () => createQuery(g, 4).in().property("_id").run(),
    expected: [2],
  },
  {
    name: "out()",
    actual: () => createQuery(g, 4).out().run(),
    expected: [{ _id: 9 }, { _id: 8 }],
  },
  // === ALIAS ===
  {
    name: "parents()",
    actual: () => createQuery(g, 4).parents().run(),
    expected: [{ _id: 9 }, { _id: 8 }],
  },
  {
    name: "children()",
    actual: () => createQuery(g, 4).children().run(),
    expected: [{ _id: 2 }],
  },
  {
    name: "children().children().parents()",
    actual: () => createQuery(g, 4).children().children().parents().run(),
    expected: [{ _id: 3 }, { _id: 2 }],
  },
  {
    name: "children().in().parents().out().parents()",
    actual: () => createQuery(g, 4).children().in().parents().out().parents().run(),
    expected: [{ _id: 15 }, { _id: 14 }, { _id: 13 }, { _id: 12 }, { _id: 11 }, { _id: 10 }, { _id: 9 }, { _id: 8 }],
  },
];

for (const testCase of testCases) {
  test(testCase.name, () => {
    assert.deepStrictEqual(testCase.actual(), testCase.expected);
  });
}

test("fromString", async () => {
  const fromString = Graph.fromString(g.toString())

  await test("::nodes", () => {
    assert.deepStrictEqual(g.nodes, fromString.nodes)
  })

  await test("::edges", () => {
    assert.deepStrictEqual(g.edges, fromString.edges)
  })
})
