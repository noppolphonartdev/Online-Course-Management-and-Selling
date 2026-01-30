import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function CheckoutPage() {
  const { id } = useParams(); // id ของคอร์ส
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`);
        setCourse(res.data);
      } catch (err) {
        console.error("Error fetching course:", err);
        toast.error("ไม่สามารถโหลดข้อมูลคอร์สได้");
      }
    };
    fetchCourse();
  }, [id]);

  const handlePurchase = async () => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อ");
      navigate("/login");
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        'http://localhost:5000/api/orders',
        { courseId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('สร้างคำสั่งซื้อสำเร็จ!');
      navigate('/my-orders');
    } catch (err) {
      toast.error(err.response?.data?.message || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
    }
    setIsLoading(false);
  };

  if (!course) {
    return <p className="text-center mt-20">⏳ กำลังโหลดข้อมูลคอร์ส...</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 pt-24">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">สรุปรายการและชำระเงิน</h1>
        
        <div className="border rounded-lg p-4 mb-6 flex items-center gap-4">
          <img 
            src={course.image ? `http://localhost:5000${course.image}` : 'https://placehold.co/120x80'}
            alt={course.title}
            className="w-32 h-20 object-cover rounded-md"
          />
          <div>
            <h2 className="text-xl font-semibold">{course.title}</h2>
            <p className="text-gray-600">โดย {course.instructor}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>ราคารวม</span>
            <span>{course.price.toLocaleString()} บาท</span>
          </div>
        </div>

        <div className="mt-8">
          {/* --- เพิ่ม Spinner บนปุ่ม --- */}
          <button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full bg-green-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-green-700 transition disabled:bg-gray-400 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'ยืนยันการสั่งซื้อ'
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
            * ในขั้นตอนนี้จะเป็นการสร้างคำสั่งซื้อเบื้องต้น ยังไม่มีการชำระเงินจริง
        </p>
      </div>
    </div>
  );
}

export default CheckoutPage;