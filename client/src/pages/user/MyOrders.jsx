import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ UX: แท็บกรองรายการ
  const [tab, setTab] = useState("all"); // all | paid | pending | noSlip

  // ✅ state แยกตาม orderId (ไฟล์สลิป/หมายเหตุ/กำลังอัปโหลด/เปิดพับ)
  const [slipFileByOrder, setSlipFileByOrder] = useState({});
  const [slipNoteByOrder, setSlipNoteByOrder] = useState({});
  const [uploadingByOrder, setUploadingByOrder] = useState({});
  const [openSlipPanelByOrder, setOpenSlipPanelByOrder] = useState({});

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ✅ อ้างอิง input file (ถ้าจะกดเลือกไฟล์จากปุ่ม)
  const fileInputRefs = useRef({});

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching orders:", err);
        if (err.response && err.response.status === 403) {
          alert("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
          logout();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate, logout]);

  // ✅ helper: format date
  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("th-TH");
    } catch {
      return "-";
    }
  };

  const fmtDateTime = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString("th-TH");
    } catch {
      return "-";
    }
  };

  // ✅ นับจำนวนแต่ละสถานะเพื่อโชว์บนแท็บ
  const counts = useMemo(() => {
    const all = orders.length;
    const paid = orders.filter((o) => o.paymentStatus === "paid").length;
    const pending = orders.filter((o) => o.paymentStatus === "pending").length;
    const noSlip = orders.filter(
      (o) => o.paymentStatus === "pending" && !o.slipUrl
    ).length;
    return { all, paid, pending, noSlip };
  }, [orders]);

  // ✅ กรองตามแท็บ
  const filteredOrders = useMemo(() => {
    if (tab === "paid") return orders.filter((o) => o.paymentStatus === "paid");
    if (tab === "pending")
      return orders.filter((o) => o.paymentStatus === "pending");
    if (tab === "noSlip")
      return orders.filter((o) => o.paymentStatus === "pending" && !o.slipUrl);
    return orders;
  }, [orders, tab]);

  // ✅ เลือกไฟล์
  const setFileForOrder = (orderId, file) => {
    setSlipFileByOrder((p) => ({ ...p, [orderId]: file || null }));
    // เปิด panel ให้อัตโนมัติเมื่อเลือกไฟล์ (UX ดีขึ้น)
    setOpenSlipPanelByOrder((p) => ({ ...p, [orderId]: true }));
  };

  // ✅ อัปโหลดสลิป: 1) upload image 2) patch order
  const handleUploadSlip = async (orderId) => {
    const file = slipFileByOrder[orderId];
    if (!file) return alert("กรุณาเลือกไฟล์สลิปก่อน");

    try {
      setUploadingByOrder((p) => ({ ...p, [orderId]: true }));

      // 1) อัปโหลดรูปไปยัง /api/upload
      const fd = new FormData();
      fd.append("image", file);

      const up = await axios.post("http://localhost:5000/api/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const slipUrl = up.data?.imageUrl;
      if (!slipUrl) throw new Error("อัปโหลดรูปไม่สำเร็จ");

      // 2) ผูกสลิปเข้ากับ order
      const token = localStorage.getItem("token");
      const note = slipNoteByOrder[orderId] || "";

      const res = await axios.patch(
        `http://localhost:5000/api/orders/${orderId}/upload-slip`,
        { slipUrl, slipNote: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // อัปเดต UI
      const updated = res.data;
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));

      // เคลียร์ไฟล์หลังส่งสำเร็จ
      setSlipFileByOrder((p) => {
        const n = { ...p };
        delete n[orderId];
        return n;
      });

      alert("แนบสลิปสำเร็จ! รอแอดมินตรวจสอบ");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "แนบสลิปไม่สำเร็จ");
    } finally {
      setUploadingByOrder((p) => ({ ...p, [orderId]: false }));
    }
  };

  // ✅ กล่องลากวางไฟล์
  const handleDrop = (e, orderId) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      alert("รองรับเฉพาะไฟล์รูปภาพเท่านั้น");
      return;
    }
    setFileForOrder(orderId, file);
  };

  const TabButton = ({ id, label, count }) => {
    const active = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        className={[
          "px-3 py-2 rounded-xl text-sm font-medium transition border",
          active
            ? "bg-indigo-600 text-white border-indigo-600 shadow"
            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
        ].join(" ")}
      >
        {label}{" "}
        <span
          className={[
            "ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs",
            active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700",
          ].join(" ")}
        >
          {count}
        </span>
      </button>
    );
  };

  const StatusPill = ({ status }) => {
    const isPaid = status === "paid";
    return (
      <span
        className={[
          "px-3 py-1 text-xs sm:text-sm font-semibold rounded-full",
          isPaid
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800",
        ].join(" ")}
      >
        {isPaid ? "ชำระแล้ว" : "รอดำเนินการ"}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-[calc(100vh-80px)]">
      <div className="container max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              คอร์สของฉัน
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              จัดการคอร์สที่ซื้อแล้ว และแนบสลิปเพื่อรอการอนุมัติจากแอดมิน
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            <TabButton id="all" label="ทั้งหมด" count={counts.all} />
            <TabButton id="paid" label="ชำระแล้ว" count={counts.paid} />
            <TabButton id="pending" label="รอตรวจสอบ" count={counts.pending} />
            <TabButton id="noSlip" label="ยังไม่แนบสลิป" count={counts.noSlip} />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-100">
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100">
            <p className="text-gray-600 font-semibold">ไม่พบรายการในหมวดนี้</p>
            <p className="text-sm text-gray-500 mt-1">
              ลองเปลี่ยนแท็บ หรือไปเลือกคอร์สที่หน้า “คอร์สทั้งหมด”
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isPaid = order.paymentStatus === "paid";
              const hasSlip = !!order.slipUrl;
              const panelOpen = !!openSlipPanelByOrder[order._id];

              const selectedFile = slipFileByOrder[order._id];
              const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : "";

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden"
                >
                  {/* Card header */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={
                            order.courseId?.image
                              ? `http://localhost:5000${order.courseId.image}`
                              : "https://placehold.co/120x80"
                          }
                          alt={order.courseId?.title}
                          className="w-28 h-20 object-cover rounded-xl border"
                        />
                        <div className="min-w-0">
                          <p className="text-lg font-bold truncate">
                            {order.courseId?.title || "-"}
                          </p>
                          <div className="mt-1 text-sm text-gray-600 space-y-0.5">
                            <p>วันที่สั่งซื้อ: {fmtDate(order.purchaseDate)}</p>
                            <p>
                              ราคา:{" "}
                              <span className="font-semibold text-gray-900">
                                {Number(order.totalPrice || 0).toLocaleString()}
                              </span>{" "}
                              บาท
                            </p>
                            {!isPaid && (
                              <p className="text-xs text-gray-500">
                                * ชำระแล้วจะเข้าเรียนได้ทันที / หากยังไม่ชำระให้แนบสลิปด้านล่าง
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3">
                        <StatusPill status={order.paymentStatus} />
                        {!isPaid && (
                          <button
                            onClick={() =>
                              setOpenSlipPanelByOrder((p) => ({
                                ...p,
                                [order._id]: !panelOpen,
                              }))
                            }
                            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                          >
                            {panelOpen ? "ซ่อนการแนบสลิป" : "แนบสลิป"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Slip summary line */}
                    {!isPaid && (
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-gray-50 border p-3">
                        <div className="text-sm">
                          <span className="font-semibold">สถานะสลิป:</span>{" "}
                          {hasSlip ? (
                            <span className="text- сочет">
                              <span className="text-green-700 font-semibold">
                                แนบแล้ว
                              </span>
                              <span className="text-gray-500">
                                {" "}
                                (เวลาแนบ: {fmtDateTime(order.slipUploadedAt)})
                              </span>
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold">
                              ยังไม่แนบ
                            </span>
                          )}
                          {order.slipNote ? (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              หมายเหตุ: {order.slipNote}
                            </p>
                          ) : null}
                        </div>

                        {hasSlip && (
                          <a
                            className="text-sm font-semibold text-indigo-600 hover:underline"
                            href={`http://localhost:5000${order.slipUrl}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            ดูสลิปที่แนบไว้
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Slip panel */}
                  {!isPaid && panelOpen && (
                    <div className="border-t bg-white p-4 sm:p-5">
                      <div className="grid md:grid-cols-12 gap-4 items-start">
                        {/* Left: note + choose */}
                        <div className="md:col-span-5">
                          <h3 className="font-bold text-sm mb-2">
                            แนบสลิปชำระเงิน
                          </h3>

                          <textarea
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={4}
                            placeholder="หมายเหตุถึงแอดมิน (ไม่บังคับ) เช่น โอนจากบัญชี..., เวลาโอน..."
                            value={slipNoteByOrder[order._id] || ""}
                            onChange={(e) =>
                              setSlipNoteByOrder((p) => ({
                                ...p,
                                [order._id]: e.target.value,
                              }))
                            }
                          />

                          <div className="mt-3 flex gap-2">
                            <input
                              ref={(el) => (fileInputRefs.current[order._id] = el)}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                setFileForOrder(order._id, e.target.files?.[0])
                              }
                            />

                            <button
                              onClick={() => fileInputRefs.current[order._id]?.click()}
                              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              เลือกไฟล์สลิป
                            </button>

                            {selectedFile && (
                              <button
                                onClick={() => setFileForOrder(order._id, null)}
                                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                              >
                                ล้างไฟล์
                              </button>
                            )}
                          </div>

                          {selectedFile && (
                            <p className="text-xs text-gray-500 mt-2">
                              ไฟล์ที่เลือก:{" "}
                              <span className="font-semibold text-gray-700">
                                {selectedFile.name}
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Middle: dropzone + preview */}
                        <div className="md:col-span-4">
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, order._id)}
                            className="rounded-2xl border border-dashed p-3 bg-gray-50"
                          >
                            <div className="h-100 sm:h-100 md:h-110 rounded-xl bg-white border grid place-items-center overflow-hidden">
                              {selectedFile ? (
                                <img
                                  src={previewUrl}
                                  alt="slip-preview"
                                  className="w-autu h-auto object-cover bg-white"
                                />
                              ) : (
                                <div className="text-center px-4">
                                  <p className="text-sm font-semibold text-gray-700">ลากไฟล์มาวางที่นี่</p>
                                  <p className="text-xs text-gray-500 mt-1">รองรับไฟล์รูปภาพ (jpg/png/webp)</p>
                                </div>
                              )}
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                              * แนะนำให้รูปชัดเจน เห็นยอดเงิน/เวลาโอน
                            </p>
                          </div>
                        </div>

                        {/* Right: action */}
                        <div className="md:col-span-3">
                          <div className="rounded-2xl border p-4">
                            <p className="text-sm font-bold">ส่งสลิปให้แอดมิน</p>
                            <p className="text-xs text-gray-500 mt-1">
                              แนบแล้วสถานะยังเป็น “รอดำเนินการ” จนกว่าแอดมินจะกดอนุมัติ
                            </p>

                            <button
                              onClick={() => handleUploadSlip(order._id)}
                              disabled={!!uploadingByOrder[order._id]}
                              className="mt-4 w-full rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-60"
                            >
                              {uploadingByOrder[order._id]
                                ? "กำลังอัปโหลด..."
                                : "ส่งสลิป"}
                            </button>

                            {!selectedFile && (
                              <p className="text-xs text-gray-500 mt-2">
                                * กรุณาเลือกไฟล์ก่อนกดส่ง
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
