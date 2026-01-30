import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
      
      const res = await axios.post('http://localhost:5000/api/admin/login', formData);
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">เข้าสู่ระบบแอดมิน</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-1 text-gray-600">อีเมล</label>
          <input
            name="email"
            placeholder="อีเมล"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block mb-1 text-gray-600">รหัสผ่าน</label>
          <input
            name="password"
            type="password"
            placeholder="รหัสผ่าน"
            value={formData.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition"
        >
          เข้าสู่ระบบ
        </button>
      </form>
      {error && <p className="text-red-500 mt-4 text-center">❌ {error}</p>}
    </div>
  </div>
  );
}

export default AdminLogin;