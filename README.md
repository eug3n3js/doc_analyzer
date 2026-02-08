# doc_analyzer

CLI tool that analyzes PDF and DOCX documents using Google Vertex AI (Gemini). Supports OCR via Tesseract and LibreOffice for DOCX→PDF conversion.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set:
   - `PROJECT_ID` — your Google Cloud project ID
   - `LOCATION` — e.g. `us-central1`
   - `KEY_FILE_PATH` — path to your service account JSON (e.g. `api_keys.json`)
3. Place your Google Cloud service account key file (e.g. `api_keys.json`) in the project root. **Do not commit** `.env` or API key files.

## Run

```bash
npm start
```

Enter a directory path containing `.pdf` or `.docx` files, choose an analysis mode (1–4), and get the result from Vertex AI.

## Requirements

- Node.js
- [Poppler](https://poppler.freedesktop.org/) (for PDF→images)
- LibreOffice (for DOCX→PDF)
- Google Cloud project with Vertex AI enabled
