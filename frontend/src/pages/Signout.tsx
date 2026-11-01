import { useAuthStore } from "@/Stores/useAuthStore";
import { useState } from "react";
import { useNavigate } from "react-router";

const Signout = () => {
  const { Logout } = useAuthStore();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await Logout();
      navigate("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={loggingOut}
      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold rounded-lg shadow-md transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  );
};

export default Signout;
