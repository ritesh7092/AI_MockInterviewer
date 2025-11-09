'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Loader from '@/components/Loader';
import { resumeAPI } from '@/lib/api';

export default function ResumeUploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain') {
        if (selectedFile.size <= 5 * 1024 * 1024) {
          setFile(selectedFile);
          setError('');
        } else {
          setError('File size must be less than 5MB');
        }
      } else {
        setError('Only PDF and text files are allowed');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const response = await resumeAPI.upload(file);
      if (response.success) {
        setResult(response.data);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Upload Resume</h1>

        <Card>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume File (PDF or TXT, max 5MB)
              </label>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={uploading}
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {result && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="font-semibold text-green-800 mb-2">Resume Parsed Successfully!</h3>
                <div className="text-sm text-green-700">
                  <p><strong>Skills found:</strong> {result.parsed?.skills?.length || 0}</p>
                  <p><strong>Projects found:</strong> {result.parsed?.projects?.length || 0}</p>
                  <p><strong>Experience years:</strong> {result.parsed?.experienceYears || 0}</p>
                  <p className="mt-2">Redirecting to dashboard...</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? <Loader size="sm" /> : 'Upload Resume'}
            </Button>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

