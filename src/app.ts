import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { ENVIRONMENT } from "./utils/secret";
import swaggerDefinition from "./utils/swagger";
import apiRoutes from "./routes/api";
import growthIndexRoutes from "./routes/growth-index";
import databaseDataRoutes from "./routes/database-data";
import logger from "./utils/logger";

const prod = ENVIRONMENT === "production"; // Anything else is treated as 'dev'
if (prod) {
  logger.info("PROD ENV");
} else {
  logger.info("DEV ENV");
}

// Create Express server
const app = express();

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ["./src/**/*.ts"], // Adjust the path to wherever your route handlers are
};

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Use routes
app.use(apiRoutes);
app.use(growthIndexRoutes);
app.use(databaseDataRoutes);

export default app;
