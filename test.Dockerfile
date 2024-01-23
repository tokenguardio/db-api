FROM postgres:16

# Copy the initialization script and .env.test file
COPY init-test-db.sh /docker-entrypoint-initdb.d/
COPY .env.test /

# Set execute permissions on the script
RUN chmod +x /docker-entrypoint-initdb.d/init-test-db.sh
