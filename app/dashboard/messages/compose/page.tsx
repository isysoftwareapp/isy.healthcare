"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, X, Loader2, UserPlus } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function ComposeMessagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [priority, setPriority] = useState<"normal" | "high" | "urgent">(
    "normal"
  );

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      // Fetch staff from clinic
      const response = await fetch("/api/users");
      if (response.ok) {
        const result = await response.json();
        setStaffList(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRecipients.length === 0) {
      alert("Please select at least one recipient");
      return;
    }

    if (!subject.trim()) {
      alert("Please enter a subject");
      return;
    }

    if (!messageBody.trim()) {
      alert("Please enter a message");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientIds: selectedRecipients,
          subject,
          messageBody,
          priority,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      alert("Message sent successfully!");
      router.push("/dashboard/messages");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipient = (userId: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const getSelectedNames = () => {
    return staffList
      .filter((user) => selectedRecipients.includes(user._id))
      .map((user) => user.name)
      .join(", ");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-lg">
            <Send className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Compose Message
            </h1>
            <p className="text-gray-600 mt-1">
              Send a message to staff members
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipients */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Recipients *
          </label>
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedRecipients.map((recipientId) => {
                const user = staffList.find((u) => u._id === recipientId);
                return (
                  <span
                    key={recipientId}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {user?.name}
                    <button
                      type="button"
                      onClick={() => toggleRecipient(recipientId)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
              {selectedRecipients.length === 0 && (
                <span className="text-gray-500 text-sm">
                  No recipients selected
                </span>
              )}
            </div>
          </div>

          <details className="border border-gray-300 rounded-lg">
            <summary className="px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">
                Select Recipients ({staffList.length} staff available)
              </span>
            </summary>
            <div className="p-4 border-t border-gray-300 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {staffList.map((user) => (
                  <label
                    key={user._id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipients.includes(user._id)}
                      onChange={() => toggleRecipient(user._id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {user.email} • {user.role}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </details>
        </div>

        {/* Subject */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="Enter message subject"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Priority */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="normal"
                checked={priority === "normal"}
                onChange={(e) =>
                  setPriority(e.target.value as "normal" | "high" | "urgent")
                }
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Normal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="high"
                checked={priority === "high"}
                onChange={(e) =>
                  setPriority(e.target.value as "normal" | "high" | "urgent")
                }
                className="w-4 h-4 text-orange-600"
              />
              <span className="text-sm text-gray-700">High Priority</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="urgent"
                checked={priority === "urgent"}
                onChange={(e) =>
                  setPriority(e.target.value as "normal" | "high" | "urgent")
                }
                className="w-4 h-4 text-red-600"
              />
              <span className="text-sm text-gray-700">Urgent</span>
            </label>
          </div>
        </div>

        {/* Message Body */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            required
            rows={10}
            placeholder="Type your message here..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Message
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
