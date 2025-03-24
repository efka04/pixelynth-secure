'use client';
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { HiArrowSmallLeft } from 'react-icons/hi2';

export default function ReportPage() {
  const router = useRouter();
  const { id } = useParams();
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: id, reason: reportReason }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit report.');
      }

      alert('Report submitted successfully.');
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-gray-50 p-4">
      {/* Back Button in the Upper Left */}
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 flex items-center gap-1 text-black hover:bg-gray-200 p-2 rounded-md"
      >
        <HiArrowSmallLeft className="text-2xl" />
        <span>Back</span>
      </button>

      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Report Article</h1>
        <p className="mb-4 text-center">
          Please let us know why you're reporting this article.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            required
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Enter your reason..."
            className="border p-2 rounded-md resize-none"
            rows={5}
          ></textarea>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
