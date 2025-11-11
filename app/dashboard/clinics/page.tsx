"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Clinic {
  _id: string;
  name: string;
  // address can be a formatted string (legacy) or an object with details
  address:
    | string
    | {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        timezone?: string;
      };
  phone: string;
  email: string;
  status: "active" | "inactive";
  createdAt: string;
}

export default function ClinicsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchClinics();
    }
  }, [status, router]);

  const fetchClinics = async () => {
    try {
      const response = await fetch("/api/clinics");
      if (!response.ok) throw new Error("Failed to fetch clinics");
      const result = await response.json();
      // Handle both array response and {success, data} response
      const clinicsData = Array.isArray(result) ? result : result.data || [];
      setClinics(clinicsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clinics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading clinics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clinics</h1>
        <Link
          href="/dashboard/admin/clinics/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Clinic
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clinics.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No clinics found. Create your first clinic to get started.
                </td>
              </tr>
            ) : (
              clinics.map((clinic) => (
                <tr key={clinic._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {clinic.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {typeof clinic.address === "string" ? (
                      clinic.address
                    ) : (
                      <div>
                        {clinic.address?.street && (
                          <div>{clinic.address.street}</div>
                        )}
                        <div>
                          {clinic.address?.city}
                          {clinic.address?.city && clinic.address?.state
                            ? ", "
                            : ""}
                          {clinic.address?.state} {clinic.address?.postalCode}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {clinic.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {clinic.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        clinic.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {clinic.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/dashboard/clinics/${clinic._id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/clinics/${clinic._id}/settings`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Settings
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
