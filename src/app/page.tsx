"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { TabBar } from "../components/TabBar";
import { FamilyManager } from "../components/FamilyManager";
import { PairingView } from "../components/PairingView";
import { AttendanceSelector } from "../components/AttendanceSelector";
import { SessionHistory } from "../components/SessionHistory";
import { createClient, type User } from "@supabase/supabase-js";
import Image from "next/image";

export type Family = {
  id: string;
  name: string;
  archived: boolean;
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

type Tab = "session" | "families" | "history";
type AuthStatus = "checking" | "signed_out" | "denied" | "allowed";

const subscribeToHydration = () => () => {};

export default function HomePage() {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
  const [activeTab, setActiveTab] = useState<Tab>("session");
  const [sessionStep, setSessionStep] = useState<"participants" | "groups">(
    "participants"
  );
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [userEmail, setUserEmail] = useState("");
  const [families, setFamilies] = useState<Family[]>([]);
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendingIds, setAttendingIds] = useState<string[]>([]);
  const activeFamilies = useMemo(
    () => families.filter((family) => !family.archived),
    [families]
  );
  const archivedFamilies = useMemo(
    () => families.filter((family) => family.archived),
    [families]
  );

  useEffect(() => {
    let active = true;

    const verifyAccess = async (user: User | null) => {
      if (!user?.email) {
        if (active) {
          setUserEmail("");
          setAuthStatus("signed_out");
        }
        return;
      }

      const email = user.email.toLowerCase();
      const { data, error } = await supabase
        .from("allowed_users")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (!active) return;

      setUserEmail(email);
      setAuthStatus(!error && data ? "allowed" : "denied");
    };

    void supabase.auth.getUser().then(({ data }) => verifyAccess(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void verifyAccess(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // ---------------------------------------------------------
  // LOAD FAMILIES & SESSIONS AFTER AUTHORIZATION
  // ---------------------------------------------------------
  useEffect(() => {
    if (authStatus !== "allowed") return;

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
        setAttendingIds(
          famData.filter((family) => !family.archived).map((family) => family.id)
        );
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
  }, [authStatus]);

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setFamilies([]);
    setSessions([]);
    setAttendingIds([]);
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

    const { data, error } = await supabase
      .from("families")
      .insert([{ id: crypto.randomUUID(), name: trimmed, archived: false }])
      .select()
      .single();

    if (error) {
      console.error("Add family error:", error);
      return;
    }

    setFamilies((prev) =>
      [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
    );
    setAttendingIds((prev) =>
      prev.includes(data.id) ? prev : [...prev, data.id]
    );
  };

  // ---------------------------------------------------------
  // ARCHIVE A FAMILY
  // ---------------------------------------------------------
  const handleRemoveFamily = async (id: string) => {
    const { data, error } = await supabase
      .from("families")
      .update({ archived: true })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Archive family error:", error);
      return;
    }

    setFamilies((prev) => prev.map((family) => (family.id === id ? data : family)));
    setAttendingIds((prev) => prev.filter((familyId) => familyId !== id));
  };

  const handleRestoreFamily = async (id: string) => {
    const { data, error } = await supabase
      .from("families")
      .update({ archived: false })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Restore family error:", error);
      return;
    }

    setFamilies((prev) => prev.map((family) => (family.id === id ? data : family)));
    setAttendingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
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
    if (!groups || groups.length === 0) return false;

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
      return false;
    }

    // Prepend to list
    setSessions((prev) => [data, ...prev]);
    return true;
  };

  if (!isHydrated || authStatus === "checking" || (authStatus === "allowed" && loading)) {
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

  if (authStatus === "signed_out") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#242c48] px-4 py-10">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-white p-6 text-center shadow-2xl sm:p-9">
          <div className="-mx-6 -mt-6 mb-7 rounded-t-3xl bg-[#242c48] px-7 py-8 sm:-mx-9 sm:-mt-9">
            <Image
              src="/WS-full-logo-white.png"
              alt="WindSong Church of Christ"
              width={600}
              height={153}
              priority
              className="mx-auto h-auto w-64"
            />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Community Ministry
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#242c48]">
            Around The Table
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
            Sign in with an approved Google account to manage families and
            create table groups.
          </p>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="mt-7 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-base font-bold text-[#4285f4]"
            >
              G
            </span>
            Continue with Google
          </button>
          <p className="mt-5 text-xs text-slate-400">
            Access is limited to approved WindSong ministry administrators.
          </p>
        </section>
      </main>
    );
  }

  if (authStatus === "denied") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#242c48] px-4 py-10">
        <section className="w-full max-w-lg rounded-3xl bg-white p-7 text-center shadow-2xl sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl text-amber-600">
            !
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[#242c48]">
            Authentication permission required
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            <span className="font-medium text-slate-700">{userEmail}</span> is
            signed in successfully, but this account has not been approved for
            Around The Table.
          </p>
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Please reach out to Adam Perry at{" "}
            <a
              href="mailto:perrys235@gmail.com"
              className="font-semibold text-[#242c48] underline underline-offset-2"
            >
              perrys235@gmail.com
            </a>{" "}
            for authentication permissions.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 min-h-11 rounded-xl bg-[#242c48] px-6 text-sm font-semibold text-white transition hover:bg-[#192139]"
          >
            Sign out and use another account
          </button>
        </section>
      </main>
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
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/65">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
              {activeFamilies.length} families
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
              {attendingIds.length} participating
            </span>
            <span className="hidden rounded-full border border-white/15 bg-white/10 px-3 py-1.5 sm:inline">
              {userEmail}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="min-h-8 rounded-full border border-white/25 px-3 font-semibold text-white transition hover:bg-white hover:text-[#242c48]"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6">
          <TabBar activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "families" && (
          <FamilyManager
            families={activeFamilies}
            archivedFamilies={archivedFamilies}
            onAddFamily={handleAddFamily}
            onRemoveFamily={handleRemoveFamily}
            onRestoreFamily={handleRestoreFamily}
            onGeneratePairs={() => {
              setSessionStep("participants");
              setActiveTab("session");
            }}
            onEditFamily={handleEditFamily}
          />
        )}

        {activeTab === "session" && sessionStep === "groups" && (
          <PairingView
            families={activeFamilies}
            historicalFamilies={families}
            attendingIds={attendingIds}
            sessions={sessions}
            onSaveSession={saveCurrentGroupsAsSession}
            onSessionSaved={() => {
              setSessionStep("participants");
              setActiveTab("history");
            }}
            onBack={() => setSessionStep("participants")}
          />
        )}

        {activeTab === "session" && sessionStep === "participants" && (
          <AttendanceSelector
            families={activeFamilies}
            attendingIds={attendingIds}
            onToggle={toggleAttendance}
            onSetMany={setManyAttendance}
            onAddFamily={handleAddFamily}
            onContinue={() => setSessionStep("groups")}
          />
        )}

        {activeTab === "history" && (
          <SessionHistory families={families} sessions={sessions} />
        )}
      </main>
    </div>
  );
}
