"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  scholarshipId: string;
  userId: string;
  initialSaved: boolean;
  /** Pass true when rendered on a dark/image hero background */
  variant?: "hero" | "default";
}

export default function SaveButton({ scholarshipId, userId, initialSaved, variant = "default" }: Props) {
  const [saved,   setSaved]   = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    if (saved) {
      await supabase.from("saved_scholarships")
        .delete().eq("user_id", userId).eq("scholarship_id", scholarshipId);
    } else {
      await supabase.from("saved_scholarships")
        .insert({ user_id: userId, scholarship_id: scholarshipId });
    }
    setSaved(!saved);
    setLoading(false);
  }

  const heroStyle = saved
    ? "bg-white/25 backdrop-blur-sm border border-white/40 text-white hover:bg-white/35"
    : "bg-white/10 backdrop-blur-sm border border-white/25 text-white/90 hover:bg-white/20 hover:border-white/40";

  const defaultStyle = saved
    ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800"
    : "border-zinc-200 text-zinc-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
        variant === "hero" ? heroStyle : defaultStyle
      }`}
    >
      {loading
        ? <Loader2 className="size-4 animate-spin" />
        : saved
          ? <BookmarkCheck className="size-4" />
          : <Bookmark className="size-4" />}
      {saved ? "Saved" : "Save"}
    </button>
  );
}
