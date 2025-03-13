/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: 회원관련 API
 */
// 시작 화면
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: "시작 화면"
 *     tags: [Users]
 *     description: "시작 화면을 표시합니다."
 *     responses:
 *       200:
 *         description: "성공적으로 시작 화면을 반환합니다."
 *       500:
 *         description: "서버 오류"
 */
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 회원 가입 및 자동 로그인
 *     description: 사용자 정보를 받아 회원 가입을 진행하고, 세션을 생성하여 자동 로그인 처리
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               userRegnu:
 *                 type: string
 *               userPhone:
 *                 type: string
 *               userPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: 회원가입 및 자동 로그인 완료
 *       400:
 *         description: 입력값 오류 또는 이미 가입된 회원
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /api/users/update-password:
 *   put:
 *     summary: PIN 번호 등록
 *     description: 사용자 세션을 확인하고 비밀번호(PIN)를 변경
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: PIN 번호 등록 성공
 *       401:
 *         description: 세션 없음 또는 만료됨
 *       500:
 *         description: 서버 오류
 */
/**
 * @swagger
 * /api/users/pin:
 *   get:
 *     summary: PIN 번호 화면 요청
 *     description: 클라이언트가 PIN 번호 관련 화면을 요청
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: PIN 번호 화면 제공
 *       500:
 *         description: 서버 오류
 */
/**
 * @swagger
 * api/users/pin:
 *   post:
 *     summary: PIN 번호 인증
 *     description: 사용자가 입력한 PIN 번호를 검증
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: PIN 번호 인증 성공
 *       400:
 *         description: PIN 번호 인증 오류
 *       401:
 *         description: 세션 없음 또는 만료됨
 *       500:
 *         description: 서버 오류
 */

// 월급 정보
/**
 * @swagger
 * api/users/salary:
 *   get:
 *     summary: "사용자의 월급 정보 조회"
 *     description: "로그인된 사용자의 월급 정보(계좌 정보, 금액, 지급일)를 조회합니다."
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: "월급 정보 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 salaryAccount:
 *                   type: object
 *                   properties:
 *                     bank_name:
 *                       type: string
 *                       description: "은행 이름"
 *                     account_number:
 *                       type: string
 *                       description: "계좌 번호"
 *                 amount:
 *                   type: number
 *                   description: "월급 금액"
 *                 payDate:
 *                   type: string
 *                   format: date
 *                   description: "월급 지급일 (YYYY-MM-DD 형식)"
 *       500:
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버오류"
 *       400:
 *         description: "잘못된 요청"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그인 필요"
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /api/users/salary:
 *   post:
 *     summary: "월급 정보 입력"
 *     description: "사용자가 월급 정보를 입력하여 DB에 저장합니다."
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: "월급 액수"
 *               payDate:
 *                 type: string
 *                 format: date
 *                 description: "월급 지급일"
 *               accountId:
 *                 type: string
 *                 description: "사용자 계좌 ID"
 *     responses:
 *       201:
 *         description: "월급 정보 입력 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "월급 입력정보 성공"
 *                 salaryId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: "모든 정보를 입력하지 않음"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "모든 정보를 입력하세요!"
 *       404:
 *         description: "계좌를 찾을 수 없음"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account not found"
 *       500:
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버 오류"
 */

// 관심사
/**
 * @swagger
 * /api/users/interests:
 *   get:
 *     summary: "관심사 선택 화면"
 *     description: "사용자에게 관심사를 선택할 수 있는 화면을 반환합니다."
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: "관심사 선택 화면"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "관심사 선택 화면입니다."
 *       500:
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버오류"
 */

/**
 * @swagger
 * /api/users/interests:
 *   post:
 *     summary: 관심사 등록
 *     description: 사용자가 관심사를 등록할 수 있도록 합니다.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interest:
 *                 type: string
 *                 description: 사용자가 등록할 관심사
 *     responses:
 *       200:
 *         description: 관심사 등록 성공
 *       401:
 *         description: 세션 없음 또는 로그인 필요
 *       500:
 *         description: 서버 오류
 */
/**
 * @swagger
 * /api/users/delete:
 *   delete:
 *     summary: "회원 탈퇴"
 *     description: "사용자가 계정을 탈퇴합니다. 탈퇴 시 연관된 모든 데이터를 삭제합니다."
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: "회원 탈퇴 완료"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "회원 탈퇴 완료"
 *       401:
 *         description: "로그인이 필요함"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그인이 필요합니다."
 *       404:
 *         description: "사용자 정보 찾을 수 없음"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "회원 정보를 찾을 수 없습니다."
 *       500:
 *         description: "서버 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버 오류"
 */
