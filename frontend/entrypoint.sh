#!/bin/bash

# Set environment variables dynamically
export NITRO_SSL_KEY=$(cat ./cert.key)
export NITRO_SSL_CERT=$(cat /app/cert.crt)

# Execute the main process (Nuxt.js or other apps)
exec "$@"
