# 🚀 Guide Test: Fonctionnalités Temps Réel

**Date**: 25 Décembre 2024 - Part 11 & 12
**Features**: Email Notifications (Celery) + WebSocket (Django Channels)

---

## ⚡ Setup Complet (6 services)

### Terminal 1: PostgreSQL + PostGIS

```bash
# Option A: Docker (recommandé)
docker run -d \
  --name ecobilda-postgres \
  -e POSTGRES_DB=ecobilda \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgis/postgis:15-3.3

# Option B: Local install
# Déjà running si installé en service
```

**Vérifier**:
```bash
psql -h localhost -U postgres -d ecobilda -c "SELECT version();"
```

---

### Terminal 2: Redis

```bash
# Option A: Docker (recommandé)
docker run -d \
  --name ecobilda-redis \
  -p 6379:6379 \
  redis:7-alpine

# Option B: Local install (Windows)
# Télécharger depuis https://github.com/microsoftarchive/redis/releases
# Lancer: redis-server.exe
```

**Vérifier**:
```bash
redis-cli ping
# Doit retourner: PONG
```

---

### Terminal 3: Django (ASGI)

```bash
cd backend

# Activer venv
venv\Scripts\activate

# Variables d'environnement (.env)
# REDIS_URL=redis://localhost:6379/0
# EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
# FRONTEND_URL=http://localhost:5173

# Migrations (première fois)
python manage.py migrate
python manage.py loaddata apps/skills/fixtures/initial_skills.json

# Créer 2 users de test
python manage.py createsuperuser --email alice@test.com --no-input
python manage.py createsuperuser --email bob@test.com --no-input

# Lancer Django avec ASGI (pour WebSocket)
python manage.py runserver
# OU pour production-like:
# daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

**Vérifier**:
- http://localhost:8000/ → Page Django
- http://localhost:8000/admin/ → Admin accessible

---

### Terminal 4: Celery Worker

```bash
cd backend
venv\Scripts\activate

# Lancer worker
celery -A config worker -l info

# Windows: Si erreur "pool", utiliser:
celery -A config worker -l info --pool=solo
```

**Output attendu**:
```
-------------- celery@DESKTOP v5.3.4
--- ***** -----
-- ******* ----
- *** --- * ---
- ** ---------- [config]
- ** ---------- .> app:         ecobilda:0x...
- ** ---------- .> transport:   redis://localhost:6379/0

[tasks]
  . apps.messaging.tasks.send_message_notification
  . apps.messaging.tasks.send_review_notification
  . apps.messaging.tasks.send_review_response_notification
  . config.celery.debug_task

[2024-12-25 16:30:00,000: INFO/MainProcess] Connected to redis://...
[2024-12-25 16:30:00,000: INFO/MainProcess] celery@DESKTOP ready.
```

---

### Terminal 5: Frontend

```bash
cd frontend

# Installer dépendances (première fois)
npm install

# Créer .env (si pas fait)
echo VITE_API_BASE_URL=http://localhost:8000 > .env

# Lancer dev server
npm run dev
```

**Vérifier**:
- http://localhost:5173 → App React charge

---

### Terminal 6: Console logs (optionnel)

Utile pour voir les emails console:

```bash
cd backend
venv\Scripts\activate

# Watch logs Django
python manage.py runserver --verbosity 3
```

---

## 🧪 Test 1: Email Notifications (Celery)

### Préparation

**1. Créer 2 utilisateurs**

Via Django shell:
```bash
cd backend
python manage.py shell
```

```python
from apps.users.models import User
from apps.messaging.models import Conversation, Message

# Créer users
alice = User.objects.create_user(
    email='alice@test.com',
    password='testpass123',
    first_name='Alice',
    last_name='Smith'
)

bob = User.objects.create_user(
    email='bob@test.com',
    password='testpass123',
    first_name='Bob',
    last_name='Jones'
)

# Créer conversation
conv = Conversation.objects.create(user1=alice, user2=bob)

print(f"Conversation ID: {conv.id}")
print(f"Alice ID: {alice.id}")
print(f"Bob ID: {bob.id}")
```

---

### Test: Envoi message → Email notification

**2. Envoyer message (via API ou shell)**

Option A: **API (recommandé)**
```bash
# Login as Alice
ACCESS_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"testpass123"}' \
  | jq -r '.tokens.access')

