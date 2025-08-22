# TBIBI Healthcare Management Platform

> **Bridging Healthcare Gaps with Technology**

A comprehensive, full-stack healthcare management platform featuring a Go backend API, React frontend, Python RAG system, and search services. Designed to streamline healthcare access and delivery for patients, doctors, and administrative staff.

## 🏗️ System Architecture

The platform follows a **microservices architecture** with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   RAG Service   │    │  Search Service │
│   (React)       │◄──►│     (Go)        │◄──►│   (Python)      │◄──►│   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                     
    ┌────▼────┐             ┌────▼─────┐             ┌────▼────┐         
    │Material │             │PostgreSQL│             │ Vector  │         
    │   UI    │             │Database  │             │Database │            
    └─────────┘             └──────────┘             └─────────┘            
```

### 🎯 Core Principles

- **Domain-Driven Design**: Features organized by business domains
- **Microservices**: Loosely coupled, independently deployable services
- **API-First**: RESTful APIs with comprehensive documentation
- **Real-time**: WebSocket integration for instant communication
- **Scalable**: Containerized deployment with Docker

## 📁 Project Structure

```
healthcare_management_platform/
├── backend_go/                       # Go Backend API
│   ├── main.go                       # Application entry point
│   ├── pkg/
│   │   ├── config/                   # Configuration management
│   │   ├── database/                 # Database layer & migrations
│   │   ├── auth/                     # JWT authentication utilities
│   │   ├── middleware/               # HTTP middleware (auth, CORS)
│   │   ├── models/                   # Data models & structures
│   │   ├── handlers/                 # HTTP request handlers
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── appointment/          # Appointment management
│   │   │   ├── doctor/               # Doctor-specific endpoints
│   │   │   ├── patient/              # Patient-specific endpoints
│   │   │   ├── chat/                 # Real-time messaging
│   │   │   └── receptionist/         # Receptionist management
│   │   ├── services/                 # Business logic layer
│   │   ├── routes/                   # Route definitions
│   │   ├── utils/                    # Utility functions
│   │   └── validators/               # Input validation
│   ├── docker-compose.yml            # Docker services configuration
│   ├── Dockerfile                    # Container build instructions
│   ├── go.mod                        # Go module definition
│   └── go.sum                        # Dependency checksums
├── frontend/                         # React Frontend Application
│   ├── public/                       # Static assets
│   ├── src/
│   │   ├── features/                 # Feature-based architecture
│   │   │   ├── auth/                 # Authentication & authorization
│   │   │   ├── appointments/         # Appointment management
│   │   │   ├── chat/                 # Real-time messaging
│   │   │   ├── medical-records/      # Document management
│   │   │   ├── user-management/      # User profiles
│   │   │   └── ...                   # Other features
│   │   ├── components/               # Shared UI components
│   │   ├── contexts/                 # React contexts
│   │   ├── hooks/                    # Custom React hooks
│   │   └── pages/                    # Top-level pages
│   ├── package.json                  # Dependencies & scripts
│   └── tailwind.config.js            # Tailwind CSS configuration
├── rag_app_python/                   # Python RAG Service
│   ├── src/app/                      # FastAPI application
│   ├── db/                           # Database migrations & queries
│   ├── requirements/                 # Python dependencies
│   └── pyproject.toml                # Project configuration
├── search_service_python/            # Python Search Service
│   ├── src/                          # Search API implementation
│   ├── requirements/                 # Python dependencies
│   └── Dockerfile                    # Container build instructions
├── generate_test_data.py             # Test data generation script
└── README.md                         # This documentation
```

## 🚀 Quick Start

### Prerequisites
- **Go** 1.24.4 (for backend)
- **Node.js** 16+ (v22.14.0+ recommended)
- **React** 18.2.0 (included with Create React App)
- **Python** 3.11+ (for RAG and search services)
- **Docker** & Docker Compose (recommended)
- **PostgreSQL** 15+ (or use Docker)

### Manual Setup

#### Backend Setup
```bash
cd backend_go

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Install dependencies and run
go mod tidy
go run main.go # or u can build and run executable
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

