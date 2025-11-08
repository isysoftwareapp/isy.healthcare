"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppointmentDetailClient from "./AppointmentDetailClient";
import { Loader2 } from "lucide-react";

export default function AppointmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAppointment() {
      try {
        const response = await fetch(`/api/appointments/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch appointment");
        }

        const data = await response.json();
        if (data.success) {
          setAppointment(data.data);
        } else {
          setError("Appointment not found");
        }
      } catch (err: any) {
        console.error("Error fetching appointment:", err);
        setError(err.message || "Failed to load appointment");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchAppointment();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          <p>{error || "Appointment not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <AppointmentDetailClient appointment={appointment} />
    </div>
  );
}
