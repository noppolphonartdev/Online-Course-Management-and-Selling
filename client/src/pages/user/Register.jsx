import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    lastname: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePassword = (password) => password.length >= 6;

  useEffect(() => {
    const errs = {};

    if (touched.name && !form.name.trim()) errs.name = "กรุณากรอกชื่อ";
    if (touched.lastname && !form.lastname.trim())
      errs.lastname = "กรุณากรอกนามสกุล";
    if (touched.email && !validateEmail(form.email))
      errs.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (touched.password && !validatePassword(form.password))
      errs.password = "รหัสผ่านต้องมากกว่า 6 ตัวอักษร";
    if (touched.confirmPassword && form.confirmPassword !== form.password) {
      errs.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }

    setErrors(errs);
  }, [form, touched]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess("");
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // mark ทุก field ว่า touched ก่อนส่ง
    setTouched({
      name: true,
      lastname: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.keys(errors).length > 0) return;

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name: form.name,
        lastname: form.lastname,
        email: form.email,
        password: form.password,
      });

      setSuccess(" สมัครเสร็จแล้ว...");
      navigate("/verify-pending", { state: { email: form.email } });
    } catch (err) {
      if (err.response?.data?.message === "อีเมลนี้ถูกใช้ไปแล้ว") {
        setErrors((prev) => ({ ...prev, email: "อีเมลนี้ถูกใช้ไปแล้ว" }));
      } else {
        setErrors((prev) => ({ ...prev, general: "เกิดข้อผิดพลาด" }));
      }
    }
  };

  return (
    <div className="flex max-w-6xl min-h-[70vh] pt-20 mx-auto justify-center items-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">
          สมัครสมาชิก
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-gray-700 text-sm font-medium">
              ชื่อ
            </label>
            <input
              type="text"
              name="name"
              placeholder="ชื่อ"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full p-3 border rounded focus:outline-none focus:border-blue-400"
            />
            {touched.name && errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          {/* LastName */}
          <div>
            <label className="mb-1 block text-gray-700 text-sm font-medium">
              นามสกุล
            </label>
            <input
              type="text"
              name="lastname"
              placeholder="นามสกุล"
              value={form.lastname}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full p-3 border rounded focus:outline-none focus:border-blue-400"
            />
            {touched.lastname && errors.lastname && (
              <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>
            )}
          </div>
          {/* Email */}
          <div>
            <label className="mb-1 block text-gray-700 text-sm font-medium">
              อีเมล (สำหรับใช้เข้าสู่ระบบ)
            </label>
            <input
              type="email"
              name="email"
              placeholder="อีเมล"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full p-3 border rounded focus:outline-none focus:border-blue-400"
            />
            {touched.email && errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          {/* Password */}
          <div>
            <label className="mb-1 block text-gray-700 text-sm font-medium">
              รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
            </label>
            <input
              type="password"
              name="password"
              placeholder="รหัสผ่าน"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full p-3 border rounded focus:outline-none focus:border-blue-400"
            />
            {touched.password && errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>
          {/* Confirm Password */}
          <div>
            <label className="mb-1 block text-gray-700 text-sm font-medium">
              ยืนยันรหัสผ่าน
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="ยืนยันรหัสผ่าน"
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full p-3 border rounded focus:outline-none focus:border-blue-400"
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
          >
            สมัคร
          </button>
        </form>
        {errors.general && (
          <p className="text-red-500 text-center mt-4">{errors.general}</p>
        )}
        {success && (
          <p className="text-green-600 text-center mt-4">{success}</p>
        )}
      </div>
    </div>
  );
};

export default Register;
