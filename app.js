const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const { specs, swaggerUi } = require("./swagger/swagger-config"); // swagger 설정
const usersRouter = require("./api/users"); // 사용자 라우터 가져오기
const accountRouter = require("./api/account"); // 계좌목록 가져오기
const salaryRouter = require("./api/salary");
const transactionsRouter = require("./api/transactions");
const expensesRouter = require("./api/expenses"); // 소비내역 가져오기
const goalRouter = require("./api/goal"); // 목표
const aiAnalysisRouter = require("./api/ai-analysis.js");
const goalAI = require("./api/ai-goal.js"); // goalai.js에서 router 가져오기

const app = express();
const port = 5000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://buflfe.vercel.app", // 프론트엔드 주소
    credentials: true, // 쿠키 허용
  })
);

app.use(
  session({
    secret: "secret code", // 세션 암호화에 사용할 키
    resave: false, // 세션 변경 시마다 저장하는 설정
    saveUninitialized: true, // 세션 초기화 상태에서 저장할지 여부
    cookie: { secure: true },
  })
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/api/users", usersRouter); // 라우터 등록
app.use("/api/accounts", accountRouter); // 라우터 등록
app.use("/api/salary", salaryRouter); // 라우터 등록
app.use("/api/transactions", transactionsRouter);
app.use("/api/expenses", expensesRouter); // 라우터 등록
app.use("/api/goals", goalRouter); // 라우터 등록
app.use("/api/ai-goals", goalAI); // 라우터 등록
app.use("/api/ai-analysis", aiAnalysisRouter);

app.get("/", async (req, res) => {
  try {
    if (req.cookies.sessionId) {
      // 회원가입 한 경우 로그인 화면으로 넘어감
      res.redirect("/api/users/login");
    } else {
      // 회원가입 하지 않은 경우 회원가입 화면으로 넘어감
      res.redirect("/api/users");
    }
  } catch (err) {
    console.error("메인 화면 처리 중 오류 발생:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

app.listen(port, () => {
  console.log("✅ 서버 실행 중: http://localhost:5000");
  console.log("📄 Swagger 문서: http://localhost:5000/api-docs");
});
