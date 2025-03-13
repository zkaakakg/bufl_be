const db = require("../db/db");

exports.getUserAccounts = async (sessionId) => {
  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );

  if (session.length === 0) {
    const error = new Error("세션 만료됨");
    error.status = 401;
    throw error;
  }

  const userId = session[0].user_id;
  const [results] = await db.query(
    "SELECT id AS account_id, account_number, bank_name, balance, logo FROM account WHERE user_id = ?",
    [userId]
  );

  if (results.length === 0) {
    const error = new Error("해당 사용자 계좌가 없습니다.");
    error.status = 404;
    throw error;
  }

  return { message: `${userId}의 계좌목록`, accounts: results };
};

exports.getAccountTransactions = async (sessionId, accountId) => {
  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );

  if (session.length === 0) {
    const error = new Error("세션 만료됨");
    error.status = 401;
    throw error;
  }

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
    [userId, accountId]
  );

  if (results.length === 0) {
    const error = new Error("해당 계좌의 거래 내역이 없습니다.");
    error.status = 404;
    throw error;
  }

  return { message: `계좌 ${accountId}의 거래 내역`, transaction: results };
};
