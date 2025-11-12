"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function DebugGeneratePage() {
  const { data: session } = useSession();
  const [count, setCount] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>("random");

  const canRun =
    session?.user && ["Admin", "Director"].includes(session.user.role);

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/debug/generate-practitioners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count,
          clinicId: selectedClinic === "random" ? null : selectedClinic,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate practitioners");
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res = await fetch("/api/clinics");
        const data = await res.json();
        const clinicsData = data.data || data.clinics || [];
        setClinics(clinicsData);
        if (clinicsData.length > 0 && selectedClinic === "random") {
          // keep default random but ensure dropdown has options
        }
      } catch (err) {
        console.error("Error fetching clinics:", err);
      }
    };
    fetchClinics();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">
        Debug — Generate Practitioners
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        Create dummy practitioner users that match the Practitioner form (for
        testing and appointments).
      </p>

      {!session && <div>Loading session...</div>}

      {session && !canRun && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-yellow-800">
          You need Admin or Director role to run debug generation.
        </div>
      )}

      {session && canRun && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of practitioners to generate
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value || "0", 10))}
            className="w-32 px-3 py-2 border rounded"
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign generated practitioners to clinic
            </label>
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="w-64 px-3 py-2 border rounded"
            >
              <option value="random">Random (assign to 1-3 clinics)</option>
              {clinics.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Practitioners"}
            </button>
            <Link
              href="/dashboard/practitioners"
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Open Practitioners Page
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Result</h2>
          <p className="mb-3">{result.message}</p>
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="p-1">Email</th>
                  <th className="p-1">Password</th>
                  <th className="p-1">Role</th>
                </tr>
              </thead>
              <tbody>
                {result.created?.map((c: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="p-1 text-sm">{c.email}</td>
                    <td className="p-1 text-sm">{c.password}</td>
                    <td className="p-1 text-sm">{c.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
