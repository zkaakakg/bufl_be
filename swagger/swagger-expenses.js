/**
 * @swagger
 * tags:
 *   - name: Transactions
 *     description: 지출 관련 API
 */
/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: 사용자별 총 소비 내역 조회
 *     tags: [Transactions]
 *     description: 특정 사용자의 모든 소비 내역을 조회합니다.
 *     security:
 *       - sessionAuth: []  # 세션 인증 방식 사용
 *     responses:
 *       200:
 *         description: 소비 내역 조회 성공
 *         content:
 *           application/json:
 *             example:
 *               message: "44의 소비목록"
 *               totalCount: 2
 *               expenses:
 *                 - transaction_id: 1
 *                   account_id: 10
 *                   inout_type: "OUT"
 *                   tran_amt: 50000
 *                   tran_balance_amt: 450000
 *                   tran_desc: "식비"
 *                   transaction_time: "2025-02-10T12:34:56Z"
 *                 - transaction_id: 2
 *                   account_id: 12
 *                   inout_type: "OUT"
 *                   tran_amt: 30000
 *                   tran_balance_amt: 420000
 *                   tran_desc: "교통비"
 *                   transaction_time: "2025-02-11T15:20:30Z"
 *       400:
 *         description: 로그인하지 않음
 *         content:
 *           application/json:
 *             example:
 *               message: "로그인이 필요합니다."
 *       404:
 *         description: 소비 내역이 없음
 *         content:
 *           application/json:
 *             example:
 *               message: "소비 내역이 없습니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             example:
 *               message: "서버 오류"
 */

/**
 * @swagger
 * /api/expenses/{month}:
 *   get:
 *     summary: 특정 월의 총 지출 내역 조회
 *     tags: [Transactions]
 *     description: 특정 사용자의 지정된 월의 총 지출 금액을 조회합니다.
 *     parameters:
 *       - in: path
 *         name: month
 *         required: true
 *         description: 조회할 월 (YYYY-MM 형식)
 *         schema:
 *           type: string
 *           example: "2025-02"
 *     responses:
 *       200:
 *         description: 특정 월의 총 지출 금액
 *         content:
 *           application/json:
 *             example:
 *               user_id: 44
 *               total_spent: 80000
 *               month: "2025-02"
 *       400:
 *         description: 잘못된 요청 (월 형식 오류)
 *         content:
 *           application/json:
 *             example:
 *               message: "잘못된 날짜 형식입니다. 예: YYYY-MM"
 *       404:
 *         description: 해당 월의 지출 내역이 없음
 *         content:
 *           application/json:
 *             example:
 *               message: "지출 내역이 존재하지 않습니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             example:
 *               message: "서버 오류"
 */
