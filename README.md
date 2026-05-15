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

# Roadmap

- Streaming Chat Response
- PostgreSQL Chat History
- JWT Authentication
- RAG Knowledge Base
- LangChain Integration
- LangGraph Workflow
- AI Agent System