# AI Agent Platform

使用本機 Ollama 模型，實作基於 Docker 的 Full-stack AI Chat Platform。

# Features

- AI Chat API
- Next.js Chat UI
- FastAPI Backend
- Docker Compose 開發環境
- 本機 Ollama 模型串接

---

# Tech Stack

## Backend

- Python 3.11
- FastAPI
- Ollama

## Frontend

- Next.js
- React
- TypeScript

## Infrastructure

- Docker
- PostgreSQL
- Redis

---

# Environment

本專案目前以 Windows + Docker Desktop 為主要開發環境。

---

# Requirements

請先安裝：

- Docker Desktop
- Ollama 

並確認 Ollama service 已啟動。

```powershell
ollama list
```

---

# Start Project

```powershell
docker compose up --build
```

---

# Frontend

http://localhost:3003

---

# Backend Swagger

http://localhost:8003/docs

---

# Chat History

對話會寫入 PostgreSQL（`conversations`、`messages`），重新整理頁面後會從 `localStorage` 還原目前的 `conversation_id` 並載入歷史訊息。

| Method | Path | 說明 |
|--------|------|------|
| GET | `/conversations` | 列出所有對話 |
| POST | `/conversations` | 建立新對話 |
| GET | `/conversations/{id}/messages` | 取得訊息歷史 |
| POST | `/chat` | 串流回覆（body: `message`, `conversation_id?`；header: `X-Conversation-Id`） |

本機 DB 連線字串見 `backend/env.example`（Docker 內建於 `docker-compose.yml`）。

# Roadmap

- Streaming Chat Response
- ~~PostgreSQL Chat History~~ ✓
- JWT Authentication
- RAG Knowledge Base
- LangChain Integration
- LangGraph Workflow
- AI Agent System