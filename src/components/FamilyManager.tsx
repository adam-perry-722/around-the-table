"use client";

import { Family } from "../app/page";
import { useState } from "react";

interface FamilyManagerProps {
  families: Family[];
  onAddFamily: (name: string) => void;
  onRemoveFamily: (id: string) => void;
  onGeneratePairs: () => void;
}

export function FamilyManager({
  families,
  onAddFamily,
  onRemoveFamily,
  onGeneratePairs,
}: FamilyManagerProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFamily(input);
    setInput("");
  };

  return (
    <div className="grid gap-6 md:grid-cols-[2fr,3fr]">
      {/* Left: Add form */}
      <section className="rounded-xl border border-slate-800 bg-[#2A2A2A] p-4 md:p-5 shadow-sm">
        <h2 className="text-base md:text-lg font-semibold mb-3">
          Add families / people
        </h2>
        <p className="text-xs md:text-sm text-slate-400 mb-4">
          Add each family or person you want to include in groupings. You can
          use individual names or family names like &quot;Perry Family&quot;.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Perry Family"
              className="w-64 px-3 py-2 rounded-md bg-white text-black border border-slate-400 shadow-sm"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-md font-medium shadow-sm bg-green-600 text-white hover:bg-green-700 transition"
            >
              Add
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Tip: Avoid duplicates — the app blocks the same name twice.
          </p>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
          <h3 className="text-sm font-medium text-slate-200">
            Next: generate groups
          </h3>
          <button
            type="button"
            onClick={onGeneratePairs}
            disabled={families.length < 2}
            className="px-5 py-2 rounded-md font-medium shadow-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition"
          >
            Generate groups
          </button>
          {families.length < 2 && (
            <p className="text-[11px] text-slate-500">
              Add at least 2 families before generating groups.
            </p>
          )}
        </div>
      </section>

      {/* Right: List */}
      <section className="rounded-xl border border-slate-800 bg-[#2A2A2A] p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold">Family list</h2>
          <span className="text-xs text-slate-500">
            {families.length} {families.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        {families.length === 0 ? (
          <p className="text-sm text-slate-400">
            No families yet. Start by adding a few names on the left.
          </p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-auto pr-1">
            {families.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#2A2A2A] px-3 py-2 text-sm"
              >
                <span>{f.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveFamily(f.id)}
                  className="text-[11px] text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
