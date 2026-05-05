import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import { format } from "date-fns"
import { MessageList } from "@/components/admin/message-list"

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  await requireAuth()

  const status = searchParams.status || "UNREAD"
  const page = parseInt(searchParams.page || "1")
  const limit = 20
  const offset = (page - 1) * limit

  const messages = await sql`
    SELECT 
      m.*,
      u.name as replied_by_name
    FROM messages m
    LEFT JOIN users u ON m.replied_by = u.id
    WHERE m.status = ${status}
    ORDER BY m.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const countResult = await sql`
    SELECT COUNT(*) as total FROM messages WHERE status = ${status}
  `
  const total = parseInt(countResult[0]?.total || "0")
  const totalPages = Math.ceil(total / limit)

  const statusCounts = await sql`
    SELECT status, COUNT(*) as count
    FROM messages
    GROUP BY status
  `

  const counts = statusCounts.reduce((acc: any, row: any) => {
    acc[row.status] = parseInt(row.count)
    return acc
  }, {})

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold mb-8">Messages</h1>
      <MessageList
        messages={messages as any[]}
        currentStatus={status}
        currentPage={page}
        totalPages={totalPages}
        statusCounts={counts}
      />
    </div>
  )
}

