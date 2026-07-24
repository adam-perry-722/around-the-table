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
    <section className="mx-auto max-w-4xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Step two
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-[#242c48] sm:text-2xl">
          Who’s participating this Around The Table?
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Select the families that are participating.
        </p>
        </div>
        <span className="w-fit rounded-full bg-[#242c48]/8 px-3 py-1.5 text-xs font-semibold text-[#242c48]">
          {attendingIds.length} of {families.length} selected
        </span>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search families…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#242c48] focus:ring-4 focus:ring-[#242c48]/10"
      />

      {/* Bulk actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={filteredFamilies.length === 0 || allFilteredSelected}
          className="min-h-10 rounded-lg bg-[#242c48] px-4 text-sm font-semibold text-white hover:bg-[#192139] disabled:opacity-40"
        >
          Select all
        </button>

        <button
          type="button"
          onClick={handleClearAll}
          disabled={filteredFamilies.length === 0}
          className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      {/* Family list */}
      <div className="grid max-h-[32rem] gap-2 overflow-auto pr-1 sm:grid-cols-2">
        {filteredFamilies.length === 0 ? (
          <p className="text-sm text-slate-400">No families found.</p>
        ) : (
          filteredFamilies.map((family) => (
            <label
              key={family.id}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                attendingIds.includes(family.id)
                  ? "border-[#242c48]/30 bg-[#242c48]/5 text-[#242c48]"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={attendingIds.includes(family.id)}
                onChange={() => onToggle(family.id)}
                className="h-5 w-5 shrink-0 accent-[#242c48]"
              />
              <span className="text-sm font-medium">{family.name}</span>
            </label>
          ))
        )}
      </div>
    </section>
  );
}
