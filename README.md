# ⚕️ MediCheck — AI Symptom Checker

<div align="center">

![MediCheck Banner](https://img.shields.io/badge/MediCheck-AI%20Health%20Assistant-blue?style=for-the-badge&logo=python)

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=flat-square&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector%20DB-6C47FF?style=flat-square)](https://pinecone.io)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-Transformers-FFD21E?style=flat-square&logo=huggingface&logoColor=black)](https://huggingface.co)

**An intelligent, RAG-powered health information chatbot that provides document-grounded responses to user-described symptoms — with full citations and responsible AI disclaimers.**

[🩺 Features](#-features) • [🛠 Tech Stack](#-tech-stack) • [⚙️ Setup](#%EF%B8%8F-setup) • [📁 Project Structure](#-project-structure) • [🤖 How It Works](#-how-it-works)

</div>

---

## 📌 Overview

MediCheck is a full-stack AI health chatbot built using **Retrieval-Augmented Generation (RAG)**. Instead of generating answers from scratch (which can lead to hallucinations), MediCheck retrieves relevant information from a verified medical knowledge base and builds grounded, cited responses.

> ⚠️ **Disclaimer:** MediCheck is for educational purposes only. It does not provide medical diagnosis or treatment. Always consult a qualified healthcare professional.

---

## ✨ Features

- 🔍 **Semantic Symptom Search** — Uses Hugging Face `all-MiniLM-L6-v2` embeddings to understand the meaning behind symptoms, not just keywords
- 📚 **Cited Responses** — Every answer includes citations from verified sources like Mayo Clinic and MedlinePlus with relevance scores
- 🤖 **RAG Architecture** — Retrieval-Augmented Generation ensures zero hallucinations — all answers are grounded in real documents
- ⚠️ **Responsible AI Layer** — Mandatory disclaimer modal and medical warnings on every response
- ⚡ **Fast Vector Search** — Pinecone vector database enables lightning-fast semantic retrieval
- 🏠 **Landing Page** — Professional homepage with feature showcase and how-it-works section
- 💬 **Chat Interface** — Clean dark-themed UI with suggestion pills, character counter, and live API status

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Axios | Chat UI, Homepage, API calls |
| **Backend** | Python, Django, Django REST Framework | REST API, business logic |
| **NLP Model** | Hugging Face `all-MiniLM-L6-v2` | Text → vector embeddings |
| **Vector DB** | Pinecone | Semantic similarity search |
| **Architecture** | RAG (Retrieval-Augmented Generation) | Grounded, cited responses |
| **CORS** | django-cors-headers | React ↔ Django communication |

---

## 🤖 How It Works

```
User types symptoms
        ↓
Hugging Face embeds query → 384-dimensional vector
        ↓
Pinecone searches for closest medical documents (cosine similarity)
        ↓
Top matching documents retrieved with relevance scores
        ↓
Structured response built from document text
        ↓
Response returned with citations + medical disclaimer
```

**No generative LLM (like GPT) is used** — responses are constructed directly from retrieved document text, making every answer fully explainable and source-backed.

---

## 📁 Project Structure

```
medicheck/
├── backend/
│   ├── chatbot/
│   │   ├── rag_service.py       # RAG pipeline — embeddings + Pinecone search
│   │   ├── views.py             # Django REST API endpoints
│   │   ├── urls.py              # URL routing
│   │   └── setup_pinecone.py   # One-time script to load medical knowledge base
│   ├── core/
│   │   ├── settings.py          # Django configuration
│   │   └── urls.py              # Root URL config
│   ├── .env                     # API keys (not committed)
│   ├── .gitignore
│   └── manage.py
└── frontend/
    └── src/
        ├── App.js               # Main chat interface
        ├── HomePage.js          # Landing page
        ├── Message.js           # Chat bubbles with citations & disclaimers
        ├── Disclaimer.js        # Responsible AI modal
        ├── api.js               # Axios API service
        └── index.css            # Global dark theme styles
```

---

## ⚙️ Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- [Pinecone](https://pinecone.io) account (free tier)
- [Hugging Face](https://huggingface.co) account (free tier)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/medicheck.git
cd medicheck
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

pip install django djangorestframework django-cors-headers \
            python-dotenv pinecone sentence-transformers torch
```

### 3. Environment Variables
Create a `.env` file inside the `backend` folder:
```env
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=medicheck
HF_TOKEN=your_huggingface_token
SECRET_KEY=your_django_secret_key
DEBUG=True
```

### 4. Load Medical Knowledge Base (Run Once)
```bash
python chatbot/setup_pinecone.py
```
This creates a Pinecone index and uploads 10 verified medical documents.

### 5. Run Django Backend
```bash
python manage.py migrate
python manage.py runserver
```
Backend runs at `http://localhost:8000`

### 6. Frontend Setup
```bash
cd ../frontend
npm install
npm start
```
Frontend runs at `http://localhost:3000`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health/` | Check if the server is running |
| `POST` | `/api/chat/` | Send symptoms, get grounded response |

### Example Request
```json
POST /api/chat/
{
  "message": "I have a headache and fever"
}
```

### Example Response
```json
{
  "query": "I have a headache and fever",
  "answer": "Based on verified medical sources...",
  "citations": [
    {
      "number": 1,
      "source": "Mayo Clinic - Headache",
      "relevance_score": 0.89
    }
  ],
  "disclaimer": "⚠️ MEDICAL DISCLAIMER: This information is for educational purposes only...",
  "sources_found": 2
}
```

---

## 🧠 NLP Model Details

**Model:** `sentence-transformers/all-MiniLM-L6-v2`
- Lightweight BERT-based sentence transformer
- Produces **384-dimensional** dense vector embeddings
- Captures semantic meaning — "dizzy" and "vertigo" map to similar vectors
- Runs locally — no API calls to Hugging Face at inference time

**Vector Search:** Pinecone with **cosine similarity**
- Finds documents with similar semantic meaning to the query
- Returns top-k matches with relevance scores (0.0 → 1.0)
- Only includes results with score > 0.3 to filter irrelevant matches

---

## 🚀 Running the Project

Every time you want to launch MediCheck, open **two terminal tabs**:

**Tab 1 — Django Backend:**
```bash
cd medicheck/backend
source venv/bin/activate
python3 manage.py runserver
```

**Tab 2 — React Frontend:**
```bash
cd medicheck/frontend
npm start
```

Then open **`http://localhost:3000`** in your browser.

---

## 🎓 What I Learned

- Building end-to-end **RAG pipelines** from scratch
- **Vector embeddings** and semantic search with Pinecone
- Integrating **Hugging Face** models into a production backend
- Building **REST APIs** with Django REST Framework
- Connecting a **React frontend** to a Django backend with CORS
- Implementing **Responsible AI** principles — citations, disclaimers, transparency

---

<div align="center">

⚕️ **MediCheck** — For educational purposes only • Not a substitute for professional medical advice

</div>
