import { createQuery, createSampleGraph } from "./fixtures.ts";
import test from "node:test";
import assert from "node:assert/strict";

type TestCase = {
  name: string;
  actual: () => unknown[];
  expected: unknown[];
};

const g = createSampleGraph();

const testCases: TestCase[] = [
  {
    name: "in().in().out().out().unique()",
    actual: () => createQuery(g, 4).in().in().out().out().unique().run(),
    expected: [7, 6, 5, 4],
  },
  {
    name: "in()",
    actual: () => createQuery(g, 4).in().run(),
    expected: [2],
  },
  {
    name: "in().in()",
    actual: () => createQuery(g, 4).in().in().run(),
    expected: [1],
  },
  {
    name: "in().in().out()",
    actual: () => createQuery(g, 4).in().in().out().run(),
    expected: [3, 2],
  },
  {
    name: "in().in().out().out().out()",
    actual: () => createQuery(g, 4).in().in().out().out().out().run(),
    expected: [15, 14, 13, 12, 11, 10, 9, 8],
  },
  {
    name: "in().out().in() (com repeticao)",
    actual: () => createQuery(g, 4).in().out().in().run(),
    expected: [2, 2],
  },
  {
    name: "in().out().in().unique()",
    actual: () => createQuery(g, 4).in().out().in().unique().run(),
    expected: [2],
  },
  {
    name: "property('_id')",
    actual: () => createQuery(g, 4).property("_id").run(),
    expected: [4],
  },
  {
    name: "in().property('_id')",
    actual: () => createQuery(g, 4).in().property("_id").run(),
    expected: [2],
  },
  {
    name: "out()",
    actual: () => createQuery(g, 4).out().run(),
    expected: [9, 8],
  },
  // === ALIAS ===
  {
    name: "parents()",
    actual: () => createQuery(g, 4).parents().run(),
    expected: [9, 8],
  },
  {
    name: "children()",
    actual: () => createQuery(g, 4).children().run(),
    expected: [2],
  },
  {
    name: "children().children().parents()",
    actual: () => createQuery(g, 4).children().children().parents().run(),
    expected: [3, 2],
  },
  {
    name: "children().in().parents().out().parents()",
    actual: () => createQuery(g, 4).children().in().parents().out().parents().run(),
    expected: [15, 14, 13, 12, 11, 10, 9, 8],
  },
];

for (const testCase of testCases) {
  test(testCase.name, () => {
    assert.deepStrictEqual(testCase.actual(), testCase.expected);
  });
}

console.log(g.jsonify());