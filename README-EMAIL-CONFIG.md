# Configuration des emails - Guide complet

## Prérequis

Vous devez avoir un compte email professionnel (recommandé) ou personnel avec accès SMTP.

## Fournisseurs supportés

### 1. Infomaniak (Recommandé pour la Suisse/France)

Configuration actuelle dans le code. Infomaniak offre des services email fiables.

### 2. Gmail

Pour utiliser Gmail, vous devez activer l'authentification à deux facteurs et générer un mot de passe d'application.

### 3. Autres fournisseurs

La plupart des fournisseurs SMTP fonctionneront avec cette configuration.

## Configuration étape par étape

### 1. Créer le fichier .env

Copiez le fichier `env.example` vers `.env` dans le dossier backend :

```bash
cp env.example .env
```

### 2. Configuration Infomaniak

Dans votre fichier `.env`, modifiez ces lignes :

```env
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=votre-email@votre-domaine.com
SMTP_PASSWORD=votre-mot-de-passe-email
```

**Exemple concret :**

```env
SMTP_HOST=mail.infomaniak.com
SMTP_PORT=587
SMTP_USER=contact@aufildessentiers.com
SMTP_PASSWORD=MonMotDePasseTresSecurise123!
```

### 3. Configuration alternative Gmail

Si vous préférez utiliser Gmail :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-application
```

### 4. Configuration alternative autres fournisseurs

Pour d'autres fournisseurs, consultez leur documentation SMTP :

```env
SMTP_HOST=smtp.votre-fournisseur.com
SMTP_PORT=587  # ou 465 pour SSL
SMTP_USER=votre-email@domaine.com
SMTP_PASSWORD=votre-mot-de-passe
```

## Ports SMTP courants

- **587** : STARTTLS (recommandé)
- **465** : SSL/TLS
- **25** : Non sécurisé (non recommandé)

## Configuration avancée

### Modification de la sécurité TLS

Si vous avez des problèmes de certificat, dans `services/emailService.js` :

```javascript
tls: {
  rejectUnauthorized: false, // Pour ignorer les certificats auto-signés
  ciphers: 'SSLv3'          // Si nécessaire pour de vieux serveurs
}
```

### Authentification alternative

Pour certains serveurs, vous pourriez avoir besoin de :

```javascript
auth: {
  type: 'OAuth2',
  user: process.env.SMTP_USER,
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  refreshToken: process.env.OAUTH_REFRESH_TOKEN
}
```

## Test de la configuration

### 1. Tester depuis le backend

Ajoutez cette route temporaire dans `server.js` pour tester :

```javascript
app.get("/test-email", async (req, res) => {
  try {
    const result = await emailService.verifyConnection();
    if (result) {
      res.json({ success: true, message: "Configuration email OK" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Problème configuration" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2. Tester l'envoi d'un email

```javascript
app.get("/test-send-email", async (req, res) => {
  try {
    await emailService.sendVerificationEmail(
      "test@example.com",
      "Test User",
      "test-token-123"
    );
    res.json({ success: true, message: "Email envoyé" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Dépannage

### Erreur "Invalid login"

- Vérifiez que l'email et le mot de passe sont corrects
- Pour Gmail, utilisez un mot de passe d'application, pas votre mot de passe normal

### Erreur "Connection timeout"

- Vérifiez l'adresse du serveur SMTP
- Vérifiez que le port est correct
- Vérifiez que votre pare-feu n'bloque pas la connexion

### Erreur de certificat SSL

- Ajoutez `rejectUnauthorized: false` dans la configuration TLS
- Ou utilisez le port 587 avec STARTTLS au lieu de 465

### Email dans les spams

- Configurez SPF, DKIM et DMARC pour votre domaine
- Utilisez un nom d'expéditeur professionnel
- Évitez les mots-clés spam dans le sujet

## URLs importantes

Configurez ces URLs dans votre `.env` :

```env
FRONTEND_URL=https://votre-domaine.com  # URL publique de votre site
BACKEND_URL=https://api.votre-domaine.com  # URL de votre API
```

## Sécurité

- Utilisez des mots de passe forts
- Activez l'authentification à deux facteurs quand disponible
- Ne commitez jamais le fichier `.env` dans Git
- Utilisez des mots de passe d'application pour Gmail
- Considérez l'utilisation d'un service email dédié (SendGrid, Mailgun) pour la production

## Production

Pour la production, considérez :

- Un service email transactionnel (SendGrid, Mailgun, Amazon SES)
- Un domaine dédié pour les emails
- La configuration de DNS appropriée (SPF, DKIM, DMARC)
