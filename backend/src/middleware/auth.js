import jwt from "jsonwebtoken";

export function authRequired(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "토큰이 없습니다." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // req.user.user_id 사용 가능
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
}
