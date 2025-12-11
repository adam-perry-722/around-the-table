"use client";

import { useEffect, useMemo, useState } from "react";
import { TabBar } from "../components/TabBar";
import { FamilyManager } from "../components/FamilyManager";
import { PairingView } from "../components/PairingView";

import { createClient } from "@supabase/supabase-js";

export type Family = {
  id: string;
  name: string;
};

export type GroupSession = {
  id: string;
  timestamp: number;
  groups: string[][];
};

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Tab = "families" | "pairing";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("families");
  const [families, setFamilies] = useState<Family[]>([]);
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------
  // LOAD FAMILIES & SESSIONS FROM SUPABASE ON FIRST LOAD
  // ---------------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Load families
      const { data: famData, error: famError } = await supabase
        .from("families")
        .select("*")
        .order("name", { ascending: true });

      if (famError) console.error("Error loading families:", famError);
      else if (famData) setFamilies(famData);

      // Load sessions
      const { data: sesData, error: sesError } = await supabase
        .from("sessions")
        .select("*")
        .order("timestamp", { ascending: false });

      if (sesError) console.error("Error loading sessions:", sesError);
      else if (sesData) setSessions(sesData);

      setLoading(false);
    };

    loadData();
  }, []);

  // ---------------------------------------------------------
  // ADD A FAMILY (INSERT INTO SUPABASE)
  // ---------------------------------------------------------
  const handleAddFamily = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // prevent duplicates
    if (families.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }

    const { data, error } = await supabase
      .from("families")
      .insert([{ id: crypto.randomUUID(), name: trimmed }])
      .select()
      .single();

    if (error) {
      console.error("Add family error:", error);
      return;
    }

    setFamilies((prev) => [...prev, data]);
  };

  // ---------------------------------------------------------
  // REMOVE A FAMILY
  // ---------------------------------------------------------
  const handleRemoveFamily = async (id: string) => {
    const { error } = await supabase.from("families").delete().eq("id", id);
    if (error) {
      console.error("Remove family error:", error);
      return;
    }

    setFamilies((prev) => prev.filter((f) => f.id !== id));
  };

  // ---------------------------------------------------------
  // SAVE NEW SESSION INTO SUPABASE
  // ---------------------------------------------------------
  const saveCurrentGroupsAsSession = async (groups: string[][]) => {
    if (!groups || groups.length === 0) return;

    const newSession: GroupSession = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      groups,
    };

    const { data, error } = await supabase
      .from("sessions")
      .insert([newSession])
      .select()
      .single();

    if (error) {
      console.error("Save session error:", error);
      return;
    }

    // Prepend to list
    setSessions((prev) => [data, ...prev]);
  };

  // Get most recent session
  const mostRecentSession = useMemo(
    () => (sessions.length > 0 ? sessions[0] : null),
    [sessions]
  );

  // Optional "loading" placeholder
  if (loading) {
    return (
      <div className="text-center text-slate-300 mt-20 text-lg">
        Loading data…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "families" && (
        <FamilyManager
          families={families}
          onAddFamily={handleAddFamily}
          onRemoveFamily={handleRemoveFamily}
          onGeneratePairs={() => setActiveTab("pairing")}
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