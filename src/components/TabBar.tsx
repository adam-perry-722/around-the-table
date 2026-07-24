"use client";

type Tab = "families" | "attendance" | "pairing";

interface TabBarProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ activeTab, onChange }: TabBarProps) {
  const tabs: { id: Tab; label: string; shortLabel: string }[] = [
    { id: "families", label: "1. Families", shortLabel: "Families" },
    { id: "attendance", label: "2. Participation", shortLabel: "Attend" },
    { id: "pairing", label: "3. Groups & History", shortLabel: "Groups" },
  ];

  return (
    <nav
      aria-label="Around The Table workflow"
      className="grid w-full grid-cols-3 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm sm:inline-grid sm:w-auto"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          aria-current={activeTab === tab.id ? "step" : undefined}
          className={`min-h-11 rounded-lg px-2 text-xs font-semibold transition sm:px-5 sm:text-sm ${
            activeTab === tab.id
              ? "bg-[#242c48] text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-100 hover:text-[#242c48]"
          }`}
        >
          <span className="sm:hidden">{tab.shortLabel}</span>
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
