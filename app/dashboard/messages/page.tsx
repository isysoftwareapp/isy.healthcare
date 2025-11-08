"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  MailOpen,
  Send,
  Inbox,
  Archive,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Message {
  _id: string;
  sender: { _id: string; name: string; email: string };
  recipients: { _id: string; name: string; email: string }[];
  subject: string;
  body: string;
  priority: "normal" | "high" | "urgent";
  isRead: Map<string, boolean>;
  createdAt: string;
  replies?: any[];
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<"inbox" | "sent" | "all">("inbox");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchMessages();
  }, [folder]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ folder });

      const response = await fetch(`/api/messages?${params}`);
      if (!response.ok) throw new Error("Failed to fetch messages");

      const result = await response.json();
      setMessages(result.data.messages);
      setUnreadCount(result.data.unreadCount);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "normal") return null;

    const colors = {
      high: "bg-orange-100 text-orange-600",
      urgent: "bg-red-100 text-red-600",
    };

    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          colors[priority as keyof typeof colors]
        }`}
      >
        {priority === "urgent" ? (
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            URGENT
          </span>
        ) : (
          "High Priority"
        )}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/messages/compose"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Message
          </Link>
        </div>

        {/* Folder Tabs */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFolder("inbox")}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                folder === "inbox"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Inbox className="w-5 h-5" />
              Inbox
              {unreadCount > 0 && folder === "inbox" && (
                <span className="bg-white text-purple-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFolder("sent")}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                folder === "sent"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Send className="w-5 h-5" />
              Sent
            </button>
            <button
              onClick={() => setFolder("all")}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                folder === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Archive className="w-5 h-5" />
              All Messages
            </button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No messages in {folder}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {messages.map((message) => {
              const isUnread =
                folder === "inbox" &&
                !Object.fromEntries(message.isRead as any)[message._id];
              const hasReplies = message.replies && message.replies.length > 0;

              return (
                <Link
                  key={message._id}
                  href={`/dashboard/messages/${message._id}`}
                  className={`block p-4 hover:bg-gray-50 transition-colors ${
                    isUnread ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        isUnread
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isUnread ? (
                        <Mail className="w-5 h-5" />
                      ) : (
                        <MailOpen className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              isUnread
                                ? "font-semibold text-gray-900"
                                : "font-medium text-gray-700"
                            }`}
                          >
                            {folder === "sent"
                              ? message.recipients.map((r) => r.name).join(", ")
                              : message.sender.name}
                          </p>
                          <p
                            className={`text-base mt-1 truncate ${
                              isUnread
                                ? "font-semibold text-gray-900"
                                : "text-gray-900"
                            }`}
                          >
                            {message.subject}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {message.body.substring(0, 100)}
                            {message.body.length > 100 ? "..." : ""}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          {getPriorityBadge(message.priority)}
                          <p className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </p>
                          {hasReplies && (
                            <span className="text-xs text-blue-600 flex items-center gap-1">
                              <Send className="w-3 h-3" />
                              {message.replies?.length} replies
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {folder === "sent" && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          deleteMessage(message._id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
