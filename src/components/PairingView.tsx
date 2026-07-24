"use client";

import { useState, useMemo } from "react";
import { buildPairFrequency, generateGroups } from "../../utils/groupings";
import { exportSessionPdf } from "../../utils/exportSessionPdf";
import { Family, GroupSession } from "../app/page";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface PairingViewProps {
  families: Family[];
  attendingIds: string[];
  sessions: GroupSession[];
  mostRecentSession: GroupSession | null;
  onSaveSession: (groups: string[][]) => void;
}

function formatDate(timestamp: number) {
  const d = new Date(timestamp);
  return d.toLocaleString();
}

export function PairingView({
  families,
  attendingIds,
  sessions,
  mostRecentSession,
  onSaveSession,
}: PairingViewProps) {
  const [groupSize, setGroupSize] = useState(3);
  const [currentGroups, setCurrentGroups] = useState<string[][]>([]);
  const [saveDisabled, setSaveDisabled] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const idToName = useMemo(() => {
    return Object.fromEntries(families.map((f) => [f.id, f.name]));
  }, [families]);

  const handleGenerateGroups = () => {
    if (families.length < 2) {
      setCurrentGroups([]);
      return;
    }

    const attendingFamilies = families.filter(f =>
      attendingIds.includes(f.id)
    );

    const frequency = buildPairFrequency(families, sessions);
    const groups = generateGroups(attendingFamilies, groupSize, frequency);
    setCurrentGroups(groups);
  };

  const handleSave = () => {
    if (currentGroups.length === 0 || saveDisabled) return;

    // Remove empty groups
    const cleaned = currentGroups.filter(g => g.length > 0);

    onSaveSession(cleaned);

    // Clear groups after saving
    setCurrentGroups([]);

    // Disable save button
    setSaveDisabled(true);

    // Show toast
    setShowToast(true);

    // Hide toast and re-enable button after 2 seconds
    setTimeout(() => {
      setShowToast(false);
      setSaveDisabled(false);
    }, 2000);
  };

  const handleExportSession = (session: GroupSession) =>
    exportSessionPdf({ session, familyNamesById: idToName });
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceGroupIndex = parseInt(source.droppableId.replace("group-", ""), 10);
    const destGroupIndex = parseInt(destination.droppableId.replace("group-", ""), 10);

    setCurrentGroups((prev) => {
      const groups = prev.map((g) => [...g]);

      const [moved] = groups[sourceGroupIndex].splice(source.index, 1);
      groups[destGroupIndex].splice(destination.index, 0, moved);

      // Remove any groups that are now empty
      return groups.filter(g => g.length > 0);
    });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[3fr,2fr]">
      {/* LEFT: current groups + controls */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold tracking-tight text-[#242c48]">
            Group Generator
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            {families.length} families loaded
          </span>
        </div>

        <p className="mb-5 max-w-3xl text-sm leading-6 text-slate-500">
          Choose a group size, then generate balanced groups using grouping
          history. Groups are built so people who have been together the least
          are grouped first. You can then drag names between groups to fine-tune
          them before saving.
        </p>

        {/* Controls row */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-end">
          {/* GROUP SIZE INPUT */}
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Group size
            <input
              type="number"
              min={2}
              value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-normal text-slate-900 outline-none focus:border-[#242c48] focus:ring-4 focus:ring-[#242c48]/10 sm:w-24"
            />
          </label>

          {/* GENERATE BUTTON */}
          <button
            type="button"
            onClick={handleGenerateGroups}
            disabled={families.length < 2}
            className="min-h-11 rounded-lg bg-[#242c48] px-5 font-semibold text-white shadow-sm transition hover:bg-[#192139] disabled:bg-slate-300"
          >
            Generate Groups
          </button>

          {/* SAVE BUTTON */}
          <button
            type="button"
            onClick={handleSave}
            disabled={currentGroups.length === 0 || saveDisabled}
            className="min-h-11 rounded-lg border border-[#242c48] bg-white px-5 font-semibold text-[#242c48] transition hover:bg-[#242c48]/5 disabled:border-slate-200 disabled:text-slate-300"
          >
            Save Around The Table List
          </button>
        </div>

        {/* GROUPS LIST WITH DRAG & DROP */}
        {currentGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
          <p className="text-sm text-slate-500">
            No groups yet. Enter a size and generate groups.
          </p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid gap-3 md:grid-cols-2">
              {currentGroups.map((group, groupIndex) => (
                <Droppable
                  key={groupIndex}
                  droppableId={`group-${groupIndex}`}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`rounded-xl border border-slate-200 bg-slate-50 p-3 transition ${
                        snapshot.isDraggingOver ? "border-[#242c48] bg-[#242c48]/5" : ""
                      }`}
                    >
                      <h3 className="mb-2 text-sm font-semibold text-[#242c48]">
                        Group {groupIndex + 1}
                      </h3>
                      <ul className="text-xs space-y-1">
                        {group.map((member, index) => (
                          <Draggable
                            key={`${member}-${index}`}
                            draggableId={`${member}-${groupIndex}-${index}`}
                            index={index}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <li
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={`flex min-h-10 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 transition ${
                                  dragSnapshot.isDragging
                                    ? "border-[#242c48] bg-white shadow-lg"
                                    : ""
                                }`}
                              >
                                <span>{idToName[member] ?? "(Unknown family)"}</span>
                                <span className="text-[10px] text-slate-400">
                                  drag
                                </span>
                              </li>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ul>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
        {currentGroups.length > 0 && (
          <button
            type="button"
            onClick={() =>
              setCurrentGroups((prev) => [...prev, []])
            }
            className="mt-4 min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            + Add New Group
          </button>
        )}
        {showToast && (
          <div className="
            fixed bottom-4 right-4
            bg-green-600 text-white
            px-4 py-2 rounded-md shadow-lg
            animate-fadeIn
          ">
            Session saved!
          </div>
        )}
      </section>

      {/* RIGHT: history */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm sm:p-6">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-[#242c48]">
          Around The Table History
        </h2>

        {sessions.length === 0 ? (
          <p className="text-sm text-slate-400">
            No saved groups yet.
          </p>
        ) : (
          <div className="max-h-[38rem] space-y-3 overflow-auto pr-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  {/* NEW PDF EXPORT BUTTON */}
                  <button
                    onClick={() => handleExportSession(s)}
                    className="min-h-8 rounded-lg bg-[#242c48] px-3 text-[10px] font-semibold text-white transition hover:bg-[#192139]"
                  >
                    Export to PDF
                  </button>
                  <span className="font-medium">
                  </span>
                  <span className="text-slate-500">
                    {formatDate(s.timestamp)}
                  </span>
                </div>

                {s.groups.map((group, i) => (
                  <div key={i} className="mb-2">
                    <span className="font-semibold">Group {i + 1}:</span>
                    <ul className="ml-3 text-[11px] space-y-1">
                      {group.map((familyId) => (
                        <li key={familyId}>
                          {idToName[familyId] ?? <span className="text-slate-500">(Unknown family)</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {mostRecentSession && (
          <p className="mt-3 text-[11px] text-slate-500">
            Latest Around The Table: {formatDate(mostRecentSession.timestamp)}
          </p>
        )}
      </section>
    </div>
  );
}
