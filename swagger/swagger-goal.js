/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: 저축 목표 관련 API
 */

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: "목표 설정"
 *     description: "사용자가 새로운 저축 목표를 설정합니다. 목표 설정과 동시에 첫 자동이체가 실행됩니다."
 *     tags: [Goals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monthly_saving:
 *                 type: number
 *                 description: "매월 저축할 금액"
 *               goal_duration:
 *                 type: integer
 *                 description: "목표 기간 (개월)"
 *               account_id:
 *                 type: integer
 *                 description: "사용자의 계좌 ID"
 *     responses:
 *       201:
 *         description: "목표가 설정되었습니다."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "목표가 설정되었습니다."
 *                 goal_id:
 *                   type: integer
 *                   description: "설정된 목표의 ID"
 *                 account_number:
 *                   type: string
 *                   description: "사용자 계좌 번호"
 *                 first_transaction:
 *                   type: boolean
 *                   description: "첫 자동이체 성공 여부"
 *                 transaction_message:
 *                   type: string
 *                   description: "첫 자동이체 상태 메시지"
 *       400:
 *         description: "모든 필드가 입력되지 않았습니다."
 *       401:
 *         description: "세션이 없거나 세션이 만료되었습니다."
 *       404:
 *         description: "계좌를 찾을 수 없음"
 *       500:
 *         description: "서버 오류"
 */

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: "저축 목표 목록 전체 조회"
 *     description: "사용자의 저축 목표 목록과 목표 달성 확률을 조회합니다."
 *     tags: [Goals]
 *     responses:
 *       200:
 *         description: "목표 내역 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "목표 내역"
 *                 goals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       goal_name:
 *                         type: string
 *                       goal_amount:
 *                         type: number
 *                         format: float
 *                       current_amount:
 *                         type: number
 *                         format: float
 *                       goal_duration:
 *                         type: integer
 *                       goal_start:
 *                         type: string
 *                         format: date-time
 *                       goal_end:
 *                         type: string
 *                         format: date-time
 *                       probability:
 *                         type: integer
 *       400:
 *         description: "로그인이 필요합니다."
 *       404:
 *         description: "목표 내역이 없음"
 *       500:
 *         description: "서버 오류"
 */
/**
 * @swagger
 * /api/goals/:id:
 *   get:
 *     summary: "저축 목표 목록 조회"
 *     description: "사용자의 저축 목표 목록과 목표 달성 확률을 조회합니다."
 *     tags: [Goals]
 *     responses:
 *       200:
 *         description: "목표 내역 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "목표 내역"
 *                 goals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       goal_name:
 *                         type: string
 *                       goal_amount:
 *                         type: number
 *                         format: float
 *                       current_amount:
 *                         type: number
 *                         format: float
 *                       goal_duration:
 *                         type: integer
 *                       goal_start:
 *                         type: string
 *                         format: date-time
 *                       goal_end:
 *                         type: string
 *                         format: date-time
 *                       probability:
 *                         type: integer
 *       400:
 *         description: "로그인이 필요합니다."
 *       404:
 *         description: "목표 내역이 없음"
 *       500:
 *         description: "서버 오류"
 */

/**
 * @swagger
 * /api/goals/prediction:
 *   get:
 *     summary: 사용자의 목표 달성 확률 예측
 *     description: 사용자의 세션을 확인하고 목표 목록을 조회하여 각 목표의 달성 확률을 반환합니다.
 *     tags:
 *       - Goals
 *     parameters:
 *       - in: cookie
 *         name: sessionId
 *         required: true
 *         description: 사용자 로그인 세션 ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 목표 달성 확률 반환 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "목표 달성 확률"
 *                 goals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       goal_id:
 *                         type: integer
 *                         example: 1
 *                       goal_name:
 *                         type: string
 *                         example: "해외 여행"
 *                       current_amount:
 *                         type: integer
 *                         example: 500000
 *                       probability:
 *                         type: string
 *                         example: "85%"
 */

/**
 * @swagger
 * /api/goals/{goal_id}/transactions:
 *   get:
 *     summary: "특정 목표에 대한 입금 내역 조회"
 *     description: "주어진 목표 ID에 해당하는 목표에 대한 입금 내역을 조회합니다. '목표 저축'으로 설명된 거래만 포함됩니다."
 *     tags: [Goals]
 *     parameters:
 *       - name: "goal_id"
 *         in: "path"
 *         description: "목표의 고유 ID"
 *         required: true
 *         type: "integer"
 *     responses:
 *       200:
 *         description: "목표에 대한 입금 내역 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tran_amt:
 *                         type: number
 *                         description: "입금 금액"
 *                       tran_balance_amt:
 *                         type: number
 *                         description: "잔액"
 *                       tran_desc:
 *                         type: string
 *                         description: "입금 내역 설명"
 *                       transaction_time:
 *                         type: string
 *                         format: date-time
 *                         description: "입금 일시"
 *       404:
 *         description: "목표가 존재하지 않거나 입금 내역이 없는 경우"
 *       500:
 *         description: "서버 오류"
 */

/**
 * @swagger
 * /api/goals/{goal_id}/deposit:
 *   post:
 *     summary: "목표 입금"
 *     description: "사용자가 설정한 저축 목표에 입금을 합니다."
 *     tags: [Goals]
 *     parameters:
 *       - in: path
 *         name: goal_id
 *         required: true
 *         description: "목표 ID"
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deposit_amount:
 *                 type: number
 *                 format: float
 *                 description: "입금 금액"
 *               account_id:
 *                 type: integer
 *                 description: "입금할 계좌 ID"
 *     responses:
 *       200:
 *         description: "입금 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "입금 성공"
 *                 newAmount:
 *                   type: number
 *                   format: float
 *                   description: "입금 후 목표 금액"
 *                 goal:
 *                   type: object
 *                   properties:
 *                     goal_name:
 *                       type: string
 *                     current_amount:
 *                       type: number
 *                       format: float
 *                     goal_amount:
 *                       type: number
 *                       format: float
 *       400:
 *         description: "올바른 입금 금액을 입력해주세요."
 *       404:
 *         description: "목표 또는 계좌를 찾을 수 없음"
 *       500:
 *         description: "서버 오류"
 */
