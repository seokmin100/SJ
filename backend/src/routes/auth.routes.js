import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);  // 회원가입
router.post("/login", login);        // 로그인

// 로그인된 사용자 확인 API
router.get("/me", authRequired, (req, res) => {
  res.json({
    logged_in: true,
    user: req.user,
  });
});

export default router;
