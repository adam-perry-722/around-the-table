import { Family, GroupSession } from "../src/app/page";

export function buildPairFrequency(
  families: Family[],
  sessions: GroupSession[]
): Record<string, Record<string, number>> {
  const count: Record<string, Record<string, number>> = {};

  const familyIds = families.map(f => f.id);

  // Initialize zero matrix
  for (const id of familyIds) {
    count[id] = {};
    for (const otherId of familyIds) {
      count[id][otherId] = 0;
    }
  }

  // Process historical sessions
  for (const session of sessions) {
    for (const group of session.groups) {
      for (let i = 0; i < group.length; i++) {
        const a = group[i];
        if (!count[a]) continue;

        for (let j = i + 1; j < group.length; j++) {
          const b = group[j];
          if (!count[b]) continue;

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
  // Use IDs internally (NOT names)
  const ids = families.map(f => f.id);
  const total = ids.length;

  // ---------------------------------------------------------
  // 1️⃣ Calculate IDEAL group sizes
  // ---------------------------------------------------------
  const baseGroupCount = Math.floor(total / groupSize);
  const remainder = total % groupSize;

  const finalGroupCount =
    remainder === 0 ? baseGroupCount : baseGroupCount + 1;

  const idealGroupSizes: number[] = [];

  for (let i = 0; i < finalGroupCount; i++) {
    idealGroupSizes.push(groupSize);
  }

  for (let i = 0; i < remainder; i++) {
    idealGroupSizes[i]++;
  }

  // ---------------------------------------------------------
  // 2️⃣ Build groups using least-paired logic (BY ID)
  // ---------------------------------------------------------
  const remaining = [...ids];
  const groups: string[][] = [];

  idealGroupSizes.forEach(size => {
    if (remaining.length === 0) return;

    const group: string[] = [];

    // Random starting member
    const first = remaining.splice(
      Math.floor(Math.random() * remaining.length),
      1
    )[0];

    if (!first) return;
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

      if (!best) break;

      remaining.splice(remaining.indexOf(best), 1);
      group.push(best);
    }

    if (group.length > 0) {
      groups.push(group);
    }
  });
  return groups;
}

