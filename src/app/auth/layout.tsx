export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-stretch justify-center">
        {children}
      </main>
    </div>
  );
}
