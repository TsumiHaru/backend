# 🔒 Configuration de Sécurité - Backend

## ✅ Fonctionnalités de sécurité implémentées

### 1. Variables d'environnement

- ✅ Fichier `.env` protégé par `.gitignore`
- ✅ Validation des variables obligatoires au démarrage
- ✅ Exemple de configuration dans `env.example`

### 2. Authentification JWT

- ✅ Tokens d'accès (15 minutes) et refresh (7 jours)
- ✅ Hashage sécurisé des mots de passe avec bcrypt (12 rounds)
- ✅ Middleware d'authentification et de rôles
- ✅ Gestion des refresh tokens avec blacklist
- ✅ Support des API Keys pour services externes

### 3. Rate Limiting

- ✅ Limitation générale : 1000 requêtes/15min par IP
- ✅ Limitation auth : 5 tentatives/15min pour login/register
- ✅ Headers de rate limiting standardisés

### 4. Validation des données

- ✅ Validation avec Joi pour tous les endpoints
- ✅ Sanitisation des entrées utilisateur
- ✅ Protection contre les injections XSS

### 5. Headers de sécurité (Helmet.js)

- ✅ Content Security Policy (CSP)
- ✅ Protection contre le clickjacking
- ✅ Headers de sécurité complets

### 6. CORS configuré

- ✅ Origines autorisées configurables
- ✅ Credentials supportés
- ✅ Headers personnalisés autorisés

### 7. Autres protections

- ✅ Compression des réponses
- ✅ Logging des requêtes (morgan)
- ✅ Timeout des requêtes (30s)
- ✅ Gestion d'erreurs sécurisée
- ✅ Parsing JSON limité (10MB)

## 🚀 Installation et démarrage

1. **Installer les dépendances :**

```bash
cd backend
npm install
```

2. **Configurer l'environnement :**

```bash
# Copier le fichier d'exemple
cp env.example .env

# Modifier les valeurs dans .env
# IMPORTANT : Changer JWT_SECRET en production !
```

3. **Démarrer le serveur :**

```bash
npm start
```

## 🔧 Configuration des variables d'environnement

### Variables obligatoires :

- `JWT_SECRET` : Clé secrète pour signer les JWT (changez en production !)

### Variables optionnelles :

- `NODE_ENV` : Environnement (development/production)
- `PORT` : Port du serveur (défaut: 3000)
- `JWT_EXPIRES_IN` : Durée des tokens d'accès (défaut: 15m)
- `JWT_REFRESH_EXPIRES_IN` : Durée des refresh tokens (défaut: 7d)
- `BCRYPT_ROUNDS` : Rounds de hashage bcrypt (défaut: 12)
- `ALLOWED_ORIGINS` : Origines CORS autorisées (séparées par virgule)
- `VALID_API_KEYS` : Clés API valides (séparées par virgule)

## 📡 Endpoints disponibles

### Publics :

- `GET /` - Statut du serveur
- `GET /health` - Santé du serveur
- `POST /api/register` - Inscription
- `POST /api/login` - Connexion

### Protégés (JWT requis) :

- `GET /api/protected` - Route protégée
- `POST /api/refresh` - Renouveler le token
- `POST /api/logout` - Déconnexion

### API Key (x-api-key header requis) :

- `GET /api/public-data` - Données publiques

## 🛡️ Bonnes pratiques de sécurité

1. **Jamais commiter le fichier `.env`**
2. **Changer `JWT_SECRET` en production**
3. **Utiliser HTTPS en production**
4. **Configurer les origines CORS correctement**
5. **Monitorer les logs de sécurité**
6. **Mettre à jour les dépendances régulièrement**

## 🔍 Test de sécurité

### Test de connexion :

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"motdepasse123"}'
```

### Test de route protégée :

```bash
curl -X GET http://localhost:3000/api/protected \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test avec API Key :

```bash
curl -X GET http://localhost:3000/api/public-data \
  -H "x-api-key: your-api-key-1"
```

## ⚠️ Notes importantes

- Le mot de passe de test est : `motdepasse123` et test@example.com
- En production, remplacez les utilisateurs simulés par une vraie base de données
- Configurez un reverse proxy (nginx) pour HTTPS
- Utilisez Redis pour stocker les refresh tokens en production
- Implémentez un système de logs de sécurité
