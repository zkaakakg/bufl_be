/**
 * @swagger
 * tags:
 *   name: Category
 *   description: 카테고리 관련 API
 */

/**
 * @swagger
 * /api/salary/category:
 *   get:
 *     summary: 카테고리 목록 조회
 *     description: 로그인한 사용자의 카테고리 목록을 조회합니다.
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: 카테고리 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       goal_amount:
 *                         type: integer
 *                       background_color:
 *                         type: string
 *                       ratio:
 *                         type: integer
 *                       amount:
 *                         type: integer
 *                       bank_name:
 *                         type: string
 *                       account_number:
 *                         type: string
 *       400:
 *         description: 로그인되지 않음
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /api/salary/category/{id}:
 *   get:
 *     summary: 카테고리 단건 조회
 *     description: 특정 카테고리를 조회합니다.
 *     tags: [Category]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 카테고리 ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 카테고리 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     goal_amount:
 *                       type: integer
 *                     background_color:
 *                       type: string
 *                     ratio:
 *                       type: integer
 *                     amount:
 *                       type: integer
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /api/salary/category:
 *   post:
 *     summary: 카테고리 추가
 *     description: 사용자가 카테고리를 추가합니다.
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 goal_amount:
 *                   type: integer
 *                 background_color:
 *                   type: string
 *                 ratio:
 *                   type: integer
 *     responses:
 *       201:
 *         description: 카테고리 추가 성공
 *       400:
 *         description: 입력 값 오류 (카테고리 정보 오류, 비율 합 100% 미만 등)
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /api/salary/info:
 *   get:
 *     summary: 사용자의 카테고리별 계좌 정보 조회
 *     description: 사용자의 카테고리에 연결된 계좌 정보를 조회하여 반환합니다.
 *     tags:
 *       - Category
 *     parameters:
 *       - in: cookie
 *         name: sessionId
 *         required: true
 *         description: 사용자 세션 ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 카테고리별 계좌 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: 카테고리 이름
 *                   bankName:
 *                     type: string
 *                     description: 은행 이름
 *                   accountNumber:
 *                     type: string
 *                     description: 계좌 번호
 *                   balance:
 *                     type: number
 *                     description: 계좌 잔액
 *                   logo:
 *                     type: string
 *                     description: 은행 로고 URL
 *       400:
 *         description: 사용자의 카테고리가 없음
 *       401:
 *         description: 세션 없음 또는 세션 만료됨
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /api/salary/category/{id}:
 *   delete:
 *     summary: 카테고리 삭제
 *     description: 특정 카테고리를 삭제합니다.
 *     tags: [Category]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 카테고리 ID
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 카테고리 삭제 성공
 *       400:
 *         description: 해당 카테고리가 존재하지 않음
 *       500:
 *         description: 서버 오류
 */
/**
 * @swagger
 * /api/salary/account:
 *   post:
 *     summary: 계좌 연동
 *     description: 카테고리에 계좌를 연동합니다.
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *               accountId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 계좌 연동 성공
 *       400:
 *         description: 계좌 정보 미제공
 *       500:
 *         description: 서버 오류
 */

/**
 * @swagger
 * /api/salary/account:
 *   get:
 *     summary: 연동 계좌 목록 조회
 *     description: 사용자의 연동된 계좌 목록을 조회합니다.
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: 계좌 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   bankName:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *       500:
 *         description: 서버 오류
 */
