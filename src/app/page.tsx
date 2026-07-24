"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { TabBar } from "../components/TabBar";
import { FamilyManager } from "../components/FamilyManager";
import { PairingView } from "../components/PairingView";
import { AttendanceSelector } from "../components/AttendanceSelector";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

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

type Tab = "families" | "attendance" | "pairing";

const subscribeToHydration = () => () => {};

export default function HomePage() {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
  const [activeTab, setActiveTab] = useState<Tab>("families");
  const [families, setFamilies] = useState<Family[]>([]);
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendingIds, setAttendingIds] = useState<string[]>([]);


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
      else if (famData) {
        setFamilies(famData);
        setAttendingIds(famData.map((family) => family.id));
      }

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

  const loadFamilies = async () => {
    const { data, error } = await supabase
      .from("families")
      .select("*")
      .order("name");

    if (!error && data) {
      setFamilies(data);
      setAttendingIds(data.map((family) => family.id));
    }
  };

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

    const { error } = await supabase
      .from("families")
      .insert([{ id: crypto.randomUUID(), name: trimmed }])
      .select()
      .single();

    if (error) {
      console.error("Add family error:", error);
      return;
    }

    if (!error) {
      await loadFamilies();
    }
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
    setAttendingIds((prev) => prev.filter((familyId) => familyId !== id));
  };

  const toggleAttendance = (id: string) => {
    setAttendingIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const setManyAttendance = (ids: string[], checked: boolean) => {
    setAttendingIds(prev => {
      const set = new Set(prev);

      ids.forEach(id => {
        if (checked) set.add(id);
        else set.delete(id);
      });

      return Array.from(set);
    });
  };

  const handleEditFamily = async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    // Prevent duplicates (case-insensitive), excluding the current family
    if (
      families.some(
        (f) => f.id !== id && f.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      return;
    }

    const { data, error } = await supabase
      .from("families")
      .update({ name: trimmed })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Edit family error:", error);
      return;
    }

    // Update state with returned row
    setFamilies((prev) => prev.map((f) => (f.id === id ? data : f)));
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

  if (!isHydrated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#242c48]">
        <div className="flex flex-col items-center gap-5 text-white">
          <Image
            src="/WS-full-logo-white.png"
            alt="WindSong Church of Christ"
            width={300}
            height={76}
            priority
            className="h-auto w-56 sm:w-72"
          />
          <div className="h-1 w-24 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-white" />
          </div>
          <p className="text-sm text-white/70">Loading Around The Table…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-[#242c48] text-white shadow-lg shadow-slate-900/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-5">
            <Image
              src="/WS-full-logo-white.png"
              alt="WindSong Church of Christ"
              width={600}
              height={153}
              priority
              className="h-auto w-48 sm:w-64"
            />
            <div className="hidden h-10 w-px bg-white/20 sm:block" />
            <div className="hidden sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
                Community Ministry
              </p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight">
                Around The Table
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/65">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
              {families.length} families
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
              {attendingIds.length} participating
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6">
          <TabBar activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "families" && (
          <FamilyManager
            families={families}
            onAddFamily={handleAddFamily}
            onRemoveFamily={handleRemoveFamily}
            onGeneratePairs={() => setActiveTab("attendance")}
            onEditFamily={handleEditFamily}
          />
        )}

        {activeTab === "pairing" && (
          <PairingView
            families={families}
            attendingIds={attendingIds}
            sessions={sessions}
            mostRecentSession={mostRecentSession}
            onSaveSession={saveCurrentGroupsAsSession}
          />
        )}

        {activeTab === "attendance" && (
          <AttendanceSelector
            families={families}
            attendingIds={attendingIds}
            onToggle={toggleAttendance}
            onSetMany={setManyAttendance}
          />
        )}
      </main>
    </div>
  );
}
