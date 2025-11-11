"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Clinic {
  _id: string;
  name: string;
  clinicId?: string;
  code?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
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
  operationalSettings?: any;
  financialSettings?: any;
  isActive?: boolean;
  stats?: { staff?: number; patients?: number };
  staffList?: Array<{
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  }>;
}

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params as any)?.id;

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/clinics/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.success) {
          setError(data?.error || "Clinic not found");
          setClinic(null);
        } else {
          setClinic(data.data);
        }
      })
      .catch((err) => setError(err.message || "Failed to load clinic"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading clinic...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="mt-4">
          <Link
            href="/dashboard/clinics"
            className="text-blue-600 hover:underline"
          >
            Back to clinics
          </Link>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Clinic not found</div>
      </div>
    );
  }

  const addressDisplay = () => {
    if (typeof clinic.address === "string") return clinic.address;
    const a = clinic.address || {};
    return (
      <div>
        {a.street && <div>{a.street}</div>}
        <div>
          {a.city}
          {a.city && a.state ? ", " : ""}
          {a.state} {a.postalCode}
        </div>
        {a.country && <div>{a.country}</div>}
        {a.timezone && (
          <div className="text-sm text-gray-500">Timezone: {a.timezone}</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{clinic.name}</h1>
          <p className="text-sm text-gray-500">
            ID: {clinic.clinicId || clinic._id}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/clinics/${clinic._id}/settings`}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            Settings
          </Link>
          <Link
            href="/dashboard/clinics"
            className="px-4 py-2 bg-white border rounded hover:bg-gray-50"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Contact</h3>
          <div className="text-sm text-gray-700">
            <div>Email: {clinic.contactInfo?.email || "-"}</div>
            <div>Phone: {clinic.contactInfo?.phone || "-"}</div>
            {clinic.contactInfo?.website && (
              <div>Website: {clinic.contactInfo.website}</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Address</h3>
          <div className="text-sm text-gray-700">{addressDisplay()}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Stats</h3>
          <div className="text-sm text-gray-700">
            <div>Staff: {clinic.stats?.staff ?? 0}</div>
            <div>Patients: {clinic.stats?.patients ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Financial Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            Primary Currency: {clinic.financialSettings?.primaryCurrency || "-"}
          </div>
          <div>
            Accepted Currencies:{" "}
            {clinic.financialSettings?.acceptedCurrencies?.join(", ") || "-"}
          </div>
          <div>
            Invoice Prefix: {clinic.financialSettings?.invoicePrefix || "-"}
          </div>
          <div>Tax Rate: {clinic.financialSettings?.taxRate ?? "-"}</div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Staff</h3>
        {clinic.staffList && clinic.staffList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clinic.staffList.map((s, idx) => (
              <div key={idx} className="p-3 border rounded">
                <div className="font-medium">
                  {(s.firstName || "") + " " + (s.lastName || "")}
                </div>
                <div className="text-sm text-gray-600">{s.email}</div>
                <div className="text-xs text-gray-500">{s.role}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            No staff assigned to this clinic.
          </div>
        )}
      </div>
    </div>
  );
}
