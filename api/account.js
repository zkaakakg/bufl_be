const express = require("express");
const router = express.Router();
const db = require("../db/db");

// 계좌 목록 조회 API
// router.get("/", async (req, res) => {
//   try {
//     const [results] = await db.query("SELECT * FROM account");
//     if (results.length === 0) {
//       return res.status(404).json({ message: "등록된 계좌가 없습니다." });
//     }
//     res.status(200).json({ message: "계좌목록 조회 성공", accounts: results });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "서버오류" });
//   }
// });
/**
 * @swagger
 * tags:
 *   - name: Accounts
 *     description: 계좌 관련 API
 */

// 계좌 목록 조회 API
/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: 사용자 계좌 목록 조회
 *     tags: [Accounts]
 *     description: 인증된 사용자의 계좌 목록을 조회합니다.
 *     responses:
 *       200:
 *         description: 사용자 계좌 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "44의 계좌목록"
 *                 accounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       account_id:
 *                         type: integer
 *                         example: 1
 *                       user_id:
 *                         type: integer
 *                         example: 44
 *                       account_number:
 *                         type: string
 *                         example: "123-456-789"
 *       404:
 *         description: 해당 사용자 계좌가 없습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "해당 사용자 계좌가 없습니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버 오류"
 */

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
/**
 * @swagger
 * /api/accounts/{account_id}/transactions:
 *   get:
 *     summary: 계좌 거래 내역 조회
 *     tags: [Accounts]
 *     description: 특정 계좌의 거래 내역을 조회합니다.
 *     parameters:
 *       - in: path
 *         name: account_id
 *         required: true
 *         description: 거래 내역을 조회할 계좌 ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: 계좌의 거래 내역
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "계좌 1의 거래 내역"
 *                 transaction:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       transaction_id:
 *                         type: integer
 *                         example: 1001
 *                       from_account_number:
 *                         type: string
 *                         example: "123-456-789"
 *                       to_account_number:
 *                         type: string
 *                         example: "987-654-321"
 *                       inout_type:
 *                         type: string
 *                         example: "입금"
 *                       tran_amt:
 *                         type: integer
 *                         example: 50000
 *                       tran_balance_amt:
 *                         type: integer
 *                         example: 1000000
 *                       transaction_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-03-04T12:34:56Z"
 *       404:
 *         description: 해당 계좌의 거래 내역이 없습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "해당 계좌의 거래 내역이 없습니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버 오류"
 */
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
