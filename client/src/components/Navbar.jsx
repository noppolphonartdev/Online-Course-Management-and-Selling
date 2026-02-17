import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserProfileDropdown from "./UserProfileDropdown";
import { useAuth } from "../context/AuthContext";
import { FaBars, FaTimes, FaRegBell  } from "react-icons/fa";

function Navbar() {
  // ดึง unreadNotiCount มาด้วย
  const { user, unreadNotiCount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const goToNotifications = () => {
    // ถ้ายังไม่มีหน้ารวมแจ้งเตือน แนะนำใช้ /my-orders ก่อน
    navigate("/notifications"); // หรือ "/my-orders"
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      {/* Container หลัก */}
      <div className="container mx-auto max-w-[1440px] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          {/* โลโก้ */}
          <Link to="/" className="text-2xl font-bold text-blue-600">
            CourseSi
          </Link>

          {/* เมนู Desktop */}
          <ul className="hidden md:flex items-center space-x-6">
            <li>
              <Link to="/" className="text-gray-600 hover:text-blue-500">
                หน้าแรก
              </Link>
            </li>
            <li>
              <Link to="/courses" className="text-gray-600 hover:text-blue-500">
                คอร์สทั้งหมด
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-gray-600 hover:text-blue-500">
                เกี่ยวกับเรา
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-gray-600 hover:text-blue-500">
                ติดต่อเรา
              </Link>
            </li>
          </ul>
        </div>

        {/* ส่วน User/Login (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* กระดิ่งแจ้งเตือน */}
              <button
                onClick={goToNotifications}
                className="relative h-10 w-10 grid place-items-center rounded-full hover:bg-gray-100 transition"
                aria-label="Notifications"
                title="แจ้งเตือน"
              >
                <FaRegBell size={22} className="text-gray-700" />
                {unreadNotiCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] grid place-items-center">
                    {unreadNotiCount}
                  </span>
                )}
              </button>

              <UserProfileDropdown />
            </>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-blue-500">
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                สมัครสมาชิก
              </Link>
            </div>
          )}
        </div>

        {/* ปุ่ม Hamburger (Mobile) */}
        <div className="md:hidden flex items-center gap-2">
          {/* ถ้า login แล้ว โชว์กระดิ่งบนมือถือด้วย */}
          {user && (
            <button
              onClick={goToNotifications}
              className="relative h-10 w-10 grid place-items-center rounded-full hover:bg-gray-100 transition"
              aria-label="Notifications"
              title="แจ้งเตือน"
            >
              <FaRegBell size={22} className="text-gray-700" />
              {unreadNotiCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] grid place-items-center">
                  {unreadNotiCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-700 focus:outline-none"
            aria-label="Menu"
          >
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${isOpen ? "block" : "hidden"} md:hidden bg-white border-t`}>
        <ul className="flex flex-col items-center p-4 space-y-4">
          <li>
            <Link
              to="/"
              className="text-gray-600 hover:text-blue-500"
              onClick={() => setIsOpen(false)}
            >
              หน้าแรก
            </Link>
          </li>
          <li>
            <Link
              to="/courses"
              className="text-gray-600 hover:text-blue-500"
              onClick={() => setIsOpen(false)}
            >
              คอร์สทั้งหมด
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className="text-gray-600 hover:text-blue-500"
              onClick={() => setIsOpen(false)}
            >
              เกี่ยวกับเรา
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className="text-gray-600 hover:text-blue-500"
              onClick={() => setIsOpen(false)}
            >
              ติดต่อเรา
            </Link>
          </li>

          {/* ปุ่มแจ้งเตือนในเมนูมือถือ */}
          {user && (
            <li>
              <button
                onClick={goToNotifications}
                className="text-gray-700 hover:text-blue-500 flex items-center gap-2"
              >
                แจ้งเตือน
                {unreadNotiCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] grid place-items-center">
                    {unreadNotiCount}
                  </span>
                )}
              </button>
            </li>
          )}
        </ul>

        <div className="flex flex-col items-center p-4 border-t space-y-4">
          {user ? (
            <UserProfileDropdown />
          ) : (
            <>
              <Link
                to="/login"
                className="w-full text-center text-gray-600 hover:text-blue-500"
                onClick={() => setIsOpen(false)}
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className="w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                onClick={() => setIsOpen(false)}
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;