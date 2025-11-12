"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { ChevronDownIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DebugDBPage() {
  // Request full collection documents. Be careful: large collections may return
  // a lot of data. This page is intended for Admin/Director use only.
  const { data, error, isLoading } = useSWR(
    "/api/debug/db/collections?all=true",
    fetcher
  );
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (data?.collections) {
      const map: Record<string, boolean> = {};
      for (const c of data.collections) map[c.name] = false;
      setExpanded(map);
    }
  }, [data]);

  if (isLoading) return <div className="p-6">Loading database...</div>;
  if (error)
    return (
      <div className="p-6 text-red-600">
        Error loading DB: {error?.message || JSON.stringify(error)}
      </div>
    );
  if (!data) return <div className="p-6">No data</div>;

  const collections = data.collections.filter((c: any) =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Database inspector</h1>
        <p className="text-sm text-gray-600 mt-1">
          Read-only view of MongoDB collections, counts and sample documents.
        </p>
      </div>

      <div className="mb-4 flex gap-2 items-center">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter collections..."
          className="border px-3 py-2 rounded-md w-64"
        />
        <button
          className="ml-2 px-3 py-2 rounded-md bg-blue-600 text-white"
          onClick={() => {
            (window as any).location.reload();
          }}
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {collections.length === 0 && (
          <div className="text-gray-500">No collections match that filter.</div>
        )}
        {collections.map((col: any) => (
          <div key={col.name} className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="w-6 h-6 text-gray-600" />
                <div>
                  <div className="font-medium">{col.name}</div>
                  <div className="text-sm text-gray-500">
                    {col.count.toLocaleString()} documents
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    navigator.clipboard?.writeText(
                      JSON.stringify(col.samples, null, 2)
                    )
                  }
                  className="px-3 py-1 rounded-md border text-sm"
                >
                  Copy sample JSON
                </button>
                <button
                  onClick={() =>
                    setExpanded((s) => ({ ...s, [col.name]: !s[col.name] }))
                  }
                  className="flex items-center gap-2 px-3 py-1 rounded-md border"
                >
                  <ChevronDownIcon
                    className={`w-4 h-4 transform ${
                      expanded[col.name] ? "rotate-180" : "rotate-0"
                    }`}
                  />
                  <span className="text-sm">
                    {expanded[col.name] ? "Hide" : "View"}
                  </span>
                </button>
              </div>
            </div>

            {expanded[col.name] && (
              <div className="p-4 bg-white">
                <div className="mb-2 text-sm text-gray-600">
                  Showing up to 10 sample documents. Nested BSON values are
                  converted for readability.
                </div>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(col.samples, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-500">
        This page is read-only and intended for debugging and inspection by
        Admin/Director accounts.
      </div>
    </div>
  );
}
