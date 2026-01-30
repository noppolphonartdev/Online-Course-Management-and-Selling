import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // ดึงฟังก์ชัน login จาก Context

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); // ล้าง Error เก่าทุกครั้งที่พยายามล็อกอิน
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      // เรียกใช้ฟังก์ชัน login จาก Context เพื่ออัปเดต State และ localStorage
      login(res.data); 
      
      navigate('/my-orders');
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  return (
    <div className="flex min-h-[70vh] justify-center items-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">เข้าสู่ระบบผู้ใช้</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="อีเมล"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            className="w-full p-3 border rounded focus:outline-none focus:border-blue-400"
          />
          <input
            name="password"
            type="password"
            placeholder="รหัสผ่าน"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            className="w-full p-3 border rounded focus:outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
          >
            เข้าสู่ระบบ
          </button>
        </form>
        {error && <p className="text-red-500 text-center mt-4">❌ {error}</p>}
      </div>
    </div>
  );
}

export default Login;