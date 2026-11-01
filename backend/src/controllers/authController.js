import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Session from "../models/Session.js";
import crypto from "crypto";

const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

function createAccessToken(userId) {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
}

function setRefreshCookie(req, res, refreshToken) {
  const forwardedProtocol = req
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim()
    .toLowerCase();
  const isSecure = req.secure || forwardedProtocol === "https";

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    maxAge: REFRESH_TOKEN_TTL,
    path: "/api/auth",
  });
}

function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", { path: "/api/auth" });
}

function toPublicUser(user) {
  const publicUser = user.toObject({ versionKey: false });
  delete publicUser.hashPassword;

  return {
    ...publicUser,
    account: publicUser.email ?? publicUser.phone ?? publicUser.username,
  };
}

function checkAccount(account) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)) {
    return { email: account };
  } else if (/^0\d{9}$/.test(account)) {
    return { phone: account };
  } else {
    return { username: account };
  }
}

export const signup = async (req, res) => {
  try {
    const { username, password, account, displayName } = req.body;

    // kiểm tra thông tin đầy đủ
    if (!username || !password || !account || !displayName)
      return res.status(400).json({ message: "Không thể thiếu thông tin" });

    // kiểm tra thông tin tồn tại
    const duplicate = await User.findOne({
      $or: [{ username }, { email: account }, { phone: account }],
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Username, email hoặc số điện thoại đã tồn tại",
      });
    }
    // mã hóa password
    const hashPassword = await bcrypt.hash(password, 10);

    // tạo người dùng
    // kiểm tra là email hay số điện thoại
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (regex.test(account)) {
      await User.create({
        username,
        hashPassword,
        email: account,
        displayName,
        role: "user",
      });
    } else {
      await User.create({
        username,
        hashPassword,
        phone: account,
        displayName,
        role: "user",
      });
    }
    console.log(`Tài khoản ${username} đã được tạo thành công!`);
    return res.sendStatus(204);
    // return
  } catch (error) {
    console.error("Lỗi khi đăng ký: ", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const login = async (req, res) => {
  try {
    const { account, password } = req.body;
    if (typeof account !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ!",
      });
    }
    if (!account || !password) {
      return res
        .status(400)
        .json({ message: "không thể thiếu username hoặc password!" });
    }

    // so sánh hashpassword
    const user = await User.findOne(checkAccount(account));

    if (!user) {
      return res
        .status(401)
        .json({ message: "username hoặc mật khẩu không chính xác!" });
    }

    // kiểm tra pass
    const passwordCorrect = await bcrypt.compare(password, user.hashPassword);

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "username hoặc mật khẩu không chính xác!" });
    }

    const accessToken = createAccessToken(user._id.toString());

    // Tạo refresh token có thời hạn 14 ngày cho phiên đăng nhập này.
    const refreshToken = crypto.randomBytes(64).toString("hex");

    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    setRefreshCookie(req, res, refreshToken);
    console.log(`Người dùng ${user.username} đăng nhập thành công!`);
    return res.status(200).json({
      message: "Đăng nhập thành công!",
      accessToken,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập: ", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const refresh = async (req, res) => {
  try {
    const currentRefreshToken = req.cookies?.refreshToken;
    if (!currentRefreshToken) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn" });
    }

    const session = await Session.findOne({
      refreshToken: currentRefreshToken,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ" });
    }

    const user = await User.findById(session.userId).select("-hashPassword");
    if (!user) {
      await Session.deleteOne({ _id: session._id });
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Tài khoản không còn tồn tại" });
    }

    // Xoay refresh token sau mỗi lần dùng để token cũ không thể tái sử dụng.
    const nextRefreshToken = crypto.randomBytes(64).toString("hex");
    const updatedSession = await Session.findOneAndUpdate(
      {
        _id: session._id,
        refreshToken: currentRefreshToken,
        expiresAt: { $gt: new Date() },
      },
      {
        refreshToken: nextRefreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
      },
      { new: true },
    );

    if (!updatedSession) {
      clearRefreshCookie(res);
      return res
        .status(401)
        .json({ message: "Phiên đăng nhập đã được làm mới" });
    }

    setRefreshCookie(req, res, nextRefreshToken);
    return res.status(200).json({
      accessToken: createAccessToken(user._id.toString()),
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Lỗi khi làm mới phiên đăng nhập:", error);
    return res
      .status(500)
      .json({ message: "Không thể làm mới phiên đăng nhập" });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await Session.deleteOne({ refreshToken: token });
    }

    clearRefreshCookie(res);
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi đăng xuất: ", error);
    clearRefreshCookie(res);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
