import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectedRoute = async (req, res, next) => {
  try {
    const [scheme, token] = (req.headers.authorization || "").split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Thiếu access token" });
    }

    const decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedUser.userId).select("-hashPassword");

    if (!user) {
      return res.status(401).json({ message: "Tài khoản không còn tồn tại" });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Access token không hợp lệ hoặc đã hết hạn" });
    }

    console.error("Lỗi khi xác minh JWT middleware:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
