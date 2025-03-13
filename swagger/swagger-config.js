const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "월급 쪼개기 API",
      version: "1.0.0",
      description: "월급 자동 분배 시스템 API 문서",
    },
    servers: [
      {
        url: "http://localhost:5000", // 개발 중일 때 사용할 서버 URL
      },
    ],
    tags: [
      // 원하는 순서대로 태그 정의
      { name: "Users", description: "사용자 관련 API" },
      { name: "Accounts", description: "계좌 관련 API" },
      { name: "Category", description: "카테고리 관련 API" },
      { name: "Goals", description: "저축 목표 API" },
      { name: "Transactions", description: "거래 내역 API" },
      { name: "Ai", description: "Ai관련 API" },
    ],
  },
  apis: ["./swagger/*.js"], // Swagger 주석을 포함할 API 파일 경로
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
