import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function EmailVerify() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await axios.get(`http://localhost:5000/api/auth/verify/${token}`);
        setStatus('success');
      } catch (err) {
        setStatus('fail');
      }
    };
    verifyEmail();
  }, [token]);

  return (
    <div style={{ padding: 20 }}>
      {status === 'loading' && <p>🔄 กำลังตรวจสอบ...</p>}
      {status === 'success' && (
        <div>
          <h2>✅ ยืนยันอีเมลสำเร็จ!</h2>
          <p>คุณสามารถเข้าสู่ระบบได้แล้ว</p>
          <a href="/login">เข้าสู่ระบบ</a>
        </div>
      )}
      {status === 'fail' && (
        <div>
          <h2>❌ ลิงก์ยืนยันไม่ถูกต้อง หรือหมดอายุ</h2>
          <p>กรุณาสมัครใหม่หรือขอลิงก์ใหม่</p>
        </div>
      )}
    </div>
  );
}

export default EmailVerify;