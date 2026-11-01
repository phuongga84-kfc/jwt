import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { SignUpPage } from "./pages/SignUpPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { Toaster } from "sonner";
import { useAuthStore } from "./Stores/useAuthStore";

function SessionInitializer() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return null;
}

function ProtectedHome() {
  const { accessToken, sessionReady } = useAuthStore();

  if (!sessionReady) {
    return <div role="status">Đang khôi phục phiên đăng nhập...</div>;
  }

  return accessToken ? <HomePage /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <SessionInitializer />
        <Routes>
          {/* Các trang công khai */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          {/* Chỉ cho phép truy cập trang chủ khi đã có phiên hợp lệ */}
          <Route path="/" element={<ProtectedHome />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
