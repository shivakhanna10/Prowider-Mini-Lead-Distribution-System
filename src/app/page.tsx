import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold">Prowider Simulator</h1>
          <p className="mt-2 text-blue-100">Lead Generation & Distribution System</p>
        </div>
        
        <div className="p-6 space-y-4 text-black">
          <Link href="/request-service" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition group">
            <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600">Feature 1: Customer Form →</h2>
            <p className="text-gray-600 text-sm mt-1">Submit a new lead. Tests DB-level duplicate rules.</p>
          </Link>
          
          <Link href="/dashboard" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition group">
            <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600">Feature 3 & 4: Provider Dashboard →</h2>
            <p className="text-gray-600 text-sm mt-1">Live real-time dashboard powered by Server-Sent Events (SSE).</p>
          </Link>
          
          <Link href="/test-tools" className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition group">
            <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600">Feature 5: Test Tools →</h2>
            <p className="text-gray-600 text-sm mt-1">Simulate concurrent loads and test webhook idempotency.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
