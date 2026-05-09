"use client";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { ToastProvider } from "./ToastProvider";
import KeyboardShortcuts from "./KeyboardShortcuts";

interface Props {
  profile: { full_name: string | null; email: string; role: string } | null;
  children: React.ReactNode;
}

export default function AdminLayoutClient({ profile, children }: Props) {
  return (
    <div className="h-screen bg-zinc-50 flex overflow-hidden">
      <AdminSidebar profile={profile} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-28 md:pb-8 custom-scrollbar relative z-10">
          <ToastProvider>
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </ToastProvider>
          <KeyboardShortcuts />
        </main>
      </div>
    </div>
  );
}
