#!/bin/bash
set -e

# Source the .env.test file
if [ -f .env.test ]; then
    source .env.test
fi

# Function to create a database if it doesn't exist
create_db() {
    local database=$1
    echo "Creating database: $database"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
        CREATE DATABASE "$database";
EOSQL
}

# Convert the DB names string to an array
IFS=',' read -ra DB_ARRAY <<< "$PROD_EXTERNAL_DB_NAMES"

# Loop through and create each database
for db in "${DB_ARRAY[@]}"; do
    create_db "$db"
done
