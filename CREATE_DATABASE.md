# Créer la base de données Ecobilda

## Option 1: Avec pgAdmin (Interface graphique)

1. Ouvre **pgAdmin** (installé avec PostgreSQL 17)
2. Connecte-toi avec ton mot de passe PostgreSQL
3. Clic droit sur **Databases** → **Create** → **Database**
4. Nom: `ecobilda`
5. Owner: `postgres`
6. Cliquer **Save**

## Option 2: En ligne de commande (PowerShell)

```powershell
# Remplace MON_MOT_DE_PASSE par ton vrai mot de passe PostgreSQL
$env:PGPASSWORD="MON_MOT_DE_PASSE"
& "C:\Program Files\PostgreSQL\17\bin\createdb" -U postgres ecobilda
```

## Option 3: SQL direct

```powershell
# Remplace MON_MOT_DE_PASSE par ton vrai mot de passe
$env:PGPASSWORD="MON_MOT_DE_PASSE"
& "C:\Program Files\PostgreSQL\17\bin\psql" -U postgres -c "CREATE DATABASE ecobilda;"
```

## Après avoir créé la base

Mets à jour le mot de passe dans `backend/.env`:

```env
DB_PASSWORD=TON_VRAI_MOT_DE_PASSE
```

Puis lance les migrations:

```bash
cd backend
source venv/Scripts/activate
python manage.py migrate
```

## Vérifier que ça fonctionne

```bash
cd backend
source venv/Scripts/activate
python manage.py check
```

Si ça affiche "System check identified no issues", c'est bon! Tu peux lancer Django:

```bash
python manage.py runserver
```
