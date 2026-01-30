import { useState } from 'react';
import axios from 'axios';

function VerifyPending({ email }) {
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);

  const handleResend = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/resend-verification', { email });
      setMessage(res.data.message);
      setCount(prev => prev + 1);
    } catch (err) {
      setMessage(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
        {/* ไอคอนอีเมล */}
        <div className="flex justify-center mb-3">
          <span className="text-4xl">📧</span>
        </div>
        <h2 className="text-xl font-bold mb-2">โปรดยืนยันอีเมลของคุณ</h2>
        <p className="mb-4 text-gray-700">
          ระบบได้ส่งลิงก์ยืนยันไปที่<br />
          <span className="font-medium text-blue-700">{email}</span>
        </p>
        {/* ปุ่มส่งอีเมลอีกครั้ง */}
        <button
          onClick={handleResend}
          disabled={count >= 4}
          className={`w-full py-2 rounded-lg font-semibold transition mb-2 
            ${count >= 4
              ? "bg-gray-300 text-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"}`}
        >
          ส่งอีเมลอีกครั้ง
        </button>
        {/* ข้อความแจ้งเตือน */}
        {message && (
          <div className="mt-2 text-sm text-gray-600">{message}</div>
        )}
        {/* คำแนะนำป้องกัน spam */}
        <div className="mt-4 text-xs text-gray-400">
          กดได้สูงสุด 4 ครั้งใน 30 นาที เพื่อป้องกันสแปม
        </div>
      </div>
    </div>
  );
}

export default VerifyPending;