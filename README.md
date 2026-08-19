
# 🎓 CampusConnect – S B Jain College Event Management System

### Smart College Event Management and Student Engagement System

A full-stack web-based college event management platform developed as a **Final Year Engineering TAE-I Capstone Project**.

CampusConnect provides a centralized platform for students and administrators to manage college events, registrations, digital event passes, attendance, feedback, and event analytics.

---

## 📌 Project Overview

In conventional college environments, event information is often distributed through notice boards, WhatsApp groups, Google Forms, and other disconnected platforms.

This can lead to:

- Difficult event discovery
- Registration bottlenecks
- Manual seat tracking
- Lost registration records
- Difficulty managing attendance
- Manual feedback collection
- Increased administrative workload

**CampusConnect** solves these problems by providing a centralized digital event management system.

The platform allows students to discover and register for events while administrators can create, manage, monitor, and analyze college events from a dedicated dashboard.

---

# 🌟 Key Features

## 👨‍🎓 Student Features

### 🔐 Authentication

- Student registration
- Student login
- Secure password hashing using bcrypt
- JWT-based authentication
- Session management
- Profile management
- Protected student routes

### 🔎 Event Discovery

Students can:

- Browse upcoming events
- Search events by name
- Search by venue
- Search by organizer
- Filter events by category
- Filter events by department
- Sort events by date

### 📝 One-Click Event Registration

The system provides:

- Real-time seat availability
- Event capacity checking
- Registration deadline checking
- Duplicate registration prevention
- Automatic registration creation
- Digital ticket generation

### 🎟️ Digital Event Pass

After successful registration, students receive a unique digital event pass.

Example ticket format:

`TCK-EVT001-1234`

The pass contains:

- Student information
- Event information
- Ticket number
- Event date
- Event venue
- Registration status

Students can print or save their digital pass.

### 📚 Manage Registrations

Students can:

- View upcoming registrations
- View active event passes
- View event history
- Cancel registrations
- Check registration status

### ⭐ Feedback and Rating

Students can:

- Rate events from 1 to 5 stars
- Write reviews
- Submit event feedback

---

# 🛡️ Administrator Features

## 📊 Admin Dashboard

The administrator dashboard provides:

- Total student count
- Total event count
- Total registrations
- Attendance/completion count
- Event statistics
- Registration statistics
- Popular events
- Category-wise analytics

Charts and visualizations are implemented using **Chart.js**.

---

## 📅 Event Management

Administrators can:

- Create events
- View events
- Edit events
- Delete events
- Archive events
- Set event capacity
- Set registration deadlines
- Add venue details
- Add event rules
- Manage event categories

---

## 👥 Student Management

Administrators can:

- View registered students
- Search students
- View student profiles
- Update student information
- Delete student accounts

---

## 🎟️ Registration Management

Administrators can manage registration statuses:

- `Registered`
- `Attended`
- `Cancelled`
- `Waitlisted`

Administrators can also monitor:

- Booked seats
- Available seats
- Event capacity
- Student registrations

---

## ⭐ Feedback Management

Administrators can:

- View student feedback
- Monitor ratings
- Review event feedback
- Remove feedback
- Analyze student satisfaction

---

# 💻 Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML5, CSS3, Bootstrap 5.3 |
| Icons | Bootstrap Icons |
| JavaScript | Vanilla JavaScript ES6+ |
| Charts | Chart.js |
| Backend | Node.js |
| Framework | Express.js |
| Database | JSON File Database |
| Authentication | JWT |
| Password Security | bcryptjs |
| API | REST API |
| Testing | Node.js HTTP Integration Tests |
| Deployment | Render |
| Version Control | Git & GitHub |

---
# 🏗️ System Architecture

```mermaid
graph TD
    A["Student / Admin Browser"]
    B["Frontend - HTML CSS Bootstrap JavaScript"]
    C["Express.js REST API"]
    D["Authentication Middleware - JWT"]
    E["Controllers"]
    F["JSON Database Engine"]
    G["JSON Data Store"]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G

# 📂 Project Structure

S-B-JAIN-College-Event-Management-System/
│
├── data/
│   ├── admins.json
│   ├── events.json
│   ├── feedback.json
│   ├── registrations.json
│   └── students.json
│
├── public/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── admin.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── main.js
│   │   └── student.js
│   │
│   ├── index.html
│   ├── about.html
│   ├── events.html
│   ├── event-details.html
│   ├── contact.html
│   ├── student-login.html
│   ├── student-register.html
│   ├── student-dashboard.html
│   ├── student-profile.html
│   ├── student-events.html
│   ├── my-registrations.html
│   ├── event-history.html
│   ├── feedback.html
│   ├── settings.html
│   ├── admin-login.html
│   ├── admin-dashboard.html
│   ├── manage-events.html
│   ├── add-event.html
│   ├── edit-event.html
│   ├── manage-students.html
│   ├── manage-registrations.html
│   ├── event-analytics.html
│   ├── manage-feedback.html
│   ├── 404.html
│   └── access-denied.html
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   └── server.js
│
├── tests/
│   └── api_test.js
│
├── .env.example
├── .gitignore
├── package.json
├── render.yaml
├── DOCUMENTATION.md
├── VIVA_QUESTIONS.md
└── README.md

