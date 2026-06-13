"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const ROLES = ["OWNER","ADMIN","PAYROLL_MANAGER","PAYROLL_PROCESSOR","HR_MANAGER","ACCOUNTANT","VIEWER"];

const roleColor: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-red-100 text-red-800",
  PAYROLL_MANAGER: "bg-blue-100 text-blue-800",
  PAYROLL_PROCESSOR: "bg-cyan-100 text-cyan-800",
  HR_MANAGER: "bg-green-100 text-green-800",
  ACCOUNTANT: "bg-yellow-100 text-yellow-800",
  VIEWER: "bg-gray-100 text-gray-700",
  SUPER_ADMIN: "bg-pink-100 text-pink-800",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [resetUser, setResetUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ name: "", email: "", role: "VIEWER", tempPassword: "" });
  const [newPassword, setNewPassword] = useState("");
  const [editRoles, setEditRoles] = useState<string[]>([]);

  const load = () => api<any[]>("/users").then(setUsers).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (!form.tempPassword || form.tempPassword.length < 8) {
      setError("Temporary password must be at least 8 characters.");
      return;
    }
    setSaving(true); setError(""); setSuccess("");
    try {
      await api("/users", { method: "POST", body: JSON.stringify(form) });
      setSuccess(`User ${form.email} created. They can log in with the temporary password and change it.`);
      setShowCreate(false);
      setForm({ name: "", email: "", role: "VIEWER", tempPassword: "" });
      load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create user"); }
    finally { setSaving(false); }
  }

  async function updateRoles(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      await api("/users/roles", { method: "PATCH", body: JSON.stringify({ userId: editUser.id, roles: editRoles }) });
      setSuccess(`Roles updated for ${editUser.email}.`);
      setEditUser(null);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to update roles"); }
    finally { setSaving(false); }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await api(`/users/${resetUser.id}/reset-password`, { method: "PATCH", body: JSON.stringify({ newPassword }) });
      setSuccess(`Password reset for ${resetUser.email}.`);
      setResetUser(null);
      setNewPassword("");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to reset password"); }
    finally { setSaving(false); }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Create users and manage access roles for this company.</p>
        </div>
        <Button onClick={() => { setShowCreate(!showCreate); setEditUser(null); setResetUser(null); }}>
          {showCreate ? "Cancel" : "+ Add User"}
        </Button>
      </div>

      {success && <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800 flex justify-between"><span>{success}</span><button onClick={() => setSuccess("")} className="font-bold">×</button></div>}
      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800 flex justify-between"><span>{error}</span><button onClick={() => setError("")} className="font-bold">×</button></div>}

      {/* Create User */}
      {showCreate && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Create New User</h2>
            <p className="text-xs text-[var(--muted-foreground)]">User gets a temporary password. They should change it after first login.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={createUser} className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Full Name *</label>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Berita Moyo" />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Email Address *</label>
                <Input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="berita@company.com" />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Role *</label>
                <select className="h-10 rounded-md border bg-[var(--card)] px-3 text-sm" value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Temporary Password *</label>
                <Input type="text" required value={form.tempPassword}
                  onChange={(e) => setForm((f) => ({ ...f, tempPassword: e.target.value }))}
                  placeholder="Min 8 characters — share with user" />
                <p className="text-xs text-[var(--muted-foreground)]">Give this to the user. They change it after first login.</p>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create User"}</Button>
                <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Roles */}
      {editUser && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Edit Roles — {editUser.email}</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateRoles} className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <label key={r} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${editRoles.includes(r) ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)]"}`}>
                    <input type="checkbox" className="accent-[var(--primary)]"
                      checked={editRoles.includes(r)}
                      onChange={(e) => {
                        if (e.target.checked) setEditRoles((prev) => [...prev, r]);
                        else setEditRoles((prev) => prev.filter((x) => x !== r));
                      }} />
                    <span className="text-sm font-medium">{r.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Roles"}</Button>
                <Button type="button" variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reset Password */}
      {resetUser && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Reset Password — {resetUser.email}</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={resetPassword} className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-sm font-medium">New Password *</label>
                <Input type="text" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters" />
                <p className="text-xs text-[var(--muted-foreground)]">Share this with the user. They should change it after login.</p>
              </div>
              <div className="flex items-end gap-3">
                <Button type="submit" disabled={saving}>{saving ? "Resetting..." : "Reset Password"}</Button>
                <Button type="button" variant="secondary" onClick={() => { setResetUser(null); setNewPassword(""); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users table */}
      <Card>
        <CardContent className="overflow-x-auto pt-4">
          {loading ? (
            <p className="text-[var(--muted-foreground)] text-center py-8">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-[var(--muted-foreground)] text-center py-8">No users yet. Click + Add User to create one.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[var(--muted)]">
                  {["Name","Email","Roles","Last Login","Actions"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-[var(--muted)]">
                    <td className="px-3 py-2 font-medium">{user.name ?? "—"}</td>
                    <td className="px-3 py-2">{user.email}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(user.roles ?? []).map((role: string) => (
                          <span key={role} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleColor[role] ?? "bg-gray-100"}`}>
                            {role.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[var(--muted-foreground)] text-xs">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("en-GB") : "Never"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary"
                          onClick={() => { setEditUser(user); setEditRoles(user.roles ?? []); setShowCreate(false); setResetUser(null); }}>
                          Edit Roles
                        </Button>
                        <Button size="sm" variant="secondary"
                          onClick={() => { setResetUser(user); setNewPassword(""); setShowCreate(false); setEditUser(null); }}>
                          Reset Password
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Role descriptions */}
      <Card>
        <CardHeader><h2 className="font-semibold text-sm">Role Permissions</h2></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {[
            ["OWNER", "Full access. Can lock payroll runs, manage users and change company settings."],
            ["ADMIN", "Can create/edit employees, create and approve payroll runs."],
            ["PAYROLL_MANAGER", "Can create, calculate and approve payroll runs. Edit payroll lines."],
            ["PAYROLL_PROCESSOR", "Can create runs and edit payroll lines. Cannot approve."],
            ["HR_MANAGER", "Can manage employees and leave records."],
            ["ACCOUNTANT", "Read access to payroll data and reports. Can export."],
            ["VIEWER", "Read-only access to all data."],
          ].map(([role, desc]) => (
            <div key={role} className="flex gap-3 py-1 border-b last:border-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 h-fit ${roleColor[role] ?? "bg-gray-100"}`}>{role}</span>
              <span className="text-[var(--muted-foreground)]">{desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
