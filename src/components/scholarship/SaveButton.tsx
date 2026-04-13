"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props { scholarshipId: string; userId: string; initialSaved: boolean; }

export default function SaveButton({ scholarshipId, userId, initialSaved }: Props) {
  const [saved,   setSaved]   = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();

    if (saved) {
      await supabase.from("saved_scholarships")
        .delete()
        .eq("user_id", userId)
        .eq("scholarship_id", scholarshipId);
    } else {
      await supabase.from("saved_scholarships")
        .insert({ user_id: userId, scholarship_id: scholarshipId });
    }

    setSaved(!saved);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
        saved
          ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          : "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
      }`}
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : saved
          ? <BookmarkCheck className="w-4 h-4" />
          : <Bookmark className="w-4 h-4" />}
      {saved ? "Saved" : "Save"}
    </button>
  );
}
