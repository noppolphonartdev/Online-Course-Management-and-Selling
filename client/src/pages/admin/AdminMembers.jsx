import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";

const emptyForm = {
  name: "",
  lastname: "",
  email: "",
  role: "user",
  verified: false,
};

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const itemsPerPage = 10;
  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/admin/members", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(res.data || []);
    } catch (err) {
      alert("Session หมดอายุ หรือไม่มีสิทธิ์เข้าถึง");
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter((member) => {
      const name = `${member?.name || ""} ${member?.lastname || ""}`.toLowerCase();
      const email = (member?.email || "").toLowerCase();
      const role = (member?.role || "").toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [members, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageData = filtered.slice(pageStart, pageStart + itemsPerPage);

  useEffect(() => setCurrentPage(1), [search]);

  const startEdit = (member) => {
    setEditingId(member._id);
    setForm({
      name: member?.name || "",
      lastname: member?.lastname || "",
      email: member?.email || "",
      role: member?.role || "user",
      verified: Boolean(member?.verified),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      setSaving(true);
      const res = await axios.put(
        `http://localhost:5000/api/admin/members/${editingId}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMembers((prev) =>
        prev.map((member) => (member._id === editingId ? res.data : member))
      );
      cancelEdit();
    } catch (err) {
      alert(err?.response?.data?.message || "อัปเดตข้อมูลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Member">
      <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา: ชื่อ / อีเมล / บทบาท"
            className="w-full rounded-xl border bg-white px-3 py-2 pr-8 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M20 20l-3-3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <button
          onClick={fetchMembers}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm text-white hover:brightness-95"
        >
          โหลดข้อมูลอีกครั้ง
        </button>
      </section>

      {editingId && (
        <section className="mt-6 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <label className="text-xs text-gray-500">ชื่อ</label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">นามสกุล</label>
                <input
                  value={form.lastname}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, lastname: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <label className="text-xs text-gray-500">อีเมล</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">บทบาท</label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-5 md:pt-0">
                <input
                  id="member-verified"
                  type="checkbox"
                  checked={form.verified}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      verified: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <label htmlFor="member-verified" className="text-sm">
                  ยืนยันอีเมลแล้ว
                </label>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
              <button
                onClick={cancelEdit}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="max-h-[560px] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">ชื่อสมาชิก</th>
                <th className="px-4 py-3">อีเมล</th>
                <th className="px-4 py-3">บทบาท</th>
                <th className="px-4 py-3">ยืนยันแล้ว</th>
                <th className="px-4 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6" colSpan={5}>
                    กำลังโหลด...
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td className="px-4 py-6" colSpan={5}>
                    ไม่พบข้อมูลตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                pageData.map((member) => (
                  <tr key={member._id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {member.name} {member.lastname}
                      </p>
                    </td>
                    <td className="px-4 py-3">{member.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                        {member.role || "user"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {member.verified ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                          ยืนยันแล้ว
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
                          ยังไม่ยืนยัน
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => startEdit(member)}
                        className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50"
                      >
                        แก้ไข
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
          <p>
            หน้า <span className="font-medium">{currentPage}</span> /{" "}
            {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