#### Python Services Setup
```bash
# RAG Service
cd rag_app_python
pip install -r requirements/requirements.txt
python -m uvicorn src.app.main:app --reload --port 8000

# Search Service
cd search_service_python
pip install -r requirements/requirements.txt
python src/api.py
```

### Environment Configuration

Create `.env` files in respective directories:

**Backend (.env)**
```env
# Database
DATABASE_HOST=your_database_host
DATABASE_PORT=your_database_port
DATABASE_USER=your_database_user
DATABASE_PASSWORD=your_database_password
DATABASE_NAME=your_database_name

# Server
SERVER_PORT=your_server_port

# JWT
JWT_SECRET_KEY=your_super_secret_jwt_key
REFRESH_SECRET=your_refresh_token_secret

# AWS S3 (optional)
S3_BUCKET_NAME=your-s3-bucket
AWS_REGION=your-aws-region
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_KEY=your_secret_key

# Email (optional)
SMTP_EMAIL=your-email@gmail.com
SMTP_EMAIL_PASSWORD=your_app_password
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WEBSOCKET_URL=ws://localhost:3001
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## 🏥 Core Features

### 🎯 Multi-Role Platform

**User Types & Capabilities:**

**👨‍⚕️ Doctors**
- Complete practice management dashboard
- Patient appointment scheduling and management
- Medical report creation and diagnosis tracking
- AI-powered chatbot for patient data analysis
- Content creation (health articles and blog posts)
- Staff management (hire and manage receptionists)
- Real-time chat with patients and staff

**👤 Patients**
- Doctor search and discovery with advanced filters
- Online appointment booking with real-time availability
- Medical records and document management
- Secure messaging with healthcare providers
- Health content feed and educational resources
- Appointment history and medical timeline

**👩‍💼 Receptionists**
- Patient management and registration
- Appointment scheduling for assigned doctors
- Patient search and information management
- Administrative dashboard with key metrics
- Communication tools for patient coordination

### 🔐 Authentication & Security

- **Multi-role Authentication**: Role-based login system
- **JWT Security**: Secure token-based authentication with refresh tokens
- **Email Verification**: Account activation and password reset
- **Role-based Access Control**: Feature access based on user permissions
- **Session Management**: Automatic logout and token refresh

### 📅 Advanced Appointment System

- **Smart Scheduling**: AI-enhanced appointment booking
- **Real-time Availability**: Live calendar updates
- **Conflict Prevention**: Automatic double-booking prevention
- **Cancellation Management**: Reason tracking and rescheduling
- **Statistics Dashboard**: Appointment analytics and insights
- **Notification System**: Email and in-app appointment reminders

### 🏥 Comprehensive Medical Records

- **Digital Health Records**: Complete patient medical history
- **Document Management**: Secure file upload and sharing
- **Medical Reports**: Detailed appointment reports with diagnosis
- **Prescription Tracking**: Medication history and current prescriptions
- **Referral System**: Seamless doctor-to-doctor patient referrals
- **Medical Timeline**: Chronological health event tracking

### 💬 Real-time Communication

- **WebSocket Chat**: Instant messaging between all user types
- **Media Sharing**: Image and file sharing capabilities
- **Chat History**: Persistent message storage and search
- **User Discovery**: Find and connect with healthcare providers
- **Group Messaging**: Multi-participant conversations

### 🤖 AI-Powered Features

- **Medical Chatbot**: AI assistant for symptom analysis and doctor recommendations
- **Smart Search**: AI-enhanced doctor discovery with specialty matching
- **Document Analysis**: Automated medical document processing
- **Predictive Analytics**: Health trend analysis and insights
- **RAG System**: Retrieval-Augmented Generation for medical queries

### 📱 Social Health Platform

- **Health Feed**: Curated medical content and articles
- **Doctor Blogging**: Healthcare professionals can publish content
- **Community Engagement**: Comments, likes, and social interactions
- **Follow System**: Patients can follow trusted healthcare providers
- **Content Discovery**: Specialty-based content filtering

### 🔍 AI-Powered Search Services

- **OpenAI Integration**: Intelligent symptom analysis and specialty matching
- **Smart Doctor Recommendations**: AI-driven doctor suggestions based on symptoms
- **Multi-criteria Filtering**: Location, specialty, availability filtering
- **Natural Language Processing**: Symptom-to-specialty mapping

## 🔧 Technical Implementation

### 🏗️ Backend Architecture (Go)

**Technology Stack:**
- **Framework**: Gin HTTP framework
- **Database**: PostgreSQL with pgx driver
- **Authentication**: JWT with refresh tokens
- **Real-time**: WebSocket for chat functionality
- **File Storage**: AWS S3 integration
- **Email**: SMTP for notifications
- **Containerization**: Docker & Docker Compose


### ⚛️ Frontend Architecture (React)

**Technology Stack:**
- **Framework**: React 18.2.0 with Create React App
- **UI Library**: Material-UI (MUI) 5.16.7
- **Styling**: Tailwind CSS 3.3.3 + Flowbite components
- **State Management**: React Context API + Recoil
- **Routing**: React Router DOM 6.16.0
- **HTTP Client**: Axios with interceptors
- **Real-time**: WebSocket integration
- **Charts**: Chart.js with React Chart.js 2
- **File Management**: Syncfusion File Manager

**Key Features:**
- Feature-first architecture
- Role-based navigation and access control
- Responsive design (mobile-first)
- Real-time updates via WebSocket
- Comprehensive form validation
- Advanced data visualization

### 🐍 Python Services

**RAG Service (FastAPI):**
- Vector database integration
- Document processing and indexing
- Natural language query processing
- Medical knowledge retrieval

**Search Service (FastAPI):**
- OpenAI integration for symptom analysis
- Intelligent specialty recommendation
- Direct API integration with backend
- Natural language symptom processing

### 🗄️ Database Schema

**Core Tables:**
```sql
-- User Management
doctor_info, patient_info, receptionist_info
verification_tokens, password_reset_tokens