# Envoyer message
curl -X POST http://localhost:8000/api/conversations/1/send-message/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body":"Hello Bob, interested in your project!"}'
```

Option B: **Django Shell**
```python
from apps.messaging.models import Message
from apps.messaging.tasks import send_message_notification

msg = Message.objects.create(
    conversation=conv,
    sender=alice,
    body="Hello Bob from shell!"
)

# Trigger email task
send_message_notification.delay(msg.id)
```

---

**3. Vérifier email envoyé**

**Terminal Celery** devrait afficher:
```
[2024-12-25 16:35:00,123: INFO] Task apps.messaging.tasks.send_message_notification[abc-123] received
[2024-12-25 16:35:00,456: INFO] Task apps.messaging.tasks.send_message_notification[abc-123] succeeded in 0.3s: {'sent': True, 'reason': None}
```

**Terminal Django** (console backend) devrait afficher l'email:
```
Content-Type: text/plain; charset="utf-8"
Subject: New message from Alice on Ecobilda
From: noreply@ecobilda.org
To: bob@test.com
Date: Wed, 25 Dec 2024 16:35:00 -0000

Ecobilda - New Message

Hi Bob,

You have a new message from Alice Smith!

---
Hello Bob, interested in your project!
---

Read the full message: http://localhost:5173/messages/1
```

✅ **Success!** Email sent

---

### Test: Anti-spam 24h cooldown

**4. Envoyer 5 messages de suite**

```bash
for i in {1..5}; do
  curl -X POST http://localhost:8000/api/conversations/1/send-message/ \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"body\":\"Message $i\"}"
  sleep 1
done
```

**Vérifier Terminal Celery**:
```
[...] Task send_message_notification[1] succeeded: {'sent': True}  ← Premier
[...] Task send_message_notification[2] succeeded: {'sent': False, 'reason': '0.5h < 24h'}
[...] Task send_message_notification[3] succeeded: {'sent': False, 'reason': '0.6h < 24h'}
[...] Task send_message_notification[4] succeeded: {'sent': False, 'reason': '0.7h < 24h'}
[...] Task send_message_notification[5] succeeded: {'sent': False, 'reason': '0.8h < 24h'}
```

✅ **Success!** Seulement 1 email envoyé (anti-spam fonctionne)

---

### Test: Opt-out (disable notifications)

**5. Désactiver notifications pour Bob**

```python
bob.email_notifications = False
bob.save()
```

**6. Envoyer nouveau message**

```bash
curl -X POST http://localhost:8000/api/conversations/1/send-message/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body":"This should not send email"}'
```

**Vérifier Celery**:
```
[...] Task succeeded: {'sent': False, 'reason': 'Receiver has disabled email notifications'}
```

✅ **Success!** Opt-out fonctionne

---

## 🌐 Test 2: WebSocket Chat

### Préparation

**1. Obtenir JWT tokens**

```bash
# Login as Alice
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"testpass123"}' \
  > alice_token.json

# Login as Bob
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@test.com","password":"testpass123"}' \
  > bob_token.json

# Extraire tokens
ALICE_TOKEN=$(cat alice_token.json | jq -r '.tokens.access')
BOB_TOKEN=$(cat bob_token.json | jq -r '.tokens.access')

echo "Alice: $ALICE_TOKEN"
echo "Bob: $BOB_TOKEN"
```

---

### Test: Browser WebSocket Console

**2. Ouvrir 2 fenêtres navigateur**

**Fenêtre 1 (Alice)**:
1. Ouvrir http://localhost:5173
2. F12 → Console
3. Coller:

```javascript
// Connect as Alice
const aliceToken = 'eyJ0eXAi...';  // Remplacer par ALICE_TOKEN
const wsAlice = new WebSocket(`ws://localhost:8000/ws/chat/?token=${aliceToken}`);

wsAlice.onopen = () => console.log('✅ Alice connected');

wsAlice.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('📩 Alice received:', data);
};

wsAlice.onerror = (error) => console.error('❌ Alice error:', error);

wsAlice.onclose = (event) => console.log('🔌 Alice disconnected:', event.code);

