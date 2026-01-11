# Configuration MCP pour Mantine

Ce guide explique comment configurer le serveur MCP (Model Context Protocol) pour accéder à la documentation Mantine dans Cursor.

## Installation

Le serveur MCP pour Mantine est disponible via npm : `@hakxel/mantine-ui-server`

## Configuration dans Cursor

Le serveur MCP Mantine est maintenant installé localement dans le projet. Pour le configurer dans Cursor :

### Étape 1 : Ouvrir les paramètres MCP de Cursor

1. Ouvrez les paramètres de Cursor (File > Preferences > Settings ou `Ctrl+,`)
2. Recherchez "MCP" ou "Model Context Protocol"
3. Ouvrez la section de configuration des serveurs MCP

### Étape 2 : Ajouter la configuration

**Option 1 : Utiliser l'installation locale (recommandé)**

Ajoutez la configuration suivante pour utiliser le package installé localement :

```json
{
  "mcpServers": {
    "mantine": {
      "command": "node",
      "args": ["./frontend/node_modules/@hakxel/mantine-ui-server/build/index.js"],
      "cwd": "C:/Users/aurel/Desktop/Projets/Ecobilda",
      "env": {
        "MANTINE_VERSION": "7.17.8"
      }
    }
  }
}
```

**Option 2 : Utiliser npx (si l'installation locale ne fonctionne pas)**

```json
{
  "mcpServers": {
    "mantine": {
      "command": "npx",
      "args": ["-y", "@hakxel/mantine-ui-server"],
      "env": {
        "MANTINE_VERSION": "7.17.8"
      }
    }
  }
}
```

**Option 3 : Installation globale**

Si vous préférez installer le serveur globalement :

```bash
npm install -g @hakxel/mantine-ui-server
```

Puis utilisez cette configuration :

```json
{
  "mcpServers": {
    "mantine": {
      "command": "mantine-ui-server"
    }
  }
}
```

## Vérification

Une fois configuré, redémarrez Cursor. Le serveur MCP Mantine devrait être disponible et vous pourrez accéder à la documentation Mantine directement depuis l'assistant.

## Ressources

- Dépôt GitHub : https://github.com/hakxel/mantine-ui-server
- Documentation Mantine : https://mantine.dev

