# Hacker Castle — single-container image.
#
# Base: full Debian "bookworm" Node image (NOT Alpine). It uses glibc, ships
# common tooling (git, curl, build tools), and is the standard, feature-rich
# choice — room to grow when we add more services to this container later.
FROM node:20-bookworm

# App lives here.
WORKDIR /app

# Install dependencies first so Docker can cache this layer between rebuilds.
# On this Debian base, better-sqlite3 installs a prebuilt binary (no compiling).
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the castle (server, db, public/).
COPY . .

# The castle listens on the standard web port.
EXPOSE 80

# Start the server. The SQLite database is created fresh on every boot.
#
# FUTURE: when this container runs more than just the website, swap this CMD
# for a process supervisor (e.g. supervisord) that launches each service.
CMD ["node", "server.js"]
