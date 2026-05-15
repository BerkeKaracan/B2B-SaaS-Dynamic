import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
      <h1 className="text-4xl font-bold text-slate-900">B2B SaaS Engine</h1>
      <p className="text-slate-500">Go to your dashboard to start building.</p>
      <Link
        href="/dashboard/test-tenant"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
      >
        Open Dashboard
      </Link>
    </div>
  );
}
