import { Family, GroupSession } from "../src/app/page";

export function buildPairFrequency(
  families: Family[],
  sessions: GroupSession[]
) {
  const count: Record<string, Record<string, number>> = {};

  // Build initial zero matrix based on *current* families only
  const familyNames = families.map(f => f.name);

  for (const name of familyNames) {
    count[name] = {};
    for (const other of familyNames) {
      count[name][other] = 0;
    }
  }

  // Process past sessions safely
  for (const session of sessions) {
    for (const group of session.groups) {
      for (let i = 0; i < group.length; i++) {
        const a = group[i];
        if (!count[a]) continue; // family removed → skip

        for (let j = i + 1; j < group.length; j++) {
          const b = group[j];
          if (!count[b]) continue; // family removed → skip

          count[a][b] += 1;
          count[b][a] += 1;
        }
      }
    }
  }

  return count;
}

export function generateGroups(
  families: Family[],
  groupSize: number,
  pairFrequency: Record<string, Record<string, number>>
): string[][] {
  const names = families.map(f => f.name);
  const total = names.length;

  // ---------------------------------------------------------
  // 1️⃣ Calculate IDEAL group counts
  // ---------------------------------------------------------
  const baseGroupCount = Math.floor(total / groupSize); // Full groups
  const remainder = total % groupSize; // How many left over?

  const finalGroupCount =
    remainder === 0
      ? baseGroupCount
      : baseGroupCount + 1; // Need 1 extra group for leftovers

  const idealGroupSizes: number[] = [];

  // Fill group sizes evenly
  for (let i = 0; i < finalGroupCount; i++) {
    idealGroupSizes.push(groupSize);
  }

  // Distribute remaining members one-by-one into groups
  for (let i = 0; i < remainder; i++) {
    idealGroupSizes[i]++; // these become size+1
  }

  // Example:
  // 7 family total, groupSize=3 → ideal sizes = [4, 3]

  // ---------------------------------------------------------
  // 2️⃣ Build groups using your least-paired algorithm
  // ---------------------------------------------------------
  const remaining = [...names];
  const groups: string[][] = [];

 idealGroupSizes.forEach((size) => {
  if (remaining.length === 0) return; // <-- Defensive: nothing left to put in a group

  const group: string[] = [];

  // Pick a random start
  const first = remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0];
  if (!first) return; // <-- Defensive again
  group.push(first);

  while (group.length < size && remaining.length > 0) {
    let best: string | null = null;
    let bestScore = Infinity;

    for (const candidate of remaining) {
      let score = 0;

      for (const member of group) {
        score += pairFrequency[member]?.[candidate] ?? 0;
      }

      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    if (!best) break; // <-- Defensive
    remaining.splice(remaining.indexOf(best), 1);
    group.push(best);
  }

  if (group.length > 0) {
    groups.push(group); // <-- Only push if non-empty
  }
});

  return groups;
}

