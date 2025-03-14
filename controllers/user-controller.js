const userService = require("../services/user-service");

exports.getStartPage = async (req, res) => {
  try {
    res.json({ message: "시작 화면입니다." });
  } catch (err) {
    console.error("시작 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
};

exports.registerUser = async (req, res) => {
  const { userName, userRegnu, userPhone, userPassword } = req.body;
  try {
    const result = await userService.registerUser(
      userName,
      userRegnu,
      userPhone,
      userPassword
    );

    res.cookie("sessionId", result.sessionId, {
      httpOnly: true,
      secure: true, // 배포 시 true (HTTPS 필수)
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "none", // 7일 유지
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.updatePassword = async (req, res) => {
  const { userPassword } = req.body;
  const sessionId = req.cookies.sessionId;
  try {
    const result = await userService.updatePassword(sessionId, userPassword);
    res.status(200).json(result);
  } catch (err) {
    console.error("PiN 번호 등록 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.getPinPage = async (req, res) => {
  try {
    res.json({ message: "PIN 번호 화면입니다." });
  } catch (err) {
    console.error("PIN 번호 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
};

exports.verifyPin = async (req, res) => {
  const { userPassword } = req.body;
  const sessionId = req.cookies.sessionId;
  try {
    const result = await userService.verifyPin(sessionId, userPassword);
    res.status(201).json(result);
  } catch (err) {
    console.error("PIN 번호 인증 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.getSalaryInfo = async (req, res) => {
  const sessionId = req.cookies.sessionId;
  try {
    const result = await userService.getSalaryInfo(sessionId);
    res.status(200).json(result);
  } catch (err) {
    console.error("월급 정보 입력 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
};

exports.addSalaryInfo = async (req, res) => {
  const { amount, payDate, accountId } = req.body;
  try {
    const result = await userService.addSalaryInfo(amount, payDate, accountId);
    res.status(201).json(result);
  } catch (err) {
    console.error("월급 정보 입력 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.getInterestsPage = async (req, res) => {
  try {
    res.json({ message: "관심사 선택 화면입니다." });
  } catch (err) {
    console.error("관심사 선택 화면 오류", err);
    res.status(500).json({ message: "서버오류" });
  }
};

exports.addInterest = async (req, res) => {
  const sessionId = req.cookies.sessionId;
  const { interest } = req.body;
  try {
    const result = await userService.addInterest(sessionId, interest);
    res.json({ message: result });
  } catch (err) {
    console.error("관심사 등록 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
};

exports.deleteUser = async (req, res) => {
  const sessionId = req.cookies.sessionId;
  try {
    const result = await userService.deleteUser(sessionId);
    res.json({ message: result });
  } catch (err) {
    console.error("회원 탈퇴 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};
