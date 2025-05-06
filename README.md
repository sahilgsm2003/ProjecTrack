# ProjecTrack  academic Project Management Tool

**ProjecTrack** is a Progressive Web Application (PWA) designed to streamline academic project management within a college setting. It facilitates student group formation, manages project proposals and approvals with supervising teachers, and supports ongoing project collaboration.

This repository contains the source code for ProjecTrack, organized into:
-   `/frontend`: The React-based PWA client (Vite + Tailwind CSS).
-   `/backend`: The Node.js with Express.js API server (Prisma ORM + PostgreSQL).

## Table of Contents

-   [Project Specification](#project-specification)
-   [Core Features (MVP)](#core-features-mvp)
-   [Tech Stack](#tech-stack)
-   [High-Level Architecture](#high-level-architecture)
-   [Current Status](#current-status)
-   [Getting Started](#getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
-   [API Endpoints Overview](#api-endpoints-overview)
-   [Roadmap & Future Work](#roadmap--future-work)

## Project Specification

For detailed project requirements, functional specifications, UI mockups (conceptual), and the original implementation roadmap, please refer to the [project_spec.md](project_spec.md) file in this repository.

## Core Features (MVP)

The Minimum Viable Product aims to deliver:

*   **User Authentication & Profiles:** Secure signup and login for students and teachers, with role-specific profile management.
*   **Group Management:** Students can create groups, invite members, and manage group memberships. Invitations can be accepted or rejected.
*   **Project Proposal & Approval:** Student groups (led by a group leader) can propose projects to teachers, who can then approve or reject them.
*   **Role-Based Dashboards:** Distinct interfaces and functionalities for students and teachers.
*   *(Upcoming)* Group Project Dashboard and Milestone Management.
*   *(Upcoming)* Group Document Submission & Teacher Feedback.
*   *(Upcoming)* Teacher Availability Management and Group Meeting Scheduling.
*   *(Upcoming)* Real-time Group Chat with Supervisors.
*   *(Upcoming)* In-app Notifications for key events.

## Tech Stack

| Layer              | Technology                                       |
| :----------------- | :----------------------------------------------- |
| **Front-end**      | React (Vite), Tailwind CSS, Basic PWA Features   |
| **Back-end API**   | Node.js with Express.js, RESTful APIs            |
| **Database**       | PostgreSQL                                       |
| **ORM**            | Prisma                                           |
| **Authentication** | JWT (JSON Web Tokens) + bcrypt (password hashing)|
| **File Storage**   | (Planned) Local filesystem (`/backend/uploads`)  |
| **Real-time Chat** | (Planned) Socket.IO                              |

## High-Level Architecture

```mermaid
flowchart LR
  subgraph Frontend: PWA - Vite
    A[React UI Components] -->|REST API Calls| B(Backend API Server)
    A -->|WebSocket Planned| C[Chat Server Socket.IO]
  end

  subgraph Backend Node.js/Express.js
    B --> D{Prisma ORM}
    D --> E[(PostgreSQL Database)]
    B --> F[(Local File Storage - Planned)]
    C --> D
    C --> B
  end
```

## Current Status

The project is currently in the **backend development phase**. Key functionalities implemented include:

*   User authentication (signup, login, profile management via JWT).
*   Group creation, listing, and a complete invitation system (send, view pending, accept/reject).
*   Project proposal submission by group leaders.
*   Project proposal review (view, approve/reject) by assigned teachers.

The frontend has been initialized with Vite, React, and Tailwind CSS, including basic PWA setup, but UI components for the implemented backend features are pending.

## Getting Started

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm, yarn, or pnpm
*   PostgreSQL server running
*   Git

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/projectrack_minor.git
    cd projectrack_minor/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install / pnpm install
    ```

3.  **Set up environment variables:**
    *   Create a `.env` file in the `/backend` directory by copying `.env.example`
    *   Update the `DATABASE_URL` to point to your local PostgreSQL instance and database.
        Example: `DATABASE_URL="postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:5432/my_db"`
    *   Set a strong `JWT_SECRET` for signing tokens.
        Example: `JWT_SECRET="your_super_secret_and_long_jwt_key"`
    *   (Optional) `PORT` for the backend server (defaults to 3001).

4.  **Create your PostgreSQL database:**
    *   Ensure your PostgreSQL server is running.
    *   Create a database matching the one specified in your `DATABASE_URL` (e.g., `my_db`).


5.  **Run database migrations:**
    *   This will create all necessary tables based on the Prisma schema.
    ```bash
    npx prisma migrate dev
    ```

6.  **Start the backend server:**
    ```bash
    npm run dev # For development with nodemon
    # or
    # npm start # To run the compiled server (if build step exists)
    ```
    The backend API should now be running (typically on `http://localhost:3001`).

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install / pnpm install
    ```

3.  **Start the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend should now be running (typically on `http://localhost:5173`).

## API Endpoints Overview

(This section can be expanded as more endpoints are built or linked to API documentation if generated)

Key base routes implemented:
*   `/api/auth/` (signup, login, profile)
*   `/api/groups/` (group creation, listing, invitations, responding to invites)
*   `/api/projects/` (project proposal, viewing proposals, approving/rejecting)

## Roadmap & Future Work

The immediate next steps involve implementing:

1.  **Milestones & Documents (Backend):**
    *   Endpoints for managing project milestones (CRUD).
    *   File upload capabilities for project document submissions.
    *   Endpoints for teachers to provide feedback on documents/milestones.
2.  **Scheduling & Notifications (Backend - Initial):**
    *   Teacher availability management.
    *   Meeting request and confirmation system.
    *   Basic in-app notification framework (data structure, simple REST delivery).
3.  **Real-time Chat (Backend - Initial):**
    *   Socket.IO setup for basic message send/receive.
    *   Message persistence.
4.  **Frontend Feature Integration:**
    *   Building UI components for all implemented backend features (authentication, dashboards, group management, project proposals, etc.).
    *   Connecting frontend components to the backend REST APIs.

Refer to `project_spec.md` for the full list of planned features.