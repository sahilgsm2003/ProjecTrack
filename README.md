# ProjecTrack

ProjecTrack is a Progressive Web Application (PWA) designed to serve as an academic project management tool within a single college. It facilitates student group formation, project proposal and approval workflows, and ongoing collaboration with supervising teachers.

## Project Structure

```
.
├── frontend/    # React + Vite PWA application
└── backend/     # Node.js + Express REST API
```

## Getting Started

### Prerequisites

- Node.js (>=14.x)
- npm (>=6.x) or yarn
- PostgreSQL

### Setup

1. Clone the repository:

   ```bash
   git clone <repo_url>
   cd projectrack
   ```

2. Initialize the backend:

   ```bash
   cd backend
   npm install
   # configure database in .env (see .env.example)
   npm run migrate
   npm start
   ```

3. Initialize the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## License

MIT
