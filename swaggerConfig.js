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
  },
  apis: ["./api/*.js"], // Swagger 주석을 포함할 API 파일 경로
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
