const express = require("express");
const session = require("express-session");
const router = express.Router();
const db = require("../db/db");

require("dotenv").config("../.env");
const { Anthropic } = require("@anthropic-ai/sdk");
const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = new Anthropic({
  apiKey: apiKey,
});
/**
 * @swagger
 * /api/ai-analysis/recommend:
 *   get:
 *     summary: 추천 결과 조회
 *     description: 로그인된 사용자의 관심사와 급여 정보 등을 바탕으로 추천 결과를 조회합니다.
 *     tags: [Ai]
 *     responses:
 *       200:
 *         description: 추천 결과를 반환합니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendRatio:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       ratio:
 *                         type: number
 *                       amount:
 *                         type: number
 *       400:
 *         description: 로그인되지 않은 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그인이 필요합니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

/**
 * @swagger
 * /api/ai-analysis/recommend:
 *   post:
 *     summary: 추천 결과 저장
 *     description: 추천 결과를 카테고리 테이블에 저장합니다.
 *     tags: [Ai]
 *     responses:
 *       201:
 *         description: 추천 결과가 성공적으로 저장되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "5개의 카테고리가 추가되었습니다."
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

/**
 * @swagger
 * /api/ai-analysis/:
 *   get:
 *     summary: 거래내역 조회
 *     description: 사용자의 거래내역을 조회하여 소비 패턴 분석 결과를 반환합니다.
 *     tags: [Ai]
 *     responses:
 *       200:
 *         description: 소비 패턴 분석 결과를 반환합니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysisResult:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       amount:
 *                         type: number
 *       400:
 *         description: 로그인되지 않은 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그인이 필요합니다."
 *       404:
 *         description: 거래내역이 없는 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "거래내역이 없습니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

async function consumptionPattern(transactions) {
  try {
    const transactionSummary = transactions.map((transaction) => {
      return {
        description: transaction.tran_desc,
        time: transaction.transaction_time,
      };
    });

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      temperature: 0.7,
      system: "당신은 사용자의 소비 패턴을 분석하는 도우미입니다..",
      messages: [
        {
          role: "user",
          content: `3개월 간 사용자의 거래내역을 분석하여 소비 패턴을 분석하여 JSON 형식으로만 응답  
          패턴 개수는 4개 ~ 9개 사이로만 응답
          거래내역: ${JSON.stringify(transactionSummary)} 
          응답에 다음 구조를 사용하세요. JSON 형식으로만 응답하시오. 줄바꿈 문자을 넣지 말고, 줄바꿈하지 마시오.
          {
            "consumptionPattern": [
              {
                "name": "음식",
                "ratio": "20%"
              },
              {
                "name": "쇼핑",
                "ratio": "15%"
              }
            ]
          }`,
        },
      ],
    });

    const parsedResponse = JSON.parse(response.content[0].text);

    console.log(parsedResponse);
    return parsedResponse;
  } catch (error) {
    console.error("에러 발생:", error);
  }
}

async function recommendRatio(salary, interests, transactions) {
  try {
    const interestSummary = interests[0].name;

    // const analysisSummary = await consumptionPattern(transactions);

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      temperature: 0.7,
      system: "당신은 사용자의 통장쪼개기 비율을 추천하는 도우미 입니다.",
      messages: [
        {
          role: "user",
          content: `사용자의 관심사와 소비 패턴을 분석하여 통장(월급)쪼개기를 위한 카테고리와 비율(월급통장 포함)을 JSON 형식으로만 응답
          카테고리 개수는 3개 ~ 6개 사이로만 응답
  
          관심사: ${interestSummary}
          소비습관(소비패턴) : ${JSON.stringify(transactions)}
          사용자 월급 : ${salary}
          응답에 다음 구조를 사용하세요. JSON 형식으로만 응답하시오. 줄바꿈 문자을 넣지 말고, 줄바꿈하지 마시오.
          월급통장은 name을 "월급 통장"으로만 쓰시오.
          {
            "recommendRatio": [
              {
                "name": "저축",
                "ratio": "30",
                "amount" : ""
              },
              {
                "name": "생활비",
                "ratio": "40",
                "amount" : ""
              },
              { 
                "name": "제태크", 
                "ratio": "30", 
                "amount" : ""
              } 
            ]
          }`,
        },
      ],
    });

    const parsedResponse = JSON.parse(response.content[0].text);

    console.log(parsedResponse);
    return parsedResponse;
  } catch (err) {
    console.error("에러 발생:", err);
  }
}

router.get("/recommend", async (req, res) => {
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

    const [interests] = await db.query(
      "SELECT * FROM interests WHERE user_id = ?",
      [userId]
    );
    // const [transactions] = await db.query(
    //   "SELECT * FROM transaction WHERE account_id IN (SELECT account_id FROM account WHERE user_id = ?) AND inout_type = 'OUT'",
    //   [userId]
    // );

    const [salaryInfo] = await db.query(
      "SELECT * FROM salary WHERE user_id = ?",
      [userId]
    );

    const salary = salaryInfo[0].amount;
    const transactions = req.session.analysisResult;
    const recommendResult = await recommendRatio(
      salary,
      interests,
      transactions
    );

    delete req.session.transactions;
    req.session.recommendResult = recommendResult.recommendRatio;

    res.send(recommendResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/recommend", async (req, res) => {
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
    const recommendResult = req.session.recommendResult;
    const colorList = [
      "#FF6B86",
      "#BDEEB6",
      "#FFF58A",
      "#FFB1E0",
      "#5EB961",
      "#6BF8F6",
      "#C767D0",
    ];

    console.log(recommendResult);

    const values = recommendResult.map((category, index) => {
      return [
        userId,
        category.name,
        category.goal_amount || 0,
        category.background_color || colorList[index % colorList.length], // index를 사용
        category.ratio,
        category.amount,
      ];
    });

    // 이미 존재하는 카테고리 확인
    const [existCategories] = await db.query(
      "SELECT * FROM categories WHERE user_id = ?",
      [userId]
    );

    // 기존 카테고리 삭제
    if (existCategories.length > 0) {
      await db.query("DELETE FROM categories WHERE user_id = ?", [userId]);
    }

    // 카테고리 추가
    const [result] = await db.query(
      "INSERT INTO categories (user_id, name, goal_amount, background_color, ratio, amount) VALUES ?",
      [values]
    );

    // 세션에서 추천 결과 삭제
    delete req.session.recommendResult;

    // 성공 응답
    res.status(201).json({
      message: `${recommendResult.length}개의 카테고리가 추가되었습니다.`,
    });
  } catch (err) {
    console.error("카테고리 추가 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

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
    const [transactions] = await db.query(
      "SELECT * FROM transaction WHERE account_id IN (SELECT id FROM account WHERE user_id = ?) AND inout_type = 'OUT'",
      [userId]
    );

    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "거래내역이 없습니다." });
    }

    const analysisResult = await consumptionPattern(transactions);
    req.session.analysisResult = analysisResult;

    res.send(analysisResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
