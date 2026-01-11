#!/usr/bin/env python
"""Wait for PostgreSQL to be ready."""

import time
import sys
import psycopg2
from decouple import config

DB_NAME = config('DB_NAME', default='ecobilda')
DB_USER = config('DB_USER', default='postgres')
DB_PASSWORD = config('DB_PASSWORD', default='postgres')
DB_HOST = config('DB_HOST', default='127.0.0.1')
DB_PORT = config('DB_PORT', default=5432, cast=int)

max_retries = 30
retry_delay = 1

print(f"Waiting for PostgreSQL at {DB_HOST}:{DB_PORT}...")

for attempt in range(max_retries):
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.close()
        print("✓ PostgreSQL is ready!")
        sys.exit(0)
    except psycopg2.OperationalError as e:
        print(f"Attempt {attempt + 1}/{max_retries}: Not ready yet... ({e})")
        time.sleep(retry_delay)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

print("✗ PostgreSQL did not become ready in time")
sys.exit(1)
