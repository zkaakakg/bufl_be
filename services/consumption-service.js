const db = require("../db/db");
const aiService = require("./ai-service");

const analysisStore = new Map();
const recommendStore = new Map();

exports.analyzeConsumptionPattern = async (sessionId) => {
  try {
    const userId = await getUserIdFromSession(sessionId);
    if (!userId) return { status: 401, data: { message: "세션 만료됨" } };

    const [transactions] = await db.query(
      "SELECT * FROM transaction WHERE account_id IN (SELECT id FROM account WHERE user_id = ?) AND inout_type = 'OUT'",
      [userId]
    );

    if (transactions.length === 0) {
      return {
        status: 404,
        data: { success: false, message: "거래내역이 없습니다." },
      };
    }

    const analysisResult = await aiService.consumptionPattern(transactions);
    analysisStore.set(userId, analysisResult);

    return { status: 200, data: analysisResult };
  } catch (err) {
    return { status: 500, data: { success: false, error: err.message } };
  }
};

exports.getRecommendedRatio = async (sessionId) => {
  try {
    const userId = await getUserIdFromSession(sessionId);
    if (!userId) return { status: 401, data: { message: "세션 만료됨" } };

    const [interests] = await db.query(
      "SELECT * FROM interests WHERE user_id = ?",
      [userId]
    );
    const [salaryInfo] = await db.query(
      "SELECT * FROM salary WHERE user_id = ?",
      [userId]
    );

    if (!salaryInfo.length) {
      return { status: 400, data: { message: "월급 정보 없음" } };
    }

    const salary = salaryInfo[0].amount;
    const transactions = analysisStore.get(userId);
    if (!transactions) {
      return { status: 400, data: { message: "소비 패턴 분석 데이터 없음" } };
    }

    const recommendResult = await aiService.recommendRatio(
      salary,
      interests,
      transactions
    );
    recommendStore.set(userId, recommendResult.recommendRatio);

    return { status: 200, data: recommendResult };
  } catch (err) {
    return { status: 500, data: { success: false, error: err.message } };
  }
};

exports.saveRecommendedCategory = async (sessionId) => {
  try {
    const userId = await getUserIdFromSession(sessionId);
    if (!userId) return { status: 401, data: { message: "세션 만료됨" } };

    const recommendResult = recommendStore.get(userId);
    if (!recommendResult) {
      return { status: 400, data: { message: "추천 결과 없음" } };
    }

    const colorList = [
      "#FF6B86",
      "#BDEEB6",
      "#FFF58A",
      "#FFB1E0",
      "#5EB961",
      "#6BF8F6",
      "#C767D0",
    ];
    const values = recommendResult.map((category, index) => [
      userId,
      category.name,
      category.goal_amount || 0,
      category.background_color || colorList[index % colorList.length],
      category.ratio,
      category.amount,
    ]);

    await db.query("DELETE FROM categories WHERE user_id = ?", [userId]);
    await db.query(
      "INSERT INTO categories (user_id, name, goal_amount, background_color, ratio, amount) VALUES ?",
      [values]
    );

    return {
      status: 201,
      data: {
        message: `${recommendResult.length}개의 카테고리가 추가되었습니다.`,
      },
    };
  } catch (err) {
    return { status: 500, data: { message: "서버 오류", error: err.message } };
  }
};

// 세션을 통해 userId 조회
const getUserIdFromSession = async (sessionId) => {
  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );
  return session.length ? session[0].user_id : null;
};
