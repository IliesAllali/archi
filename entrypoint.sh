#!/bin/sh
# Initialize DB schema if needed (idempotent — uses IF NOT EXISTS)
node scripts/init-db.js
# Start the app
exec node server.js
