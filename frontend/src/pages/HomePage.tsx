import { useEffect } from "react";
import { useAuthStore } from "@/Stores/useAuthStore";
import Signout from "@/pages/Signout.tsx";

export const HomePage = () => {
  const { user, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    void fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Thông tin người dùng</h1>
          <Signout />
        </div>
        {user ? (
          <dl className="space-y-3 text-slate-300">
            <div>
              <dt className="font-medium text-white">Tên hiển thị</dt>
              <dd>{user.displayName}</dd>
            </div>
            <div>
              <dt className="font-medium text-white">Tên người dùng</dt>
              <dd>{user.username}</dd>
            </div>
            <div>
              <dt className="font-medium text-white">Tài khoản</dt>
              <dd>{user.account}</dd>
            </div>
            {user.email && (
              <div>
                <dt className="font-medium text-white">Email</dt>
                <dd>{user.email}</dd>
              </div>
            )}
            {user.phone && (
              <div>
                <dt className="font-medium text-white">Số điện thoại</dt>
                <dd>{user.phone}</dd>
              </div>
            )}
            {user.role && (
              <div>
                <dt className="font-medium text-white">Vai trò</dt>
                <dd>{user.role}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p role="status" className="text-slate-400">
            Đang tải thông tin người dùng...
          </p>
        )}
      </section>
    </main>
  );
};
