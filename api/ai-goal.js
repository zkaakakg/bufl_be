const { Anthropic } = require("@anthropic-ai/sdk");
require("dotenv").config("../.env");
const express = require("express");
const db = require("../db/db");

const router = express.Router();

const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = new Anthropic({ apiKey });
// AI에게 목표 추천 요청
// AI로부터 추천 받은 목표를 세션에 저장하는 함수
async function getGoalRecommendations(req) {
  try {
    // 세션에서 이미 데이터가 있는지 확인
    const cachedData = req.session.goalRecommendations;

    if (cachedData) {
      console.log("세션에서 데이터 반환:", cachedData);
      return cachedData;
    }

    // 세션에 데이터가 없으면 AI로부터 데이터를 받아옴
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      temperature: 0.7,
      system:
        "당신은 저축 목표를 추천하는 도우미입니다. 목표 금액과 기간을 고려해 월별 저축액을 5만원 단위로 계산해 추천합니다. 결과는 JSON 형식으로만 응답하고 줄바꿈하지 마세요.",
      messages: [
        {
          role: "user",
          content: `저축 목표를 추천해주세요. 목표 금액은 50만원에서 300만원 사이로 설정하고, 기간은 3개월에서 36개월 사이로 설정해주세요.
           각 목표에 대해 4개만 추천 목표를 생성해주세요.
           형식은 예를들어
           recommendations: [
              {
                id:0,
                goal_name: '여행 자금 마련',
                goal_amount: 800000,
                goal_duration: 3,
                monthly_saving: 250000
              },
              {
                id:1,
                goal_name: '겨울 패딩 구매',
                goal_amount: 500000,
                goal_duration: 5,
                monthly_saving: 100000
              }
           로 JSON 형식으로 제공해주세요.`,
        },
      ],
    });

    const parsedResponse = JSON.parse(response.content[0].text);
    console.log("AI 응답 내용:", parsedResponse);

    // 세션에 데이터 저장
    req.session.goalRecommendations = parsedResponse;

    return parsedResponse;
  } catch (error) {
    console.error("AI 목표 추천 오류:", error.message);
    throw new Error("AI 목표 추천 실패: " + error.message);
  }
}

/**
 * @swagger
 * /api/ai-goals:
 *   get:
 *     tags: [Ai]
 *     summary: "AI 추천 목표 목록을 가져오는 API"
 *     description: "AI로부터 추천받은 목표 목록을 가져와서 응답으로 반환합니다."
 *     responses:
 *       200:
 *         description: "AI 추천 목표 목록을 성공적으로 가져왔습니다."
 *         schema:
 *           type: "object"
 *           properties:
 *             message:
 *               type: "string"
 *               example: "AI 추천 목표 목록을 성공적으로 가져왔습니다."
 *             recommendations:
 *               type: "array"
 *               items:
 *                 type: "object"
 *                 properties:
 *                   goal_name:
 *                     type: "string"
 *                   goal_amount:
 *                     type: "number"
 *                     format: "float"
 *                   goal_duration:
 *                     type: "integer"
 *                   goal_start:
 *                     type: "string"
 *                     format: "date-time"
 *                   goal_end:
 *                     type: "string"
 *                     format: "date-time"
 *       400:
 *         description: "AI에서 추천한 목표가 없습니다."
 *         schema:
 *           type: "object"
 *           properties:
 *             message:
 *               type: "string"
 *               example: "AI에서 추천한 목표가 없습니다."
 *       401:
 *         description: "세션 오류 (세션 없음)"
 *         schema:
 *           type: "object"
 *           properties:
 *             message:
 *               type: "string"
 *               example: "세션 없음"
 *       500:
 *         description: "서버 오류 (AI 추천 목표 목록 가져오기 실패)"
 *         schema:
 *           type: "object"
 *           properties:
 *             message:
 *               type: "string"
 *               example: "목표 추천 목록을 가져오는 중 오류가 발생했습니다."
 */
// AI 추천 목표 목록 가져오기 (GET)
router.get("/", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });
  try {
    // AI로부터 목표 추천을 받아옵니다.
    const aiResponse = await getGoalRecommendations(req);

    if (!aiResponse || aiResponse.length === 0) {
      return res
        .status(400)
        .json({ message: "AI에서 추천한 목표가 없습니다." });
    }

    // AI 추천 목표 목록을 응답으로 반환
    res.status(200).json({
      message: "AI 추천 목표 목록을 성공적으로 가져왔습니다.",
      recommendations: aiResponse, // AI 추천 목표 목록
    });
  } catch (error) {
    console.error("AI 추천 목표 목록 가져오기 실패:", error);
    res
      .status(500)
      .json({ message: "목표 추천 목록을 가져오는 중 오류가 발생했습니다." });
  }
});

