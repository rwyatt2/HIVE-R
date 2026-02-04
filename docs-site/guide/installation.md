# Installation

This guide covers installing and configuring HIVE-R for local development or self-hosting.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **pnpm**
- **OpenAI API Key** (for LLM access)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/HIVE-R/hive-r.git
cd hive-r
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# Required: OpenAI API key
OPENAI_API_KEY=sk-...

# Optional: Custom model
OPENAI_MODEL_MAIN=gpt-4o

# Optional: API authentication
HIVE_API_KEY=your-secret-key

# Optional: Database path
DATABASE_PATH=./data/hive.db

# Optional: JWT secret for auth
JWT_SECRET=your-jwt-secret
```

### 4. Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

The API will be available at `http://localhost:3000`.

## Running HIVE-R Studio

To run the visual interface:

```bash
cd client
npm install
npm run dev
```

Studio will be available at `http://localhost:5173`.

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t hive-r .
docker run -p 3000:3000 -e OPENAI_API_KEY=sk-... hive-r
```

## Verify Installation

```bash
curl http://localhost:3000/health
# Response: {"status":"healthy"}

curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, HIVE-R!"}'
```

## Next Steps

- [Quick Start](/guide/quick-start) - Your first request
- [API Endpoints](/api/endpoints) - Full API reference
