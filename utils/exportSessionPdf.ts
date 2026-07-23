interface ExportableSession {
  timestamp: number;
  groups: string[][];
}

interface ExportSessionPdfOptions {
  session: ExportableSession;
  familyNamesById: Record<string, string>;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character]!
  );
}

function formatDateForFilename(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildSessionPdfMarkup(
  session: ExportableSession,
  familyNamesById: Record<string, string>
) {
  const sessionDate = new Date(session.timestamp).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
  const familyCount = session.groups.reduce(
    (total, group) => total + group.length,
    0
  );
  const groupCards = session.groups
    .map(
      (group, groupIndex) => `
        <section class="group-card">
          <div class="group-heading">
            <h2>Group ${groupIndex + 1}</h2>
            <span>${group.length} ${group.length === 1 ? "family" : "families"}</span>
          </div>
          <ul>
            ${group
              .map(
                (member) =>
                  `<li>${escapeHtml(familyNamesById[member] ?? "(Unknown family)")}</li>`
              )
              .join("")}
          </ul>
        </section>
      `
    )
    .join("");

  return `
    <style>
      * { box-sizing: border-box; }
      .pdf-page {
        width: 7.5in;
        min-height: 10in;
        padding: 0.08in;
        color: #172033;
        background: #ffffff;
        font-family: Arial, Helvetica, sans-serif;
      }
      .pdf-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 18px;
        padding: 6px 2px 14px;
        border-bottom: 3px solid #2563eb;
      }
      .pdf-header h1 {
        margin: 0 0 4px;
        color: #172033;
        font-size: 25px;
        line-height: 1;
        letter-spacing: -0.4px;
      }
      .pdf-header p {
        margin: 0;
        color: #64748b;
        font-size: 11px;
      }
      .summary {
        flex: none;
        color: #475569;
        font-size: 10px;
        text-align: right;
        white-space: nowrap;
      }
      .groups-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        align-items: start;
      }
      .group-card {
        overflow: hidden;
        border: 1px solid #dbe3ee;
        border-radius: 7px;
        background: #f8fafc;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .group-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 10px;
        color: #ffffff;
        background: #1e3a5f;
      }
      .group-heading h2 {
        margin: 0;
        font-size: 12px;
        line-height: 1.2;
      }
      .group-heading span {
        color: #dbeafe;
        font-size: 8px;
        white-space: nowrap;
      }
      .group-card ul {
        margin: 0;
        padding: 6px 10px 8px 25px;
      }
      .group-card li {
        margin: 0;
        padding: 3px 0;
        color: #263449;
        font-size: 10px;
        line-height: 1.25;
        border-bottom: 1px solid #e7edf4;
      }
      .group-card li:last-child { border-bottom: 0; }
    </style>
    <main class="pdf-page">
      <header class="pdf-header">
        <div>
          <h1>Around The Table</h1>
          <p>${escapeHtml(sessionDate)}</p>
        </div>
        <div class="summary">
          ${session.groups.length} groups&nbsp;&nbsp;&bull;&nbsp;&nbsp;${familyCount} families
        </div>
      </header>
      <div class="groups-grid">${groupCards}</div>
    </main>
  `;
}

export async function exportSessionPdf({
  session,
  familyNamesById,
}: ExportSessionPdfOptions) {
  if (typeof window === "undefined") return;

  const html2pdf = (await import("html2pdf.js")).default;
  const element = document.createElement("div");
  element.innerHTML = buildSessionPdfMarkup(session, familyNamesById);

  const options = {
    margin: 0.5,
    filename: `Around-The-Table-${formatDateForFilename(session.timestamp)}.pdf`,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: 900,
    },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    jsPDF: {
      unit: "in" as const,
      format: "letter" as const,
      orientation: "portrait" as const,
    },
  };

  await html2pdf().set(options).from(element).save();
}