// Helper function
window.aliceSend = (conversationId, body) => {
    wsAlice.send(JSON.stringify({
        type: 'send_message',
        conversation_id: conversationId,
        body: body
    }));
};
```

**Fenêtre 2 (Bob)**:
1. Ouvrir http://localhost:5173 (nouvel onglet)
2. F12 → Console
3. Coller:

```javascript
// Connect as Bob
const bobToken = 'eyJ0eXAi...';  // Remplacer par BOB_TOKEN
const wsBob = new WebSocket(`ws://localhost:8000/ws/chat/?token=${bobToken}`);

wsBob.onopen = () => console.log('✅ Bob connected');

wsBob.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('📩 Bob received:', data);
};

wsBob.onerror = (error) => console.error('❌ Bob error:', error);

wsBob.onclose = (event) => console.log('🔌 Bob disconnected:', event.code);

// Helper function
window.bobSend = (conversationId, body) => {
    wsBob.send(JSON.stringify({
        type: 'send_message',
        conversation_id: conversationId,
        body: body
    }));
};
```

---

**3. Test: Connection established**

**Console Alice**:
```json
✅ Alice connected
📩 Alice received: {
  "type": "connection_established",
  "user_id": 1,
  "message": "Connected to Ecobilda chat"
}
```

**Console Bob**:
```json
✅ Bob connected
📩 Bob received: {
  "type": "connection_established",
  "user_id": 2,
  "message": "Connected to Ecobilda chat"
}
```

✅ **Success!** Both connected

---

**4. Test: Send message (Alice → Bob)**

**Console Alice**:
```javascript
aliceSend(1, 'Hello Bob from WebSocket!');
```

**Console Alice** (confirmation):
```json
📩 Alice received: {
  "type": "message_sent",
  "message": {
    "id": 42,
    "conversation": 1,
    "sender": {
      "id": 1,
      "first_name": "Alice",
      "profile_picture": null
    },
    "body": "Hello Bob from WebSocket!",
    "created_at": "2024-12-25T16:45:00Z"
  }
}
```

**Console Bob** (notification):
```json
📩 Bob received: {
  "type": "new_message",
  "message": {
    "id": 42,
    "conversation": 1,
    "sender": {
      "id": 1,
      "first_name": "Alice"
    },
    "body": "Hello Bob from WebSocket!",
    "created_at": "2024-12-25T16:45:00Z"
  }
}
```

✅ **Success!** Real-time message delivery

---

**5. Test: Send message (Bob → Alice)**

**Console Bob**:
```javascript
bobSend(1, 'Hi Alice, thanks for your interest!');
```

**Console Bob** (confirmation):
```json
📩 Bob received: {
  "type": "message_sent",
  ...
}
```

**Console Alice** (notification):
```json
📩 Alice received: {
  "type": "new_message",
  "message": {
    "sender": {
      "id": 2,
      "first_name": "Bob"
    },
    "body": "Hi Alice, thanks for your interest!"
  }
}
```

✅ **Success!** Bidirectional messaging works

---

**6. Test: Typing indicator**

**Console Alice**:
```javascript
wsAlice.send(JSON.stringify({
    type: 'typing',
    conversation_id: 1
}));
```

**Console Bob** receives:
```json
📩 Bob received: {
  "type": "typing",
  "conversation_id": 1,
  "user_id": 1,
  "user_name": "Alice Smith"
}
```

**Console Alice** (stop typing):
```javascript
wsAlice.send(JSON.stringify({
    type: 'stop_typing',
    conversation_id: 1
}));
```

**Console Bob** receives:
```json
📩 Bob received: {
  "type": "stop_typing",
  "conversation_id": 1,
  "user_id": 1
}
```

✅ **Success!** Typing indicators work

---

### Test: Persistence (WebSocket + Database)

**7. Vérifier messages sauvegardés en DB**

```bash
cd backend
python manage.py shell
```

```python
from apps.messaging.models import Message, Conversation

conv = Conversation.objects.get(id=1)
messages = Message.objects.filter(conversation=conv).order_by('created_at')

for msg in messages:
    print(f"[{msg.created_at}] {msg.sender.first_name}: {msg.body}")
