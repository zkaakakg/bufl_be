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
           각 목표에 대해 4개 정도의 추천 목표를 생성해주세요.
           형식은 예를들어
           recommendations: [
              {
                id:1,
                goal_name: '여행 자금 마련',
                goal_amount: 800000,
                goal_duration: 3,
                monthly_saving: 250000
              },
              {
                id:2,
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
 *     summary: AI 추천 목표 목록 가져오기
 *     description: AI로부터 추천된 저축 목표 목록을 반환합니다.
 *     responses:
 *       200:
 *         description: 목표 목록을 성공적으로 가져왔습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       goal_name:
 *                         type: string
 *                       goal_amount:
 *                         type: number
 *                       goal_duration:
 *                         type: number
 *                       monthly_saving:
 *                         type: number
 *       400:
 *         description: AI에서 추천한 목표가 없습니다.
 *       500:
 *         description: 목표 목록을 가져오는 중 오류가 발생했습니다.
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
 * /api/ai-goals/generate-goals:
 *   post:
 *     tags: [Ai]
 *     summary: 추천 목표 저장하기
 *     description: 사용자가 선택한 목표를 데이터베이스에 저장하고 자동이체를 실행합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               selectedGoalIndex:
 *                 type: number
 *               accountId:
 *                 type: number
 *     responses:
 *       200:
 *         description: 목표가 성공적으로 저장되었습니다.
 *       400:
 *         description: 유효하지 않은 선택된 목표
 *       500:
 *         description: 목표 저장 중 오류가 발생했습니다.
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

  // AI가 전달한 값 받기
  const { goal_name, monthly_saving, goal_duration, accountId } = req.body;

  if (!goal_name || !monthly_saving || !goal_duration || !accountId) {
    return res.status(400).json({ message: "모든 필드를 입력해주세요." });
  }

  try {
    const aiResponse = await getGoalRecommendations(req); // AI로부터 추천 받은 목표들
    const selectedGoalIndex = req.body.selectedGoalIndex;
    const goals = aiResponse.recommendations;

    if (!goals || goals.length === 0) {
      return res
        .status(400)
        .json({ message: "AI에서 추천한 목표가 없습니다." });
    }

    if (selectedGoalIndex < 0 || selectedGoalIndex >= goals.length) {
      return res
        .status(400)
        .json({ message: "선택된 목표가 유효하지 않습니다." });
    }

    const selectedGoal = goals[selectedGoalIndex];
    const { goal_amount } = selectedGoal;

    // 목표 저장
    const [result] = await db.query(
      `INSERT INTO goal (goal_name, goal_amount, goal_duration, goal_start, goal_end, user_id, account_id, monthly_saving)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MONTH), ?, ?, ?);`,
      [
        goal_name,
        goal_amount,
        goal_duration,
        goal_duration,
        userId,
        accountId,
        monthly_saving,
      ]
    );

    const goalId = result.insertId;

    // 목표 생성 후 자동이체 실행 로직 추가
    const [accountResult] = await db.query(
      `SELECT account_number, balance FROM account WHERE id = ?`,
      [accountId]
    );

    const account = accountResult[0];

    if (account.balance >= monthly_saving) {
      const newBalance = account.balance - monthly_saving;

      // 계좌 잔액 업데이트
      await db.query(`UPDATE account SET balance = ? WHERE id = ?`, [
        newBalance,
        accountId,
      ]);

      // 목표 금액 업데이트
      await db.query(
        `UPDATE goal SET current_amount = current_amount + ? WHERE id = ?`,
        [monthly_saving, goalId]
      );

      // 트랜잭션 기록
      await db.query(
        `INSERT INTO transaction (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc)
        VALUES (?, ?, ?, 'OUT', ?, ?, '목표 저축')`,
        [
          accountId,
          account.account_number,
          goal_name, // goal_name을 사용하여 트랜잭션 기록
          monthly_saving,
          newBalance,
        ]
      );
    } else {
      console.log(`목표 ${goalId}: 잔액 부족, 자동이체 실행되지 않음`);
    }

    res.status(200).json({
      message: "선택된 목표가 성공적으로 저장되었습니다.",
      goalId, // 생성된 goal_id 반환
      goal: selectedGoal,
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
