# Finance Tracker Console

Projet réalisé dans le cadre du cours Realtime Databases, NoSQL, XML – ECAM 2025-2026.

## 1. Introduction

Finance Tracker Console est une application web de gestion financière destinée à simuler la gestion des finances d'un poste pionnier mais peut etre déclinée a d'autres applications. Elle permet à un administrateur de :

- Gérer les utilisateurs (création, modification, suppression)
- Enregistrer leurs transactions (dettes, créances, argent récolté)
- Créer et filtrer des catégories
- Générer des rapports financiers sur une période donnée
- Consulter des notifications automatiques

L’application utilise une base de données NoSQL (MongoDB) et un système de cache Redis pour améliorer les performances.

## 2. Architecture et technologies

### Structure du projet

```
finance-tracker/
│
├── backend/
│   ├── backend.py              # API Flask principale
│   ├── cache.py                # Gestion du cache Redis
│   ├── requirements.txt        # Dépendances Python
│   └── Dockerfile
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── Dockerfile
│
├── docker-compose.yml          # Déploiement multi-conteneurs
└── README.md
```

### Technologies principales

| Composant        | Technologie | Rôle                                |
|------------------|-------------|-------------------------------------|
| Backend          | Flask (Python) | API REST                         |
| Base de données  | MongoDB        | Stockage NoSQL principal          |
| Cache & sessions | Redis          | Accélération et persistance temporaire |
| Frontend         | HTML / CSS / JS | Interface utilisateur            |
| Déploiement      | Docker & Docker Compose | Conteneurisation complète |

## 3. Installation et exécution

### Prérequis

- Docker et Docker Compose installés
- Ports 3000 et 5001 disponibles

### Lancement du projet

```bash
docker-compose up --build
```

- Accès au frontend : <http://localhost:3000>
- Accès à l’API Flask : <http://localhost:5001>

### Variables d’environnement

Ces variables sont définies dans `docker-compose.yml`.

| Nom                     | Description                 | Valeur par défaut                          |
|-------------------------|-----------------------------|--------------------------------------------|
| `MONGODB_URI`           | URI de connexion MongoDB    | `mongodb://mongo:27017/financialdb`        |
| `REDIS_HOST`            | Hôte Redis                  | `redis`                                    |
| `DEFAULT_ADMIN_USERNAME`| Admin par défaut            | `Nicolas Schell`                           |
| `DEFAULT_ADMIN_PASSWORD`| Mot de passe admin          | `Admin@1234`                               |
| `DEFAULT_ADMIN_EMAIL`   | Email admin                 | `21242@ecam.be`                            |

### Données initiales

Au démarrage, la base MongoDB est automatiquement peuplée avec un utilisateur administrateur. Des données de test peuvent ensuite être ajoutées via l’interface graphique.

## 4. Fonctionnalités principales

| Fonction            | Description                                                         |
|---------------------|---------------------------------------------------------------------|
| Authentification    | Connexion administrateur (identifiants initiaux dans `docker-compose.yml`) |
| Gestion utilisateurs| CRUD complet : ajout, édition, suppression                          |
| Transactions        | Enregistrement, modification, suppression filtrage par catégorie, date et type              |
| Catégories          | Création et gestion de catégories de transaction                    |
| Rapports financiers | Génération de rapports par période (début/fin)                      |
| Notifications       | Système de notification côté client                                 |
| Cache Redis         | Réduction du temps de réponse pour les requêtes fréquentes          |

## 5. Choix du NoSQL et modélisation

### Base utilisée

MongoDB : base orientée documents, adaptée aux structures dynamiques et aux données non relationnelles. Chaque utilisateur contient des sous-documents pour ses transactions, permettant une lecture rapide.

### Exemple de schéma

```json
user{
  "_id": ObjectId("..."),
  "first_name": "Lucas",
  "last_name": "Dupont",
  "email": "lucas.dupont@example.com",
  "phone": "+32471234567",

  "creances": 300.0,
  "dettes": 150.0,
  "argent_recolte": 150.0,   // total encaissé (ex: créances - dettes)

  "created_at": "2025-10-27T14:30:00Z",
  "updated_at": "2025-10-27T14:30:00Z"
}
```

### Justification

- NoSQL (MongoDB) permet une structure flexible sans schéma fixe.
- Idéal pour des entités comme les transactions ou les rapports dont la structure peut évoluer.
- La scalabilité horizontale est native via le sharding MongoDB.

## 6. Déploiement Docker

Un fichier `docker-compose.yml` permet de tout lancer :

```yaml
version: "3.9"
services:
  backend:
    build: ./backend
    ports: ["5001:5000"]
    environment:
      - MONGODB_URI=mongodb://mongo:27017/financialdb
      - REDIS_HOST=redis
    depends_on: [mongo, redis]
  frontend:
    build: ./frontend
    ports: ["3000:80"]
    depends_on: [backend]
  mongo:
    image: mongo:6.0
    volumes: [mongo-data:/data/db]
  redis:
    image: redis:7-alpine
volumes:
  mongo-data:
```

Démarrage complet :

```bash
docker-compose up --build
```

## 7. Tests et dépannage

| Commande                          | Utilité                                      |
|----------------------------------|----------------------------------------------|
| `docker ps`                      | Vérifie les conteneurs actifs                 |
| `docker-compose logs backend`    | Affiche les logs Flask                        |
| `docker exec -it finance-mongo mongosh` | Accès au shell MongoDB               |
| `docker-compose down -v`         | Stoppe et supprime les volumes                |

### Erreurs courantes

- `400 Bad Request` : mauvais format de requête JSON.
- `Connection refused` : Mongo ou Redis non démarré.
- `Unauthorized` : mauvais mot de passe admin.

## 8. Utilisation d’outils IA

Conformément aux règles du cours :

| Élément        | Détails                                                                 |
|----------------|-------------------------------------------------------------------------|
| Outil utilisé  | ChatGPT (GPT-5, OpenAI), Codex                                                |
| Rôle de l’IA   | Nous avons utiliser de l'IA dans la confection de notre frontend, et de temps-en temps dans le backend ou il m'aidait a corriger des erreurs rencontré. Il nous a aussi aidé a structurer nos idée et nous permettre de mieux les visualisé. Il m'a aussi aidé a faire correctement le setup de docker.|
| Prompts principaux | « je veux que tu me crée un front-end pour tester mon backedn ce front-end ne doit pas specialement etre beau mais il doit etre fonctionnel je vois bien un menu avec tout les noms des gent ou on peut clique pour sur un profil pour voir toutes les informations de cette personne en dessous je veux un bouton pour ajouter un utilisateur, dans le menus specialisée d'un seul utilisateur je veux etre capaple d'ajouter une transaction qui ouvre une micro-fenetre ou je dis le types de transaction avec un menu déroulant, le montant et tout ce qui nécessaaire dans la data attendue et puis un submit qui me permet d'ajouter cette transaction et de mettre a jour le profil utilisateur avec cette nouvelle transaction » |
| Erreurs rencontrées |  Erreur lors de la création : Failed to fetch,  erreur dans le build Docker                     |
| Réflexion      | L’usage de l’IA a permis de mieux structurer mes idées, surtout etant seul a faire ce projet, il m'aidait aussi a prendre du recul et mieux comprendre certaines notions de NOSQL. |

## 9. Équipe

| Nom             | Rôle                | Email             |
|-----------------|---------------------|-------------------|
| Nicolas Schell  | Backend & Docker    | 21242@ecam.be     |


## Licence

Projet académique – ECAM Brussels Engineering School. © 2025 – Tous droits réservés.
