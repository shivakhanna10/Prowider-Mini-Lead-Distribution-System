'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Provider = {
  _id: string;
  name: string;
  services: string[];
  alwaysReceive: string[];
  quota: number;
  assignedCount: number;
};

function ProviderCard({ provider }: { provider: Provider }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [currentQuota, setCurrentQuota] = useState(provider.quota);
  const [assignedCount, setAssignedCount] = useState(provider.assignedCount || 0);
  
  useEffect(() => {
    const eventSource = new EventSource(`/api/leads/stream?providerId=${provider._id}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'connected') {
        setConnectionStatus('Connected (SSE)');
      } else if (data.type === 'new_lead') {
        setLeads(prev => [data.lead, ...prev].slice(0, 10)); // Keep last 10 leads
        // Optimistically update quota and assignedCount based on the new lead
        setCurrentQuota(prev => Math.max(0, prev - 1));
        setAssignedCount(prev => prev + 1);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus('Reconnecting...');
    };

    return () => {
      eventSource.close();
    };
  }, [provider._id]);

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col h-full text-black">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg">{provider.name}</h3>
        <span className={`px-2 py-1 text-xs rounded-full font-bold ${currentQuota > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Quota: {currentQuota}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded">
        <div><strong>Total Leads Received:</strong> {assignedCount}</div>
        <div className="mt-1"><strong>Services:</strong> {provider.services.join(', ')}</div>
        {provider.alwaysReceive.length > 0 && (
          <div className="text-amber-600 mt-1"><strong>Always gets:</strong> {provider.alwaysReceive.join(', ')}</div>
        )}
        <div className="text-xs mt-2 text-gray-400 border-t pt-1">Status: {connectionStatus}</div>
      </div>

      <div className="flex-grow rounded overflow-y-auto max-h-[300px]">
        <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider">Live Assigned Leads List</h4>
        {leads.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 rounded">
            Waiting for real-time leads...
          </div>
        ) : (
          <ul className="space-y-2">
            {leads.map((lead, idx) => (
              <li key={idx} className="bg-blue-50 p-3 rounded shadow-sm text-sm border-l-4 border-blue-500 animate-in fade-in slide-in-from-top-2">
                <div className="font-bold text-blue-900">{lead.name || lead.customerName}</div>
                <div className="text-gray-600 mt-1 text-xs">
                  Needs: <span className="font-semibold">{lead.service}</span> • {lead.phoneNumber}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      setProviders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  if (loading) return <div className="p-8 text-center text-black">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Back to Hub</Link>
        </div>
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Provider Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time leads streaming directly from the database.</p>
        </header>

        {providers.length === 0 ? (
          <div className="bg-white p-8 rounded-lg text-center shadow">
            <h2 className="text-xl font-bold mb-4">No Providers Found</h2>
            <p className="text-gray-500">Go to Test Tools to seed the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map(p => (
              <ProviderCard key={p._id} provider={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
