"use client";

import { useMemo } from "react";
import { exportSessionPdf } from "../../utils/exportSessionPdf";
import { Family, GroupSession } from "../app/page";

interface SessionHistoryProps {
  families: Family[];
  sessions: GroupSession[];
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SessionHistory({
  families,
  sessions,
}: SessionHistoryProps) {
  const familyNamesById = useMemo(
    () => Object.fromEntries(families.map((family) => [family.id, family.name])),
    [families]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Saved sessions
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-[#242c48]">
            Around The Table history
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review previous groups or download a printable copy.
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
        </span>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
          <p className="text-sm text-slate-500">No saved sessions yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sessions.map((session) => (
            <article
              key={session.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-100"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#242c48]">
                    {formatDate(session.timestamp)}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {session.groups.length} groups
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    exportSessionPdf({ session, familyNamesById })
                  }
                  className="min-h-9 rounded-lg bg-[#242c48] px-3 text-xs font-semibold text-white transition hover:bg-[#192139]"
                >
                  Export PDF
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {session.groups.map((group, groupIndex) => (
                  <div
                    key={groupIndex}
                    className="rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#242c48]">
                      Group {groupIndex + 1}
                    </h4>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      {group.map((familyId) => (
                        <li key={familyId}>
                          {familyNamesById[familyId] ?? (
                            <span className="text-slate-400">
                              Unknown family
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
