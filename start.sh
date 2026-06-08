#!/bin/bash
set -e

cd "$(dirname "$0")"

npm install
PORT=${PORT:-3000} node --watch server.js
