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
  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/orders/admin/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(res.data || []);
    } catch (err) {
      alert("Session หมดอายุ หรือไม่มีสิทธิ์เข้าถึง");
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const revenue = useMemo(
    () => orders.reduce((s, o) => s + (o.totalPrice || 0), 0),
    [orders]
  );
  const countPaid = useMemo(
    () => orders.filter((o) => o.paymentStatus === "paid").length,
    [orders]
  );
  const countPending = useMemo(
    () => orders.filter((o) => o.paymentStatus === "pending").length,
    [orders]
  );
  const countFailed = useMemo(
    () => orders.filter((o) => o.paymentStatus === "failed").length,
    [orders]
  );

  const pieData = [
    { name: "ชำระแล้ว", value: countPaid },
    { name: "รอดำเนินการ", value: countPending },
    { name: "ล้มเหลว/ยกเลิก", value: countFailed },
  ];
  const COLORS = ["#22c55e", "#eab308", "#ef4444"];

  return (
    <DashboardLayout title="Dashboard">
      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">คำสั่งซื้อทั้งหมด</p>
          <p className="mt-1 text-2xl font-semibold">
            {loading ? "-" : orders.length}
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
          <p className="text-sm text-gray-500">รายได้</p>
          <p className="mt-1 text-2xl font-semibold">
            {loading ? "-" : `${revenue.toLocaleString()} ฿`}
          </p>
        </div>
      </section>

      {/* Chart + Table */}
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[380px,1fr]">
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
      </section>
    </DashboardLayout>
  );
}
