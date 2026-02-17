import React, { createContext, useEffect, useState, useContext } from "react";
import axios from "axios";

// 1) สร้าง Context object
const AuthContext = createContext(null);

// Utility: อ่าน user จาก localStorage
const getUserFromLocalStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getUserFromLocalStorage());

  // แจ้งเตือน: จำนวน unread เพื่อโชว์ที่ Navbar
  const [unreadNotiCount, setUnreadNotiCount] = useState(0);

  const login = (loginResponseData) => {
    localStorage.setItem("user", JSON.stringify(loginResponseData));
    localStorage.setItem("token", loginResponseData.token);
    setUser(loginResponseData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setUnreadNotiCount(0);
  };

  const updateUser = (newUserData) => {
    localStorage.setItem("user", JSON.stringify(newUserData));
    setUser(newUserData);
  };

  // ดึงจำนวนแจ้งเตือนที่ยังไม่อ่าน
  const fetchUnreadNotiCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return setUnreadNotiCount(0);

      const res = await axios.get("http://localhost:5000/api/notifications/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUnreadNotiCount(res.data?.count ?? 0);
    } catch {
      // ถ้า error ก็ไม่ต้องทำอะไรเยอะ กัน UI กระพริบ
      setUnreadNotiCount((c) => c || 0);
    }
  };

  // เมื่อ user login แล้ว ให้ polling เบา ๆ ทุก 15 วิ เพื่ออัปเดต badge
  useEffect(() => {
    if (!user) return;
    fetchUnreadNotiCount();

    const t = setInterval(() => {
      fetchUnreadNotiCount();
    }, 15000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,

        // noti
        unreadNotiCount,
        fetchUnreadNotiCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
