import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const { user, logout } = useAuth(); // ดึง user และ logout จาก Context
  const navigate = useNavigate();

  useEffect(() => {
    // ตรวจสอบว่ามี user ก่อนจะ fetch ข้อมูล
    if (user) {
      const fetchOrders = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get("http://localhost:5000/api/orders", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setOrders(res.data);
        } catch (err) {
          console.error("Error fetching orders:", err);
          // หาก token หมดอายุ ควร logout อัตโนมัติ
          if (err.response && err.response.status === 403) {
            alert("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
            logout();
            navigate("/login");
          }
        }
      };
      fetchOrders();
    }
  }, [user, navigate, logout]);

  const handleLogout = () => {
    logout(); // ใช้ฟังก์ชัน logout จาก Context
    navigate("/login");
  };

  return (
    <div className="p-5">
      <div className="container max-w-[1440px] mx-auto">
        <div className="flex mb-6">
          <h1 className="text-2xl font-bold">คอร์สของฉัน</h1>
        </div>

        {orders.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">คุณยังไม่มีคอร์สที่ลงทะเบียน</p>
        ) : (

          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white p-4 rounded-lg shadow border flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex items-center gap-4">
                  <img
                    src={order.courseId?.image ? `http://localhost:5000${order.courseId.image}` : 'https://placehold.co/100x70'}
                    alt={order.courseId?.title}
                    className="w-24 h-16 object-cover rounded-md"
                  />
                  <div>
                    <p className="font-semibold text-lg">{order.courseId?.title}</p>
                    <p className="text-sm text-gray-600">วันที่ซื้อ: {new Date(order.purchaseDate).toLocaleDateString("th-TH")}</p>
                    <p className="text-sm text-gray-600">ราคา: {order.totalPrice.toLocaleString()} บาท</p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {order.paymentStatus === 'paid' ? 'ชำระแล้ว' : 'รอดำเนินการ'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;