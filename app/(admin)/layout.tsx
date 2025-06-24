export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h2 className="text-lg font-semibold">Admin Dashboard</h2>
          <nav className="ml-6 flex items-center space-x-4 lg:space-x-6">
            <a
              href="/admin/ingestion"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Document Ingestion
            </a>
          </nav>
        </div>
      </div>
      <main className="flex-1">{children}</main>
    </div>
  );
}
