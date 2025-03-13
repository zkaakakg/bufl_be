const db = require("../db/db");

const getUserIdBySession = async (sessionId) => {
  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );
  if (session.length === 0) return null;
  return session[0].user_id;
};

const getUserTransactions = async (userId) => {
  const [transactions] = await db.query(
    `SELECT t.id, t.account_id, t.inout_type, t.tran_amt, t.tran_balance_amt, t.tran_desc, t.transaction_time
     FROM transaction t
     JOIN account a ON t.account_id = a.id
     WHERE a.user_id = ?`,
    [userId]
  );
  return transactions;
};

const getMonthlyExpenses = async (userId, month) => {
  const [year, monthNum] = month.split("-");
  const startDate = `${year}-${monthNum}-01`;
  const endDate = new Date(year, monthNum, 0).toISOString().split("T")[0];

  const [results] = await db.query(
    `SELECT SUM(t.tran_amt) AS total_spent
     FROM transaction t
     JOIN account a ON t.account_id = a.id
     WHERE a.user_id = ?
       AND t.inout_type = 'OUT'
       AND DATE(t.transaction_time) >= ?
       AND DATE(t.transaction_time) <= ?`,
    [userId, startDate, endDate]
  );

  return results.length === 0 || results[0].total_spent === null
    ? null
    : results[0].total_spent;
};

module.exports = {
  getUserIdBySession,
  getUserTransactions,
  getMonthlyExpenses,
};
