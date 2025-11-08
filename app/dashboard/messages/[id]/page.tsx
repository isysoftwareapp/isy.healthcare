"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  ArrowLeft,
  Reply,
  Send,
  Loader2,
  AlertCircle,
  User,
} from "lucide-react";

interface Message {
  _id: string;
  sender: { _id: string; name: string; email: string };
  recipients: { _id: string; name: string; email: string }[];
  subject: string;
  body: string;
  priority: "normal" | "high" | "urgent";
  createdAt: string;
  replies?: Message[];
}

export default function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [messageId, setMessageId] = useState<string>("");

  useEffect(() => {
    params.then((p) => {
      setMessageId(p.id);
      fetchMessage(p.id);
    });
  }, []);

  const fetchMessage = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages/${id}`);
      if (!response.ok) throw new Error("Failed to fetch message");

      const result = await response.json();
      setMessage(result.data);
    } catch (error) {
      console.error("Error fetching message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyBody.trim()) {
      alert("Please enter a reply message");
      return;
    }

    try {
      setSending(true);

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientIds: [message!.sender._id],
          subject: `Re: ${message!.subject}`,
          messageBody: replyBody,
          priority: message!.priority,
          parentMessageId: messageId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reply");
      }

      setReplyBody("");
      setShowReply(false);
      fetchMessage(messageId);
      alert("Reply sent successfully!");
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Message not found</p>
      </div>
    );
  }

  const getPriorityBadge = (priority: string) => {
    if (priority === "normal") return null;

    const colors = {
      high: "bg-orange-100 text-orange-600",
      urgent: "bg-red-100 text-red-600",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          colors[priority as keyof typeof colors]
        }`}
      >
        {priority === "urgent" ? (
          <span className="flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
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
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Messages
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {message.subject}
              </h1>
              {getPriorityBadge(message.priority)}
            </div>
          </div>
          <button
            onClick={() => setShowReply(!showReply)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Reply className="w-5 h-5" />
            Reply
          </button>
        </div>
      </div>

      {/* Original Message */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <User className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-900">
                  {message.sender.name}
                </p>
                <p className="text-sm text-gray-600">{message.sender.email}</p>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">
                To: {message.recipients.map((r) => r.name).join(", ")}
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-4">
          <p className="text-gray-900 whitespace-pre-wrap">{message.body}</p>
        </div>
      </div>

      {/* Reply Form */}
      {showReply && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reply to {message.sender.name}
          </h3>
          <form onSubmit={handleReply}>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              required
              rows={6}
              placeholder="Type your reply here..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReply(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Replies */}
      {message.replies && message.replies.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Replies ({message.replies.length})
          </h3>
          {message.replies.map((reply) => (
            <div key={reply._id} className="bg-gray-50 rounded-lg p-6 ml-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {reply.sender.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {reply.sender.email}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(reply.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-300 pt-4">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {reply.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
