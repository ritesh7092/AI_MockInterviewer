'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Loader from '@/components/Loader';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch sessions from an API endpoint
    // For now, we'll just show user info
    setLoading(false);
  }, []);

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            {user && (
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {user.name}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Role:</span> {user.role}</p>
                <p><span className="font-medium">Education:</span> {user.education?.degree} from {user.education?.college || 'N/A'}</p>
                <p><span className="font-medium">Experience:</span> {user.experienceLevel} ({user.experienceYears} years)</p>
                {user.domains && user.domains.length > 0 && (
                  <p><span className="font-medium">Domains:</span> {user.domains.join(', ')}</p>
                )}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/resume/upload" className="block">
                <Button className="w-full">Upload Resume</Button>
              </Link>
              <Link href="/interview/start" className="block">
                <Button className="w-full">Start Interview</Button>
              </Link>
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Past Interview Sessions</h2>
          {loading ? (
            <Loader />
          ) : sessions.length === 0 ? (
            <p className="text-gray-600">No past sessions yet. Start your first interview!</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session._id} className="p-4 border rounded-lg">
                  <p className="font-medium">Session {session._id}</p>
                  <p className="text-sm text-gray-600">Status: {session.status}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}

