const express = require("express");
const db = require("../db/db");
const router = express.Router();
const schedule = require("node-schedule");

// 목표 달성 확률 계산 함수
function calculateGoalCompletionProbability(
  goal_amount,
  current_amount,
  goal_duration,
  elapsed_months
) {
  const remainingAmount = goal_amount - current_amount;
  const monthsRemaining = goal_duration - elapsed_months;
  if (monthsRemaining <= 0) return 100;
  const probability = (current_amount / goal_amount) * 100;

  // 소수점 두 자리로 제한
  return probability > 100 ? 100 : probability.toFixed(2);
}

// 경과된 월 수 계산
function getElapsedMonths(goal_start) {
  const startDate = new Date(goal_start);
  const currentDate = new Date();
  const monthDiff =
    currentDate.getMonth() -
    startDate.getMonth() +
    12 * (currentDate.getFullYear() - startDate.getFullYear());
  return monthDiff;
}

/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: 저축 목표 관련 API
 */

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: "목표 설정"
 *     description: "사용자가 새로운 저축 목표를 설정합니다. 목표 설정과 동시에 첫 자동이체가 실행됩니다."
 *     tags: [Goals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monthly_saving:
 *                 type: number
 *                 description: "매월 저축할 금액"
 *               goal_duration:
 *                 type: integer
 *                 description: "목표 기간 (개월)"
 *               account_id:
 *                 type: integer
 *                 description: "사용자의 계좌 ID"
 *     responses:
 *       201:
 *         description: "목표가 설정되었습니다."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "목표가 설정되었습니다."
 *                 goal_id:
 *                   type: integer
 *                   description: "설정된 목표의 ID"
 *                 account_number:
 *                   type: string
 *                   description: "사용자 계좌 번호"
 *                 first_transaction:
 *                   type: boolean
 *                   description: "첫 자동이체 성공 여부"
 *                 transaction_message:
 *                   type: string
 *                   description: "첫 자동이체 상태 메시지"
 *       400:
 *         description: "모든 필드가 입력되지 않았습니다."
 *       401:
 *         description: "세션이 없거나 세션이 만료되었습니다."
 *       404:
 *         description: "계좌를 찾을 수 없음"
 *       500:
 *         description: "서버 오류"
 */

router.post("/", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });

  const { monthly_saving, goal_duration, account_id } = req.body;

  if (!account_id || !monthly_saving || !goal_duration) {
    return res.status(400).json({ message: "모든 필드를 입력해주세요." });
  }

  try {
    // 세션에서 user_id 추출
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );

    if (session.length === 0)
      return res.status(401).json({ message: "세션 만료됨" });

    const userId = session[0].user_id;

    // 계좌 정보 확인
    const [accountResult] = await db.query(
      `SELECT account_number, balance FROM account WHERE id = ? AND user_id = ?`,
      [account_id, userId]
    );

    if (accountResult.length === 0) {
      return res.status(404).json({ message: "해당 계좌를 찾을 수 없습니다." });
    }

    const account = accountResult[0]; // 계좌 정보
    const goal_amount = monthly_saving * goal_duration;
    const dynamicGoalName = `${goal_amount} 모으기`;

    // 목표 저장
    const [result] = await db.query(
      `INSERT INTO goal (goal_name, goal_amount, goal_duration, goal_start, goal_end, user_id, account_id, monthly_saving, current_amount)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MONTH), ?, ?, ?, ?)`,
      [
        dynamicGoalName,
        goal_amount,
        goal_duration,
        goal_duration,
        userId,
        account_id,
        monthly_saving,
        0, // 초기 금액
      ]
    );

    const goalId = result.insertId;

    // 🔥 목표 설정과 동시에 첫 자동이체 실행!
    let transactionMessage = "첫 자동이체 성공";
    let firstTransactionSuccess = false;

    if (account.balance >= monthly_saving) {
      const newBalance = account.balance - monthly_saving;

      // 계좌 잔액 차감
      await db.query(`UPDATE account SET balance = ? WHERE id = ?`, [
        newBalance,
        account_id,
      ]);

      // 목표 금액 업데이트
      await db.query(`UPDATE goal SET current_amount = ? WHERE id = ?`, [
        monthly_saving,
        goalId,
      ]);

      // 트랜잭션 기록
      await db.query(
        `INSERT INTO transaction (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc)
        VALUES (?, ?, ?, 'OUT', ?, ?, '목표 저축')`,
        [
          account_id,
          account.account_number,
          dynamicGoalName,
          monthly_saving,
          newBalance,
        ]
      );

      firstTransactionSuccess = true;
    } else {
      transactionMessage = "첫 자동이체 실패 (계좌 잔액 부족)";
    }

    res.status(201).json({
      message: "목표가 설정되었습니다.",
      goal_id: goalId,
      account_number: account.account_number,
      first_transaction: firstTransactionSuccess,
      transaction_message: transactionMessage,
    });
  } catch (err) {
    console.error("목표 설정 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: "저축 목표 목록 전체 조회"
 *     description: "사용자의 저축 목표 목록과 목표 달성 확률을 조회합니다."
 *     tags: [Goals]
 *     responses:
 *       200:
 *         description: "목표 내역 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "목표 내역"
 *                 goals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       goal_name:
 *                         type: string
 *                       goal_amount:
 *                         type: number
 *                         format: float
 *                       current_amount:
 *                         type: number
 *                         format: float
 *                       goal_duration:
 *                         type: integer
 *                       goal_start:
 *                         type: string
 *                         format: date-time
 *                       goal_end:
 *                         type: string
 *                         format: date-time
 *                       probability:
 *                         type: integer
 *       400:
 *         description: "로그인이 필요합니다."
 *       404:
 *         description: "목표 내역이 없음"
 *       500:
 *         description: "서버 오류"
 */

// 전체 목표 조회 API
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
    //user 정보
    const userId = session[0].user_id;
    const [results] = await db.query(`SELECT * FROM goal WHERE user_id = ?`, [
      userId,
    ]);

    if (results.length === 0) {
      return res.status(404).json({ message: "목표 내역이 없습니다." });
    }

    const goalsWithProbability = results.map((goal) => {
      const elapsedMonths = getElapsedMonths(goal.goal_start);
      const probability = Math.round(
        calculateGoalCompletionProbability(
          goal.goal_amount,
          goal.current_amount || 0,
          goal.goal_duration,
          elapsedMonths
        )
      );
      return { ...goal, probability: probability };
    });

    res.status(200).json({ message: "목표 내역", goals: goalsWithProbability });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});
