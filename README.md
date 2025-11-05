# Finance Tracker Console

Projet réalisé dans le cadre du cours *Realtime Databases, NoSQL, XML* – ECAM 2025‑2026.

---

## 1. Présentation

Finance Tracker Console est une application web de gestion financière pensée pour un poste pionnier, mais facilement adaptable à d’autres contextes. L’interface administrateur permet :

- de gérer les utilisateurs (création, modification, suppression) ;
- d’enregistrer et suivre leurs transactions (créances, dettes, montants récoltés) ;
- de créer et filtrer des catégories de mouvements ;
- de générer des rapports financiers par période ;
- de consulter un flux de notifications automatiques ;
- d’explorer toutes les transactions via une vue dédiée (tri par date ou catégorie, filtres cumulables).

L’application s’appuie sur MongoDB pour le stockage NoSQL et sur Redis pour le cache.

---

## 2. Architecture

```
finance-tracker/
│
├── backend/
│   ├── backend.py           # API Flask principale
│   ├── cache.py             # Gestion du cache Redis
│   ├── requirements.txt     # Dépendances Python
│   └── Dockerfile
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── Dockerfile
│
├── docker-compose.yml       # Déploiement multi-conteneurs
└── README.md
```

| Couche             | Technologie                 | Rôle principal                                       |
|--------------------|-----------------------------|-------------------------------------------------------|
| Backend            | Flask (Python)              | API REST + logique métier                             |
| Base de données    | MongoDB                     | Stockage NoSQL des utilisateurs, transactions, rapports |
| Cache              | Redis                       | Accélération, invalidation et notifications           |
| Frontend           | HTML / CSS / JavaScript     | Interface administrateur (login, filtres, tableaux)   |
| Déploiement        | Docker & Docker Compose     | Orchestration multi‑conteneurs                        |

---

## 3. Installation rapide

### Prérequis

- Docker + Docker Compose
- Ports 3000 (frontend) et 5001 (backend/API) disponibles

### Démarrage

```bash
docker compose up --build
```

- Interface : http://localhost:3000  
- API : http://localhost:5001  

### Variables d’environnement (`docker-compose.yml`)

| Variable                       | Description                 | Valeur par défaut                   |
|--------------------------------|-----------------------------|-------------------------------------|
| `MONGODB_URI`                  | URI MongoDB                 | `mongodb://mongo:27017/financialdb` |
| `REDIS_HOST`                   | Hôte Redis                  | `redis`                             |
| `DEFAULT_ADMIN_USERNAME`       | Identifiant admin initial   | `admin`                             |
| `DEFAULT_ADMIN_PASSWORD`       | Mot de passe admin initial  | `Admin@1234`                        |
| `DEFAULT_ADMIN_EMAIL`          | Email admin initial         | `admin@example.com`                 |

Au premier lancement, un compte administrateur est automatiquement créé avec ces identifiants.
Un script d'initialisation côté backend s’exécute au démarrage pour injecter cet admin de base ; sans lui, l’interface reste inaccessible.

---

## 4. Fonctionnalités

| Module                  | Description                                                                                   |
|-------------------------|-----------------------------------------------------------------------------------------------|
| Authentification        | Connexion administrateur obligatoire.                                                         |
| Utilisateurs            | CRUD complet avec recalcul automatique des soldes et notifications lors des ajouts.          |
| Transactions (profil)   | Ajout, modification, suppression ; mise en avant depuis une notification.                     |
| Transactions (globales) | Vue consolidée avec tri par date/catégorie, filtres cumulables, clic pour ouvrir l’utilisateur.|
| Administration          | Mise à jour du profil personnel, création et suppression d’administrateurs secondaires.        |
| Catégories              | Gestion et réutilisation dans les filtres et formulaires.                                    |
| Rapports financiers     | Génération par période avec historique consultable.                                           |
| Notifications           | Panneau latéral (fermeture par clic extérieur, bouton, touche Échap) + badge d’indication.   |
| Cache Redis             | Invalidation ciblée (profils, listes) pour accélérer les réponses.                           |

