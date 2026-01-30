import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function AccountSetting() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // Redirect if no user
  if (!user) {
    navigate("/login");
    return null;
  }

  // General UI States
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  // Avatar Upload States
  const [imageFile, setImageFile] = useState(null);

  // Edit Name Modal States
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editLastname, setEditLastname] = useState(user.lastname);
  const [nameError, setNameError] = useState("");

  // Change Password Modal States
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  // --- Image Handler ---
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  // --- Avatar Upload Logic ---
  const handleUploadAvatar = async () => {
    if (!imageFile) {
      toast.error("กรุณาเลือกไฟล์ก่อน");
      return;
    }
    setLoading(true);
    const loadingToast = toast.loading("กำลังอัปโหลด...");
    const formData = new FormData();
    formData.append("avatar", imageFile);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/auth/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      updateUser(res.data); // อัปเดตข้อมูลผ่าน Context
      toast.success("อัปโหลดรูปสำเร็จ!", { id: loadingToast });
      setImageFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "อัปโหลดไม่สำเร็จ", {
        id: loadingToast,
      });
    }
    setLoading(false);
  };

  // --- Edit Name Logic ---
  const handleSubmitEdit = async () => {
    if (!editName.trim() || !editLastname.trim()) {
      return setNameError("กรุณากรอกชื่อและนามสกุล");
    }
    setLoading(true);
    setNameError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "http://localhost:5000/api/auth/profile",
        { name: editName, lastname: editLastname },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser(res.data); // อัปเดตข้อมูลผ่าน Context
      toast.success("เปลี่ยนชื่อสำเร็จ");
      setNameModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "เปลี่ยนชื่อไม่สำเร็จ");
    }
    setLoading(false);
  };

  // --- Change Password Logic ---
  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async () => {
    setPasswordError("");
    if (passwords.newPassword.length < 6) {
      return setPasswordError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setPasswordError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/auth/change-password",
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordModalOpen(false);
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ!");
    } catch (err) {
      setPasswordError(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-20 pt-24">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-10">
        <h2 className="text-2xl font-bold mb-1 text-blue-700">บัญชีทั่วไป</h2>
        <p className="text-gray-400 text-sm mb-8">
          การตั้งค่าด้านนี้จะรักษาความปลอดภัยของบัญชีของคุณ
        </p>

        {/* Avatar Section */}
        <div className="flex items-center mb-8 gap-8">
          <img
            src={
              imageFile
                ? URL.createObjectURL(imageFile)
                : user.avatar
                ? `http://localhost:5000${user.avatar}`
                : "/default-avatar.png"
            }
            alt="profile"
            className="w-28 h-28 rounded-full border object-cover"
          />
          <div className="flex flex-col gap-2">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold"
              onClick={() => fileRef.current.click()}
              type="button"
            >
              {imageFile ? "เปลี่ยนรูปใหม่" : "เลือกรูปโปรไฟล์"}
            </button>
            {imageFile && (
              <button
                onClick={handleUploadAvatar}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  "บันทึกรูปนี้"
                )}
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileRef}
              className="hidden"
            />
            <span className="text-xs text-gray-400">เฉพาะไฟล์ png, jpg</span>
          </div>
        </div>

        {/* Info Cards */}
        <div className="bg-blue-50 flex items-center rounded-xl px-6 py-5 mb-4 gap-4">
          <span className="text-2xl text-blue-400">📧</span>
          <div className="flex-1">
            <div className="font-semibold text-gray-600">อีเมล</div>
            <div className="text-gray-800">{user.email}</div>
          </div>
        </div>
        <div className="bg-blue-50 flex items-center rounded-xl px-6 py-5 mb-4 gap-4">
          <span className="text-2xl text-blue-400">😊</span>
          <div className="flex-1">
            <div className="font-semibold text-gray-600">ชื่อผู้ใช้</div>
            <div className="text-gray-800">
              {user.name} {user.lastname}
            </div>
          </div>
          <button
            className="text-blue-600 font-semibold hover:underline"
            onClick={() => {
              setNameModalOpen(true);
              setEditName(user.name);
              setEditLastname(user.lastname);
              setNameError("");
            }}
          >
            เปลี่ยนชื่อผู้ใช้
          </button>
        </div>
        <div className="bg-blue-50 flex items-center rounded-xl px-6 py-5 gap-4">
          <span className="text-2xl text-blue-400">🔒</span>
          <div className="flex-1">
            <div className="font-semibold text-gray-600">รหัสผ่าน</div>
            <div className="text-gray-800">*********</div>
          </div>
          <button
            className="text-blue-600 font-semibold hover:underline"
            onClick={() => {
              setPasswordModalOpen(true);
              setPasswordError("");
            }}
          >
            เปลี่ยนรหัสผ่าน
          </button>
        </div>
      </div>

      {/* Edit Name */}
      {nameModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full relative z-50">
            <h3 className="font-bold text-lg mb-6">เปลี่ยนชื่อผู้ใช้</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="ชื่อ"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border-none rounded-lg px-4 py-3 bg-gray-100"
              />
              <input
                type="text"
                placeholder="นามสกุล"
                value={editLastname}
                onChange={(e) => setEditLastname(e.target.value)}
                className="w-full border-none rounded-lg px-4 py-3 bg-gray-100"
              />
            </div>
            {nameError && (
              <p className="text-red-500 text-sm mt-4 text-center">
                {nameError}
              </p>
            )}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => setNameModalOpen(false)}
                className="border border-gray-400 px-10 py-2 rounded-lg"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmitEdit}
                className="bg-blue-500 px-10 py-2 rounded-lg text-white font-semibold flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  "ยืนยัน"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Passwor */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full relative z-50">
            <h3 className="font-bold text-lg mb-6">เปลี่ยนรหัสผ่าน</h3>
            <div className="space-y-4">
              <input
                type="password"
                name="currentPassword"
                placeholder="รหัสผ่านปัจจุบัน"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                className="w-full border-none rounded-lg px-4 py-3 bg-gray-100"
              />
              <input
                type="password"
                name="newPassword"
                placeholder="รหัสผ่านใหม่"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                className="w-full border-none rounded-lg px-4 py-3 bg-gray-100"
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full border-none rounded-lg px-4 py-3 bg-gray-100"
              />
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm mt-4 text-center">
                {passwordError}
              </p>
            )}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="border border-gray-400 px-10 py-2 rounded-lg"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="bg-blue-500 px-10 py-2 rounded-lg text-white font-semibold flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  "ยืนยัน"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
