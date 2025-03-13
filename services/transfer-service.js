const db = require("../db/db");
const schedule = require("node-schedule");

async function executeAutoTransfer(
  fromAccountId,
  toAccountId,
  amount,
  description
) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 출금 계좌 확인
    const [fromAccount] = await connection.query(
      "SELECT * FROM account WHERE id = ? FOR UPDATE",
      [fromAccountId]
    );

    if (fromAccount.length === 0) {
      throw new Error("출금 계좌를 찾을 수 없습니다.");
    }

    const fromBalance = Number(fromAccount[0].balance);
    if (fromBalance < amount) {
      throw new Error("잔액이 부족합니다.");
    }

    // 출금 처리
    await connection.query(
      "UPDATE account SET balance = balance - ? WHERE id = ?",
      [amount, fromAccountId]
    );

    // 입금 계좌 확인
    const [toAccount] = await connection.query(
      "SELECT * FROM account WHERE id = ? FOR UPDATE",
      [toAccountId]
    );

    if (toAccount.length === 0) {
      throw new Error("입금 계좌를 찾을 수 없습니다.");
    }

    // 입금 처리
    await connection.query(
      "UPDATE account SET balance = balance + ? WHERE id = ?",
      [amount, toAccountId]
    );

    // 트랜잭션 기록 (출금)
    await connection.query(
      `INSERT INTO transaction 
        (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc, transaction_time) 
        VALUES (?, ?, ?, 'OUT', ?, ?, ?, NOW())`,
      [
        fromAccountId,
        fromAccount[0].account_number,
        toAccount[0].account_number,
        amount,
        fromBalance - amount,
        description,
      ]
    );

    // 트랜잭션 기록 (입금)
    const toBalance = Number(toAccount[0].balance);
    await connection.query(
      `INSERT INTO transaction 
        (account_id, from_account_number, to_account_number, inout_type, tran_amt, tran_balance_amt, tran_desc, transaction_time) 
        VALUES (?, ?, ?, 'IN', ?, ?, ?, NOW())`,
      [
        toAccountId,
        fromAccount[0].account_number,
        toAccount[0].account_number,
        amount,
        toBalance + amount,
        description,
      ]
    );

    await connection.commit();
    console.log(
      `✅ 자동이체 완료: ${amount}원 from ${fromAccount[0].account_number} to ${toAccount[0].account_number}`
    );
  } catch (err) {
    await connection.rollback();
    console.error("❌ 자동이체 실패:", err.message);
    throw err;
  } finally {
    connection.release();
  }
}

exports.scheduleAutoTransfer = async (sessionId) => {
  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );

  if (session.length === 0) {
    throw new Error("세션 만료됨");
  }

  const userId = session[0].user_id;

  // 사용자 월급 계좌 조회
  const [fromAccount] = await db.query(
    "SELECT * FROM salary WHERE user_id = ?",
    [userId]
  );

  if (fromAccount.length === 0) {
    throw new Error("월급 계좌를 찾을 수 없습니다.");
  }

  const fromAccountId = fromAccount[0].account_id;

  // 자동이체할 카테고리 조회
  const [categories] = await db.query(
    "SELECT id, amount, account_id FROM categories WHERE user_id = ?",
    [userId]
  );

  if (categories.length === 0) {
    throw new Error("이체할 카테고리를 찾을 수 없습니다.");
  }

  const categoriesToProcess = categories.slice(1);

  const autoTransferPromises = categoriesToProcess.map(async (category) => {
    const toAccountId = category.account_id;

    if (!toAccountId) {
      throw new Error("연동된 계좌가 없습니다.");
    }

    const [toAccount] = await db.query("SELECT * FROM account WHERE id = ?", [
      toAccountId,
    ]);

    if (toAccount.length === 0) {
      throw new Error("입금 계좌를 찾을 수 없습니다.");
    }

    const amount = category.amount;
    const fiveMinutesLater = new Date();
    fiveMinutesLater.setMinutes(fiveMinutesLater.getMinutes() + 1);

    schedule.scheduleJob(fiveMinutesLater, () => {
      executeAutoTransfer(fromAccountId, toAccountId, amount, "자동이체");
    });
  });

  await Promise.all(autoTransferPromises);

  return "✅ 자동이체 일정이 등록되었습니다.";
};

exports.getTransferHistory = async (sessionId) => {
  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );

  if (session.length === 0) {
    throw new Error("세션 만료됨");
  }

  const userId = session[0].user_id;
  const [salaryAccount] = await db.query(
    "SELECT * FROM salary WHERE user_id = ?",
    [userId]
  );

  const fromAccountId = salaryAccount[0].account_id;
  const [fromAccount] = await db.query("SELECT * FROM account WHERE id = ?", [
    fromAccountId,
  ]);
  const fromAccountNumber = fromAccount[0].account_number;

  const [histories] = await db.query(
    "SELECT * FROM transaction WHERE from_account_number = ? AND inout_type = 'OUT' AND tran_desc = '자동이체'",
    [fromAccountNumber]
  );

  return histories.map((history) => ({
    fromAccountNumber,
    toAccountNumber: history.to_account_number,
    amount: history.tran_amt,
    balance: history.tran_balance_amt,
    time: history.transaction_time,
  }));
};
