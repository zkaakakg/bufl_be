/**
 * @swagger
 * /api/ai-goals:
 *   get:
 *     tags: [Ai]
 *     summary: "AI 추천 목표 목록을 가져오는 API"
 *     description: "AI로부터 추천받은 목표 목록을 가져와서 응답으로 반환합니다."
 *     responses:
 *       200:
 *         description: "AI 추천 목표 목록을 성공적으로 가져왔습니다."
 *         schema:
 *           type: "object"
 *           properties:
 *             message:
 *               type: "string"
 *               example: "AI 추천 목표 목록을 성공적으로 가져왔습니다."
 *             recommendations:
 *               type: "array"
 *               items:
 *                 type: "object"
 *                 properties:
 *                   goal_name:
 *                     type: "string"
 *                   goal_amount:
 *                     type: "number"
 *                     format: "float"
 *                   goal_duration:
 *                     type: "integer"
 *                   goal_start:
 *                     type: "string"
 *                     format: "date-time"
 *                   goal_end:
 *                     type: "string"
 *                     format: "date-time"
 *       400:
 *         description: "AI에서 추천한 목표가 없습니다."
 *         schema:
 *           type: "object"
 *           properties:
 *             message:
 *               type: "string"
 *               example: "AI에서 추천한 목표가 없습니다."
 *       401:
 *         description: "세션 오류 (세션 없음)"
 *         schema:
 *           type: "object"
 *           properties:
 *             message:
 *               type: "string"
 *               example: "세션 없음"
 *       500:
 *         description: "서버 오류 (AI 추천 목표 목록 가져오기 실패)"
 *         schema:
 *           type: "object"
 *           properties:
 *             message:
 *               type: "string"
 *               example: "목표 추천 목록을 가져오는 중 오류가 발생했습니다."
 */

/**
 * @swagger
 *   /api/ai-goals/generate-goals:
 *     post:
 *       tags: [Ai]
 *       summary: 사용자가 선택한 목표를 생성하고 자동이체를 실행합니다.
 *       description: 사용자가 선택한 목표 정보를 기반으로 목표를 생성하고, 자동이체가 실행됩니다.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 goal_name:
 *                   type: string
 *                   description: 목표 이름
 *                   example: string
 *                 monthly_saving:
 *                   type: number
 *                   description: 월 저축액
 *                   example: 0
 *                 goal_duration:
 *                   type: number
 *                   description: 목표 기간 (개월)
 *                   example: 0
 *                 accountId:
 *                   type: integer
 *                   description: 계좌 ID
 *                   example: 0
 *       responses:
 *         200:
 *           description: 목표가 성공적으로 저장되었습니다.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "선택된 목표가 성공적으로 저장되었습니다."
 *                   goalId:
 *                     type: integer
 *                     description: 생성된 목표 ID
 *                     example: 123
 *                   goal:
 *                     type: object
 *                     properties:
 *                       goal_name:
 *                         type: string
 *                         example: "여행 저축"
 *                       goal_amount:
 *                         type: number
 *                         example: 1200000
 *                       goal_duration:
 *                         type: number
 *                         example: 12
 *                       monthly_saving:
 *                         type: number
 *                         example: 100000
 *         400:
 *           description: 필수 값이 부족하거나 잘못된 요청
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "목표 이름, 계좌 ID, 월 저축액, 목표 기간은 필수입니다."
 *         401:
 *           description: 세션 없음 또는 세션 만료됨
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "세션 없음"
 *         500:
 *           description: 서버 오류
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "목표 추천 또는 저장 중 오류가 발생했습니다."
 */
