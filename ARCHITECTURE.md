# Ecobilda - Architecture Diagrams

## High-Level Architecture

```mermaid
graph TB
    subgraph Clients
        FN["Frontend Next.js<br/>(localhost:3000)"]
        ADM["Admin Panel React<br/>(localhost:5174)"]
        MOB["Mobile (future)"]
    end

    subgraph Backend["Backend (localhost:8000)"]
        DJANGO["Django 5.0 + DRF"]
        CHANNELS["Django Channels<br/>(WebSocket)"]
        CELERY["Celery Workers"]
        BEAT["Celery Beat<br/>(Scheduler)"]
    end

    subgraph Infrastructure
        PG["PostgreSQL 15"]
        REDIS["Redis 7"]
        EMAIL["Email Service<br/>(SMTP)"]
    end

    FN -->|REST API /api/| DJANGO
    FN -->|WebSocket /ws/| CHANNELS
    ADM -->|REST API /api/admin/| DJANGO
    MOB -.->|REST API| DJANGO

    DJANGO --> PG
    DJANGO --> REDIS
    CHANNELS --> REDIS
    CELERY --> PG
    CELERY --> REDIS
    CELERY --> EMAIL
    BEAT --> REDIS
```

## Docker Services

```mermaid
graph LR
    subgraph docker-compose
        DB["db<br/>PostgreSQL 15<br/>:5432"]
        RD["redis<br/>Redis 7<br/>:6379"]
        WEB["backend<br/>Daphne ASGI<br/>:8000"]
        CW["celery<br/>Worker"]
        CB["celery-beat<br/>Scheduler"]
    end

    WEB --> DB
    WEB --> RD
    CW --> DB
    CW --> RD
    CB --> RD
```

## Backend Django Apps

```mermaid
graph TB
    subgraph core["Core & Reference Data"]
        CORE["core<br/>Country, Language, Address"]
        SKILLS["skills<br/>16 Fixed Skills"]
    end

    subgraph users_auth["Users & Auth"]
        USERS["users<br/>Unified User Model"]
        AUTH["authentication<br/>JWT + Google OAuth"]
    end

    subgraph projects_flow["Projects & Participation"]
        PROJECTS["projects<br/>Project, Availability, Images"]
        PARTICIPATIONS["participations<br/>Request: PENDING > ACCEPTED/REFUSED"]
    end

    subgraph communication["Communication"]
        MESSAGING["messaging<br/>Conversation, Message<br/>(WebSocket + REST)"]
        NOTIFICATIONS["notifications<br/>In-app Notifications"]
        EMAILS["emails<br/>Transactional Emails"]
    end

    subgraph engagement["Engagement"]
        REVIEWS["reviews<br/>Airbnb-style Reviews"]
        FAVORITES["favorites<br/>User Favorites"]
        SEARCHES["searches<br/>Saved Searches"]
        REPORTS["reports<br/>Project/Review Flagging"]
    end

    AUTH --> USERS
    PROJECTS --> USERS
    PROJECTS --> SKILLS
    PROJECTS --> CORE
    PARTICIPATIONS --> PROJECTS
    PARTICIPATIONS --> USERS
    MESSAGING --> PARTICIPATIONS
    REVIEWS --> MESSAGING
    FAVORITES --> PROJECTS
    NOTIFICATIONS --> USERS
    EMAILS --> MESSAGING
    REPORTS --> PROJECTS
    REPORTS --> REVIEWS
    SEARCHES --> PROJECTS
```

## Database Models (Entity Relationship)

