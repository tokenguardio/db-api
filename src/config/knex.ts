import knex from "knex";

const pg = knex({
  client: "pg",
  connection: {
    connectionString:
      process.env.DATABASE_URL ||
      `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  },
  searchPath: [process.env.DB_SCHEMA || "public"], // Default to 'public' if DB_SCHEMA is not defined
});

export default pg;
