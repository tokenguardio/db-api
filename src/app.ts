import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { ENVIRONMENT } from "./utils/secret";
import { Request, Response, NextFunction } from "express";
import swaggerDefinition from "./utils/swagger";
import growthIndexRoutes from "./routes/growth-index";
import queryRoutes from "./routes/query";
import databaseInfoRoutes from "./routes/databaseInfo";
import chartDataRouters from "./routes/chartData";
import dappDataRouters from "./routes/dapp";
import logger from "./utils/logger";
import { ApiError } from "./middleware/joiValidate";

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

app.use(cors());
app.options("*", cors());

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
// Use routes
app.use(growthIndexRoutes);
app.use(queryRoutes);
app.use(databaseInfoRoutes);
app.use(chartDataRouters);
app.use(dappDataRouters);

app.use((err: ApiError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : "An unexpected error occurred";
  return res.status(statusCode).send({
    message,
  });
});

export default app;
