'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RequestService() {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    city: '',
    service: 'plumbing',
    description: ''
  });
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        // Specifically handle the 409 Conflict from the E11000 duplicate index
        if (res.status === 409) {
          setStatus({ type: 'error', message: 'Duplicate Lead: You have already submitted a request for this service with this phone number.' });
        } else {
          setStatus({ type: 'error', message: data.error || 'Failed to submit request' });
        }
      } else {
        setStatus({ type: 'success', message: 'Request submitted successfully! Providers have been assigned.' });
        setFormData({ name: '', phoneNumber: '', city: '', service: 'plumbing', description: '' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Back to Hub</Link>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Request a Service</h2>
        
        {status.type !== 'idle' && (
          <div className={`p-4 mb-6 rounded ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input required type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. 9999999999" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Service Type</label>
            <select value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500">
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="hvac">HVAC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" rows={3}></textarea>
          </div>
          <button disabled={loading} type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
