const express = require("express");
const router = express.Router();
const db = require("../db/db");

require("dotenv").config("../.env");
const { Anthropic } = require("@anthropic-ai/sdk");
const apiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = new Anthropic({
  apiKey: apiKey,
});

const analysisStore = new Map();
const recommendStore = new Map();

// 소비패턴 AI
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

// 카테고리/비율 추천 AI
async function recommendRatio(salary, interests, transactions) {
  try {
    const interestSummary = interests[0].name;

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

// 소비패턴
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
    analysisStore.set(userId, analysisResult);

    res.send(analysisResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 추천 카테고리/비율
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

    const [salaryInfo] = await db.query(
      "SELECT * FROM salary WHERE user_id = ?",
      [userId]
    );

    const salary = salaryInfo[0].amount;
    const transactions = analysisStore.get(userId);

    const recommendResult = await recommendRatio(
      salary,
      interests,
      transactions
    );

    recommendStore.set(userId, recommendResult.recommendRatio);

    res.send(recommendResult);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 추천 카테고리/비율 저장
router.get("/add-category", async (req, res) => {
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
    const recommendResult = recommendStore.get(userId);

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
    if (!recommendResult) {
      return res.status(400).json({ message: "추천 결과 없음" });
    }

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

    // 성공 응답
    res.status(201).json({
      message: `${recommendResult.length}개의 카테고리가 추가되었습니다.`,
    });
  } catch (err) {
    console.error("카테고리 추가 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
