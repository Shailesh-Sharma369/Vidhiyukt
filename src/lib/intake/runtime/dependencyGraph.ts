import type { IntakeSchema } from '@/types';

type DependencyCondition = {
  questionId: string;
};

type DependencyRule = {
  dependsOn: string | readonly string[];
  conditions?: readonly DependencyCondition[];
};

function formatReferenceValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function validateSemanticKey(questionId: string, semanticKey: unknown): string {
  if (typeof semanticKey !== 'string' || semanticKey.trim().length === 0) {
    throw new Error(`Invalid semantic key for question "${questionId}": semantic key must be a non-empty string.`);
  }

  return semanticKey;
}

function toDependencyReferenceList(questionId: string, semanticKey: string, dependsOn: string | readonly string[]): string[] {
  if (typeof dependsOn === 'string') {
    return [dependsOn];
  }

  if (!isStringArray(dependsOn)) {
    throw new Error(`Invalid dependency reference for question "${questionId}" with semantic key "${semanticKey}": dependency reference must be a string or string array, received ${formatReferenceValue(dependsOn)}.`);
  }

  return [...dependsOn];
}

function createReferenceLookup(schema: IntakeSchema): Map<string, string> {
  const lookup = new Map<string, string>();
  const semanticKeyOwners = new Map<string, string>();

  for (const question of schema.questions) {
    const semanticKey = validateSemanticKey(question.id, question.semanticKey);
    const duplicateOwner = semanticKeyOwners.get(semanticKey);

    if (duplicateOwner) {
      throw new Error(`Duplicate semantic key "${semanticKey}" found on questions "${duplicateOwner}" and "${question.id}".`);
    }

    semanticKeyOwners.set(semanticKey, question.id);
    lookup.set(question.id, question.id);
    lookup.set(semanticKey, question.id);
  }

  return lookup;
}

function addEdge(graph: Map<string, Set<string>>, fromQuestionId: unknown, toQuestionId: string): void {
  if (typeof fromQuestionId !== 'string') {
    throw new Error('Invalid dependency source reference');
  }

  const sourceQuestionId = fromQuestionId;

  if (!graph.has(sourceQuestionId)) {
    graph.set(sourceQuestionId, new Set<string>());
  }

  graph.get(sourceQuestionId)?.add(toQuestionId);
}

function collectRuleReferences(questionId: string, semanticKey: string, rule: DependencyRule): string[] {
  const references = toDependencyReferenceList(questionId, semanticKey, rule.dependsOn);

  for (const condition of rule.conditions ?? []) {
    references.push(condition.questionId);
  }

  return references;
}

export function buildDependencyGraph(schema: IntakeSchema): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  const referenceLookup = createReferenceLookup(schema);

  for (const question of schema.questions) {
    graph.set(question.id, new Set());
  }

  for (const question of schema.questions) {
    const semanticKey = validateSemanticKey(question.id, question.semanticKey);

    for (const rule of question.conditionalRules ?? []) {
      for (const reference of collectRuleReferences(question.id, semanticKey, rule)) {
        const sourceQuestionId = referenceLookup.get(reference);

        if (!sourceQuestionId) {
          throw new Error(`Unknown dependency reference "${reference}" in question "${question.id}" with semantic key "${semanticKey}".`);
        }

        if (sourceQuestionId === question.id) {
          throw new Error(`Question "${question.id}" with semantic key "${semanticKey}" cannot depend on itself via dependency reference "${reference}".`);
        }

        addEdge(graph, sourceQuestionId, question.id);
      }
    }
  }

  detectCircularDependencies(graph);
  return graph;
}

export function getDependentQuestions(graph: Map<string, Set<string>>, questionId: string): string[] {
  return Array.from(graph.get(questionId) ?? []);
}

export function getDependencyChain(graph: Map<string, Set<string>>, questionId: string): string[] {
  const chain: string[] = [];
  const visited = new Set<string>([questionId]);
  const queue: string[] = [...getDependentQuestions(graph, questionId)];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);
    chain.push(current);

    for (const dependentId of getDependentQuestions(graph, current)) {
      if (!visited.has(dependentId)) {
        queue.push(dependentId);
      }
    }
  }

  return chain;
}

class CircularDependencyError extends Error {
  readonly cycles: string[][];

  constructor(cycles: string[][]) {
    super(`Circular intake dependencies detected: ${cycles.map((cycle) => cycle.join(' -> ')).join(' | ')}`);
    this.name = 'CircularDependencyError';
    this.cycles = cycles;
  }
}

export function detectCircularDependencies(graph: Map<string, Set<string>>): string[][] {
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];
  const cycles: string[][] = [];
  const seen = new Set<string>();

  const recordCycle = (cycle: string[]): void => {
    const signature = [...cycle].sort().join('::');

    if (seen.has(signature)) {
      return;
    }

    seen.add(signature);
    cycles.push(cycle);
  };

  const visit = (node: string): void => {
    if (stack.has(node)) {
      const cycleStartIndex = path.indexOf(node);
      if (cycleStartIndex >= 0) {
        recordCycle([...path.slice(cycleStartIndex), node]);
      }
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    stack.add(node);
    path.push(node);

    for (const dependentId of graph.get(node) ?? []) {
      visit(dependentId);
    }

    stack.delete(node);
    path.pop();
  };

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      visit(node);
    }
  }

  if (cycles.length > 0) {
    throw new CircularDependencyError(cycles);
  }

  return cycles;
}