---

## 5. Modélisation NoSQL

MongoDB (base orientée documents) est retenu pour sa flexibilité et sa scalabilité horizontale.

```json
{
  "_id": ObjectId("..."),
  "first_name": "Lucas",
  "last_name": "Dupont",
  "email": "lucas.dupont@example.com",
  "phone": "+32471234567",
  "creances": 300.0,
  "dettes": 150.0,
  "argent_recolte": 150.0,
  "created_at": "2025-10-27T14:30:00Z",
  "updated_at": "2025-10-27T14:30:00Z"
}
```

Les transactions sont stockées dans une collection dédiée, indexée par utilisateur, date et catégorie pour optimiser la vue globale.

---

## 6. Déploiement Docker

```yaml
version: "3.9"

services:
  backend:
    build: ./backend
    ports:
      - "5001:5000"
    environment:
      FLASK_ENV: development
      MONGODB_URI: mongodb://mongo:27017/financialdb
      REDIS_HOST: redis
      REDIS_PORT: 6379
      DEFAULT_ADMIN_USERNAME: admin
      DEFAULT_ADMIN_PASSWORD: Admin@1234
      DEFAULT_ADMIN_EMAIL: admin@example.com
    depends_on:
      - mongo
      - redis
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  mongo:
    image: mongo:6.0
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  mongo-data:
  redis-data:
```

---

## 7. Maintien et diagnostic

| Commande                                   | Utilité                                    |
|-------------------------------------------|--------------------------------------------|
| `docker ps`                               | Vérifie l’état des conteneurs              |
| `docker compose logs backend`             | Suit les logs Flask / création de l’admin  |
| `docker exec -it finance-mongo mongosh`   | Ouvre un shell MongoDB                     |
| `docker compose down -v`                  | Arrête tout et supprime les volumes        |

**Erreurs courantes**  
- `400 Bad Request` : JSON invalide.  
- `401 Unauthorized` : identifiants admin incorrects.  
- `Connection refused` : vérifier que Mongo et Redis tournent (`docker ps`).

---

## 8. Usage d’outils IA

| Élément               | Détails                                                                                                                     |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------|
| Outils                | ChatGPT (GPT‑5, OpenAI), Codex                                                                                               |
| Rôle                  | Génération du front-end de test, corrections ponctuelles backend, structuration des idées, aide au setup Docker.            |
| Prompt type           | « Crée un front-end fonctionnel listant les utilisateurs, affichant leurs détails, avec un formulaire modal pour ajouter des transactions… » |
| Erreurs rencontrées   | `Failed to fetch` côté front, erreurs de build Docker.                                                                      |
| Retour d’expérience   | L’IA a servi de support pour clarifier des notions NoSQL, prendre du recul et accélérer l’implémentation (travail individuel). |

---

## 9. Équipe

| Nom            | Rôle principal              | Email         |
|----------------|-----------------------------|---------------|
| Nicolas Schell | Backend, Docker, intégration front | 21242@ecam.be |

---


## 10. Améliorations futures

- Pour l’instant, tous les administrateurs peuvent créer et supprimer d’autres comptes. L’objectif, à terme, est d’introduire un super administrateur disposant de ces droits, tandis que les administrateurs classiques seraient limités.
- À l’avenir, nous pourrions aussi permettre à chaque utilisateur de consulter ses propres données personnelles
- Nous pourrions également gérer plusieurs entités financières, chacune avec son propre ensemble d’utilisateurs isolé des autres.
- Exportation des rapports au format PDF.
- Intégration de graphiques interactifs (Chart.js).
- Optimisation du cache Redis pour les statistiques temps réel.

---

## Licence

Projet académique – ECAM Brussels Engineering School. © 2025 – Tous droits réservés.
