# Ecobilda API Endpoints

Complete reference for all available API endpoints.

**Base URL:** `http://localhost:8000/api/`
**WebSocket URL:** `ws://localhost:8000/ws/`

All authenticated endpoints require the header:
```
Authorization: Bearer {access_token}
```

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users and Profile](#users-and-profile)
3. [Projects](#projects)
4. [Messaging (Conversations and Messages)](#messaging)
5. [Reviews](#reviews)
6. [Notifications](#notifications)
7. [Favorites](#favorites)
8. [Skills](#skills)
9. [WebSocket Endpoints](#websocket-endpoints)
10. [Django Admin](#django-admin)
11. [General Notes](#general-notes)

---

## Authentication

All auth endpoints are under `/api/auth/`.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register/` | Register a new user account | No |
| POST | `/api/auth/login/` | Login with email and password | No |
| POST | `/api/auth/logout/` | Logout (blacklist refresh token) | Yes |
| GET | `/api/auth/me/` | Get current authenticated user | Yes |
| POST | `/api/auth/token/` | Obtain JWT token pair (alternative to login) | No |
| POST | `/api/auth/token/refresh/` | Refresh an access token | No |
| POST | `/api/auth/password-reset/` | Request password reset email | No |
| POST | `/api/auth/password-reset/confirm/` | Confirm password reset with token | No |
| POST | `/api/auth/change-password/` | Change password (authenticated user) | Yes |
| POST | `/api/auth/google/` | Google OAuth login (placeholder, returns 501) | No |
| POST | `/api/auth/apple/` | Apple OAuth login (placeholder, returns 501) | No |

### POST /api/auth/register/

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "password_confirm": "securepassword",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1990-01-15"
}
```

**Response (201):**
```json
{
  "user": { "id": 1, "email": "user@example.com", "first_name": "John", "..." },
  "tokens": { "refresh": "...", "access": "..." },
  "message": "Registration successful. Welcome to Ecobilda!"
}
```

### POST /api/auth/login/

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "user": { "..." },
  "tokens": { "refresh": "...", "access": "..." },
  "message": "Login successful."
}
```

### POST /api/auth/logout/

**Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### POST /api/auth/token/refresh/

**Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### POST /api/auth/password-reset/

**Body:**
```json
{
  "email": "user@example.com"
}
```

Always returns 200 regardless of whether the email exists (prevents enumeration).

### POST /api/auth/password-reset/confirm/

**Body:**
```json
{
  "token": "uid-token",
  "password": "newpassword",
  "password_confirm": "newpassword"
}
```

### POST /api/auth/change-password/

**Body:**
```json
{
  "old_password": "currentpassword",
  "new_password": "newpassword",
  "new_password_confirm": "newpassword"
}
```

**Response (200):** Returns new JWT tokens after password change.

---

## Users and Profile

### Public Users (read-only)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/users/` | List all active users (public info) | No |
| GET | `/api/users/{id}/` | Get public profile of a specific user | No |
| GET | `/api/users/{id}/reviews/` | Get reviews for a user (stub, returns empty) | No |

**Query parameters for GET /api/users/:**
- `skills` -- Comma-separated skill codes (e.g., `?skills=carpentry,cobbuilding`)

### Own Profile (authenticated)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/profile/` | Get own full profile | Yes |
| PUT | `/api/profile/{id}/` | Full update of own profile | Yes |
| PATCH | `/api/profile/{id}/` | Partial update of own profile | Yes |
| POST | `/api/profile/upload_picture/` | Upload profile picture (multipart/form-data) | Yes |
| GET | `/api/profile/stats/` | Get own statistics | Yes |

**Body for PUT/PATCH /api/profile/{id}/:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Passionate about permaculture",
  "gender": "M",
  "address": {
    "city": "Paris",
    "postal_code": "75001",
    "country_code": "FR",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "formatted_address": "Paris, France"
  },
  "language_codes": ["en", "fr"],
  "email_notifications": true
}
```

**Response for GET /api/profile/stats/ (200):**
```json
{
  "projects_count": 3,
  "review_count": 12,
  "average_rating": 4.5,
  "date_joined": "2024-01-15T10:30:00Z",
  "last_login": "2024-12-25T14:20:00Z"
}
```

---

## Projects

All project endpoints are under `/api/projects/`. Uses a DRF DefaultRouter.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/projects/` | List projects with advanced filtering | No |
| POST | `/api/projects/` | Create a new project | Yes |
| GET | `/api/projects/{id}/` | Get full project details | No |
| PUT | `/api/projects/{id}/` | Full update of a project (owner only) | Yes |
| PATCH | `/api/projects/{id}/` | Partial update of a project (owner only) | Yes |
| DELETE | `/api/projects/{id}/` | Delete a project (owner only) | Yes |
| GET | `/api/projects/{id}/availabilities/` | Get project availabilities | No |
| POST | `/api/projects/{id}/set_availabilities/` | Set project availabilities (owner only) | Yes |
| GET | `/api/projects/map_data/` | Get map-optimized project data | No |
| POST | `/api/projects/{id}/flag/` | Flag a project for moderation | Yes |

### Query Parameters for GET /api/projects/

| Parameter | Type | Description |
|-----------|------|-------------|
| `keyword` | string | Search in title and description |
| `skills` | string | Comma-separated skill codes (e.g., `carpentry,cobbuilding`) |
| `countries` | string | Comma-separated country codes (e.g., `FR,ES,DE`) |
| `project_type` | string | `PERM` (permaculture) or `NATB` (natural building) |
| `internet` | boolean | Filter projects with internet |
| `family_friendly` | boolean | Filter family-friendly projects |
| `pets_allowed` | boolean | Filter projects that allow pets |
| `smoking_allowed` | boolean | Filter projects that allow smoking |
| `available_from` | date | Date in YYYY-MM-DD format for availability filtering |
| `exclude_own` | boolean | Exclude current user's own projects from results |

### POST /api/projects/

**Body:**
```json
{
  "title": "Permaculture Farm in Brittany",
  "description": "Help us establish a food forest...",
  "project_type": "PERM",
  "address": {
    "city": "Rennes",
    "postal_code": "35000",
    "country_code": "FR",
    "latitude": 48.1173,
    "longitude": -1.6778,
    "formatted_address": "Rennes, France"
  },
  "skill_codes": ["garden_maintenance", "composting", "pruning"],
  "hours_per_day": 5,
  "days_per_week": 6,
  "max_helpers": 2,
  "accommodation_details": "Private cabin with bathroom",
  "food_details": "Organic meals from the garden",
  "internet_provided": false,
  "family_friendly": true,
  "pets_allowed": true,
  "smoking_allowed": false
}
```

### POST /api/projects/{id}/set_availabilities/

**Body:**
```json
[
  {
    "year": 2025,
    "january": true,
    "february": true,
    "march": true,
    "april": true,
    "may": true,
    "june": true,
    "july": true,
    "august": true,
    "september": true,
    "october": false,
    "november": false,
    "december": false
  }
]
```

### GET /api/projects/map_data/

Accepts the same query parameters as the list endpoint. Returns minimal data optimized for map markers.

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Eco-Construction Project",
    "description_preview": "Build a strawbale house in beautiful Provence...",
    "latitude": 43.9493,
    "longitude": 4.8055,
    "cover_image": "http://localhost:8000/media/projects/...",
    "project_type": "NATB"
  }
]
```

### POST /api/projects/{id}/flag/

Cannot flag your own project. After 3 flags, the project becomes invisible.

**Response (200):**
```json
{
  "message": "Project flagged successfully.",
  "flagged_count": 1,
  "is_visible": true
}
```

---

## Messaging

Conversations and messages are under `/api/conversations/` and `/api/messages/`.

NOTE: Users cannot send messages freely. A participation request must be accepted before a conversation is created. See the business logic section in CLAUDE.md.

### Conversations

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/conversations/` | List all conversations for current user | Yes |
| POST | `/api/conversations/` | Create or get existing conversation with a recipient | Yes |
| GET | `/api/conversations/{id}/` | Get a specific conversation | Yes |
| DELETE | `/api/conversations/{id}/` | Delete a conversation (participant only) | Yes |
| POST | `/api/conversations/{id}/mark-as-read/` | Mark conversation as read | Yes |
| POST | `/api/conversations/{id}/toggle-mute/` | Mute or unmute conversation | Yes |
| GET | `/api/conversations/{id}/messages/` | Get all messages in a conversation (marks as read) | Yes |
| POST | `/api/conversations/{id}/send-message/` | Send a message in a conversation | Yes |

PUT and PATCH on conversations are not allowed (returns 405).

### POST /api/conversations/

**Body:**
```json
{
  "recipient_id": 42
}
```

Returns existing conversation if one exists, or creates a new one.

### POST /api/conversations/{id}/toggle-mute/

**Body:**
```json
{
  "muted": true
}
```

### POST /api/conversations/{id}/send-message/

**Body:**
```json
{
  "body": "Hello! I am interested in your project."
}
```

Creates the message, updates conversation metadata, creates an in-app notification for the recipient, and triggers an async email notification (with 24-hour anti-spam cooldown).

**Response (201):** Returns the serialized message object.

### Messages (read-only)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/messages/{id}/` | Get a specific message (participant only) | Yes |

Messages are created via `POST /api/conversations/{id}/send-message/`, not via the messages endpoint directly. The list action on `/api/messages/` is available but the preferred way to get messages is via `GET /api/conversations/{id}/messages/`.

---

## Reviews

All review endpoints are under `/api/reviews/`. Uses a DRF DefaultRouter.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/reviews/` | List reviews written by current user | Yes |
| POST | `/api/reviews/` | Create a new review | Yes |
| GET | `/api/reviews/{id}/` | Get a specific review | Yes |
| DELETE | `/api/reviews/{id}/` | Delete a review (writer only, if no response) | Yes |
| PATCH | `/api/reviews/{id}/add-response/` | Add a response to a review (receiver only, once) | Yes |
| GET | `/api/reviews/eligibility/{user_id}/` | Check if current user can review another user | Yes |
| GET | `/api/reviews/user/{user_id}/` | Get all reviews received by a specific user | Yes |

PUT and PATCH on reviews are not allowed (returns 405). Use the `add-response` action instead.

### POST /api/reviews/

**Body:**
```json
{
  "receiver_id": 42,
  "rating": 5,
  "feedback": "Great host, very welcoming and knowledgeable."
}
```

Validates eligibility before creation. Both users must have exchanged messages in the last 180 days.

### PATCH /api/reviews/{id}/add-response/

**Body:**
```json
{
  "response": "Thank you for the kind words!"
}
```

Only the review receiver can add a response, and only once.

### GET /api/reviews/eligibility/{user_id}/

**Response (200):**
```json
{
  "eligible": true,
  "reason": "You can review this user.",
  "conversation_id": 7
}
```

---

## Notifications

All notification endpoints are under `/api/notifications/`. Read-only ViewSet with custom actions.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/notifications/` | List all notifications for current user | Yes |
| GET | `/api/notifications/{id}/` | Get a specific notification | Yes |
| POST | `/api/notifications/{id}/mark-as-read/` | Mark a notification as read | Yes |
| POST | `/api/notifications/mark-all-read/` | Mark all notifications as read | Yes |
| GET | `/api/notifications/unread-count/` | Get count of unread notifications | Yes |

### Query Parameters for GET /api/notifications/

| Parameter | Type | Description |
|-----------|------|-------------|
| `unread_only` | boolean | Only return unread notifications (`true`/`false`) |
| `type` | string | Filter by notification type |

### GET /api/notifications/unread-count/

**Response (200):**
```json
{
  "count": 5
}
```

### POST /api/notifications/mark-all-read/

**Response (200):**
```json
{
  "detail": "Marked 5 notification(s) as read.",
  "updated_count": 5
}
```

---

## Favorites

All favorite endpoints are under `/api/favorites/`.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/favorites/` | List favorite project IDs for current user | Yes |
| POST | `/api/favorites/` | Add a project to favorites | Yes |
| DELETE | `/api/favorites/{id}/` | Remove a favorite by favorite ID | Yes |
| DELETE | `/api/favorites/by-project/{project_id}/` | Remove a favorite by project ID | Yes |

### GET /api/favorites/

Returns an array of project IDs (not full objects):
```json
[1, 5, 12, 23]
```

### POST /api/favorites/

**Body:**
```json
{
  "project": 42
}
```

Cannot favorite your own project. Returns 400 if already favorited.

**Response (201):**
```json
{
  "id": 1,
  "project": 42,
  "user": 7,
  "created_at": "2025-03-22T10:00:00Z"
}
```

---

## Skills

All skill endpoints are under `/api/skills/`. Read-only (skills are fixture data).

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/skills/` | List all 16 skills | No |
| GET | `/api/skills/{code}/` | Get a specific skill by code | No |

### Query Parameters for GET /api/skills/

| Parameter | Type | Description |
|-----------|------|-------------|
| `lang` | string | Language code for translated display names (`en`, `fr`, `es`, `de`) |
| `category` | string | Filter by category: `PERM` (permaculture) or `NATB` (natural building) |

### Skill Codes Reference

**Permaculture (PERM):** `garden_maintenance`, `grafting`, `pruning`, `harvesting`, `composting`, `weeding`, `propagating`, `seeds_harvesting`

**Natural Building (NATB):** `carpentry`, `masonry`, `strawbale_building`, `cob_building`, `earthen_plaster`, `lime_plaster`, `hempcrete`, `tadelakt_plaster`

---

## WebSocket Endpoints

WebSocket connections require JWT authentication via query parameter: `?token={access_token}`

### Chat WebSocket

```
ws://localhost:8000/ws/chat/?token={access_token}
```

Joins the user's personal group (`user_{id}`) for receiving messages.

**Client-to-server events:**

| Event Type | Payload | Description |
|------------|---------|-------------|
| `send_message` | `{ "conversation_id": 123, "body": "Hello!" }` | Send a message |
| `typing` | `{ "conversation_id": 123 }` | Notify that user is typing |
| `stop_typing` | `{ "conversation_id": 123 }` | Notify that user stopped typing |

**Server-to-client events:**

| Event Type | Description |
|------------|-------------|
| `connection_established` | Sent on successful connection |
| `message_sent` | Confirmation that your message was sent |
| `new_message` | A new message from another user |
| `typing` | Another user is typing |
| `stop_typing` | Another user stopped typing |
| `error` | Error message |

### Notifications WebSocket

```
ws://localhost:8000/ws/notifications/?token={access_token}
```

Joins the user's notification group (`notifications_user_{id}`).

**Client-to-server events:**

| Event Type | Payload | Description |
|------------|---------|-------------|
| `mark_notification_read` | `{ "notification_id": 123 }` | Mark a notification as read |

**Server-to-client events:**

| Event Type | Description |
|------------|-------------|
| `connection_established` | Sent on successful connection |
| `unread_count` | Current unread notification count (sent on connect and after updates) |
| `new_notification` | A new notification received |
| `notification_marked_read` | Confirmation that notification was marked as read |
| `error` | Error message |

---

## Django Admin

```
http://localhost:8000/admin/
```

Standard Django admin interface. Requires a superuser account (create with `python manage.py createsuperuser`).

---

## General Notes

### Authentication

All authenticated requests require the header:
```
Authorization: Bearer {access_token}
```

Access tokens are obtained via `/api/auth/login/`, `/api/auth/register/`, or `/api/auth/token/`. When an access token expires, use `/api/auth/token/refresh/` with the refresh token.

### Pagination

List endpoints use DRF default pagination (page-based):
```
?page=2
```

### Error Response Format

```json
{
  "detail": "Error description"
}
```

Or for validation errors:
```json
{
  "field_name": ["Error message for this field."]
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (successful delete) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 405 | Method Not Allowed |
| 501 | Not Implemented (placeholder endpoints) |

### Apps Not Yet Exposed via API

The following apps exist in the backend codebase but do not have URL routing configured yet:

- **Participations** (`backend/apps/participations/`) -- Participation request management (pending implementation)
- **Reports** (`backend/apps/reports/`) -- Project and review flagging (pending implementation)
- **Searches** (`backend/apps/searches/`) -- Saved searches (pending implementation)
- **Emails** (`backend/apps/emails/`) -- Internal transactional email service (no public API)
- **Core** (`backend/apps/core/`) -- Reference data models (Country, Language, Address) -- no public endpoints

### Media Files

In development, media files (profile pictures, project images) are served at:
```
http://localhost:8000/media/...
```

This requires `DEBUG=True`. In production, Nginx should serve the `/media/` path.
