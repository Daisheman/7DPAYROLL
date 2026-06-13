"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<any[]>("/audit-logs").then(setLogs).finally(() => setLoading(false));
  }, []);

  const actionColor: Record<string, string> = {
    CREATE: "bg-green-100 text-green-800",
    UPDATE: "bg-blue-100 text-blue-800",
    DELETE: "bg-red-100 text-red-800",
    LOGIN: "bg-gray-100 text-gray-700",
    LOGOUT: "bg-gray-100 text-gray-700",
    APPROVE: "bg-blue-100 text-blue-800",
    LOCK: "bg-purple-100 text-purple-800",
    EXPORT: "bg-yellow-100 text-yellow-800",
    DOWNLOAD: "bg-yellow-100 text-yellow-800",
    IMPORT: "bg-cyan-100 text-cyan-800",
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Immutable record of all actions performed in this company.</p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-4">
          {loading ? (
            <p className="text-[var(--muted-foreground)]">Loading audit log...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-8">No audit records yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[var(--muted)]">
                  {["Timestamp","Actor","Action","Entity","Entity ID","IP Address"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-[var(--muted)]">
                    <td className="px-3 py-2 whitespace-nowrap text-[var(--muted-foreground)]">
                      {new Date(log.createdAt).toLocaleString("en-GB")}
                    </td>
                    <td className="px-3 py-2">{log.actorId ? log.actorId.substring(0, 8) + "..." : "System"}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColor[log.action] ?? "bg-gray-100"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">{log.entity}</td>
                    <td className="px-3 py-2 font-mono text-xs">{log.entityId ? log.entityId.substring(0, 8) + "..." : "—"}</td>
                    <td className="px-3 py-2 text-[var(--muted-foreground)]">{log.ipAddress ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
