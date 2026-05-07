"use client";

import { useRouter } from "next/navigation";
import ScholarshipForm from "@/components/admin/ScholarshipForm";

export default function NewScholarshipPage() {
  const router = useRouter();

  return (
    <div className="pt-2">
      <ScholarshipForm
        onSaved={() => router.push("/admin/scholarships")}
        onCancel={() => router.push("/admin/scholarships")}
      />
    </div>
  );
}