```mermaid
erDiagram
    User {
        int id PK
        string email UK
        string first_name
        string last_name
        string phone
        date date_of_birth
        text bio
        string profile_picture_url
        bool email_notifications
        bool email_verified
        datetime created_at
    }

    Project {
        int id PK
        int owner_id FK
        string title
        text description
        string status "DRAFT/PENDING/ACTIVE/REJECTED"
        string project_type
        int min_stay_days
        int max_volunteers
        bool meals_included
        bool accommodation_included
        string accommodation_type
        datetime validated_at
        datetime created_at
    }

    Availability {
        int id PK
        int project_id FK
        string availability_type "FIXED/FLEXIBLE"
        date start_date
        date end_date
        bool jan
        bool feb
        bool mar
        bool apr
        bool may
        bool jun
        bool jul
        bool aug
        bool sep
        bool oct
        bool nov
        bool dec
    }

    ProjectImage {
        int id PK
        int project_id FK
        string image
        int order
    }

    Skill {
        int id PK
        string name_en
        string name_fr
        string name_es
        string name_de
        string category "PERMACULTURE/NATURAL_BUILDING"
    }

    Address {
        int id PK
        string formatted_address
        string city
        string country_code
        float latitude
        float longitude
    }

    ParticipationRequest {
        int id PK
        int volunteer_id FK
        int project_id FK
        string status "PENDING/ACCEPTED/REFUSED/CANCELLED/EXPIRED"
        text motivation
        date proposed_start
        date proposed_end
        datetime created_at
    }

    Conversation {
        int id PK
        int participation_request_id FK
        datetime created_at
    }

    Message {
        int id PK
        int conversation_id FK
        int sender_id FK
        text content
        bool is_read
        datetime created_at
    }

    Review {
        int id PK
        int reviewer_id FK
        int reviewed_id FK
        int conversation_id FK
        int rating
        text comment
        bool is_published
        datetime published_at
        datetime created_at
    }

    Notification {
        int id PK
        int user_id FK
        string type
        string message
        bool is_read
        datetime created_at
    }

    Favorite {
        int id PK
        int user_id FK
        int project_id FK
    }

    SavedSearch {
        int id PK
        int user_id FK
        string name
        json filters
    }

    Report {
        int id PK
        int reporter_id FK
        int project_id FK
        int review_id FK
        string reason
        string status
    }

    Country {
        int id PK
        string code
        string name
    }

    Language {
        int id PK
        string code
        string name
    }

    User ||--o{ Project : "owns"
    User ||--o{ ParticipationRequest : "volunteers"
    User ||--o{ Review : "writes"
    User ||--o{ Notification : "receives"
    User ||--o{ Favorite : "saves"
    User ||--o{ SavedSearch : "creates"
    User ||--o{ Report : "reports"
    User ||--o{ Message : "sends"
    Project ||--o| Availability : "has"
    Project ||--o{ ProjectImage : "has"
    Project }o--o{ Skill : "requires"
    Project ||--o| Address : "located at"
    Project ||--o{ ParticipationRequest : "receives"
    Project ||--o{ Favorite : "favorited"
    Project ||--o{ Report : "flagged"
    Project }o--o{ Language : "spoken"
    ParticipationRequest ||--o| Conversation : "creates"
    Conversation ||--o{ Message : "contains"
    Conversation ||--o{ Review : "reviewed via"
    Review ||--o{ Report : "flagged"
```

## Frontend Next.js Pages (App Router)

```mermaid
graph TB
    subgraph App["app/[locale]/"]
        HOME["/ <br/>HomePage"]

        subgraph auth["(auth) - Unauthenticated"]
            LOGIN["/login"]
            REGISTER["/register"]
            FORGOT["/forgot-password"]
            RESET["/reset-password/[uid]/[token]"]
            VERIFY["/verify-email/[token]"]
        end

        subgraph public["(public) - Public"]
            PROJ_LIST["/projects"]
            PROJ_DETAIL["/projects/[id]"]
            SEARCH["/search"]
            ABOUT["/about"]
            FAQ["/faq"]
            CONTACT["/contact"]
            FOR_HOSTS["/for-hosts"]
            FOR_VOL["/for-volunteers"]
            HOW["/how-it-works"]
            PRIVACY["/privacy"]
            TERMS["/terms"]
        end

        subgraph protected["(protected) - Authenticated"]
            MY_PROJ["/my-projects"]
            NEW_PROJ["/new"]
            EDIT_PROJ["/projects/[id]/edit"]
            MESSAGES["/messages"]
            CHAT["/messages/[id]"]
            PARTICI["/participations"]
            REQUESTS["/requests"]
            FAVORITES["/favorites"]
            PROFILE["/profile"]
            SETTINGS["/settings"]
            SAVED["/saved-searches"]
        end
    end
```

## User Flows

### Participation & Messaging Flow

