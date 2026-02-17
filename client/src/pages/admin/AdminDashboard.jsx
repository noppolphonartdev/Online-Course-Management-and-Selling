import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // เพิ่มค้นหา/กรอง
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | paid | pending | failed | refunded
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  // Modal ดูสลิป
  const [slipModal, setSlipModal] = useState({
    open: false,
    url: "",
    orderId: "",
  });

  const openSlip = (order) => {
    if (!order?.slipUrl) return;
    setSlipModal({
      open: true,
      url: `http://localhost:5000${order.slipUrl}`,
      orderId: order._id,
    });
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/orders/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert("Session หมดอายุ หรือไม่มีสิทธิ์เข้าถึง");
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  // อัปเดตสถานะคำสั่งซื้อ (ใช้ backend ที่คุณทำไว้)
  const updateStatus = async (id, newStatus) => {
    try {
      const res = await axios.patch(
        `http://localhost:5000/api/orders/${id}/update-status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res?.data;
      if (updated?._id) {
        setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o._id === id ? { ...o, paymentStatus: newStatus } : o))
        );
      }
    } catch (err) {
      alert("อัปเดตสถานะไม่สำเร็จ");
    }
  };

  // ลบคำสั่งซื้อ (ถ้าคุณใช้ endpoint delete ใน backend แล้ว)
  const deleteOrder = async (id) => {
    if (!confirm("ยืนยันการลบคำสั่งซื้อนี้?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      alert("ลบไม่สำเร็จ");
    }
  };

  // Filter + Search
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (statusFilter !== "all") {
      list = list.filter((o) => (o.paymentStatus || "").toLowerCase() === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) => {
        const courseTitle = o?.courseId?.title?.toLowerCase() || "";
        const userEmail = o?.userId?.email?.toLowerCase() || "";
        const userName = o?.userId?.name?.toLowerCase() || "";
        const orderId = (o?._id || "").toLowerCase();
        return (
          courseTitle.includes(q) ||
          userEmail.includes(q) ||
          userName.includes(q) ||
          orderId.includes(q)
        );
      });
    }

    return list;
  }, [orders, statusFilter, search]);

  // Reset หน้าเมื่อเปลี่ยนตัวกรอง
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageData = filteredOrders.slice(pageStart, pageStart + itemsPerPage);

  // KPI (ใช้ filteredOrders เพื่อให้ KPI สอดคล้องกับการกรอง)
  const revenue = useMemo(
    () => filteredOrders.reduce((s, o) => s + (o.totalPrice || 0), 0),
    [filteredOrders]
  );
  const countPaid = useMemo(
    () => filteredOrders.filter((o) => o.paymentStatus === "paid").length,
    [filteredOrders]
  );
  const countPending = useMemo(
    () => filteredOrders.filter((o) => o.paymentStatus === "pending").length,
    [filteredOrders]
  );
  const countFailed = useMemo(
    () => filteredOrders.filter((o) => o.paymentStatus === "failed").length,
    [filteredOrders]
  );

  const pieData = [
    { name: "ชำระแล้ว", value: countPaid },
    { name: "รอดำเนินการ", value: countPending },
    { name: "ล้มเหลว/ยกเลิก", value: countFailed },
  ];
  const COLORS = ["#22c55e", "#eab308", "#ef4444"];

  const StatusBadge = ({ status }) => {
    const s = (status || "pending").toLowerCase();
    const cls =
      s === "paid"
        ? "bg-green-100 text-green-700"
        : s === "failed"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700";

    const label =
      s === "paid" ? "ชำระแล้ว" : s === "failed" ? "ล้มเหลว" : "รอดำเนินการ";

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
        {label}
      </span>
    );
  };

  return (
    <DashboardLayout title="Dashboard">
      {/* ================= KPIs ================= */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">คำสั่งซื้อทั้งหมด</p>
          <p className="mt-1 text-2xl font-semibold">
            {loading ? "-" : filteredOrders.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">ชำระแล้ว</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {loading ? "-" : countPaid}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">รอดำเนินการ</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">
            {loading ? "-" : countPending}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">รายได้ (ตามตัวกรอง)</p>
          <p className="mt-1 text-2xl font-semibold">
            {loading ? "-" : `${revenue.toLocaleString()} ฿`}
          </p>
        </div>
      </section>

      {/* ================= Controls ================= */}
      <section className="mt-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-3 sm:w-auto">
          <div className="relative w-full sm:w-80">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา: ชื่อคอร์ส / อีเมล / ชื่อผู้ใช้ / รหัสออเดอร์"
              className="w-full rounded-xl border bg-white px-3 py-2 pr-8 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">สถานะ: ทั้งหมด</option>
            <option value="paid">ชำระแล้ว</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="failed">ล้มเหลว</option>
            <option value="refunded">คืนเงิน</option>
          </select>
        </div>

        <button
          onClick={fetchOrders}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm text-white hover:brightness-95"
        >
          โหลดข้อมูลอีกครั้ง
        </button>
      </section>

      {/* ================= Chart + Table ================= */}
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[380px,1fr]">
        {/* Chart */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h3 className="mb-2 text-sm font-medium text-gray-600">
            สัดส่วนสถานะคำสั่งซื้อ
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  innerRadius={50}
                  label
                >
                  {pieData.map((_, i) => (
                    <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="max-h-[560px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">คอร์ส</th>
                  <th className="px-4 py-3">ผู้สั่งซื้อ</th>
                  <th className="px-4 py-3">วันที่</th>
                  <th className="px-6 py-3">ราคา</th>
                  <th className="px-3 py-3">สถานะ</th>
                  <th className="px-4 py-3">สลิป</th>
                  <th className="px-4 py-3 text-right">การจัดการ</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={7}>
                      กำลังโหลด...
                    </td>
                  </tr>
                ) : pageData.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6" colSpan={7}>
                      ไม่พบข้อมูลตามเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  pageData.map((o) => {
                    const hasSlip = !!o.slipUrl;

                    return (
                      <tr key={o._id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              className="h-10 w-16 rounded object-cover"
                              src={
                                o.courseId?.image
                                  ? `http://localhost:5000${o.courseId.image}`
                                  : "https://placehold.co/160x100"
                              }
                              alt={o.courseId?.title}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {o.courseId?.title || "-"}
                              </p>
                              <p className="truncate text-xs text-gray-500">
                                รหัส: {o._id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {o.userId?.name || "-"}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {o.userId?.email || "-"}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {o.purchaseDate
                            ? new Date(o.purchaseDate).toLocaleDateString("th-TH")
                            : "-"}
                        </td>

                        <td className="px-4 py-6">
                          {(o.totalPrice || 0).toLocaleString()} ฿
                        </td>

                        <td className="px-2 py-3">
                          <StatusBadge status={o.paymentStatus} />
                        </td>

                        <td className="px-4 py-3">
                          {hasSlip ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openSlip(o)}
                                className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                              >
                                ดูสลิป
                              </button>
                              <span className="text-[11px] text-gray-500">
                                แนบแล้ว
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              ยังไม่แนบ
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button
                              onClick={() => updateStatus(o._id, "paid")}
                              disabled={!hasSlip}
                              className="rounded-lg bg-green-600 text-white px-2 py-1 text-xs hover:brightness-95"
                              title={!hasSlip ? "ต้องมีสลิปก่อน" : "อนุมัติ"}
                            >
                              อนุมัติ
                            </button>

                            <button
                              onClick={() => updateStatus(o._id, "failed")}
                              className="rounded-lg bg-red-600 text-white px-2 py-1 text-xs hover:brightness-95"
                            >
                              ปฏิเสธ
                            </button>

                            <select
                              value={o.paymentStatus || "pending"}
                              onChange={(e) => updateStatus(o._id, e.target.value)}
                              className="rounded-lg border px-2 py-1 text-xs"
                              title="เปลี่ยนสถานะ"
                            >
                              <option value="paid">ชำระแล้ว</option>
                              <option value="pending">รอดำเนินการ</option>
                              <option value="failed">ล้มเหลว</option>
                              <option value="refunded">คืนเงิน</option>
                            </select>

                            <button
                              onClick={() => deleteOrder(o._id)}
                              className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <p>
              หน้า <span className="font-medium">{currentPage}</span> / {totalPages}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Slip Modal */}
      {slipModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="font-semibold text-sm">
                สลิปคำสั่งซื้อ: {slipModal.orderId}
              </p>
              <button
                onClick={() => setSlipModal({ open: false, url: "", orderId: "" })}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                ปิด
              </button>
            </div>
            <div className="p-4">
              <img
                src={slipModal.url}
                alt="slip"
                className="w-full max-h-[75vh] object-contain rounded-xl border"
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
