import OwnerSidebar from "@/components/owner/OwnerSidebar";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <OwnerSidebar />

      <main className="min-h-screen w-full pt-16 lg:ml-64 lg:w-[calc(100%-16rem)] lg:pt-0">
        {children}
      </main>
    </div>
  );
}