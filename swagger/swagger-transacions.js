// 자동이체 일정 등록 API
/**
 * @swagger
 * /api/transactions/transfer:
 *   post:
 *     summary: 자동이체 일정 등록
 *     description: 사용자의 월급통장과 연동된 계좌들로 자동이체 일정 등록
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: 사용자의 ID
 *                 example: 44
 *     responses:
 *       200:
 *         description: 자동이체 일정 등록 완료
 *       400:
 *         description: 월급 계좌 또는 카테고리 정보를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

// 자동이체 내역
/**
 * @swagger
 * /api/transactions/history:
 *   get:
 *     summary: 자동이체 내역 조회
 *     description: 로그인한 사용자의 자동이체 내역을 조회합니다. 해당 내역에는 자동이체의 출금 계좌, 입금 계좌, 금액, 잔액, 거래 시간이 포함됩니다.
 *     tags: [Transactions]
 *     responses:
 *       '200':
 *         description: 자동이체 내역 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fromAccountNumber:
 *                     type: string
 *                     description: 출금 계좌 번호
 *                     example: "123-456-7890"
 *                   toAccountNumber:
 *                     type: string
 *                     description: 입금 계좌 번호
 *                     example: "098-765-4321"
 *                   amount:
 *                     type: number
 *                     format: float
 *                     description: 자동이체 금액
 *                     example: 100000
 *                   balance:
 *                     type: number
 *                     format: float
 *                     description: 자동이체 후 계좌 잔액
 *                     example: 500000
 *                   time:
 *                     type: string
 *                     format: date-time
 *                     description: 자동이체 거래 시간
 *                     example: "2025-03-05T14:30:00Z"
 *       '400':
 *         description: 로그인되지 않은 사용자가 요청한 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그인이 필요합니다."
 *       '500':
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "서버 오류"
 */
