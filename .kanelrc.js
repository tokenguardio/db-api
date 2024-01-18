const path = require('path');
const { generateKnexTablesModule, knexTypeFilter, generateMigrationCheck } = require('kanel-knex');
const dotenv = require('dotenv');

dotenv.config({ path: ".env" });

/** @type {import('kanel').Config} */
module.exports = {
  connection: {
    host: process.env.DEV_INTERNAL_HOST,
    user: process.env.DEV_INTERNAL_USER,
    password: process.env.DEV_INTERNAL_PASSWORD,
    database: process.env.DEV_INTERNAL_DB_NAME,
    port: process.env.DEV_INTERNAL_PORT,
  },

  preDeleteOutputFolder: true,
  outputPath: "./src/models",

  preRenderHooks: [generateKnexTablesModule, generateMigrationCheck],
  typeFilter: knexTypeFilter
};
