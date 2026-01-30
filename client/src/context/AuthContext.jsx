import React, { createContext, useState, useContext } from 'react';

// 1. สร้าง Context object
const AuthContext = createContext(null);

// Utility function สำหรับอ่านข้อมูลจาก localStorage
const getUserFromLocalStorage = () => {
    try {
        // ดึงข้อมูล 'user' จาก localStorage แล้วแปลงกลับเป็น object
        return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
        return null;
    }
};

// 2. สร้าง Provider Component (ตัวจัดการและส่งต่อ State)
export const AuthProvider = ({ children }) => {
    // สร้าง state 'user' โดยมีค่าเริ่มต้นจาก localStorage
    const [user, setUser] = useState(() => getUserFromLocalStorage());

    const login = (loginResponseData) => {
        // localStorage.removeItem('adminToken');
        // บันทึกข้อมูล user และ token ลงใน localStorage
        localStorage.setItem("user", JSON.stringify(loginResponseData));
        localStorage.setItem("token", loginResponseData.token); // บันทึก token ด้วย
        setUser(loginResponseData);
    };

    const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    }

    // ฟังก์ชันสำหรับอัปเดต user state และ localStorage พร้อมกัน
    const updateUser = (newUserData) => {
        localStorage.setItem("user", JSON.stringify(newUserData));
        setUser(newUserData);
    };

    // ส่งค่า user และฟังก์ชันต่างๆ ผ่าน Provider
    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. สร้าง Custom Hook เพื่อง่ายต่อการเรียกใช้ Context
export const useAuth = () => {
    return useContext(AuthContext);
};