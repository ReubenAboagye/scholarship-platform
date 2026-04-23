import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditScholarshipClient from "./EditScholarshipClient";

export default async function EditScholarshipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: scholarship } = await supabase
    .from("scholarships")
    .select("*")
    .eq("id", id)
    .single();

  if (!scholarship) {
    notFound();
  }

  return <EditScholarshipClient initial={scholarship} />;
}
