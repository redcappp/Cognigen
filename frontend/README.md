# CogniGen Frontend

React frontend for CogniGen, an adaptive assessment platform that helps teachers upload learning material, generate source-grounded questions, conduct quizzes, and review student results.

## UI Overview

The application opens with a login/register screen and then routes authenticated teachers into the CogniGen dashboard. The dashboard has two main working areas:

- Exam generation: select processed books, enter a topic, configure question groups by type, difficulty, and count, then generate an assessment from backend RAG results.
- Library and tutor: upload zipped learning material, monitor processing status, select ready books, and ask the AI tutor questions grounded in those books.
- Quiz workflow: export generated papers/answer keys, create a hosted quiz, share the student quiz route, and review responses in the results dashboard.

Students use `/take-quiz/:id` to open a quiz without signing in, submit answers, and send responses back to the backend for scoring.

## Tech Stack

- React
- React Router
- Create React App
- jsPDF for question paper and answer key exports
- QR code support for quiz sharing
- Fetch-based REST integration with the CogniGen FastAPI backend

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

The app runs at `http://localhost:3000`.

## Backend Connection

The frontend expects the CogniGen backend to be running at:

```text
http://127.0.0.1:8000
```

Start the backend first from the companion repository:

```bash
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

The frontend calls these backend endpoints:

| Feature | Endpoint |
| --- | --- |
| Register teacher account | `POST /api/v1/signup` |
| Login and receive JWT | `POST /token` |
| List uploaded books | `GET /api/v1/books` |
| Upload learning material | `POST /api/v1/books/upload` |
| Ask AI tutor questions | `POST /api/v1/chat` |
| Generate book-grounded questions | `POST /api/v1/generate-questions-from-book` |
| Create quiz | `POST /api/v1/quizzes` |
| Student quiz view | `GET /api/v1/quizzes/{quiz_id}` |
| Submit quiz answers | `POST /api/v1/quizzes/{quiz_id}/submit` |
| Review results | `GET /api/v1/quizzes/{quiz_id}/results` |

Authentication-protected teacher routes send the backend JWT in the `Authorization: Bearer <token>` header.

## Local Workflow

1. Run PostgreSQL and the CogniGen backend on port `8000`.
2. Start this React app on port `3000`.
3. Register or log in as a teacher.
4. Upload a `.zip` book package from the Library panel.
5. Select ready books, generate questions, export PDFs, or conduct a quiz.
6. Use the generated quiz route to collect student responses and review scores.

## Available Scripts

```bash
npm start
npm test
npm run build
```
