import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function UserProfileDropdown() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef();

  //ดึง user และฟังก์ชัน logout มาจาก Context
  const { user, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout(); // ใช้ฟังก์ชัน logout จาก Context
    navigate("/login");
  };

  // ถ้ายังไม่มี user (เช่น ตอนแรกที่ยังไม่โหลด) ก็ไม่ต้องแสดงอะไร
  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <img
        //ให้ดึงข้อมูลจาก user.avatar ใน context
        src={user.avatar ? `http://localhost:5000${user.avatar}` : "/default-avatar.png"}
        alt="avatar"
        className="w-9 h-9 rounded-full cursor-pointer border"
        onClick={() => setOpen((o) => !o)}
      />

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 md:right-0 md:left-14 md:-translate-x-1/1 mt-2 w-72 bg-white rounded-2xl shadow-xl border z-50 p-5">
          <div className="flex flex-col items-center mb-4">
            <img
              src={user.avatar ? `http://localhost:5000${user.avatar}` : "/default-avatar.png"}
              alt="profile"
              className="w-16 h-16 rounded-full border mb-2"
            />
            <div className="font-semibold text-lg">{user.name} {user.lastname}</div>
          </div>
          <hr className="my-2" />
          {/* เมนู ตั้งค่าบัญชี */}
          <div className="flex flex-col gap-1">
            <button
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded transition justify-center font-medium text-gray-700"
              onClick={() => {
                setOpen(false);
                navigate("/my-orders"); 
              }}
            >
              การสั่งซื้อของฉัน
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded transition justify-center font-medium text-gray-700"
              onClick={() => {
                setOpen(false);
                navigate("/account"); 
              }}
            >
              ตั้งค่าบัญชี
            </button>
          </div>
          <hr className="my-3" />
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-red-500 hover:bg-gray-100 rounded font-semibold justify-center"
          >
            ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}