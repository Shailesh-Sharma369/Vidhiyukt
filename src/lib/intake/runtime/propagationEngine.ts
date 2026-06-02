import type { IntakeAnswerMap } from '@/types';

function valuesAreEqual(left: IntakeAnswerMap[string], right: IntakeAnswerMap[string]): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }

  return Object.is(left, right);
}

export function getAffectedQuestionsOnAnswerChange(
  dependencyGraph: ReadonlyMap<string, ReadonlySet<string>>,
  changedQuestionId: string,
  oldAnswers: IntakeAnswerMap,
  newAnswers: IntakeAnswerMap
): Set<string> {
  const previousValue = oldAnswers[changedQuestionId];
  const nextValue = newAnswers[changedQuestionId];

  if (valuesAreEqual(previousValue, nextValue)) {
    return new Set();
  }

  const affected = new Set<string>();
  const queue: string[] = [...(dependencyGraph.get(changedQuestionId) ?? [])];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || affected.has(current)) {
      continue;
    }

    affected.add(current);

    for (const dependentId of dependencyGraph.get(current) ?? []) {
      if (!affected.has(dependentId)) {
        queue.push(dependentId);
      }
    }
  }

  return affected;
}