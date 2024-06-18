#!/bin/bash

npx knex migrate:latest --knexfile knexfile-local.ts
npm run start
