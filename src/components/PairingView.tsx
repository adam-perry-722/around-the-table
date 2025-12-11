"use client";

import { useState } from "react";
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
  sessions,
  mostRecentSession,
  onSaveSession,
}: PairingViewProps) {
  const [groupSize, setGroupSize] = useState(3);
  const [currentGroups, setCurrentGroups] = useState<string[][]>([]);
  const [saveDisabled, setSaveDisabled] = useState(false);
  const [showToast, setShowToast] = useState(false);


  const handleGenerateGroups = () => {
    if (families.length < 2) {
      setCurrentGroups([]);
      return;
    }

    const frequency = buildPairFrequency(families, sessions);
    const groups = generateGroups(families, groupSize, frequency);
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

  const exportSessionPDF = async (session: GroupSession) => {
    if (typeof window === "undefined") return; // protect SSR

    const html2pdf = (await import("html2pdf.js")).default;

    const element = document.createElement("div");
    element.style.padding = "20px";
    element.style.fontFamily = "sans-serif";

    let html = `
      <h1 style="font-size: 20px; margin-bottom: 10px;">Around The Table</h1>
      <p style="margin-bottom: 20px; color: #555;">${formatDate(session.timestamp)}</p>
    `;

    session.groups.forEach((group, i) => {
      html += `<h2 style="font-size: 18px; font-weight: bold; margin-top: 15px;">Group ${i + 1}:</h2><ul>`;
      group.forEach((member) => {
        html += `<li style="font-size: 14px; margin: 4px 0;">${member}</li>`;
      });
      html += `</ul>`;
    });

    element.innerHTML = html;

    const opt: any = {
      margin: 0.5,
      filename: `Around-The-Table-${formatDateForFilename(session.timestamp)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  function formatDateForFilename(ts: number) {
    const d = new Date(ts);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0"); // 01–12
    const day = String(d.getDate()).padStart(2, "0");       // 01–31

    return `${year}-${month}-${day}`;
  }


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
    <div className="grid gap-6 md:grid-cols-[3fr,2fr] text-white">
      {/* LEFT: current groups + controls */}
      <section className="rounded-xl border border-slate-800 bg-[#2A2A2A] p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold">
            Group Generator
          </h2>
          <span className="text-xs text-slate-400">
            {families.length} families loaded
          </span>
        </div>

        <p className="text-xs md:text-sm text-slate-400 mb-4">
          Choose a group size, then generate balanced groups using grouping
          history. Groups are built so people who have been together the least
          are grouped first. You can then drag names between groups to fine-tune
          them before saving.
        </p>

        {/* Controls row */}
        <div className="flex items-center gap-4 mb-6">
          {/* GROUP SIZE INPUT */}
          <label className="text-s text-slate-400 mb-1">Group Size</label>

          <input
            type="number"
            min={2}
            value={groupSize}
            onChange={(e) => setGroupSize(Number(e.target.value))}
            className="w-20 px-3 py-2 rounded-md bg-white text-black border border-slate-400 shadow-sm appearance-auto"
          />

          {/* GENERATE BUTTON */}
          <button
            type="button"
            onClick={handleGenerateGroups}
            disabled={families.length < 2}
            className="px-5 py-2 rounded-md font-medium shadow-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition"
          >
            Generate Groups
          </button>

          {/* SAVE BUTTON */}
          <button
            type="button"
            onClick={handleSave}
            disabled={currentGroups.length === 0 || saveDisabled}
            className="px-5 py-2 rounded-md font-medium shadow-sm bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition"
          >
            Save Around The Table List
          </button>
        </div>

        {/* GROUPS LIST WITH DRAG & DROP */}
        {currentGroups.length === 0 ? (
          <p className="text-sm text-slate-400">
            No groups yet. Enter a size and generate groups.
          </p>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-4">
              {currentGroups.map((group, groupIndex) => (
                <Droppable
                  key={groupIndex}
                  droppableId={`group-${groupIndex}`}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`rounded-lg border border-slate-800 bg-[#1E1E1E] p-3 transition ${
                        snapshot.isDraggingOver ? "bg-slate-800/80" : ""
                      }`}
                    >
                      <h3 className="font-semibold text-sm mb-2">
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
                                className={`px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-700 flex items-center justify-between transition ${
                                  dragSnapshot.isDragging
                                    ? "bg-blue-600/80 border-blue-300 shadow-lg"
                                    : ""
                                }`}
                              >
                                <span>{member}</span>
                                <span className="text-[10px] text-slate-400">
                                  drag to move
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
            className="mt-4 rounded-md bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm text-white shadow"
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
      <section className="rounded-xl border border-slate-800 bg-[#2A2A2A] p-4 md:p-5 shadow-sm">
        <h2 className="text-base md:text-lg font-semibold mb-3">
          Around The Table History
        </h2>

        {sessions.length === 0 ? (
          <p className="text-sm text-slate-400">
            No saved groups yet.
          </p>
        ) : (
          <div className="space-y-4 max-h-[26rem] overflow-auto pr-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-slate-800 bg-[#1E1E1E] px-3 py-2 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  {/* NEW PDF EXPORT BUTTON */}
                  <button
                    onClick={() => exportSessionPDF(s)}
                    className="px-2 py-1 text-[10px] bg-purple-600 text-white rounded hover:bg-purple-700 transition"
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
                      {group.map((name) => (
                        <li key={name}>{name}</li>
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
