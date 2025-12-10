"use client";

type Tab = "families" | "pairing";

interface TabBarProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ activeTab, onChange }: TabBarProps) {
  return (
    <div className="inline-flex rounded-full bg-[#2A2A2A] border border-slate-800 p-1 text-xs md:text-sm">
      <button
        onClick={() => onChange("families")}
        className={`px-3 py-1.5 rounded-full transition ${
          activeTab === "families"
            ? "bg-primary text-white shadow-sm"
            : "text-slate-400 hover:text-slate-100"
        }`}
      >
        Families
      </button>
      <button
        onClick={() => onChange("pairing")}
        className={`px-3 py-1.5 rounded-full transition ${
          activeTab === "pairing"
            ? "bg-primary text-white shadow-sm"
            : "text-slate-400 hover:text-slate-100"
        }`}
      >
        Pairing & History
      </button>
    </div>
  );
}