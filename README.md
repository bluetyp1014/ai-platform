# AI Agent Platform

使用本機 Ollama 模型，實作基於 Docker 的 Full-stack AI Chat Platform。

# Features

* AI Chat API
* Next.js Chat UI
* FastAPI Backend
* Docker Compose 開發環境
* 本機 Ollama 模型串接
* JWT 登入／註冊（Access + Refresh Token）
* 使用者專屬對話與聊天紀錄
* MongoDB Chat Log

---

# Tech Stack

## Backend

* Python 3.11
* FastAPI
* SQLModel / PostgreSQL
* MongoDB (PyMongo)
* Ollama
* JWT（python-jose + bcrypt）

## Frontend

* Next.js
* React
* TypeScript
* Zustand（auth state + localStorage persist）

## Infrastructure

* Docker
* PostgreSQL
* MongoDB
* Redis

---

# Environment

本專案目前以 Windows + Docker Desktop 為主要開發環境。

---

# Requirements

請先安裝：

* Docker Desktop
* Ollama

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

| 路徑          | 說明      |
| ----------- | ------- |
| `/login`    | 登入      |
| `/register` | 註冊      |
| `/`         | 聊天（需登入） |

---

# Backend Swagger

http://localhost:8003/docs

---

# Authentication (JWT)

## 流程概覽

1. **註冊／登入** → JSON 回傳 `access_token`；`refresh_token` 寫入 **HttpOnly Cookie**（`refresh_token`）。
2. **Access token** 存於 `localStorage`（Zustand persist，key：`ai-platform-auth`），含 `username`。
3. **API 請求** 帶 `Authorization: Bearer <access_token>`，且 `fetch` 使用 `credentials: "include"` 以送出 Cookie。
4. **Access 過期或 localStorage 已清空** → 先 `restoreSession()`：以 Cookie 呼叫 `POST /auth/refresh` 換新 access；成功則留在原頁，失敗才導向 `/login`。
5. **API 401** → 同樣先 refresh 再重試；仍失敗則登出並導向 `/login`。
6. **登出** → `POST /auth/logout` 清除 Cookie 與 localStorage。

## Auth API

| Method | Path             | 說明                                                 | 需 Bearer |
| ------ | ---------------- | -------------------------------------------------- | -------- |
| POST   | `/auth/register` | 註冊（body: `username`, `password`）；設定 refresh Cookie | 否        |
| POST   | `/auth/login`    | 登入；設定 refresh Cookie                               | 否        |
| POST   | `/auth/refresh`  | 以 Cookie 換新 access；輪替 refresh Cookie               | 否        |
| POST   | `/auth/logout`   | 清除 refresh Cookie                                  | 否        |

**JSON 回應範例（僅 access）：**

```json
{
  "access_token": "...",
  "token_type": "bearer"
}
```

**Refresh Cookie（後端設定，前端不可讀）：**

* HttpOnly
* SameSite=none
* Secure=false（localhost 開發）

正式環境請改：

```env
COOKIE_SECURE=true
```

---

## 受保護的 API

以下端點需 `Authorization: Bearer <access_token>`，且僅能存取目前登入使用者的資料：

| Method | Path                           | 說明     |
| ------ | ------------------------------ | ------ |
| GET    | `/conversations`               | 列出我的對話 |
| POST   | `/conversations`               | 建立新對話  |
| GET    | `/conversations/{id}/messages` | 取得訊息歷史 |
| DELETE | `/conversations/{id}`          | 刪除對話   |
| POST   | `/chat`                        | 串流回覆   |

Access token 的 JWT payload 含：

```json
{
  "type": "access"
}
```

Refresh token 含：

```json
{
  "type": "refresh"
}
```

不可混用。

---

## 後端環境變數

見 `backend/env.example`。

| 變數                          | 說明                        |
| --------------------------- | ------------------------- |
| JWT_SECRET                  | JWT 簽章密鑰                  |
| JWT_ALGORITHM               | JWT 演算法                   |
| ACCESS_TOKEN_EXPIRE_MINUTES | Access Token 有效時間         |
| REFRESH_TOKEN_EXPIRE_DAYS   | Refresh Token 有效天數        |
| REFRESH_COOKIE_NAME         | Refresh Cookie 名稱         |
| COOKIE_SECURE               | Cookie Secure 旗標          |
| COOKIE_SAMESITE             | Cookie SameSite 設定        |
| MONGODB_URL                 | MongoDB Connection String |
| MONGODB_DB                  | MongoDB Database Name     |

---

# Chat History

本專案採用 PostgreSQL + MongoDB 混合儲存架構。

## PostgreSQL

儲存核心關聯資料：

* users
* conversations

## MongoDB

儲存聊天紀錄：

* chat_logs

每筆訊息以 Document 形式儲存：

```json
{
  "conversation_id": "xxxx",
  "user_id": 1,
  "role": "user",
  "content": "Hello",
  "created_at": "2026-06-06T12:00:00"
}
```

MongoDB 適合儲存：

* Chat History
* Agent Execution Logs
* 非結構化資料
* 大量 JSON 文件

---

# Roadmap

* ~~Streaming Chat Response~~ ✓
* ~~PostgreSQL Chat History~~ ✓
* ~~MongoDB Chat Log~~ ✓
* ~~JWT Authentication（Access + Refresh）~~ ✓
* RAG Knowledge Base
* LangChain Integration
* LangGraph Workflow
* AI Agent System

---

# Architecture

```text
Next.js
    │
    ▼
FastAPI
    │
    ├── PostgreSQL
    │       ├── Users
    │       └── Conversations
    │
    ├── MongoDB
    │       ├── Chat Logs
    │       └── Agent Logs
    │
    ├── Redis
    │       └── Cache / Session
    │
    └── Ollama
            └── Local LLM
```