/**
 * @swagger
 * /api/goals/:id:
 *   get:
 *     summary: "저축 목표 목록 조회"
 *     description: "사용자의 저축 목표 목록과 목표 달성 확률을 조회합니다."
 *     tags: [Goals]
 *     responses:
 *       200:
 *         description: "목표 내역 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "목표 내역"
 *                 goals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       goal_name:
 *                         type: string
 *                       goal_amount:
 *                         type: number
 *                         format: float
 *                       current_amount:
 *                         type: number
 *                         format: float
 *                       goal_duration:
 *                         type: integer
 *                       goal_start:
 *                         type: string
 *                         format: date-time
 *                       goal_end:
 *                         type: string
 *                         format: date-time
 *                       probability:
 *                         type: integer
 *       400:
 *         description: "로그인이 필요합니다."
 *       404:
 *         description: "목표 내역이 없음"
 *       500:
 *         description: "서버 오류"
 */
//목표 테이블에서 id값 하나만 넘기기기
router.get("/:id", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });

  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );

    // session 없으면 만료 처리
    if (session.length === 0)
      return res.status(401).json({ message: "세션 만료됨" });

    const userId = session[0].user_id;
    const goalId = req.params.id; // URL 파라미터에서 goal_id 받기

    // goal 정보 조회
    const [goal] = await db.query(
      "SELECT * FROM goal WHERE user_id = ? AND id = ?",
      [userId, goalId]
    );

    if (goal.length === 0) {
      return res.status(404).json({ message: "목표를 찾을 수 없습니다." });
    }

    const elapsedMonths = getElapsedMonths(goal[0].goal_start);
    const probability = Math.round(
      calculateGoalCompletionProbability(
        goal[0].goal_amount,
        goal[0].current_amount || 0,
        goal[0].goal_duration,
        elapsedMonths
      )
    );

    res.status(200).json({
      message: "목표 상세 정보",
      goal: { ...goal[0], probability: `${probability}%` },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * @swagger
 * /api/goals/prediction:
 *   get:
 *     summary: 사용자의 목표 달성 확률 예측
 *     description: 사용자의 세션을 확인하고 목표 목록을 조회하여 각 목표의 달성 확률을 반환합니다.
 *     tags:
 *       - Goals
 *     parameters:
 *       - in: cookie
 *         name: sessionId
 *         required: true
 *         description: 사용자 로그인 세션 ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 목표 달성 확률 반환 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "목표 달성 확률"
 *                 goals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       goal_id:
 *                         type: integer
 *                         example: 1
 *                       goal_name:
 *                         type: string
 *                         example: "해외 여행"
 *                       current_amount:
 *                         type: integer
 *                         example: 500000
 *                       probability:
 *                         type: string
 *                         example: "85%"
 */
router.get("/:id/prediction", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });

  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );
    // session 없으면 만료
    if (session.length === 0)
      return res.status(401).json({ message: "세션 만료됨" });

    // user 정보
    const userId = session[0].user_id;
    const goalId = req.params.id; // URL 파라미터에서 goal_id 받기

    const [results] = await db.query(
      `SELECT * FROM goal WHERE user_id = ? AND id = ?`,
      [userId, goalId]
    );
    console.log("Goal Info for Prediction:", results);

    if (results.length === 0) {
      return res.status(404).json({ message: "목표 내역이 없습니다." });
    }

    // 목표별 확률 값만 추출
    const probabilities = results.map((goal) => {
      const elapsedMonths = getElapsedMonths(goal.goal_start);
      const probability = Math.round(
        calculateGoalCompletionProbability(
          goal.goal_amount,
          goal.current_amount || 0,
          goal.goal_duration,
          elapsedMonths
        )
      );
      return { goal_id: goal.goal_id, probability: `${probability}%` };
    });

    // 확률 값만 응답
    res.status(200).json({ message: "목표 달성 확률", probabilities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * @swagger
 * /api/goals/{goal_id}/transactions:
 *   get:
 *     summary: "특정 목표에 대한 입금 내역 조회"
 *     description: "주어진 목표 ID에 해당하는 목표에 대한 입금 내역을 조회합니다. '목표 저축'으로 설명된 거래만 포함됩니다."
 *     tags: [Goals]
 *     parameters:
 *       - name: "goal_id"
 *         in: "path"
 *         description: "목표의 고유 ID"
 *         required: true
 *         type: "integer"
 *     responses:
 *       200:
 *         description: "목표에 대한 입금 내역 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tran_amt:
 *                         type: number
 *                         description: "입금 금액"
 *                       tran_balance_amt:
 *                         type: number
 *                         description: "잔액"
 *                       tran_desc:
 *                         type: string
 *                         description: "입금 내역 설명"
 *                       transaction_time:
 *                         type: string
 *                         format: date-time
 *                         description: "입금 일시"
 *       404:
 *         description: "목표가 존재하지 않거나 입금 내역이 없는 경우"
 *       500:
 *         description: "서버 오류"
 */

//목표저축 입금내역
router.get("/:goal_id/transactions", async (req, res) => {
  const { goal_id } = req.params;

  try {
    // 목표 확인 쿼리
    const [goalResult] = await db.query(
      `SELECT goal_name FROM goal WHERE id = ?`,
      [goal_id]
    );
    if (goalResult.length === 0) {
      return res
        .status(404)
        .json({ message: "해당 목표가 존재하지 않습니다." });
    }

    // 목표에 대한 입금 내역 조회
    const [transactionResult] = await db.query(
      `SELECT t.tran_amt, t.tran_balance_amt, t.tran_desc, t.transaction_time
      FROM transaction t
      WHERE t.to_account_number = ? AND t.tran_desc = '목표 저축'
      ORDER BY t.transaction_time DESC`,
      [goalResult[0].goal_name]
    );

    // 결과가 없을 경우 처리
    if (transactionResult.length === 0) {
      return res
        .status(404)
        .json({ message: "해당 목표에 입금된 내역이 없습니다." });
    }

    // 트랜잭션 내역 반환
    res.status(200).json({ transactions: transactionResult });
  } catch (err) {
    console.error("트랜잭션 내역 조회 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

/**
 * @swagger
 * /api/goals/{goal_id}/deposit:
 *   post:
 *     summary: "목표 입금"
 *     description: "사용자가 설정한 저축 목표에 입금을 합니다."
 *     tags: [Goals]
 *     parameters:
 *       - in: path
 *         name: goal_id
 *         required: true
 *         description: "목표 ID"
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deposit_amount:
 *                 type: number
 *                 format: float
 *                 description: "입금 금액"
 *               account_id:
 *                 type: integer
 *                 description: "입금할 계좌 ID"
 *     responses:
 *       200:
 *         description: "입금 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "입금 성공"
 *                 newAmount:
 *                   type: number
 *                   format: float
 *                   description: "입금 후 목표 금액"
 *                 goal:
 *                   type: object
 *                   properties:
 *                     goal_name:
 *                       type: string
 *                     current_amount:
 *                       type: number
 *                       format: float
 *                     goal_amount:
 *                       type: number
 *                       format: float
 *       400:
 *         description: "올바른 입금 금액을 입력해주세요."
 *       404:
 *         description: "목표 또는 계좌를 찾을 수 없음"
 *       500:
 *         description: "서버 오류"
 */
// 목표 직접 입금 API
router.post("/:goal_id/deposit", async (req, res) => {
  const { goal_id } = req.params;
  const { deposit_amount, account_id } = req.body;

  if (!deposit_amount || isNaN(deposit_amount) || deposit_amount <= 0) {
    return res
      .status(400)
      .json({ message: "올바른 입금 금액을 입력해주세요." });
  }

  try {
    // 목표 정보 조회
    const [goalResult] = await db.query(
      `SELECT goal_amount, account_id, current_amount, goal_name FROM goal WHERE id = ?`,
      [goal_id]
    );

    if (goalResult.length === 0) {
      return res.status(404).json({ message: "목표를 찾을 수 없습니다." });
    }

    const goal = goalResult[0];
    const newAmount =
      parseFloat(goal.current_amount || 0) + parseFloat(deposit_amount);

    if (newAmount > goal.goal_amount) {
      return res
        .status(400)
        .json({ message: "목표 금액을 초과하는 입금은 할 수 없습니다." });
    }

    // 계좌 정보 조회 (계좌 번호를 가져오기 위해 account 테이블 조회)
    const [accountResult] = await db.query(
      `SELECT account_number, balance FROM account WHERE id = ?`,
      [account_id]
    );

    if (accountResult.length === 0) {
      return res.status(404).json({ message: "계좌를 찾을 수 없습니다." });
    }

    const account = accountResult[0]; // 계좌 정보
    const accountBalance = account.balance;
    const account_number = account.account_number; // 계좌 번호

    if (accountBalance < deposit_amount) {
      return res.status(400).json({ message: "계좌 잔액이 부족합니다." });
    }

    // 계좌에서 입금 처리
    const newBalance = accountBalance - deposit_amount;
    await db.query(`UPDATE account SET balance = ? WHERE id = ?`, [
      newBalance,
      account_id,
    ]);

    // 트랜잭션 기록
    await db.query(
      `INSERT INTO transaction (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc)
      VALUES (?, ?, ?, 'IN', ?, ?, '목표저축')`,
      [
        goal.account_id, // 목표 계좌 ID (to_account_number)
        account_number, // 사용자의 계좌 번호 (from_account_number)
        goal.goal_name, // 목표 계좌 번호 (to_account_number)
        deposit_amount, // 입금 금액
        newBalance, // 입금 후 잔액
      ]
    );

    // 목표 금액 업데이트
    await db.query(`UPDATE goal SET current_amount = ? WHERE id = ?`, [
      newAmount,
      goal_id,
    ]);

    res.status(200).json({
      message: "입금 성공",
      newAmount,
      goal: {
        goal_name: goal.goal_name,
        current_amount: newAmount,
        goal_amount: goal.goal_amount,
      },
    });
  } catch (err) {
    console.error("입금 처리 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
