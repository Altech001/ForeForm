# FormFlow — Backend API Reference

This document describes all the data models and API endpoints needed to replicate the FormFlow backend using **FastAPI (Python)** or **Express.js (Node.js)**.

---

## Table of Contents
1. [Data Models](#data-models)
2. [API Endpoints](#api-endpoints)
3. [FastAPI Implementation Guide](#fastapi-implementation-guide)
4. [Express.js Implementation Guide](#expressjs-implementation-guide)
5. [File Storage](#file-storage)
6. [Email Integration](#email-integration)
7. [Authentication](#authentication)

---

## Data Models

### Form
```json
{
  "id": "string (uuid)",
  "created_date": "datetime",
  "updated_date": "datetime",
  "created_by": "string (user email)",
  "title": "string (required)",
  "description": "string",
  "status": "enum: draft | published | closed",
  "response_count": "integer (default: 0)",
  "questions": [
    {
      "id": "string",
      "type": "enum: short_text | long_text | multiple_choice | checkbox | dropdown | date | number | email",
      "label": "string",
      "required": "boolean",
      "options": ["string"]
    }
  ],
  "branding": {
    "logo_url": "string (url)",
    "organization": "string",
    "research_title": "string",
    "appendix_label": "string",
    "ethics_statement": "string",
    "consent_text": "string",
    "require_signature": "boolean (default: false)",
    "collect_gps": "boolean (default: false)"
  }
}
```

### FormResponse
```json
{
  "id": "string (uuid)",
  "created_date": "datetime",
  "updated_date": "datetime",
  "created_by": "string (user email)",
  "form_id": "string (required, FK → Form.id)",
  "respondent_name": "string",
  "respondent_email": "string",
  "signature_data_url": "string (base64 PNG data URL)",
  "gps_latitude": "float",
  "gps_longitude": "float",
  "gps_accuracy": "float (meters)",
  "gps_address": "string",
  "answers": [
    {
      "question_id": "string",
      "question_label": "string",
      "question_type": "string",
      "answer": "string"
    }
  ]
}
```

### User
```json
{
  "id": "string (uuid)",
  "created_date": "datetime",
  "email": "string",
  "full_name": "string",
  "role": "enum: admin | user"
}
```

---

## API Endpoints

### Authentication
All endpoints (except `GET /forms/:id` and `POST /forms/:id/responses`) require a Bearer token in the `Authorization` header.

```
Authorization: Bearer <token>
```

---

### Forms

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/forms` | ✅ | List all forms for authenticated user |
| `POST` | `/api/forms` | ✅ | Create a new form |
| `GET` | `/api/forms/:id` | ❌ Public | Get a single form by ID |
| `PUT` | `/api/forms/:id` | ✅ | Update a form |
| `DELETE` | `/api/forms/:id` | ✅ | Delete a form |

#### GET /api/forms
Returns all forms owned by the authenticated user, sorted by `created_date` descending.

**Response 200:**
```json
[
  {
    "id": "abc123",
    "title": "Research Survey",
    "status": "published",
    "response_count": 12,
    "questions": [...],
    "branding": {...},
    "created_date": "2024-01-15T10:30:00Z"
  }
]
```

#### POST /api/forms
**Request Body:**
```json
{
  "title": "My Form",
  "description": "Optional description",
  "questions": [],
  "status": "draft",
  "branding": {}
}
```
**Response 201:** Full form object with generated `id`.

#### GET /api/forms/:id *(Public)*
Used by the public form fill page `/f/:id`. No auth required.
Returns 404 if not found, 403 if status is not `published`.

#### PUT /api/forms/:id
**Request Body:** Any subset of form fields to update.
```json
{
  "title": "Updated Title",
  "questions": [...],
  "status": "published",
  "response_count": 5,
  "branding": { "require_signature": true, "collect_gps": true }
}
```

---

### Form Responses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/forms/:id/responses` | ✅ | List all responses for a form |
| `POST` | `/api/forms/:id/responses` | ❌ Public | Submit a response |
| `GET` | `/api/responses/:responseId` | ✅ | Get a single response |
| `DELETE` | `/api/responses/:responseId` | ✅ | Delete a response |

#### POST /api/forms/:id/responses *(Public)*
Submitted by respondents via the public form link.

**Request Body:**
```json
{
  "respondent_name": "Jane Doe",
  "respondent_email": "jane@example.com",
  "signature_data_url": "data:image/png;base64,...",
  "gps_latitude": -33.9249,
  "gps_longitude": 18.4241,
  "gps_accuracy": 15.5,
  "answers": [
    {
      "question_id": "q_abc123",
      "question_label": "What is your age?",
      "question_type": "number",
      "answer": "28"
    }
  ]
}
```
**Response 201:** Full response object.

**Side effects:**
- Increment `Form.response_count` by 1
- Optionally send confirmation email to `respondent_email`

---

### File Upload

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/upload` | ✅ | Upload a file (logo, PDF, XLSX, CSV) |

**Request:** `multipart/form-data` with field `file`.

**Response 200:**
```json
{ "file_url": "https://your-storage.com/files/abc123.png" }
```

---

### AI Question Extraction (optional endpoint)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/ai/extract-questions` | ✅ | Extract questions from uploaded file or text |

**Request Body:**
```json
{
  "text": "Raw text content OR",
  "file_url": "https://storage.com/uploaded.pdf"
}
```

**Response 200:**
```json
{
  "questions": [
    { "label": "What is your occupation?", "type": "short_text", "required": true, "options": [] },
    { "label": "Select your age group", "type": "multiple_choice", "required": true, "options": ["18-24", "25-34", "35-44", "45+"] }
  ]
}
```
> Use OpenAI / Claude / Gemini to parse the text and return structured questions.

---

## FastAPI Implementation Guide

### Setup
```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose passlib python-multipart boto3 openai
```

### Project Structure
```
backend/
├── main.py
├── models/
│   ├── form.py
│   ├── form_response.py
│   └── user.py
├── routers/
│   ├── forms.py
│   ├── responses.py
│   ├── upload.py
│   └── ai.py
├── schemas/
│   ├── form.py
│   └── response.py
├── auth/
│   └── jwt.py
├── db.py
└── config.py
```

### Database (SQLAlchemy)
```python
# models/form.py
from sqlalchemy import Column, String, Integer, JSON, Enum, DateTime
from sqlalchemy.orm import declarative_base
import uuid, datetime

Base = declarative_base()

class Form(Base):
    __tablename__ = "forms"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_by = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    status = Column(Enum("draft", "published", "closed", name="form_status"), default="draft")
    response_count = Column(Integer, default=0)
    questions = Column(JSON, default=list)
    branding = Column(JSON, default=dict)
    created_date = Column(DateTime, default=datetime.datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class FormResponse(Base):
    __tablename__ = "form_responses"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    form_id = Column(String, nullable=False)
    respondent_name = Column(String)
    respondent_email = Column(String)
    signature_data_url = Column(String)     # base64 PNG
    gps_latitude = Column(String)
    gps_longitude = Column(String)
    gps_accuracy = Column(String)
    answers = Column(JSON, default=list)
    created_date = Column(DateTime, default=datetime.datetime.utcnow)
```

### Key Routes (FastAPI)
```python
# routers/forms.py
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/api/forms", tags=["forms"])

@router.get("/")
def list_forms(current_user=Depends(get_current_user), db=Depends(get_db)):
    return db.query(Form).filter(Form.created_by == current_user.email)\
             .order_by(Form.created_date.desc()).all()

@router.post("/", status_code=201)
def create_form(data: FormCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    form = Form(**data.dict(), created_by=current_user.email)
    db.add(form); db.commit(); db.refresh(form)
    return form

@router.get("/{form_id}")   # PUBLIC — no auth
def get_form(form_id: str, db=Depends(get_db)):
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form: raise HTTPException(404)
    return form

@router.put("/{form_id}")
def update_form(form_id: str, data: FormUpdate, current_user=Depends(get_current_user), db=Depends(get_db)):
    form = db.query(Form).filter(Form.id == form_id, Form.created_by == current_user.email).first()
    if not form: raise HTTPException(404)
    for k, v in data.dict(exclude_unset=True).items():
        setattr(form, k, v)
    db.commit(); db.refresh(form)
    return form

@router.post("/{form_id}/responses", status_code=201)  # PUBLIC
def submit_response(form_id: str, data: ResponseCreate, db=Depends(get_db)):
    form = db.query(Form).filter(Form.id == form_id).first()
    if not form or form.status != "published": raise HTTPException(403, "Form not accepting responses")
    response = FormResponse(form_id=form_id, **data.dict())
    db.add(response)
    form.response_count += 1
    db.commit(); db.refresh(response)
    # TODO: send confirmation email
    return response
```

### Run
```bash
uvicorn main:app --reload --port 8000
```

---

## Express.js Implementation Guide

### Setup
```bash
npm init -y
npm install express prisma @prisma/client jsonwebtoken bcryptjs multer aws-sdk openai cors dotenv
```

### Project Structure
```
backend/
├── server.js
├── routes/
│   ├── forms.js
│   ├── responses.js
│   ├── upload.js
│   └── ai.js
├── middleware/
│   └── auth.js
├── prisma/
│   └── schema.prisma
└── .env
```

### Prisma Schema
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Form {
  id             String   @id @default(uuid())
  createdBy      String
  title          String
  description    String?
  status         String   @default("draft")
  responseCount  Int      @default(0)
  questions      Json     @default("[]")
  branding       Json     @default("{}")
  createdDate    DateTime @default(now())
  updatedDate    DateTime @updatedAt
  responses      FormResponse[]
}

model FormResponse {
  id                String   @id @default(uuid())
  formId            String
  form              Form     @relation(fields: [formId], references: [id], onDelete: Cascade)
  respondentName    String?
  respondentEmail   String?
  signatureDataUrl  String?
  gpsLatitude       Float?
  gpsLongitude      Float?
  gpsAccuracy       Float?
  answers           Json     @default("[]")
  createdDate       DateTime @default(now())
}
```

### Key Routes (Express)
```javascript
// routes/forms.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/forms  — authenticated
router.get('/', requireAuth, async (req, res) => {
  const forms = await prisma.form.findMany({
    where: { createdBy: req.user.email },
    orderBy: { createdDate: 'desc' }
  });
  res.json(forms);
});

// POST /api/forms — authenticated
router.post('/', requireAuth, async (req, res) => {
  const form = await prisma.form.create({
    data: { ...req.body, createdBy: req.user.email }
  });
  res.status(201).json(form);
});

// GET /api/forms/:id — PUBLIC
router.get('/:id', async (req, res) => {
  const form = await prisma.form.findUnique({ where: { id: req.params.id } });
  if (!form) return res.status(404).json({ error: 'Not found' });
  res.json(form);
});

// PUT /api/forms/:id — authenticated
router.put('/:id', requireAuth, async (req, res) => {
  const form = await prisma.form.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(form);
});

// POST /api/forms/:id/responses — PUBLIC
router.post('/:id/responses', async (req, res) => {
  const form = await prisma.form.findUnique({ where: { id: req.params.id } });
  if (!form || form.status !== 'published')
    return res.status(403).json({ error: 'Form not accepting responses' });

  const response = await prisma.formResponse.create({
    data: { formId: req.params.id, ...req.body }
  });
  await prisma.form.update({
    where: { id: req.params.id },
    data: { responseCount: { increment: 1 } }
  });
  // TODO: send confirmation email via Nodemailer / SendGrid
  res.status(201).json(response);
});

module.exports = router;
```

### Auth Middleware (JWT)
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports.requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  req.user = jwt.verify(token, process.env.JWT_SECRET);
  next();
};
```

### Run
```bash
npx prisma migrate dev --name init
node server.js
# or with nodemon:
npx nodemon server.js
```

---

## File Storage

For logo uploads and question extraction from PDFs:

| Service | Notes |
|---------|-------|
| **AWS S3** | Recommended for production |
| **Cloudinary** | Good for image optimization |
| **Supabase Storage** | Free tier, easy setup |
| **Local disk** | Dev only — use `multer` (Express) or `python-multipart` (FastAPI) |

**Upload flow:**
1. Client sends `multipart/form-data` to `POST /api/upload`
2. Server stores file → returns `{ file_url: "https://..." }`
3. Client stores `file_url` in the Form's `branding.logo_url` field

---

## Email Integration

Send response confirmation emails on form submission:

| Service | Library |
|---------|---------|
| **SendGrid** | `sendgrid` (Python) / `@sendgrid/mail` (Node) |
| **Resend** | `resend` (both) |
| **Nodemailer** | SMTP — Express only |
| **AWS SES** | `boto3` (Python) / `aws-sdk` (Node) |

**Email sent on submission includes:**
- Respondent name & email
- Form title & research title (if set)
- All question/answer pairs
- GPS coordinates (if collected)
- Note about signature (if captured)

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/formflow

# Auth
JWT_SECRET=your_super_secret_key

# File Storage (S3)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=formflow-uploads
AWS_REGION=us-east-1

# Email
SENDGRID_API_KEY=...
FROM_EMAIL=noreply@yourapp.com

# AI (for question extraction)
OPENAI_API_KEY=...
```

---

## CORS Configuration

The frontend runs on a different origin, so configure CORS:

**FastAPI:**
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["https://yourapp.com"], allow_methods=["*"], allow_headers=["*"])
```

**Express:**
```javascript
const cors = require('cors');
app.use(cors({ origin: 'https://yourapp.com', methods: ['GET','POST','PUT','DELETE'] }));
```

---

*Generated for FormFlow — a research-grade form builder.*