/**
 * @swagger
 *   /api/ai-goals/generate-goals:
 *     post:
 *       tags: [Ai]
 *       summary: 사용자가 선택한 목표를 생성하고 자동이체를 실행합니다.
 *       description: 사용자가 선택한 목표 정보를 기반으로 목표를 생성하고, 자동이체가 실행됩니다.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 goal_name:
 *                   type: string
 *                   description: 목표 이름
 *                   example: string
 *                 monthly_saving:
 *                   type: number
 *                   description: 월 저축액
 *                   example: 0
 *                 goal_duration:
 *                   type: number
 *                   description: 목표 기간 (개월)
 *                   example: 0
 *                 accountId:
 *                   type: integer
 *                   description: 계좌 ID
 *                   example: 0
 *       responses:
 *         200:
 *           description: 목표가 성공적으로 저장되었습니다.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "선택된 목표가 성공적으로 저장되었습니다."
 *                   goalId:
 *                     type: integer
 *                     description: 생성된 목표 ID
 *                     example: 123
 *                   goal:
 *                     type: object
 *                     properties:
 *                       goal_name:
 *                         type: string
 *                         example: "여행 저축"
 *                       goal_amount:
 *                         type: number
 *                         example: 1200000
 *                       goal_duration:
 *                         type: number
 *                         example: 12
 *                       monthly_saving:
 *                         type: number
 *                         example: 100000
 *         400:
 *           description: 필수 값이 부족하거나 잘못된 요청
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "목표 이름, 계좌 ID, 월 저축액, 목표 기간은 필수입니다."
 *         401:
 *           description: 세션 없음 또는 세션 만료됨
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "세션 없음"
 *         500:
 *           description: 서버 오류
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "목표 추천 또는 저장 중 오류가 발생했습니다."
 */

router.post("/generate-goals", async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return res.status(401).json({ message: "세션 없음" });

  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );

  if (session.length === 0)
    return res.status(401).json({ message: "세션 만료됨" });

  const userId = session[0].user_id;

  // 클라이언트로부터 선택된 목표 값 받기
  const { goal_name, monthly_saving, goal_duration, accountId } = req.body;

  // 필수 값 확인
  if (!goal_name || !accountId || !monthly_saving || !goal_duration) {
    return res.status(400).json({
      message: "목표 이름, 계좌 ID, 월 저축액, 목표 기간은 필수입니다.",
    });
  }
  const monthly_saving_amt = monthly_saving * 10000;
  // goal_amount는 monthly_saving과 goal_duration에 따라 계산됨
  const goal_amount = monthly_saving_amt * goal_duration;

  try {
    let newGoalId;

    // 새로운 목표를 생성
    const [result] = await db.query(
      `INSERT INTO goal (goal_name, goal_amount, goal_duration, goal_start, goal_end, user_id, account_id, monthly_saving)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MONTH), ?, ?, ?);`,
      [
        goal_name,
        goal_amount, // 계산된 goal_amount 사용
        goal_duration,
        goal_duration,
        userId,
        accountId,
        monthly_saving_amt,
      ]
    );
    newGoalId = result.insertId; // 자동 생성된 goalId

    // 목표 생성 후 자동이체 실행 로직 추가
    const [accountResult] = await db.query(
      `SELECT account_number, balance FROM account WHERE id = ?`,
      [accountId]
    );

    const account = accountResult[0];

    if (account.balance >= monthly_saving_amt) {
      const newBalance = account.balance - monthly_saving_amt;

      // 계좌 잔액 업데이트
      await db.query(`UPDATE account SET balance = ? WHERE id = ?`, [
        newBalance,
        accountId,
      ]);

      // 목표 금액 업데이트
      await db.query(
        `UPDATE goal SET current_amount = current_amount + ? WHERE id = ?`,
        [monthly_saving_amt, newGoalId]
      );

      // 트랜잭션 기록
      await db.query(
        `INSERT INTO transaction (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc)
        VALUES (?, ?, ?, 'OUT', ?, ?, '목표 저축')`,
        [
          accountId,
          account.account_number,
          goal_name, // goal_name을 사용하여 트랜잭션 기록
          monthly_saving_amt,
          newBalance,
        ]
      );
    } else {
      console.log(`목표 ${newGoalId}: 잔액 부족, 자동이체 실행되지 않음`);
    }

    res.status(200).json({
      message: "선택된 목표가 성공적으로 저장되었습니다.",
      goalId: newGoalId, // 생성된 goal_id 반환
      goal: {
        goal_name,
        goal_amount, // 계산된 goal_amount
        goal_duration,
        monthly_saving_amt,
      },
    });
  } catch (error) {
    console.error("목표 추천 또는 DB 저장 실패:", error);
    res
      .status(500)
      .json({ message: "목표 추천 또는 저장 중 오류가 발생했습니다." });
  }
});

// 모듈 내보내기 (라우터 내보내기)
module.exports = router;
