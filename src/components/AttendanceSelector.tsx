"use client";

import { useMemo, useState } from "react";
import { Family } from "../app/page";

interface Props {
  families: Family[];
  attendingIds: string[];
  onToggle: (id: string) => void;
  onSetMany?: (ids: string[], checked: boolean) => void;
}

export function AttendanceSelector({
  families,
  attendingIds,
  onToggle,
  onSetMany,
}: Props) {
  const [search, setSearch] = useState("");

  // Filter families by search text
  const filteredFamilies = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return families;

    return families.filter(f =>
      f.name.toLowerCase().includes(q)
    );
  }, [families, search]);

  const allFilteredSelected =
    filteredFamilies.length > 0 &&
    filteredFamilies.every(f => attendingIds.includes(f.id));

  const handleSelectAll = () => {
    if (!onSetMany) return;
    onSetMany(filteredFamilies.map(f => f.id), true);
  };

  const handleClearAll = () => {
    if (!onSetMany) return;
    onSetMany(filteredFamilies.map(f => f.id), false);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#2A2A2A] p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          Who’s participating this Around The Table?
        </h2>
        <p className="text-sm text-slate-400">
          Select the families that are participating.
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search families…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="
          w-full px-3 py-2 rounded-md
          bg-white text-black
          border border-slate-400
        "
      />

      {/* Bulk actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={filteredFamilies.length === 0 || allFilteredSelected}
          className="px-3 py-1.5 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
        >
          Select all
        </button>

        <button
          type="button"
          onClick={handleClearAll}
          disabled={filteredFamilies.length === 0}
          className="px-3 py-1.5 rounded-md text-sm bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      {/* Family list */}
      <div className="space-y-2 max-h-72 overflow-auto pr-1">
        {filteredFamilies.length === 0 ? (
          <p className="text-sm text-slate-400">No families found.</p>
        ) : (
          filteredFamilies.map((family) => (
            <label
              key={family.id}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={attendingIds.includes(family.id)}
                onChange={() => onToggle(family.id)}
                className="h-4 w-4 accent-blue-500"
              />
              <span className="text-white">{family.name}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}