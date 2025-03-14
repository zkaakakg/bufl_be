const db = require("../db/db");
exports.createGoal = async (req) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) throw new Error("세션 없음");

  const { monthly_saving, goal_duration } = req.body;

  if (!monthly_saving || !goal_duration) {
    throw new Error("모든 필드를 입력해주세요.");
  }

  // 세션에서 user_id 추출
  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );

  if (session.length === 0) throw new Error("세션 만료됨");

  const userId = session[0].user_id;

  const monthly_saving_amt = monthly_saving;
  const goal_amount = monthly_saving_amt * goal_duration;
  const dynamicGoalName = `${goal_amount / 10000} 만원 모으기`;

  // 목표 저장
  const [result] = await db.query(
    `INSERT INTO goal (goal_name, goal_amount, goal_duration, goal_start, goal_end, user_id, account_id, monthly_saving, current_amount)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MONTH), ?, 1, ?, ?)`,

    [
      dynamicGoalName,
      goal_amount,
      goal_duration,
      goal_duration,
      userId,
      monthly_saving_amt,
      0, // 초기 금액
    ]
  );

  const goalId = result.insertId;

  // 🔥 목표 설정과 동시에 첫 자동이체 실행!
  let transactionMessage = "첫 자동이체 성공";
  let firstTransactionSuccess = false;

  // 무조건 account_id가 1인 계좌에서 처리하도록 변경
  const [accountResult] = await db.query("SELECT * FROM account WHERE id = 1");
  const account = accountResult[0]; // 계좌 정보

  if (account.balance >= monthly_saving_amt) {
    const newBalance = account.balance - monthly_saving_amt;

    // 계좌 잔액 차감
    await db.query(`UPDATE account SET balance = ? WHERE id = 1`, [newBalance]);

    // 목표 금액 업데이트
    await db.query(`UPDATE goal SET current_amount = ? WHERE id = ?`, [
      monthly_saving_amt,
      goalId,
    ]);

    // 트랜잭션 기록
    await db.query(
      `INSERT INTO transaction (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc)
      VALUES (1, ?, ?, 'OUT', ?, ?, '목표 저축')`,
      [account.account_number, dynamicGoalName, monthly_saving_amt, newBalance]
    );

    firstTransactionSuccess = true;
  } else {
    transactionMessage = "첫 자동이체 실패 (계좌 잔액 부족)";
  }

  return {
    message: "목표가 설정되었습니다.",
    goal_id: goalId,
    account_number: account.account_number,
    first_transaction: firstTransactionSuccess,
    transaction_message: transactionMessage,
  };
};
// 목표 완료 확률 계산 함수 (기간을 고려하지 않음)
function calculateGoalCompletionProbability(goalAmount, currentAmount) {
  // 목표 금액이 0이면 확률 0% (목표 금액이 잘못 설정된 경우 처리)
  if (goalAmount <= 0) {
    return 0;
  }

  // 진행된 비율을 계산
  const probability = Math.min((currentAmount / goalAmount) * 100, 100); // 100%를 초과하지 않도록 처리

  return probability;
}

exports.getGoals = async (req) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) throw new Error("세션 없음");

  try {
    const [session] = await db.query(
      "SELECT user_id FROM sessions WHERE session_id = ?",
      [sessionId]
    );
    if (session.length === 0) throw new Error("세션 만료됨");

    const userId = session[0].user_id;
    const [results] = await db.query("SELECT * FROM goal WHERE user_id = ?", [
      userId,
    ]);

    if (results.length === 0) {
      throw new Error("목표 내역이 없습니다.");
    }

    // 목표에 완료 확률을 계산하여 추가
    const goalsWithProbability = results.map((goal) => {
      const probability = Math.round(
        calculateGoalCompletionProbability(
          parseInt(goal.goal_amount), // 목표 금액은 숫자형으로 변환
          parseInt(goal.current_amount || 0) // 현재 금액은 숫자형으로 변환
        )
      );
      return { ...goal, probability };
    });

    // 중복된 `message`와 `goals`를 제거하고 단순화된 구조로 반환
    return goalsWithProbability;
  } catch (err) {
    console.error(err);
    throw new Error("서버 오류");
  }
};

exports.getGoalPrediction = async (req) => {
  const goalId = req.params.id;
  const [goal] = await db.query("SELECT * FROM goal WHERE id = ?", [goalId]);

  if (goal.length === 0) throw new Error("목표를 찾을 수 없습니다.");

  // 목표 달성 확률 계산 (여기서는 예시로 임의의 값을 반환)
  const probability = Math.random() * 100; // 임의의 확률 계산
  return { goalId, probability };
};

exports.getGoalTransactions = async (req) => {
  const goalId = req.params.id;
  const [transactions] = await db.query(
    "SELECT * FROM transaction WHERE goal_id = ?",
    [goalId]
  );
  return transactions;
};

exports.depositGoalAmount = async (req) => {
  const { goal_id, deposit_amount } = req.body;
  const [goal] = await db.query("SELECT * FROM goal WHERE id = ?", [goal_id]);

  if (goal.length === 0) throw new Error("목표를 찾을 수 없습니다.");

  const newAmount = goal[0].current_amount + deposit_amount;

  // 목표 금액 갱신
  await db.query("UPDATE goal SET current_amount = ? WHERE id = ?", [
    newAmount,
    goal_id,
  ]);

  // 트랜잭션 기록
  await db.query(
    "INSERT INTO transaction (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc) VALUES (?, ?, ?, 'IN', ?, ?, '목표 입금')",
    [
      goal[0].account_id,
      goal[0].account_number,
      goal[0].goal_name,
      deposit_amount,
      newAmount,
    ]
  );

  return { message: "입금 성공", goal_id, deposit_amount };
};
