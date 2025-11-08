"use client";

import { Clock, Loader2 } from "lucide-react";

interface TimeSlot {
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface TimeSlotSelectorProps {
  slots: TimeSlot[];
  selectedSlot?: TimeSlot;
  onSlotSelect: (slot: TimeSlot) => void;
  loading?: boolean;
}

export default function TimeSlotSelector({
  slots,
  selectedSlot,
  onSlotSelect,
  loading = false,
}: TimeSlotSelectorProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          No available slots
        </h3>
        <p className="mt-1 text-gray-500">
          Please select a different date or practitioner
        </p>
      </div>
    );
  }

  const availableSlots = slots.filter((slot) => !slot.isBooked);
  const bookedSlots = slots.filter((slot) => slot.isBooked);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Available Time Slots
      </h3>

      {availableSlots.length === 0 ? (
        <div className="rounded-lg bg-yellow-50 p-4 text-center">
          <p className="text-sm text-yellow-800">
            All slots are booked for this date. Please select another date.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {availableSlots.map((slot) => {
              const isSelected =
                selectedSlot?.startTime === slot.startTime &&
                selectedSlot?.endTime === slot.endTime;

              return (
                <button
                  key={`${slot.startTime}-${slot.endTime}`}
                  onClick={() => onSlotSelect(slot)}
                  className={`
                    rounded-md border px-3 py-2 text-sm font-medium transition-colors
                    ${
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-900 hover:border-blue-600 hover:bg-blue-50"
                    }
                  `}
                >
                  <div className="flex flex-col items-center">
                    <span>{slot.startTime}</span>
                    <span className="text-xs opacity-75">to</span>
                    <span>{slot.endTime}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Show booked slots (grayed out) */}
          {bookedSlots.length > 0 && (
            <>
              <div className="mb-2 mt-6 text-sm font-medium text-gray-500">
                Booked Slots
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {bookedSlots.map((slot) => (
                  <div
                    key={`booked-${slot.startTime}-${slot.endTime}`}
                    className="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-center text-sm text-gray-400 cursor-not-allowed"
                  >
                    <div className="flex flex-col items-center">
                      <span>{slot.startTime}</span>
                      <span className="text-xs">to</span>
                      <span>{slot.endTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Summary */}
      <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-sm">
        <span className="text-gray-600">{availableSlots.length} available</span>
        <span className="text-gray-600">{bookedSlots.length} booked</span>
      </div>
    </div>
  );
}
