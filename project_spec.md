## Original Project Specification: ProjecTrack

**1. Introduction & Overview**
ProjecTrack is a mobile application, built using PWA, designed to serve as an academic project management tool within a single college. Its primary function is to facilitate student group formation, streamline the project proposal and approval process with supervising teachers, and manage ongoing project collaboration. The application provides dedicated interfaces for students (within their groups) and teachers, enabling efficient project monitoring, meeting scheduling, progress updates, and feedback exchange in a group context.

**2. Background**
Academic institutions often struggle with streamlined management of student project work, especially group projects common in many departments. Traditional approaches lack centralized coordination for group formation, project proposals, communication, and progress tracking between student groups and supervisors. ProjecTrack aims to fill this gap by offering a dedicated mobile platform to manage these academic project workflows, foster structured communication, and provide visibility into group progress and scheduling. Initially, the application will be targeted for use within a single college.

**3. Goals & Scope (MVP)**

* **Primary Goal:** Provide a centralized, efficient mobile platform for student group formation, project proposal/approval, and collaborative project management, enhancing communication and improving progress visibility for student groups and teachers within one specific college.

* **MVP Scope (Inclusions):**

  * User Authentication (Email/Password) & Profile Management for Students and Teachers.
  * Group Formation: Student ability to create groups, invite other students, manage group membership.
  * Project Proposal & Approval: Groups can propose a project; teachers can approve or reject.
  * Role-based access and distinct dashboards/interfaces.
  * Group Project Dashboard and Milestone Management.
  * Group Document Submission & Teacher Feedback.
  * Teacher Availability Management and Group Meeting Scheduling.
  * Real-time Group Chat with Supervisors.
  * Notifications for key events.
  * Teacher dashboard for supervised projects and pending actions.

**4. Functional Requirements**

### 4.1 Authentication & Profile Management

* **FR1.1 (Both):** Users must be able to register using an email and password.
* **FR1.2 (Both):** Users must be able to log in using their registered credentials.
* **FR1.3 (Both):** Users must be able to manage their profile information (Name, Email).
* **FR1.4 (Student):** Student profiles must include academic details (e.g., Roll Number, Program/Year).
* **FR1.5 (Teacher):** Teacher profiles must include professional details (Department – ECE/CSE, Areas of Expertise).
* **FR1.6 (System):** The system must assign a `role` ("student" or "teacher") upon registration.

### 4.2 Group Management

* **FR2.1 (Student):** A student must be able to create a new group, becoming its initial leader.
* **FR2.2 (Student Leader):** The group leader must be able to invite other registered students to join the group via email or username lookup.
* **FR2.3 (Student):** Invited students must receive a notification and be able to accept or reject group invitations.
* **FR2.4 (Student):** All group members must be able to view the current list of members in their group(s).
* **FR2.5 (Student Leader):** The group leader should have the ability to remove members or transfer leadership (for MVP, focus on invites/accepts).
* **FR2.6 (Student):** Students must be able to see a list of groups they are members of.

### 4.3 Project Proposal & Approval

* **FR3.1 (Student Group - Leader):** The group leader must be able to initiate a project proposal, selecting a potential supervising teacher and providing a project title and description.
* **FR3.2 (Teacher):** Teachers must receive notifications for new project proposals submitted by groups.
* **FR3.3 (Teacher):** Teachers must be able to view the details of proposed projects (title, description, group members).
* **FR3.4 (Teacher):** Teachers must be able to approve or reject project proposals. Rejection should allow for an optional reason.
* **FR3.5 (Student Group):** The group must receive a notification regarding the status (approved/rejected) of their project proposal.
* **FR3.6 (System):** An approved proposal should transition into an active project associated with the group and the supervising teacher.

### 4.4 Group Project Management & Tracking

* **FR4.1 (Student Group):** Group members must see a dashboard listing their group's active/approved projects.
* **FR4.2 (Student Group):** The dashboard must show a summary for each project (title, supervisor).
* **FR4.3 (Student Group):** Group members must be able to collaboratively define project milestones (title, description) for their approved projects.
* **FR4.4 (Student Group):** Group members must be able to mark milestones as complete or incomplete and track who made the last update.
* **FR4.5 (Student Group):** The project view must display progress based on the ratio of completed milestones to total milestones.
* **FR4.6 (Teacher):** Teachers must see a dashboard listing the active projects they supervise.
* **FR4.7 (Teacher):** Teachers must be able to view the progress (milestones, completion status) of the groups they supervise.

### 4.5 Group Document Submission & Feedback

* **FR5.1 (Student Group):** Any group member must be able to upload project-related work documents (PDF format).
* **FR5.2 (Student Group):** The uploading member must be able to add a description/comment, with the system tracking which member uploaded the document.
* **FR5.3 (Student Group):** Group members must be able to view a history of document submissions for their project.
* **FR5.4 (Teacher):** Teachers must be able to view documents submitted by groups they supervise.
* **FR5.5 (Teacher):** Teachers must be able to provide structured feedback (textual comments, rating) on submitted documents/milestones.
* **FR5.6 (Student Group):** Group members must be able to view the feedback provided by their supervisor.
* **FR5.7 (Both):** Feedback history must be tracked and viewable at the project level.

### 4.6 Group Meeting Scheduling & Management

