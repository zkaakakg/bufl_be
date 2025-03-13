const express = require("express");
const router = express.Router();
const db = require("../db/db");

// 사용자(user_id)별 총 소비 내역 목록 조회 API
router.get("/", async (req, res) => {
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
    // 1. 사용자가 보유한 모든 소비내역 가져오기
    const [transactions] = await db.query(
      ` SELECT t.id, t.account_id,t.inout_type, t.tran_amt, t.tran_balance_amt,  t.tran_desc, t.transaction_time
        FROM transaction t
        JOIN account a ON t.account_id = a.id
        WHERE a.user_id = ? `,
      [userId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ message: "소비 내역이 없습니다." });
    }

    res.status(200).json({
      message: `${userId}의 소비목록`,
      totalCount: transactions.length,
      expenses: transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 사용자별 특정 월 총 지출 내역 조회 API
router.get("/:month", async (req, res) => {
  const { month } = req.params; // URL에서 user_id와 month 가져오기
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });

  if (!month) {
    return res.status(400).json({ message: "월을 제공해 주세요." });
  }

  // 날짜 형식 검증 (YYYY-MM 형식)
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(month)) {
    return res
      .status(400)
      .json({ message: "잘못된 날짜 형식입니다. 예: YYYY-MM" });
  }

  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );
    //session  없으면 만료
    if (session.length === 0)
      return res.status(401).json({ message: "세션 만료됨" });

    const userId = session[0].user_id;
    // 시작일과 종료일 계산
    const [year, monthNum] = month.split("-");
    const startDate = `${year}-${monthNum}-01`; // 시작일 (해당 월의 1일)
    const endDate = new Date(year, monthNum, 0).toISOString().split("T")[0]; // 해당 월의 마지막 날

    // SQL 쿼리 실행
    const [results] = await db.query(
      `SELECT SUM(t.tran_amt) AS total_spent
        FROM transaction t
        JOIN account a ON t.account_id = a.id
        WHERE a.user_id = ? 
          AND t.inout_type = 'OUT'
          AND DATE(t.transaction_time) >= ?  -- 시작 날짜 (날짜만 비교)
          AND DATE(t.transaction_time) <= ?  -- 끝 날짜 (날짜만 비교)`,
      [userId, startDate, endDate]
    );

    // 결과 처리
    if (results.length === 0 || results[0].total_spent === null) {
      return res
        .status(404)
        .json({ message: "지출 내역이 존재하지 않습니다." });
    }

    // 총 지출 금액 반환
    res.status(200).json({
      user_id: userId,
      total_spent: results[0].total_spent,
      month: month,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
