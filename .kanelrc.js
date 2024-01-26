const path = require('path');
const { generateKnexTablesModule, knexTypeFilter, generateMigrationCheck } = require('kanel-knex');
const dotenv = require('dotenv');

dotenv.config({ path: ".env" });

/** @type {import('kanel').Config} */
module.exports = {
  connection: {
    host: process.env.QUERIES_DB_HOST,
    user: process.env.QUERIES_DB_USER,
    password: process.env.QUERIES_DB_PASSWORD,
    database: process.env.QUERIES_DB_NAME,
    port: process.env.QUERIES_DB_PORT,
  },

  preDeleteOutputFolder: true,
  outputPath: "./src/db/models",

  preRenderHooks: [generateKnexTablesModule, generateMigrationCheck],
  typeFilter: knexTypeFilter
};
