import { useState } from 'react';
import { Link } from "react-router-dom";
import UserProfileDropdown from "./UserProfileDropdown";
import { useAuth } from "../context/AuthContext";
import { FaBars, FaTimes } from 'react-icons/fa';

function Navbar() {
    // ดึงข้อมูล user มาจาก Context โดยตรง
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    return (
            <nav className="bg-white shadow-md sticky top-0 z-50">
            {/* Container หลัก: จัดวางทุกอย่างให้อยู่กึ่งกลางและมีระยะห่างซ้ายขวา */}
            <div className="container mx-auto max-w-[1440px] px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-8"> 
                    {/* ส่วนโลโก้ */}
                    <Link to="/" className="text-2xl font-bold text-blue-600">
                        CourseSi
                    </Link>
                    <ul className="hidden md:flex items-center space-x-6">
                        <li><Link to="/" className="text-gray-600 hover:text-blue-500">หน้าแรก</Link></li>
                        <li><Link to="/courses" className="text-gray-600 hover:text-blue-500">คอร์สทั้งหมด</Link></li>
                        <li><Link to="/about" className="text-gray-600 hover:text-blue-500">เกี่ยวกับเรา</Link></li>
                        <li><Link to="/contact" className="text-gray-600 hover:text-blue-500">ติดต่อเรา</Link></li>
                    </ul>
                </div>
                    {/* ส่วนของ User/Login */}
                    <div className="hidden md:flex items-center">
                        {user ? (
                            <UserProfileDropdown />
                        ) : (
                            <div className="hidden md:flex items-center space-x-4">
                                <Link to="/login" className="text-gray-600 hover:text-blue-500">เข้าสู่ระบบ</Link>
                                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">สมัครสมาชิก</Link>
                            </div>
                        )}
                    </div>

                {/* ปุ่ม Hamburger สำหรับจอมือถือ */}
                <div className="md:hidden">
                    <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 focus:outline-none">
                        {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                    </button>
                </div>
            </div>

            {/* เมนูที่แสดงผลบนมือถือ (Mobile Menu) */}
            <div className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-white border-t`}>
                <ul className="flex flex-col items-center p-4 space-y-4">
                    <li><Link to="/" className="text-gray-600 hover:text-blue-500" onClick={() => setIsOpen(false)}>หน้าแรก</Link></li>
                    <li><Link to="/courses" className="text-gray-600 hover:text-blue-500" onClick={() => setIsOpen(false)}>คอร์สทั้งหมด</Link></li>
                    <li><Link to="/about" className="text-gray-600 hover:text-blue-500" onClick={() => setIsOpen(false)}>เกี่ยวกับเรา</Link></li>
                    <li><Link to="/contact" className="text-gray-600 hover:text-blue-500" onClick={() => setIsOpen(false)}>ติดต่อเรา</Link></li>
                </ul>
                <div className="flex flex-col items-center p-4 border-t space-y-4">
                    {user ? (
                        <UserProfileDropdown />
                    ) : (
                        <>
                            <Link to="/login" className="w-full text-center text-gray-600 hover:text-blue-500" onClick={() => setIsOpen(false)}>เข้าสู่ระบบ</Link>
                            <Link to="/register" className="w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700" onClick={() => setIsOpen(false)}>สมัครสมาชิก</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
export default Navbar;