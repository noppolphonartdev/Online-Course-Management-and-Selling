import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { isUserLoggedIn, isAdminLoggedIn } from "./utils/auth";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

// pages user
import HomePage from "./pages/user/HomePage";
import CourseDetail from "./pages/user/CourseDetail";
import CheckoutPage from "./pages/user/CheckoutPage";
import MyOrders from "./pages/user/MyOrders";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import EmailVerify from "./pages/user/EmailVerify";
import VerifyPending from "./pages/user/VerifyPending";
import AccountSetting from "./pages/user/AccountSetting";
import CertificatePage from "./pages/user/CertificatePage";

// pages admin
import AdminCourses from "./pages/admin/AdminCourses";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminOrders from "./pages/admin/AdminOrders";

// components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function AppRouter() {
  //ซ่อน nav ใน admin
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      {/*เรียกใช้ components */}
      {!isAdminPage && (
        <div className="print:hidden">
          <Navbar />
        </div>
      )}
      <main className="flex-1">
        <Routes>
          {/*เรีกใช้ pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/checkout/:id" element={<CheckoutPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify/:token" element={<EmailVerify />} />
          <Route path="/verify-pending" element={<VerifyPending />} />
          <Route path="/certificate/:courseId" element={<CertificatePage />} />
          <Route
            path="/my-orders"
            element={isUserLoggedIn() ? <MyOrders /> : <Navigate to="/login" />}
          />
          <Route
            path="/account"
            element={
              isUserLoggedIn() ? <AccountSetting /> : <Navigate to="/login" />
            }
          />

          {/* --- admin --- */}
          {/* ถ้าเข้ามาที่ /admin ให้ redirect ไป /admin/dashboard */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />

          {/* ป้องกันเข้าหน้าแอดมินทุกหน้า */}
          <Route
            path="/admin/dashboard"
            element={
              isAdminLoggedIn() ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route
            path="/admin/courses"
            element={
              isAdminLoggedIn() ? (
                <AdminCourses />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route
            path="/admin/members"
            element={
              isAdminLoggedIn() ? (
                <AdminMembers />
            path="/admin/orders"
            element={
              isAdminLoggedIn() ? (
                <AdminOrders />
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </main>
      {!isAdminPage && (
        <div className="print:hidden">
          <Footer />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </Router>
  );
}

export default App;
