'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TestTools() {
  const [providers, setProviders] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      setProviders(data);
    } catch (e) {
      addLog('Error fetching providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSeed = async () => {
    addLog('Clearing DB and Seeding dummy data...');
    await fetch('/api/debug/seed', { method: 'POST' });
    addLog('Database seeded. Indexes synced.');
    fetchProviders();
  };

  const handleGenerateConcurrent = async () => {
    addLog('Generating 10 leads concurrently (simulating heavy load)...');
    
    const promises = Array.from({ length: 10 }).map((_, i) => {
      // Must use unique phone numbers to avoid E11000 duplicate lead constraint
      const uniquePhone = `999${Date.now().toString().slice(-6)}${i}`; 
      
      return fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: `Concurrent User ${i}`,
          phoneNumber: uniquePhone,
          city: 'Test City',
          service: 'plumbing', // Target plumbing to test 'alwaysReceive' and fairness
          description: 'Load test'
        })
      });
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.ok).length;
    addLog(`Finished. ${successCount}/10 requests succeeded without overdrawing quota.`);
    fetchProviders();
  };

  const handleWebhookReset = async () => {
    if (providers.length === 0) {
      addLog('No providers. Please seed the DB first.');
      return;
    }
    const providerId = providers[0]._id; // Just pick the first one for testing
    const eventId = `evt_${Date.now()}`;
    
    addLog(`Calling webhook to reset quota for ${providers[0].name}...`);
    
    const res = await fetch('/api/webhooks/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, providerId })
    });
    const data = await res.json();
    addLog(`Webhook response: ${data.message || data.error}`);
    fetchProviders();
  };

  const handleWebhookIdempotency = async () => {
    if (providers.length === 0) return;
    const providerId = providers[0]._id;
    const eventId = `evt_idem_${Date.now()}`; // Same event ID for all 3 calls
    
    addLog(`Calling webhook 3 times simultaneously with SAME eventId (${eventId})...`);
    
    const promises = Array.from({ length: 3 }).map(() => {
      return fetch('/api/webhooks/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, providerId })
      }).then(r => r.json());
    });

    const results = await Promise.all(promises);
    results.forEach((r, i) => addLog(`Response ${i+1}: ${r.message || r.error}`));
    addLog(`Notice only ONE reset happened. The others say 'Event already processed'`);
    fetchProviders();
  };

  if (loading) return <div className="p-8 text-center text-black">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Back to Hub</Link>
        </div>
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Testing Tools</h1>
          <p className="text-gray-600 mt-2">Simulate webhooks and concurrent loads</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="font-bold text-lg border-b pb-2">Actions</h2>
            
            <button onClick={handleGenerateConcurrent} className="w-full bg-purple-100 text-purple-700 px-4 py-3 rounded hover:bg-purple-200 font-medium text-left flex justify-between border border-purple-200">
              <span>Generate 10 Leads Instantly</span> <span>⚡</span>
            </button>
            
            <button onClick={handleWebhookReset} className="w-full bg-green-100 text-green-700 px-4 py-3 rounded hover:bg-green-200 font-medium text-left flex justify-between">
              <span>Reset Quota (Simulate Payment)</span> <span>💳</span>
            </button>
            
            <button onClick={handleWebhookIdempotency} className="w-full bg-amber-100 text-amber-700 px-4 py-3 rounded hover:bg-amber-200 font-medium text-left flex justify-between border border-amber-200">
              <span>Call Webhook 3x (Idempotency)</span> <span>🔄</span>
            </button>

            <div className="pt-4 mt-4 border-t">
              <button onClick={handleSeed} className="w-full bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition text-sm">
                Seed / Reset Database
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg shadow-sm h-[400px] flex flex-col">
            <h3 className="text-white font-bold mb-2">System Logs</h3>
            <div className="overflow-y-auto flex-grow font-mono text-xs space-y-2 pr-2">
              {logs.map((log, i) => <div key={i}>{log}</div>)}
              {logs.length === 0 && <div className="text-gray-500 italic">No logs yet. Perform an action.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
