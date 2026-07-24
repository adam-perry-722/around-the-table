"use client";

import { useState, useMemo } from "react";
import { buildPairFrequency, generateGroups } from "../../utils/groupings";
import { Family, GroupSession } from "../app/page";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface PairingViewProps {
  families: Family[];
  historicalFamilies: Family[];
  attendingIds: string[];
  sessions: GroupSession[];
  onSaveSession: (groups: string[][]) => Promise<boolean>;
  onSessionSaved: () => void;
  onBack: () => void;
}

export function PairingView({
  families,
  historicalFamilies,
  attendingIds,
  sessions,
  onSaveSession,
  onSessionSaved,
  onBack,
}: PairingViewProps) {
  const [groupSize, setGroupSize] = useState(3);
  const [currentGroups, setCurrentGroups] = useState<string[][]>([]);
  const [saveDisabled, setSaveDisabled] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const idToName = useMemo(() => {
    return Object.fromEntries(historicalFamilies.map((f) => [f.id, f.name]));
  }, [historicalFamilies]);

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

  const handleSave = async () => {
    if (currentGroups.length === 0 || saveDisabled) return;

    const cleaned = currentGroups.filter(g => g.length > 0);
    setSaveDisabled(true);

    const saved = await onSaveSession(cleaned);

    if (!saved) {
      setSaveDisabled(false);
      return;
    }

    setCurrentGroups([]);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      setSaveDisabled(false);
      onSessionSaved();
    }, 800);
  };

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
    <div>
      {/* LEFT: current groups + controls */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            ← Participants
          </button>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Step two of two
          </span>
        </div>
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
                      className={`rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-100 ${
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

    </div>
  );
}
