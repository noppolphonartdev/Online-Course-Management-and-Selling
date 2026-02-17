import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function NotificationsDropdown({ open, onClose }) {
  const { fetchUnreadNotiCount } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const boxRef = useRef(null);

  // ✅ ปิดเมื่อคลิกนอกกล่อง (ใช้ click แทน mousedown)
  useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      const el = boxRef.current;
      if (!el) return;

      // ใช้ composedPath กันกรณี shadow/overlay บางแบบ
      const path = e.composedPath?.() || [];
      const clickedInside = path.includes(el) || el.contains(e.target);
      if (!clickedInside) onClose?.();
    };

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open, onClose]);

  // โหลดแจ้งเตือนเมื่อเปิด dropdown
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("โหลด notifications ไม่สำเร็จ:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open]);

  const markRead = async (id) => {
    const token = localStorage.getItem("token");
    await axios.patch(
      `http://localhost:5000/api/notifications/${id}/read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // อัปเดต UI ทันที
    setItems((prev) => prev.map((x) => (x._id === id ? { ...x, isRead: true } : x)));
  };

  const markAllRead = async (e) => {
    e?.stopPropagation?.();
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        "http://localhost:5000/api/notifications/read-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      await fetchUnreadNotiCount?.();
    } catch (err) {
      console.error("อ่านทั้งหมดไม่สำเร็จ:", err);
    }
  };

  // ✅ คลิกแจ้งเตือน: ไปหน้าก่อน แล้วค่อย mark read (ไม่บล็อก navigate)
  const handleClickNoti = (n) => {
    const target = (n?.link || "/my-orders").replace(/^\/courses\//, "/course/");

    // 1) ไปหน้าทันที (กันกรณี markRead พังแล้วไม่ไป)
    navigate(target);

    // 2) ปิด dropdown ทันที
    onClose?.();

    // 3) ทำ read + refresh badge แบบ background
    if (!n?.isRead) {
      (async () => {
        try {
          await markRead(n._id);
          await fetchUnreadNotiCount?.();
        } catch (err) {
          console.error("markRead ไม่สำเร็จ:", err);
          // ถึงพังก็ไม่ทำให้ navigate พังแล้ว
        }
      })();
    } else {
      // ถ้าอ่านแล้ว ก็รีเฟรช count เฉยๆ (กันค้าง)
      fetchUnreadNotiCount?.();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={boxRef}
      // ✅ กัน click-outside ด้วย
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-12 w-[360px] max-w-[90vw] rounded-2xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden z-[60]"
    >
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <p className="font-bold text-sm">แจ้งเตือน</p>
        <button
          onClick={markAllRead}
          className="text-xs font-semibold text-indigo-600 hover:underline"
        >
          อ่านทั้งหมด
        </button>
      </div>

      <div className="max-h-[420px] overflow-auto">
        {loading ? (
          <div className="p-4 text-sm text-gray-500">กำลังโหลด...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-semibold text-gray-700">ยังไม่มีแจ้งเตือน</p>
            <p className="text-xs text-gray-500 mt-1">
              เมื่อแอดมินอนุมัติการชำระเงิน ระบบจะแจ้งที่นี่
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <li
                key={n._id}
                className={[
                  "px-4 py-3 cursor-pointer hover:bg-gray-50",
                  n.isRead ? "opacity-80" : "bg-indigo-50/40",
                ].join(" ")}
                onClick={() => handleClickNoti(n)}
              >
                <div className="flex gap-3">
                  <div
                    className={[
                      "mt-1 h-2.5 w-2.5 rounded-full",
                      n.isRead ? "bg-gray-300" : "bg-indigo-600",
                    ].join(" ")}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {n.title}
                    </p>
                    {n.message ? (
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                    ) : null}

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] text-gray-500">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString("th-TH") : ""}
                      </span>
                    </div>

                    {/* เปิดใช้ถ้าจะ debug link */}
                    {/* <div className="text-[10px] text-gray-400 truncate">link: {n.link}</div> */}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 py-3 border-t">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