* **FR6.1 (Teacher):** Teachers must be able to define their weekly availability.
* **FR6.2 (Student Group - Leader/Member):** A group member must be able to view the available time slots of their assigned supervisor.
* **FR6.3 (Student Group - Leader/Member):** A group member must be able to request a group meeting for an available slot, providing a reason/purpose.
* **FR6.4 (Teacher):** Teachers must receive notifications for new group meeting requests.
* **FR6.5 (Teacher):** Teachers must be able to accept or reject group meeting requests.
* **FR6.6 (Teacher):** Teachers must be able to propose an alternative time for a group meeting.
* **FR6.7 (Student Group):** The group must receive notifications regarding the status of their meeting requests.
* **FR6.8 (Teacher):** The teacher dashboard must display a schedule of confirmed group meetings for the current day.

### 4.7 Communication (Group Chat)

* **FR7.1 (Both):** A dedicated real-time chat interface must exist between each approved student group and their assigned supervisor.
* **FR7.2 (Both):** Group members and the supervisor must be able to send and receive text messages in the group chat with sender identification.
* **FR7.3 (Both):** The chat interface must display message history for the group chat.
* **FR7.4 (Both):** The chat interface must indicate read status for the supervisor and at least one group member.

### 4.8 Notifications

* **FR8.1 (Student):** Receive notifications for group invitations.
* **FR8.2 (Student Group):** Receive notifications for project proposal status updates.
* **FR8.3 (Both):** Receive push notifications for group meeting confirmations/updates.
* **FR8.4 (Student Group):** Receive push notifications when new feedback is available.
* **FR8.5 (Both):** Receive push notifications for new unread group chat messages.
* **FR8.6 (Teacher):** Dashboard highlights pending actions (unread messages, meeting requests, new proposals).

---

## UI & Key Screens

1. **Onboarding & Authentication**

   * Splash / Welcome Screen
   * Sign Up / Log In (email + password)
   * Profile Setup (students enter roll number, program/year; teachers enter department, expertise)

2. **Student Experience**

   * **My Groups**: List of groups with “Create Group” CTA
   * **Group Dashboard**: Members list, active project summary, milestones, proposal button, chat
   * **Project Proposal Flow**: Select teacher → enter title & description → submit
   * **Meeting Scheduler**: Calendar view of teacher slots → request meeting → view status

3. **Teacher Experience**

   * **Supervisor Dashboard**: Pending proposals, today’s meetings, active projects
   * **Group Detail / Review**: Project info, milestones progress, document submissions → feedback
   * **Embedded Chat Interface**

4. **Global Components & Patterns**

   * Notifications Center (bell icon + badge)
   * Push/Web Notifications
   * Responsive PWA Shell (installable, offline-capable)

---

## Suggested Tech Stack

| Layer              | Technology                                 |
| ------------------ | ------------------------------------------ |
| **Front-end**      | React (Vite), basic PWA manifest & caching |
| **Back-end API**   | Node.js with Express.js, REST endpoints    |
| **Database**       | PostgreSQL with Prisma ORM                 |
| **Authentication** | JWT + bcrypt                               |
| **File Storage**   | Local filesystem (uploads folder)          |
| **Real-time Chat** | Socket.IO                                  |
| **Notifications**  | In-app notifications (no push integration) |

## High-Level Architecture

```mermaid
flowchart LR
  subgraph Frontend (PWA)
    A[React + Vite] -->|REST| B(API Server)
    A -->|Socket.IO| C[Chat Server]
  end

  subgraph Backend
    B --> D[(PostgreSQL)]
    B --> E[(Local File Storage)]
    C --> D
    C --> B
  end
```

## 5. Implementation Roadmap

A step‑by‑step plan to build the ProjecTrack MVP:

1. **Initialize Repository**

   * Create Git repo with `/frontend` and `/backend` folders.
   * Add README and `.gitignore`.

2. **Front-end Setup**

   * Scaffold React app with Vite in `/frontend`.
   * Add basic PWA support (manifest.json, minimal service worker for asset caching).
   * Install Tailwind CSS and configure.

3. **Back-end Setup**

   * Scaffold Express.js application in `/backend`.
   * Initialize Prisma and define database schema (User, Group, Project, Milestone, Submission, Meeting, Message).
   * Configure PostgreSQL connection and run migrations.
   * database_url = "postgresql://postgres:Sahilgarima2003@localhost:5432/my_db"

4. **Authentication**

   * Build REST endpoints for signup, login (JWT), and profile update.
   * Integrate bcrypt for password hashing.

5. **Groups & Projects**

   * Implement group creation, invite, accept/reject APIs.
   * Build project proposal endpoints and approval workflow.

6. **Milestones & Documents**

   * Create endpoints for adding/updating milestones and computing progress.
   * Implement local file upload (PDFs) to server’s uploads folder.
   * Add endpoints to list submission history.

7. **Scheduling & Notifications**

   * Develop teacher availability and meeting request endpoints.
   * Handle in-app notifications via REST (no external push).

8. **Real-time Chat**

   * Set up Socket.IO on server and client.
   * Implement message send/receive and persistence in database.
   * Add read receipt flags.

9. **Front-end Feature Integration**

   * Build UI for auth, group management, dashboards, milestones, documents, scheduler, and chat.
   * Connect components to REST and Socket.IO APIs.

10. **Final Polishing**

* UI tweaks, error handling, and basic input validation.
* Manual testing of all user flows.

---
