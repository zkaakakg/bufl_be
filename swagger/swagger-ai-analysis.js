/**
 * @swagger
 * /api/ai-analysis/recommend:
 *   get:
 *     summary: 추천 결과 조회
 *     description: 로그인된 사용자의 관심사와 급여 정보 등을 바탕으로 추천 결과를 조회합니다.
 *     tags: [Ai]
 *     responses:
 *       200:
 *         description: 추천 결과를 반환합니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendRatio:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       ratio:
 *                         type: number
 *                       amount:
 *                         type: number
 *       400:
 *         description: 로그인되지 않은 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그인이 필요합니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

/**
 * @swagger
 * /api/ai-analysis/recommend:
 *   post:
 *     summary: 추천 결과 저장
 *     description: 추천 결과를 카테고리 테이블에 저장합니다.
 *     tags: [Ai]
 *     responses:
 *       201:
 *         description: 추천 결과가 성공적으로 저장되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "5개의 카테고리가 추가되었습니다."
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
 * /api/ai-analysis/:
 *   get:
 *     summary: 거래내역 조회
 *     description: 사용자의 거래내역을 조회하여 소비 패턴 분석 결과를 반환합니다.
 *     tags: [Ai]
 *     responses:
 *       200:
 *         description: 소비 패턴 분석 결과를 반환합니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysisResult:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       amount:
 *                         type: number
 *       400:
 *         description: 로그인되지 않은 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그인이 필요합니다."
 *       404:
 *         description: 거래내역이 없는 경우
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "거래내역이 없습니다."
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
