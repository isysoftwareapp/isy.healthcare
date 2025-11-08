"use client";

import { useState, useEffect } from "react";
import { Clock, Building2, Save, Loader2, Plus, Trash2 } from "lucide-react";

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  isOpen: boolean;
  open?: string;
  close?: string;
}

interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface Clinic {
  _id: string;
  name: string;
  clinicId: string;
  code: string;
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export default function OperatingHoursPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>("");
  const [operatingHours, setOperatingHours] = useState<OperatingHours | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    if (selectedClinic) {
      fetchOperatingHours();
    }
  }, [selectedClinic]);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clinics");
      const data = await response.json();

      if (data.success) {
        setClinics(data.data);
        if (data.data.length > 0) {
          setSelectedClinic(data.data[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching clinics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperatingHours = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clinics/${selectedClinic}/settings`);
      const data = await response.json();

      if (data.success) {
        setOperatingHours(data.data.operationalSettings.operatingHours);
      }
    } catch (error) {
      console.error("Error fetching operating hours:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch(`/api/clinics/${selectedClinic}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationalSettings: {
            operatingHours,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Operating hours updated successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to update operating hours",
        });
      }
    } catch (error) {
      console.error("Error saving operating hours:", error);
      setMessage({ type: "error", text: "An error occurred while saving" });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: keyof OperatingHours) => {
    if (!operatingHours) return;

    setOperatingHours({
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        isOpen: !operatingHours[day].isOpen,
        open: operatingHours[day].isOpen ? undefined : "09:00",
        close: operatingHours[day].isOpen ? undefined : "17:00",
      },
    });
  };

  const updateTime = (
    day: keyof OperatingHours,
    field: "open" | "close",
    value: string
  ) => {
    if (!operatingHours) return;

    setOperatingHours({
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        [field]: value,
      },
    });
  };

  const copyToAllDays = (day: keyof OperatingHours) => {
    if (!operatingHours) return;

    const template = operatingHours[day];
    const updated: OperatingHours = { ...operatingHours };

    DAYS.forEach((d) => {
      updated[d] = { ...template };
    });

    setOperatingHours(updated);
    setMessage({
      type: "success",
      text: `Copied ${DAY_LABELS[day]} schedule to all days`,
    });
  };

  const applyWeekdayHours = () => {
    if (!operatingHours) return;

    const weekdays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ] as const;
    const weekends = ["saturday", "sunday"] as const;

    const updated: OperatingHours = { ...operatingHours };

    weekdays.forEach((day) => {
      updated[day] = { isOpen: true, open: "09:00", close: "17:00" };
    });

    weekends.forEach((day) => {
      updated[day] = { isOpen: false };
    });

    setOperatingHours(updated);
    setMessage({
      type: "success",
      text: "Applied standard weekday hours (9 AM - 5 PM)",
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading operating hours...</p>
        </div>
      </div>
    );
  }

  const selectedClinicData = clinics.find((c) => c._id === selectedClinic);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Operating Hours
            </h1>
            <p className="text-gray-600 mt-1">
              Configure clinic operating hours and schedules
            </p>
          </div>
        </div>

        {/* Clinic Selector */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Clinic
          </label>
          <select
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
          >
            {clinics.map((clinic) => (
              <option key={clinic._id} value={clinic._id}>
                {clinic.name} ({clinic.clinicId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={applyWeekdayHours}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Apply Standard Hours (M-F 9AM-5PM)
          </button>
        </div>
      </div>

      {/* Operating Hours Editor */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Weekly Schedule
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedClinicData?.name}
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {operatingHours && (
            <div className="space-y-4">
              {DAYS.map((day) => {
                const schedule = operatingHours[day];
                return (
                  <div
                    key={day}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    {/* Day Toggle */}
                    <div className="w-40">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={schedule.isOpen}
                          onChange={() => toggleDay(day)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-900">
                          {DAY_LABELS[day]}
                        </span>
                      </label>
                    </div>

                    {/* Time Inputs */}
                    {schedule.isOpen ? (
                      <>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Open:</label>
                          <input
                            type="time"
                            value={schedule.open || "09:00"}
                            onChange={(e) =>
                              updateTime(day, "open", e.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">
                            Close:
                          </label>
                          <input
                            type="time"
                            value={schedule.close || "17:00"}
                            onChange={(e) =>
                              updateTime(day, "close", e.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <button
                          onClick={() => copyToAllDays(day)}
                          className="ml-auto px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Copy to all days"
                        >
                          Copy to All
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-500 italic">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
