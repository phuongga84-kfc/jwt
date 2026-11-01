import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/Stores/useAuthStore";
import type { User } from "@/types/user";
import Signout from "@/pages/Signout.tsx";

type UserForm = Pick<User, "username" | "displayName"> & {
  email: string;
  phone: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

export const HomePage = () => {
  const { user, fetchCurrentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [listError, setListError] = useState("");
  const [actionError, setActionError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UserForm>({
    username: "",
    displayName: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    void fetchCurrentUser();

    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        setListError("");
        setUsers(await authService.getUsers());
      } catch (error) {
        setListError(getErrorMessage(error, "Không thể tải danh sách người dùng"));
      } finally {
        setLoadingUsers(false);
      }
    };

    void loadUsers();
  }, [fetchCurrentUser]);

  const startEditing = (target: User) => {
    setActionError("");
    setEditingId(target._id);
    setEditForm({
      username: target.username,
      displayName: target.displayName,
      email: target.email ?? "",
      phone: target.phone ?? "",
    });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingId) return;

    try {
      setSaving(true);
      setActionError("");
      const updatedUser = await authService.updateUser(editingId, editForm);
      setUsers((currentUsers) =>
        currentUsers.map((current) =>
          current._id === updatedUser._id ? updatedUser : current,
        ),
      );
      if (user?._id === updatedUser._id) {
        useAuthStore.setState({ user: updatedUser });
      }
      setEditingId(null);
    } catch (error) {
      setActionError(getErrorMessage(error, "Không thể cập nhật người dùng"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (target: User) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa tài khoản "${target.username}"? Thao tác này không thể hoàn tác.`,
      )
    ) {
      return;
    }

    try {
      setDeletingId(target._id);
      setActionError("");
      await authService.deleteUser(target._id);
      setUsers((currentUsers) =>
        currentUsers.filter((current) => current._id !== target._id),
      );
      if (editingId === target._id) setEditingId(null);
    } catch (error) {
      setActionError(getErrorMessage(error, "Không thể xóa người dùng"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">
              Trang chủ
            </p>
            <h1 className="mt-2 text-3xl font-bold">Quản lý người dùng</h1>
          </div>
          <Signout />
        </header>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Tài khoản của bạn</h2>
              <p className="mt-1 text-sm text-slate-400">
                Thông tin hồ sơ hiện tại
              </p>
            </div>
            {user?.role && (
              <span className="rounded-full bg-orange-500/15 px-3 py-1 text-sm font-medium text-orange-300">
                {user.role}
              </span>
            )}
          </div>
          {user ? (
            <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-slate-400">Tên hiển thị</dt>
                <dd className="mt-1 font-medium">{user.displayName}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Tên người dùng</dt>
                <dd className="mt-1 font-medium">{user.username}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Tài khoản</dt>
                <dd className="mt-1 font-medium">{user.account}</dd>
              </div>
            </dl>
          ) : (
            <p role="status" className="text-slate-400">
              Đang tải thông tin người dùng...
            </p>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-xl font-semibold">Danh sách người dùng</h2>
            <p className="mt-1 text-sm text-slate-400">
              {isAdmin
                ? "Bạn có thể cập nhật thông tin hoặc xóa tài khoản."
                : "Danh sách tài khoản đã đăng ký."}
            </p>
          </div>

          {actionError && (
            <p role="alert" className="mx-6 mt-5 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
              {actionError}
            </p>
          )}
          {listError && (
            <p role="alert" className="m-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
              {listError}
            </p>
          )}

          {loadingUsers ? (
            <p role="status" className="p-6 text-slate-400">
              Đang tải danh sách người dùng...
            </p>
          ) : users.length === 0 ? (
            <p className="p-6 text-slate-400">Chưa có người dùng nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-800/60 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th scope="col" className="px-6 py-4">Người dùng</th>
                    <th scope="col" className="px-6 py-4">Tên đăng nhập</th>
                    <th scope="col" className="px-6 py-4">Vai trò</th>
                    {isAdmin && (
                      <>
                        <th scope="col" className="px-6 py-4">Email</th>
                        <th scope="col" className="px-6 py-4">Điện thoại</th>
                        <th scope="col" className="px-6 py-4">Thao tác</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((listedUser) => {
                    const isEditing = editingId === listedUser._id;
                    const isCurrentUser = listedUser._id === user?._id;

                    return (
                      <tr key={listedUser._id} className="align-top">
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <label className="block">
                              <span className="sr-only">Tên hiển thị</span>
                              <input
                                form="edit-user-form"
                                required
                                value={editForm.displayName}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    displayName: event.target.value,
                                  })
                                }
                                className="w-44 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-orange-500"
                              />
                            </label>
                          ) : (
                            <span className="font-medium text-white">
                              {listedUser.displayName}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-orange-300">(Bạn)</span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {isEditing ? (
                            <label className="block">
                              <span className="sr-only">Tên người dùng</span>
                              <input
                                form="edit-user-form"
                                required
                                value={editForm.username}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    username: event.target.value,
                                  })
                                }
                                className="w-40 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-orange-500"
                              />
                            </label>
                          ) : (
                            listedUser.username
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                            {listedUser.role}
                          </span>
                        </td>
                        {isAdmin && (
                          <>
                            <td className="px-6 py-4 text-slate-300">
                              {isEditing ? (
                                <label className="block">
                                  <span className="sr-only">Email</span>
                                  <input
                                    form="edit-user-form"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(event) =>
                                      setEditForm({
                                        ...editForm,
                                        email: event.target.value,
                                      })
                                    }
                                    className="w-48 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-orange-500"
                                  />
                                </label>
                              ) : (
                                listedUser.email ?? "—"
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {isEditing ? (
                                <label className="block">
                                  <span className="sr-only">Số điện thoại</span>
                                  <input
                                    form="edit-user-form"
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(event) =>
                                      setEditForm({
                                        ...editForm,
                                        phone: event.target.value,
                                      })
                                    }
                                    className="w-40 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-orange-500"
                                  />
                                </label>
                              ) : (
                                listedUser.phone ?? "—"
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    form="edit-user-form"
                                    disabled={saving}
                                    className="rounded-lg bg-orange-500 px-3 py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-60"
                                  >
                                    {saving ? "Đang lưu..." : "Lưu"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    disabled={saving}
                                    className="rounded-lg bg-slate-700 px-3 py-2 font-medium text-white hover:bg-slate-600 disabled:opacity-60"
                                  >
                                    Hủy
                                  </button>
                                  <form
                                    id="edit-user-form"
                                    className="hidden"
                                    onSubmit={(event) => void handleSave(event)}
                                  />
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEditing(listedUser)}
                                    disabled={deletingId === listedUser._id}
                                    className="rounded-lg bg-slate-700 px-3 py-2 font-medium text-white hover:bg-slate-600 disabled:opacity-60"
                                  >
                                    Sửa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDelete(listedUser)}
                                    disabled={isCurrentUser || deletingId === listedUser._id}
                                    title={isCurrentUser ? "Không thể xóa tài khoản đang đăng nhập" : undefined}
                                    className="rounded-lg bg-red-600/90 px-3 py-2 font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {deletingId === listedUser._id ? "Đang xóa..." : "Xóa"}
                                  </button>
                                </div>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};
