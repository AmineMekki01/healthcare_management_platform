# Doctor AI Assistant

An intelligent healthcare chatbot system designed for doctors to interact with patient data, medical records, and documents through AI-powered conversations. Built with FastAPI and integrated with OpenAI for natural language processing.

## 🏥 Overview

The Doctor AI Assistant provides healthcare professionals with an intelligent chat interface that can:
- Access patient information and medical records
- Process and analyze uploaded medical documents
- Provide context-aware responses using patient data
- Manage document storage with intelligent routing
- Search through medical records and documents

## 🏗️ Architecture

### Core Components

**Chat System (`src/chat/`)**
- **TbibiAgent**: Unified AI agent with patient-specific and general query handling
- **Chat Management**: Create, manage, and delete chat sessions
- **Message Processing**: Handle user messages and generate AI responses
- **Patient Search**: Search and retrieve patient information for the patient mentionning feature.

**Document Management (`src/documents/`)**
- **ChatDocumentHandler**: In-memory document context management
- **DocumentProcessor**: Text extraction from PDF, DOCX, TXT, and images
- **ContextDecisionEngine**: Intelligent storage routing based on document size
- **QdrantDocumentService**: Vector storage and semantic search

**Medical Records (`src/medical_records/`)**
- **Patient Management**: Handle patient data and medical records
- **Medical Record Processing**: Process and store medical documents
- **Search & Retrieval**: Semantic search across patient records

**Qdrant Integration (`src/qdrant/`)**
- **Vector Storage**: Manage document embeddings and collections
- **Semantic Search**: Advanced search capabilities across documents
- **Collection Management**: Organize documents by type and user

### Technology Stack
- **Backend**: FastAPI (Python 3.11)
- **Database**: PostgreSQL with SQLAlchemy (async)
- **Vector DB**: Qdrant for semantic search and embeddings
- **AI/ML**: OpenAI API (GPT models and embeddings)
- **Storage**: AWS S3 for file storage
- **Agent Framework**: OpenAI Agents SDK.

### Project Structure
```
doctor_ai_assistant/
├── src/
│   ├── chat/                    # Chat and agent functionality
│   │   ├── agent.py            # TbibiAgent - main AI agent
│   │   ├── router.py           # Chat API endpoints
│   │   ├── service.py          # Chat business logic
│   │   ├── tools.py            # Agent tools for patient data
│   │   ├── models.py           # Chat database models
│   │   ├── schemas.py          # Request/response schemas
│   │   └── constants.py        # Chat constants and enums
│   ├── documents/              # Document management
│   │   ├── chat_document_handler.py    # In-memory context management
│   │   ├── context_decision_engine.py  # Storage decision logic
│   │   ├── document_processor.py       # Text extraction and processing
│   │   ├── qdrant_document_service.py  # Vector storage operations
│   │   ├── service.py          # Document business logic
│   │   ├── models.py           # Document database models
│   │   └── schemas.py          # Document schemas
│   ├── medical_records/        # Medical records management
│   │   ├── router.py           # Medical records API
│   │   ├── service.py          # Medical records logic
│   │   ├── models.py           # Medical record models
│   │   └── schemas.py          # Medical record schemas
│   ├── qdrant/                 # Vector database integration
│   │   ├── client.py           # Qdrant client setup
│   │   ├── collections.py      # Collection management
│   │   ├── retrieval.py        # Search and retrieval
│   │   └── models.py           # Qdrant data models
│   ├── shared/                 # Shared utilities
│   │   └── logs.py             # Logging configuration
│   ├── config.py               # Application configuration
│   ├── database.py             # Database setup
│   └── main.py                 # FastAPI application entry point
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## 🚀 Key Features

### 1. Intelligent Chat Agent
- **TbibiAgent**: Unified AI agent that automatically detects patient mentions and switches context
- **Patient-Specific Queries**: Automatically gathers complete patient profiles using multiple tools
- **General Medical Queries**: Provides evidence-based responses with document context
- **Clinical Format**: Presents information in medical professional format with proper citations
- **Conversation Memory**: Maintains chat history and context across sessions

### 2. Smart Document Management
- **Intelligent Storage Routing**: 
  - Small docs (< 4K tokens) → Direct LLM context
  - Medium docs (4K-20K tokens) → Temporary Qdrant storage (7-day TTL)
  - Large docs (> 20K tokens) → Persistent Qdrant storage (30-day TTL)
- **Multi-Format Support**: PDF, DOCX, TXT, and image files with OCR
- **Semantic Search**: Vector-based search across all document content
- **Context Integration**: Documents automatically included in chat responses

### 3. Patient Data Integration
- **Comprehensive Patient Tools**:
  - Basic demographics and contact information
  - Appointment history and scheduling
  - Medical history and diagnoses
  - Current and past medications
  - Lab results and medical reports
- **Automatic Data Retrieval**: Agent automatically gathers all relevant patient data
- **Clinical Presentation**: Information formatted for medical decision-making

### 4. Advanced Search & Retrieval
- **Multi-Collection Search**: Searches across ephemeral, temporary, and persistent storage
- **Relevance Scoring**: Intelligent ranking of search results
- **Patient-Specific Filtering**: Targeted search within patient records
- **Real-Time Context**: Documents immediately available in chat context

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- PostgreSQL database
- Qdrant vector database
- OpenAI API key
- AWS S3 bucket (optional, for file storage)

### Installation

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application**
   ```bash
   cd src
   python main.py
   ```

4. **Access the API**
   - API: http://localhost:8000
   - Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

### Configuration

Update the `.env` file with your settings:

```env
# Database
DATABASE_URL=your_database_url_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Qdrant Vector Database
QDRANT_HOST=your_qdrant_host_here
QDRANT_PORT=your_qdrant_port_here
QDRANT_API_KEY=your_qdrant_api_key_here

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=your_aws_region_here
S3_BUCKET_NAME=your_s3_bucket_name_here

# Application
APP_NAME=Doctor AI Assistant
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=your_secret_key_here
```


### TODO :
Going to make the documentation more detailed in the future. If i have some time ;).

## 📋 License

This project is part of the Healthcare Management Platform. See the main project license for details.
