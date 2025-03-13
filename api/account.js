const express = require("express");
const router = express.Router();
const db = require("../db/db");

// 계좌 목록 조회 API
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
    const [results] = await db.query(
      "SELECT id AS account_id,account_number,bank_name,balance,logo FROM account WHERE user_id = ?",
      [userId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "해당 사용자 계좌가 없습니다." });
    }

    res
      .status(200)
      .json({ message: `${userId}의 계좌목록`, accounts: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 계좌 내역 조회 API
router.get("/:account_id/transactions", async (req, res) => {
  const { account_id } = req.params; // URL 파라미터에서 account_id 가져오기
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });

  // account_id가 제공되지 않았거나 유효하지 않음
  if (!account_id) {
    return res.status(400).json({ message: "계좌 ID를 제공해 주세요." });
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

    const [results] = await db.query(
      `SELECT 
        t.id AS transaction_id, 
        t.from_account_number, 
        t.to_account_number, 
        t.inout_type, 
        t.tran_amt, 
        t.tran_balance_amt,
        t.transaction_time
      FROM transaction t
      JOIN account a ON a.id = t.account_id
      WHERE a.user_id = ? AND t.account_id = ?`,
      [userId, account_id]
    );

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "해당 계좌의 거래 내역이 없습니다." });
    }

    res.status(200).json({
      message: `계좌 ${account_id}의 거래 내역`,
      transaction: results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
