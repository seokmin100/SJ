import { pool } from "../../db/connection.js";
import { hashPassword, comparePassword } from "../utils/hash.js";

export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // 이메일 중복 체크
    const [exists] = await pool.execute(
      "SELECT * FROM USER WHERE email = ?",
      [email]
    );

    if (exists.length > 0) {
      return res.status(400).json({ error: "이미 존재하는 이메일입니다." });
    }

    // 비밀번호 해시
    const hashed = await hashPassword(password);

    // 유저 생성
    const [result] = await pool.execute(
      `INSERT INTO USER (email, password, username)
       VALUES (?, ?, ?)`,
      [email, hashed, username]
    );

    return res.json({
      success: true,
      user_id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "회원가입 실패" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 유저 조회
    const [rows] = await pool.execute(
      "SELECT * FROM USER WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "존재하지 않는 이메일입니다." });
    }

    const user = rows[0];

    // 비밀번호 비교
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "비밀번호가 틀렸습니다." });
    }

    res.json({
      success: true,
      user: {
        user_id: user.user_id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "로그인 실패" });
  }
};