```

**Output attendu**:
```
[2024-12-25 16:30:00] Alice: Hello Bob, interested in your project!
[2024-12-25 16:35:00] Alice: Message 1
[2024-12-25 16:35:01] Alice: Message 2
...
[2024-12-25 16:45:00] Alice: Hello Bob from WebSocket!
[2024-12-25 16:46:00] Bob: Hi Alice, thanks for your interest!
```

✅ **Success!** WebSocket messages persisted to database

---

### Test: Unread counts

```python
conv.refresh_from_db()
print(f"Unread for Alice (user1): {conv.unread_count_user1}")
print(f"Unread for Bob (user2): {conv.unread_count_user2}")
print(f"Last message: {conv.last_message_text}")
```

**Output**:
```
Unread for Alice (user1): 1
Unread for Bob (user2): 6
Last message: Hi Alice, thanks for your interest!
```

✅ **Success!** Unread counts updated

---

## 🔍 Test 3: Integration complète

### Scenario: Full user journey

**1. Alice s'inscrit**
- Frontend: Register form
- Backend: POST `/api/auth/register/`
- Résultat: User créé, tokens retournés

**2. Alice browse projets**
- Frontend: ProjectsPage
- Backend: GET `/api/projects/`
- Résultat: Liste projets affichée

**3. Alice clique sur projet de Bob**
- Frontend: ProjectDetailPage
- Backend: GET `/api/projects/1/`
- Résultat: Détails projet + map

**4. Alice envoie message à Bob**
- Frontend: Click "Contact Host" → ChatPage
- Backend WebSocket: `send_message` event
- Résultat:
  - Message sauvegardé DB ✅
  - Alice reçoit confirmation ✅
  - Bob reçoit notification WebSocket ✅
  - Email envoyé à Bob ✅ (si online < 24h)

**5. Bob répond**
- Frontend: Bob open ChatPage
- Backend WebSocket: Connect + send message
- Résultat:
  - Alice reçoit message temps réel ✅
  - Pas d'email (déjà notifié < 24h) ✅

**6. Alice laisse review**
- Frontend: ReviewForm sur ProfilePage
- Backend: POST `/api/reviews/`
- Validation: Eligibility check (6 mois messages) ✅
- Résultat: Review créée + email à Bob

✅ **Success!** Full stack integration works

---

## 📊 Monitoring & Debug

### Celery: Flower (Task monitoring)

```bash
cd backend
pip install flower
celery -A config flower
```

**Open**: http://localhost:5555

**Features**:
- Task history
- Success/failure rates
- Worker status
- Retry attempts

---

### Redis: Monitor commands

```bash
redis-cli

# Monitor all commands in real-time
MONITOR

# Check connected clients
CLIENT LIST

# Check keys
KEYS *

# Check channel subscribers
PUBSUB CHANNELS
```

---

### Django: Logging

```python
# settings/development.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'apps.messaging': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
```

---

## ✅ Checklist Tests Temps Réel

### Email Notifications (Celery)
- [ ] Redis running
- [ ] Celery worker running
- [ ] Task auto-discovered
- [ ] Email envoyé après message
- [ ] Anti-spam 24h fonctionne
- [ ] Opt-out fonctionne
- [ ] Email console visible

### WebSocket (Django Channels)
- [ ] Redis running
- [ ] Django ASGI running
- [ ] WebSocket connection établie
- [ ] JWT authentication fonctionne
- [ ] Messages envoyés/reçus temps réel
- [ ] Typing indicators fonctionnent
- [ ] Messages sauvegardés DB
- [ ] Unread counts updated
- [ ] Multiple users simultanés

### Integration
- [ ] WebSocket + Celery ensemble
- [ ] Message → WebSocket + Email
- [ ] Persistence correcte
- [ ] Performance acceptable (< 100ms)
- [ ] Pas de memory leaks
- [ ] Reconnection automatique

---

## 🎉 Success Criteria

**Les fonctionnalités temps réel sont OK si**:

✅ Celery worker process tasks
✅ Emails envoyés avec anti-spam
✅ WebSocket bidirectional fonctionne
✅ Typing indicators temps réel
✅ Messages persistent en DB
✅ Multiple users simultanés OK
✅ Reconnection automatique fonctionne
✅ Unread counts mis à jour

---

**MVP Backend: 98% COMPLETE! 🚀**

Prochaine étape: **Tests automatisés + Déploiement**
