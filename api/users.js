const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../db/db");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

router.get("/", async (req, res) => {
  try {
    res.json({ message: "시작 화면입니다." });
  } catch (err) {
    console.error("시작 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

router.post("/", async (req, res) => {
  const { userName, userRegnu, userPhone, userPassword } = req.body;
  try {
    if (!userName || !userRegnu || !userPhone) {
      return res.status(400).json({ message: "모든 정보를 입력하세요." });
    }

    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE user_regnu = ? OR user_phone = ?",
      [userRegnu, userPhone]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "이미 가입된 회원입니다." });
    }
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    const [result] = await db.query(
      "INSERT INTO users (user_name, user_regnu, user_phone, user_password) VALUES (?, ?, ?, ?)",
      [userName, userRegnu, userPhone, hashedPassword]
    );

    const sessionId = uuidv4();
    await db.query("INSERT INTO sessions (user_id, session_id) VALUES (?, ?)", [
      result.insertId,
      sessionId,
    ]);

    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: true, // 배포 시 true (HTTPS 필수)
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "none", // 7일 유지
    });

    res.status(201).json({ message: "회원가입 및 자동 로그인 완료" });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// PIN 번호 등록
router.put("/update-password", async (req, res) => {
  const { userPassword } = req.body;
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });
  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );

    if (session.length === 0)
      return res.status(401).json({ message: "세션 만료됨" });

    const userId = session[0].user_id;
    if (userPassword) {
      const hashedPassword = await bcrypt.hash(userPassword, 10);

      await db.query("UPDATE users SET user_password = ? WHERE id = ? ", [
        hashedPassword,
        userId,
      ]);
      res.status(200).json({ message: "PiN 번호 등록 성공" });
    }
  } catch (err) {
    console.error("PiN 번호 등록 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.get("/pin", async (req, res) => {
  try {
    res.json({ message: "PIN 번호 화면입니다." });
  } catch (err) {
    console.error("PIN 번호 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

router.post("/pin", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  const { userPassword } = req.body;

  if (!sessionId) return res.status(401).json({ message: "세션 없음" });
  try {
    if (userPassword) {
      const [session] = await db.query(
        "SELECT user_id FROM sessions WHERE session_id = ?",
        [sessionId]
      );

      if (session.length === 0)
        return res.status(401).json({ message: "세션 만료됨" });

      const [user] = await db.query("SELECT * FROM users WHERE id = ?", [
        session[0].user_id,
      ]);

      if (!user.length)
        return res.status(401).json({ message: "사용자 정보 없음" });

      const hashedPassword = user[0].user_password;

      bcrypt.compare(userPassword, hashedPassword, (err, isMatch) => {
        if (err) throw err;

        if (isMatch) {
          res.status(201).json({ message: "PIN 번호 인증 성공" });
        } else {
          res.status(400).json({ message: "PIN 번호 인증 오류" });
        }
      });
    }
  } catch (err) {
    console.error("PIN 번호 인증 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.get("/salary", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });

  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );

    //session  없으면 만료
    if (session.length === 0)
      return res.status(401).json({ message: "세션 만료됨" });

    const userId = session[0].user_id;

    const [salary] = await db.query(
      "SELECT account_id, amount, pay_date FROM salary WHERE user_id = ?",
      [userId]
    );

    const salaryAccountId = salary[0].account_id;
    const [salaryAccount] = await db.query(
      "SELECT bank_name, account_number FROM account WHERE id = ?",
      [salaryAccountId]
    );

    res.status(200).json({
      salaryAccount: salaryAccount[0],
      amount: salary[0].amount,
      payDate: salary[0].pay_date,
    });
  } catch (err) {
    console.error("월급 정보 입력 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

// 월급 정보 입력
router.post("/salary", async (req, res) => {
  const { amount, payDate, accountId } = req.body;
  try {
    if (!amount || !payDate || !accountId) {
      return res.status(400).json({ message: "모든 정보를 입력하세요!" });
    }

    const [userResult] = await db.query(
      "SELECT user_id FROM account WHERE id = ?",
      [accountId]
    );
    if (userResult.length === 0) {
      return res.status(404).json({ message: "Account not found" });
    }
    const userId = userResult[0].user_id;

    const [salaryResult] = await db.query(
      "INSERT INTO salary (account_id, user_id, amount, pay_date, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [accountId, userId, amount, payDate]
    );
    res.status(201).json({
      message: "월급 입력정보 성공",
      salaryId: salaryResult.insertId,
    });
  } catch (err) {
    console.error("월급 정보 입력 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

router.get("/interests", async (req, res) => {
  try {
    res.json({ message: "관심사 선택 화면입니다." });
  } catch (err) {
    console.error("관심사 선택 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
});

router.post("/interests", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });
  const { interest } = req.body;

  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );

    if (session.length === 0)
      return res.status(401).json({ message: "세션 만료됨" });

    const userId = session[0].user_id;

    if (!userId) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const [insertResult] = await db.query(
      "INSERT INTO interests (user_id, name) VALUES (?, ?)",
      [userId, interest]
    );

    res.json({ message: "관심사 등록 성공" });
  } catch (err) {
    console.error("관심사 등록 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

//회원 탈퇴
router.delete("/delete", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });

  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );

    //session  없으면 만료
    if (session.length === 0)
      return res.status(401).json({ message: "세션 만료됨" });

    const userId = session[0].user_id;
    //1. 연관 데이터 삭제 (월급 정보, 관심사 등)

    await db.query("DELETE FROM salary WHERE user_id = ?", [userId]);
    await db.query("DELETE FROM interests WHERE user_id = ?", [userId]);

    const [result] = await db.query("DELETE FROM users WHERE id = ?", [userId]);
    // 2. 사용자 계정 삭제
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "회원 정보를 찾을 수 없습니다." });
    }
    // 3. 세션 삭제
    await db.query("DELETE FROM sessions WHERE session_id = ?", [sessionId]);
    // ✅ 2. 쿠키 제거
    res.clearCookie("sessionId");
    res.json({ message: "회원탈퇴 완료" });
  } catch (err) {
    console.error("회원 탈퇴 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
