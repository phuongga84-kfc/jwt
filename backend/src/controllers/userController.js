import mongoose from "mongoose";
import Session from "../models/Session.js";
import User from "../models/User.js";

function toPublicUser(user, includeContactInfo = true) {
  const publicUser = user.toObject({ versionKey: false });
  delete publicUser.hashPassword;

  if (!includeContactInfo) {
    delete publicUser.email;
    delete publicUser.phone;
  }

  return {
    ...publicUser,
    account: publicUser.email ?? publicUser.phone ?? publicUser.username,
  };
}

export const authMe = async (req, res) => {
  return res.status(200).json({ user: toPublicUser(req.user) });
};

export const listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-hashPassword")
      .sort({ createdAt: -1 });
    const isAdmin = req.user.role === "admin";

    return res.status(200).json({
      users: users.map((user) => toPublicUser(user, isAdmin)),
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách người dùng:", error);
    return res.status(500).json({ message: "Không thể tải danh sách người dùng" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Mã người dùng không hợp lệ" });
    }

    const allowedFields = ["username", "displayName", "email", "phone"];
    const fields = Object.keys(req.body);
    if (fields.length === 0 || fields.some((field) => !allowedFields.includes(field))) {
      return res.status(400).json({ message: "Thông tin cập nhật không hợp lệ" });
    }

    const update = {};
    const unset = {};
    for (const field of fields) {
      const value = req.body[field];
      if (typeof value !== "string") {
        return res.status(400).json({ message: "Thông tin cập nhật không hợp lệ" });
      }

      const trimmedValue = value.trim();
      if (field === "email" || field === "phone") {
        if (trimmedValue) {
          update[field] = trimmedValue;
        } else {
          unset[field] = 1;
        }
      } else if (trimmedValue) {
        update[field] = trimmedValue;
      } else {
        return res.status(400).json({ message: "Tên người dùng và tên hiển thị không được để trống" });
      }
    }

    if (update.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(update.email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }

    const updateQuery = {};
    if (Object.keys(update).length > 0) updateQuery.$set = update;
    if (Object.keys(unset).length > 0) updateQuery.$unset = unset;

    const user = await User.findByIdAndUpdate(userId, updateQuery, {
      new: true,
      runValidators: true,
    }).select("-hashPassword");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json({ user: toPublicUser(user) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Tên người dùng hoặc thông tin liên hệ đã tồn tại" });
    }

    console.error("Lỗi khi cập nhật người dùng:", error);
    return res.status(500).json({ message: "Không thể cập nhật người dùng" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Mã người dùng không hợp lệ" });
    }
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Không thể xóa tài khoản đang đăng nhập" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    await Session.deleteMany({ userId: user._id });
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi xóa người dùng:", error);
    return res.status(500).json({ message: "Không thể xóa người dùng" });
  }
};
