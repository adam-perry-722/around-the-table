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
    <div className="grid gap-6 md:grid-cols-[2fr,3fr]">
      {/* Left: Add form */}
      <section className="rounded-xl border border-slate-800 bg-[#2A2A2A] p-4 md:p-5 shadow-sm">
        <h2 className="text-base md:text-lg font-semibold mb-3">
          Add families / people
        </h2>
        <p className="text-xs md:text-sm text-slate-400 mb-4">
          Add each family or person you want to include in groupings.
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
            Next: Participation
          </h3>
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
                <div className="flex items-center gap-3">
                  <button
                  type="button"
                  onClick={() => openEdit(f.id, f.name)}
                  className="rounded-md px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => openRemoveConfirm(f.id, f.name)}
                  className="text-[11px] text-red-400 hover:text-red-300"
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
            <div className="relative w-[92%] max-w-md rounded-xl border border-slate-700 bg-[#1f1f1f] p-5 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                Edit family name
              </h3>

              <p className="text-sm text-slate-400 mb-4">
                Update the name. History will stay linked because we store IDs.
              </p>

              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-md bg-white text-black px-3 py-2 border border-slate-400"
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
                  className="rounded-md px-4 py-2 text-sm bg-slate-600 text-white hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="rounded-md px-4 py-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700"
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
            <div className="relative w-[92%] max-w-md rounded-xl border border-slate-700 bg-[#1f1f1f] p-5 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-2">
                Remove family?
              </h3>

              <p className="text-sm text-slate-400 mb-4">
                Are you sure you want to remove{" "}
                <span className="text-white font-semibold">{removeName}</span>?
                <br />
                <span className="text-slate-500">
                  This will remove them from attendance selection, but saved history will remain.
                </span>
              </p>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeRemoveConfirm}
                  className="rounded-md px-4 py-2 text-sm bg-slate-600 text-white hover:bg-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmRemove}
                  className="rounded-md px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700"
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
