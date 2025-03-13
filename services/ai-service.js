require("dotenv").config("../.env");
const { Anthropic } = require("@anthropic-ai/sdk");
const db = require("../db/db");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.consumptionPattern = async (transactions) => {
  const transactionSummary = transactions.map(
    ({ tran_desc, transaction_time }) => ({
      description: tran_desc,
      time: transaction_time,
    })
  );
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

  return JSON.parse(response.content[0].text);
};

exports.recommendRatio = async (salary, interests, transactions) => {
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

  return JSON.parse(response.content[0].text);
};

exports.getGoalRecommendations = async (req) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) throw new Error("세션 없음");

  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );
  if (session.length === 0) throw new Error("세션 만료됨");

  const userId = session[0].user_id;
  const [interests] = await db.query(
    "SELECT * FROM interests WHERE user_id = ?",
    [userId]
  );
  const interestSummary =
    interests.length > 0 ? interests[0]?.name : "여행, 투자, 집";

  const cachedData = req.session.goalRecommendations;
  if (cachedData) return cachedData;

  const response = await anthropic.messages.create({
    model: "claude-3-7-sonnet-20250219",
    max_tokens: 1000,
    temperature: 0.7,
    system:
      "당신은 저축 목표를 추천하는 도우미입니다. 목표 금액과 기간을 고려해 월별 저축액을 5만원 단위로 계산해 추천합니다. 결과는 JSON 형식으로만 응답하고 줄바꿈하지 마세요.",
    messages: [
      {
        role: "user",
        content: `사용자의 관심사에 따라 저축 목표를 추천해주세요. 목표 금액은 50만원에서 300만원 사이로 설정하고, 기간은 3개월에서 36개월 사이로 설정해주세요.\n\n관심사: ${interestSummary}\n형식은 예를 들어\nrecommendations: [\n {\n id: 0,\n goal_name: '여행 자금 마련',\n goal_amount: 800000,\n goal_duration: 3,\n monthly_saving: 250000\n },\n {\n id: 1,\n goal_name: '겨울 패딩 구매',\n goal_amount: 500000,\n goal_duration: 5,\n monthly_saving: 100000\n }\n] 로 JSON 형식으로 제공해주세요.`,
      },
    ],
  });

  const parsedResponse = JSON.parse(response.content[0]?.text);
  req.session.goalRecommendations = parsedResponse;

  return parsedResponse;
};

exports.saveGoal = async (
  { goal_name, monthly_saving, goal_duration, accountId },
  sessionId
) => {
  if (!goal_name || !accountId || !monthly_saving || !goal_duration) {
    throw new Error("필수 입력값 누락");
  }

  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );
  if (session.length === 0) throw new Error("세션 만료됨");

  const userId = session[0].user_id;
  const monthly_saving_amt = monthly_saving * 10000;
  const goal_amount = monthly_saving_amt * goal_duration;

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
      monthly_saving_amt,
    ]
  );

  const newGoalId = result.insertId;
  const [accountResult] = await db.query(
    "SELECT account_number, balance FROM account WHERE id = ?",
    [accountId]
  );
  const account = accountResult[0];

  if (account.balance >= monthly_saving_amt) {
    const newBalance = account.balance - monthly_saving_amt;
    await db.query("UPDATE account SET balance = ? WHERE id = ?", [
      newBalance,
      accountId,
    ]);
    await db.query(
      "UPDATE goal SET current_amount = current_amount + ? WHERE id = ?",
      [monthly_saving_amt, newGoalId]
    );
    await db.query(
      `INSERT INTO transaction (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc)
       VALUES (?, ?, ?, 'OUT', ?, ?, '목표 저축')`,
      [
        accountId,
        account.account_number,
        goal_name,
        monthly_saving_amt,
        newBalance,
      ]
    );
  }

  return { message: "목표 저장 성공", goalId: newGoalId };
};
