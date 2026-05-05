"use client"

import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Mail, MailOpen, Archive } from "lucide-react"

interface MessageListProps {
  messages: any[]
  currentStatus: string
  currentPage: number
  totalPages: number
  statusCounts: Record<string, number>
}

export function MessageList({
  messages,
  currentStatus,
  currentPage,
  totalPages,
  statusCounts,
}: MessageListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "UNREAD":
        return "bg-blue-500/20 text-blue-400"
      case "READ":
        return "bg-gray-500/20 text-gray-400"
      case "REPLIED":
        return "bg-green-500/20 text-green-400"
      case "ARCHIVED":
        return "bg-yellow-500/20 text-yellow-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div>
      {/* Status Filters */}
      <div className="flex gap-4 mb-6">
        <Link
          href="/admin/messages?status=UNREAD"
          className={`px-4 py-2 rounded ${
            currentStatus === "UNREAD"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          Unread ({statusCounts.UNREAD || 0})
        </Link>
        <Link
          href="/admin/messages?status=READ"
          className={`px-4 py-2 rounded ${
            currentStatus === "READ"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          Read ({statusCounts.READ || 0})
        </Link>
        <Link
          href="/admin/messages?status=REPLIED"
          className={`px-4 py-2 rounded ${
            currentStatus === "REPLIED"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          Replied ({statusCounts.REPLIED || 0})
        </Link>
        <Link
          href="/admin/messages?status=ARCHIVED"
          className={`px-4 py-2 rounded ${
            currentStatus === "ARCHIVED"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          Archived ({statusCounts.ARCHIVED || 0})
        </Link>
      </div>

      {/* Messages List */}
      <div className="bg-[#121213] rounded-lg overflow-hidden">
        {messages.length === 0 ? (
          <div className="p-8 text-center text-[#BDBDBD]">
            No messages found.
          </div>
        ) : (
          <div className="divide-y divide-[#1A1A1B]">
            {messages.map((message) => (
              <Link
                key={message.id}
                href={`/admin/messages/${message.id}`}
                className="block p-4 hover:bg-[#1A1A1B] transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{message.name}</span>
                      <span className="text-[#BDBDBD]">{message.email}</span>
                      {message.phone && (
                        <span className="text-sm text-[#BDBDBD]">{message.phone}</span>
                      )}
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusColor(message.status)}`}
                      >
                        {message.status}
                      </span>
                    </div>
                    {message.subject && (
                      <p className="font-medium mb-1">{message.subject}</p>
                    )}
                    <p className="text-sm text-[#BDBDBD] line-clamp-2">
                      {message.message}
                    </p>
                  </div>
                  <div className="text-right text-sm text-[#BDBDBD] ml-4">
                    {format(new Date(message.created_at), "MMM d, yyyy")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`?status=${currentStatus}&page=${currentPage - 1}`}
              className="px-4 py-2 bg-[#121213] rounded border border-[#1A1A1B] hover:border-primary transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-[#BDBDBD]">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`?status=${currentStatus}&page=${currentPage + 1}`}
              className="px-4 py-2 bg-[#121213] rounded border border-[#1A1A1B] hover:border-primary transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

