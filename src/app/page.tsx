"use client";

import { useEffect, useMemo, useState } from "react";
import { TabBar } from "../components/TabBar";
import { FamilyManager } from "../components/FamilyManager";
import { PairingView } from "../components/PairingView";

export type Family = {
  id: string;
  name: string;
};

export type GroupSession = {
  id: string;
  timestamp: number;
  groups: string[][];
};

const FAMILIES_KEY = "aroundTheTable:families";
const SESSIONS_KEY = "aroundTheTable:sessions";

type Tab = "families" | "pairing";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("families");
  const [families, setFamilies] = useState<Family[]>([]);
  const [sessions, setSessions] = useState<GroupSession[]>([]);

  // Load stored data
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedFamilies = window.localStorage.getItem(FAMILIES_KEY);
    const storedSessions = window.localStorage.getItem(SESSIONS_KEY);

    if (storedFamilies) {
      try {
        setFamilies(JSON.parse(storedFamilies));
      } catch {}
    }

    if (storedSessions) {
      try {
        setSessions(JSON.parse(storedSessions));
      } catch {}
    }
  }, []);

  // Save families
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FAMILIES_KEY, JSON.stringify(families));
    }
  }, [families]);

  // Save sessions
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // Add a new family
  const handleAddFamily = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (families.some(f => f.name.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }

    setFamilies(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: trimmed }
    ]);
  };

  // Remove a family
  const handleRemoveFamily = (id: string) => {
    setFamilies(prev => prev.filter(f => f.id !== id));
  };

  // Save a new grouping session
  const saveCurrentGroupsAsSession = (groups: string[][]) => {
    if (!groups || groups.length === 0) return;

    const newSession: GroupSession = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      groups
    };

    setSessions(prev => [newSession, ...prev]);
  };

  const mostRecentSession = useMemo(
    () => (sessions.length > 0 ? sessions[0] : null),
    [sessions]
  );

  return (
    <div className="space-y-6">
      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "families" && (
        <FamilyManager
          families={families}
          onAddFamily={handleAddFamily}
          onRemoveFamily={handleRemoveFamily}
          // No more generatePairs
          onGeneratePairs={() => {}}
        />
      )}

      {activeTab === "pairing" && (
        <PairingView
          families={families}
          sessions={sessions}
          mostRecentSession={mostRecentSession}
          onSaveSession={saveCurrentGroupsAsSession}
        />
      )}
    </div>
  );
}