```mermaid
sequenceDiagram
    actor V as Volunteer
    actor H as Host
    participant API as Backend API
    participant WS as WebSocket
    participant DB as Database

    V->>API: Browse /projects
    API-->>V: Project list (ACTIVE only)

    V->>API: POST /participations/ (motivation, dates)
    API->>DB: Create ParticipationRequest (PENDING)
    API-->>V: Request created
    API->>H: Notification (new request)

    H->>API: GET /participations/host-requests/
    API-->>H: Pending requests list

    alt Host Accepts
        H->>API: PATCH /participations/{id}/ (ACCEPTED)
        API->>DB: Update status = ACCEPTED
        API->>DB: Create Conversation
        API-->>H: Conversation created
        API->>V: Notification (request accepted)

        V->>WS: Connect /ws/conversations/{id}/
        H->>WS: Connect /ws/conversations/{id}/
        V->>WS: Send message
        WS->>DB: Save Message
        WS->>H: Real-time message
        Note over API: Email notification<br/>(max 1 per 24h per conversation)
    else Host Refuses
        H->>API: PATCH /participations/{id}/ (REFUSED)
        API->>V: Notification (request refused)
        Note over V,H: No conversation created
    end
```

### Review Publication Flow (Airbnb-style)

```mermaid
sequenceDiagram
    actor U1 as User A
    actor U2 as User B
    participant API as Backend API
    participant CELERY as Celery Beat

    Note over U1,U2: Both must have sent >=1 message<br/>in last 180 days

    U1->>API: POST /reviews/ (rating, comment)
    API->>API: Check eligibility (6-month rule)
    API-->>U1: Review saved (NOT published)

    alt Both reviews submitted
        U2->>API: POST /reviews/ (rating, comment)
        API->>API: Both reviews exist -> Publish both
        API-->>U1: Review published notification
        API-->>U2: Review published notification
    else 30-day deadline expires
        CELERY->>API: Check unpublished reviews
        API->>API: Auto-publish after 30 days
        API-->>U1: Review published notification
    end
```

### Project Creation & Validation

```mermaid
stateDiagram-v2
    [*] --> Draft: User fills 4-step form

    Draft --> PENDING: Submit project (5+ images required)
    PENDING --> ACTIVE: Admin validates
    PENDING --> REJECTED: Admin rejects

    ACTIVE --> ACTIVE: Edit allowed
    REJECTED --> PENDING: User resubmits

    ACTIVE --> [*]: Project visible to all

    note right of PENDING
        Admin reviews in Admin Panel
        (localhost:5174)
    end note

    note right of ACTIVE
        Visible in /projects listing
        Volunteers can apply
    end note
```

### Participation Request States

```mermaid
stateDiagram-v2
    [*] --> PENDING: Volunteer submits request

    PENDING --> ACCEPTED: Host accepts
    PENDING --> REFUSED: Host refuses
    PENDING --> CANCELLED: Volunteer cancels
    PENDING --> EXPIRED: Auto-expire (Celery, J+14)

    ACCEPTED --> [*]: Conversation created, chat enabled

    note right of ACCEPTED
        Only state that creates
        a Conversation
    end note
```

## Frontend Services Layer

```mermaid
graph LR
    subgraph Pages["Next.js Pages"]
        P1["Projects"]
        P2["Messages"]
        P3["Profile"]
        P4["Auth"]
        P5["Participations"]
        P6["Reviews"]
        P7["Favorites"]
        P8["Searches"]
    end

    subgraph Services["services/"]
        S_API["api.ts<br/>(Axios instance)"]
        S_AUTH["auth.ts"]
        S_PROJ["projects.ts"]
        S_MSG["messaging.ts"]
        S_PART["participations.ts"]
        S_REV["reviews.ts"]
        S_PROF["profile.ts"]
        S_FAV["favorites.ts"]
        S_NOTIF["notifications.ts"]
        S_SKILLS["skills.ts"]
        S_LANG["languages.ts"]
        S_SEARCH["searches.ts"]
        S_REPORT["reports.ts"]
        S_CONTACT["contact.ts"]
    end

    subgraph Backend["Backend API"]
        API["/api/*"]
    end

    P1 --> S_PROJ
    P2 --> S_MSG
    P3 --> S_PROF
    P4 --> S_AUTH
    P5 --> S_PART
    P6 --> S_REV
    P7 --> S_FAV
    P8 --> S_SEARCH

    S_AUTH --> S_API
    S_PROJ --> S_API
    S_MSG --> S_API
    S_PART --> S_API
    S_REV --> S_API
    S_PROF --> S_API
    S_FAV --> S_API
    S_NOTIF --> S_API
    S_SKILLS --> S_API
    S_LANG --> S_API
    S_SEARCH --> S_API
    S_REPORT --> S_API
    S_CONTACT --> S_API

    S_API -->|HTTP/HTTPS| API
```