-- Appointments & Scheduling
appointments, availabilities, appointment_cancellations

-- Medical Records
medical_reports, prescribed_medications
medical_diagnosis_history, patient_medical_files

-- Communication
chats, messages, participants

-- Content & Social
blog_posts, comments, likes, follows

-- File Management
folder_file_info, shared_items
```

### 🔄 API Architecture

**RESTful Endpoints:**
```
/api/v1/
├── auth/                    # Authentication
│   ├── login, register, refresh
│   └── forgot-password, reset-password
├── doctors/                 # Doctor management
├── patients/                # Patient management
├── appointments/            # Appointment system
├── chats/                   # Real-time messaging
├── medical-records/         # Document management
├── feed/                    # Social features
└── search/                  # Search functionality
```
TODO: Still gotta fix some of them


## 🛡️ Security & Compliance

### 🔐 Authentication & Authorization

- **Multi-layer Security**: JWT access tokens + refresh tokens
- **Role-based Access Control (RBAC)**: Granular permissions per user type
- **Session Management**: Automatic token refresh and secure logout
- **Password Security**: Bcrypt hashing with salt
- **Email Verification**: Two-factor account activation
- **Rate Limiting**: API endpoint protection against abuse

### 🛡️ Data Protection

- **Input Validation**: Comprehensive request sanitization
- **SQL Injection Prevention**: Parameterized queries and ORM protection
- **XSS Protection**: Content Security Policy and input sanitization
- **CORS Configuration**: Controlled cross-origin resource sharing
- **File Upload Security**: Type validation, size limits, and virus scanning
- **Data Encryption**: Sensitive data encryption at rest and in transit


### 🔧 Development Workflow

**Local Development:**
```bash
cd backend_go && go run main.go
cd frontend && npm start
cd rag_app_python && uvicorn src.app.main:app --reload
```

**Built with ❤️ using Go, React, Python, PostgreSQL, and modern cloud technologies**

*TBIBI Healthcare Management Platform - Bridging Healthcare Gaps with Technology*
