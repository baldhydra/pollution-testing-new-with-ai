# Pollution Center Data Management & AI Assistant System

A comprehensive, turnkey full-stack web application for vehicle pollution certificate testing centers. Built with a **React (Vite) frontend**, a **Node.js Express backend**, and an integrated **Local AI Assistant** powered by **Ollama** running **Qwen 3 (8B)**.

---

## 🚀 Quick Start (Clone & Run on Any PC)

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **Ollama** installed on your PC ([Download Ollama](https://ollama.com))

### 2. Pull the Local AI Model (One-Time)
Open your terminal and run:
```bash
ollama pull qwen3:8b
```

### 3. Clone and Run (Single Command!)
```bash
git clone https://github.com/baldhydra/pollution-new.git
cd pollution-new
npm start
```

> **Windows Users**: You can also simply double-click **`start.bat`**! It will automatically check dependencies, start the backend API, start the frontend server, and connect to Ollama.
>
> **Linux / macOS Users**: You can also run `./start.sh`.

---

## 🌐 Application Endpoints & Credentials

- **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
- **AI Assistant Page**: [http://localhost:5173/ai-chat](http://localhost:5173/ai-chat)
- **Backend API**: [http://localhost:3001/api](http://localhost:3001/api)
- **Local Ollama AI**: [http://localhost:11434](http://localhost:11434)

### Default Login
- **Username**: `aswin`
- **Password**: `aswin123`

---

## 🛠️ Key Capabilities

### 1. Local AI Assistant (Qwen 3 8B via Ollama)
- **Grounded Analytics**: Uses Ollama function calling to query real vehicle data and financial collections directly from the database without hallucinations.
- **Example Inquiries**:
  - *"How many vehicles were tested in the month of August?"*
  - *"What was the profit last year?"*
  - *"Show all certificates expiring in the next 30 days."*
  - *"Give me a breakdown of vehicles by fuel type."*
  - *"Look up certificate records for vehicle KL01AB1234."*
- **Persistent Chat History**: All conversations are stored in `localStorage` across page reloads. View, switch, or delete past conversations from the **History** panel.
- **One-Click Print to PDF**: Print individual AI analysis cards or full conversation transcripts directly into PDF format with print-optimized styling.

### 2. Vehicle & Certificate Management
- **Dashboard**: Real-time stats, expiry warnings, daily/monthly collections.
- **New Entry**: Fast data entry for vehicle test certificates.
- **Reports & Export**: Interactive Recharts graphs and data tables.
- **Role-Based Segregation**: Admin vs. standard operator accounts.

---

## 📁 Project Architecture

```
pollution-new/
├── run.js                   # Unified zero-dependency launcher (starts both servers)
├── setup.js                 # Unified dependency installer (backend + frontend)
├── package.json             # Root orchestrator scripts (npm start, npm run dev, etc.)
├── start.bat                # Windows 1-click double-clickable launcher
├── start.sh                 # Linux/macOS 1-click bash launcher
├── README.md                # Documentation & guide
└── pollution-center/
    ├── package.json         # Frontend dependencies & Vite configuration
    ├── src/
    │   ├── components/      # React components (AiChat, Dashboard, Reports, etc.)
    │   ├── services/api.js  # Frontend API client
    │   └── App.jsx          # Route management
    └── server/
        ├── package.json     # Backend dependencies
        ├── server.js        # Express application server
        ├── data/            # JSON persistence (vehicle_data.json, users.json)
        ├── middleware/auth.js # Token authentication
        ├── routes/ai.js     # AI chat endpoints
        └── services/        # Qwen3 AI Agent & tool calling implementations
```

---

## 📦 Single Package NPM Scripts

From the root directory:

| Command | Action |
| :--- | :--- |
| `npm start` or `npm run dev` | Automatically checks dependencies, checks Ollama, and launches both frontend and backend concurrently. |
| `npm run setup` | Installs dependencies across both frontend and backend in one command. |
| `npm run build` | Builds the production bundle of the React frontend into `pollution-center/dist`. |

---

## 🔒 Offline & Privacy First

All AI reasoning runs **100% locally on your PC** through Ollama and Qwen 3 (8B). No prompt data, certificate records, customer phone numbers, or revenue figures ever leave your machine.
