const db = require("../db/db");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

exports.registerUser = async (userName, userRegnu, userPhone, userPassword) => {
  if (!userName || !userRegnu || !userPhone) {
    throw new Error("모든 정보를 입력하세요.");
  }

  const [existingUsers] = await db.query(
    "SELECT * FROM users WHERE user_regnu = ? OR user_phone = ?",
    [userRegnu, userPhone]
  );
  if (existingUsers.length > 0) {
    throw new Error("이미 가입된 회원입니다.");
  }
  const hashedPassword = await bcrypt.hash(userPassword, 10);

  const [result] = await db.query(
    "INSERT INTO users (user_name, user_regnu, user_phone, user_password) VALUES (?, ?, ?, ?)",
    [userName, userRegnu, userPhone, hashedPassword]
  );

  const sessionId = uuidv4();
  await db.query("INSERT INTO sessions (user_id, session_id) VALUES (?, ?)", [
    result.insertId,
    sessionId,
  ]);

  return {
    message: "회원가입 및 자동 로그인 완료",
    sessionId: sessionId,
  };
};

exports.updatePassword = async (sessionId, userPassword) => {
  if (!sessionId) throw new Error("세션 없음");

  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );

  if (session.length === 0) throw new Error("세션 만료됨");

  const userId = session[0].user_id;
  const hashedPassword = await bcrypt.hash(userPassword, 10);

  await db.query("UPDATE users SET user_password = ? WHERE id = ?", [
    hashedPassword,
    userId,
  ]);

  return { message: "PiN 번호 등록 성공" };
};

exports.verifyPin = async (sessionId, userPassword) => {
  if (!sessionId) throw new Error("세션 없음");

  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );

  if (session.length === 0) throw new Error("세션 만료됨");

  const [user] = await db.query("SELECT * FROM users WHERE id = ?", [
    session[0].user_id,
  ]);

  if (!user.length) throw new Error("사용자 정보 없음");

  const hashedPassword = user[0].user_password;
  const isMatch = await bcrypt.compare(userPassword, hashedPassword);

  if (isMatch) {
    return { message: "PIN 번호 인증 성공" };
  } else {
    throw new Error("PIN 번호 인증 오류");
  }
};

exports.getSalaryInfo = async (sessionId) => {
  if (!sessionId) throw new Error("세션 없음");

  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );

  if (session.length === 0) throw new Error("세션 만료됨");

  const userId = session[0].user_id;

  const [salary] = await db.query(
    "SELECT account_id, amount, pay_date FROM salary WHERE user_id = ?",
    [userId]
  );

  const salaryAccountId = salary[0].account_id;
  const [salaryAccount] = await db.query(
    "SELECT bank_name, account_number FROM account WHERE id = ?",
    [salaryAccountId]
  );

  return {
    salaryAccount: salaryAccount[0],
    amount: salary[0].amount,
    payDate: salary[0].pay_date,
  };
};

exports.addSalaryInfo = async (amount, payDate, accountId) => {
  if (!amount || !payDate || !accountId) {
    throw new Error("모든 정보를 입력하세요!");
  }

  const [userResult] = await db.query(
    "SELECT user_id FROM account WHERE id = ?",
    [accountId]
  );
  if (userResult.length === 0) {
    throw new Error("Account not found");
  }
  const userId = userResult[0].user_id;

  const [salaryResult] = await db.query(
    "INSERT INTO salary (account_id, user_id, amount, pay_date, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
    [accountId, userId, amount, payDate]
  );

  return {
    message: "월급 입력정보 성공",
    salaryId: salaryResult.insertId,
  };
};

exports.addInterest = async (sessionId, interest) => {
  if (!sessionId) throw new Error("세션 없음");

  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );

  if (session.length === 0) throw new Error("세션 만료됨");

  const userId = session[0].user_id;

  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }

  const [insertResult] = await db.query(
    "INSERT INTO interests (user_id, name) VALUES (?, ?)",
    [userId, interest]
  );

  return "관심사 등록 성공";
};

exports.deleteUser = async (sessionId) => {
  if (!sessionId) throw new Error("세션 없음");

  const [session] = await db.query(
    "SELECT user_id FROM sessions WHERE session_id = ?",
    [sessionId]
  );

  if (session.length === 0) throw new Error("세션 만료됨");

  const userId = session[0].user_id;

  await db.query("DELETE FROM salary WHERE user_id = ?", [userId]);
  await db.query("DELETE FROM interests WHERE user_id = ?", [userId]);

  const [result] = await db.query("DELETE FROM users WHERE id = ?", [userId]);

  if (result.affectedRows === 0) {
    throw new Error("회원 정보를 찾을 수 없습니다.");
  }

  await db.query("DELETE FROM sessions WHERE session_id = ?", [sessionId]);

  return "회원탈퇴 완료";
};
