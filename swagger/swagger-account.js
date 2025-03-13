/**
 * @swagger
 * tags:
 *   - name: Accounts
 *     description: 계좌 관련 API
 */

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: 사용자 계좌 목록 조회
 *     tags: [Accounts]
 *     description: 인증된 사용자의 계좌 목록을 조회합니다.
 *     responses:
 *       200:
 *         description: 사용자 계좌 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "44의 계좌목록"
 *                 accounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       account_id:
 *                         type: integer
 *                         example: 1
 *                       user_id:
 *                         type: integer
 *                         example: 44
 *                       account_number:
 *                         type: string
 *                         example: "123-456-789"
 *       404:
 *         description: 해당 사용자 계좌가 없습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "해당 사용자 계좌가 없습니다."
 *       500:
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

/**
 * @swagger
 * /api/accounts/{account_id}/transactions:
 *   get:
 *     summary: 계좌 거래 내역 조회
 *     tags: [Accounts]
 *     description: 특정 계좌의 거래 내역을 조회합니다.
 *     parameters:
 *       - in: path
 *         name: account_id
 *         required: true
 *         description: 거래 내역을 조회할 계좌 ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: 계좌의 거래 내역
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "계좌 1의 거래 내역"
 *                 transaction:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       transaction_id:
 *                         type: integer
 *                         example: 1001
 *                       from_account_number:
 *                         type: string
 *                         example: "123-456-789"
 *                       to_account_number:
 *                         type: string
 *                         example: "987-654-321"
 *                       inout_type:
 *                         type: string
 *                         example: "입금"
 *                       tran_amt:
 *                         type: integer
 *                         example: 50000
 *                       tran_balance_amt:
 *                         type: integer
 *                         example: 1000000
 *                       transaction_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-03-04T12:34:56Z"
 *       404:
 *         description: 해당 계좌의 거래 내역이 없습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "해당 계좌의 거래 내역이 없습니다."
 *       500:
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
