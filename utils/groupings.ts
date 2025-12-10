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
  const remaining: string[] = families.map((f) => f.name);
  const groups: string[][] = [];

  while (remaining.length > 0) {
    const size =
      remaining.length <= groupSize * 1.5
        ? Math.ceil(remaining.length / Math.ceil(remaining.length / groupSize))
        : groupSize;

    const group: string[] = [];

    const firstIndex = Math.floor(Math.random() * remaining.length);
    const first = remaining.splice(firstIndex, 1)[0];
    group.push(first);

    while (group.length < size && remaining.length > 0) {
      let bestMatch: string | null = null;
      let bestScore = Infinity;

      for (const candidate of remaining) {
        let score = 0;
        for (const member of group) {
          score += pairFrequency[member][candidate] ?? 0;
        }
        if (score < bestScore) {
          bestScore = score;
          bestMatch = candidate;
        }
      }

      if (bestMatch !== null) {
        const index = remaining.indexOf(bestMatch);
        if (index !== -1) remaining.splice(index, 1);
        group.push(bestMatch);
      }
    }

    groups.push(group);
  }

  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i].length === 1) {
        const lone = groups[i][0];

        // Remove the 1-person group
        groups.splice(i, 1);

        let bestGroupIndex = 0;
        let bestScore = Infinity;

        // Choose the group with the *least pairing history* with this member
        for (let g = 0; g < groups.length; g++) {
        const group = groups[g];

        // Sum scores against all current group members
        let score = 0;
        for (const member of group) {
            score += pairFrequency[lone]?.[member] ?? 0;
        }

        if (score < bestScore) {
            bestScore = score;
            bestGroupIndex = g;
        }
        }

        // Place lone member into the best-fitting group
        groups[bestGroupIndex].push(lone);
    }
    }

  return groups;
}
