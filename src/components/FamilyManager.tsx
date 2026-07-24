"use client";

import { Family } from "../app/page";
import { useState } from "react";

interface FamilyManagerProps {
  families: Family[];
  onAddFamily: (name: string) => void;
  onRemoveFamily: (id: string) => void;
  onGeneratePairs: () => void;
  onEditFamily: (id: string, newName: string) => void;
}

export function FamilyManager({
  families,
  onAddFamily,
  onRemoveFamily,
  onGeneratePairs,
  onEditFamily,
}: FamilyManagerProps) {
  const [input, setInput] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeName, setRemoveName] = useState("");


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFamily(input);
    setInput("");
  };

  const openEdit = (id: string, currentName: string) => {
  setEditId(id);
  setEditName(currentName);
  setIsEditOpen(true);
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditId(null);
    setEditName("");
  };

  const saveEdit = async () => {
    if (!editId) return;
    await onEditFamily(editId, editName);
    closeEdit();
  };

  const openRemoveConfirm = (id: string, name: string) => {
  setRemoveId(id);
  setRemoveName(name);
  setIsRemoveOpen(true);
};

const closeRemoveConfirm = () => {
  setIsRemoveOpen(false);
  setRemoveId(null);
  setRemoveName("");
};

const confirmRemove = async () => {
  if (!removeId) return;
  await onRemoveFamily(removeId);
  closeRemoveConfirm();
};

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(18rem,2fr),3fr]">
      {/* Left: Add form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm sm:p-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Step one
        </p>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-[#242c48]">
          Add families / people
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Perry Family"
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#242c48] focus:ring-4 focus:ring-[#242c48]/10"
            />
            <button
              type="submit"
              className="min-h-11 rounded-lg bg-[#242c48] px-5 font-semibold text-white shadow-sm transition hover:bg-[#192139]"
            >
              Add
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Tip: Avoid duplicates — the app blocks the same name twice.
          </p>
        </form>

        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-medium text-[#242c48]">
            Next: Participation
          </h3>
          {families.length < 2 && (
            <p className="text-[11px] text-slate-500">
              Add at least 2 families before generating groups.
            </p>
          )}
          <button
            type="button"
            onClick={onGeneratePairs}
            disabled={families.length < 2}
            className="min-h-11 w-full rounded-lg border border-[#242c48] px-4 text-sm font-semibold text-[#242c48] transition hover:bg-[#242c48] hover:text-white disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            Continue to participation
          </button>
        </div>
      </section>

      {/* Right: List */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold tracking-tight text-[#242c48]">Family list</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            {families.length} {families.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        {families.length === 0 ? (
          <p className="text-sm text-slate-400">
            No families yet. Start by adding a few names on the left.
          </p>
        ) : (
          <ul className="max-h-[30rem] space-y-2 overflow-auto pr-1">
            {families.map((f) => (
              <li
                key={f.id}
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition hover:border-slate-300 hover:bg-white"
              >
                <span>{f.name}</span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                  type="button"
                  onClick={() => openEdit(f.id, f.name)}
                  className="min-h-9 rounded-lg px-3 text-xs font-semibold text-[#242c48] transition hover:bg-[#242c48]/10"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => openRemoveConfirm(f.id, f.name)}
                  className="min-h-9 rounded-lg px-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Remove
                </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={closeEdit}
            />

            {/* modal */}
            <div className="relative w-[92%] max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
              <h3 className="mb-2 text-lg font-semibold text-[#242c48]">
                Edit family name
              </h3>

              <p className="mb-4 text-sm text-slate-500">
                Update the name. History will stay linked because we store IDs.
              </p>

              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-[#242c48] focus:ring-4 focus:ring-[#242c48]/10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") closeEdit();
                }}
              />

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="min-h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="min-h-10 rounded-lg bg-[#242c48] px-4 text-sm font-semibold text-white hover:bg-[#192139]"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        {isRemoveOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={closeRemoveConfirm}
            />

            {/* modal */}
            <div className="relative w-[92%] max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
              <h3 className="mb-2 text-lg font-semibold text-[#242c48]">
                Remove family?
              </h3>

              <p className="mb-4 text-sm text-slate-500">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-slate-900">{removeName}</span>?
                <br />
                <span className="text-slate-500">
                  This would also remove them from the history. You would want to do this if the family is no longer attending our congregation.
                </span>
              </p>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeRemoveConfirm}
                  className="min-h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmRemove}
                  className="min-h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Yes, remove
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
