Import du schéma `blog_articles` et des articles d'exemple

Si le script Node `scripts/init-database.js` ne peut pas être exécuté, importez ce fichier SQL manuellement.

1. Avec phpMyAdmin

   - Ouvrez phpMyAdmin, sélectionnez votre base `aufildessentiers_db`.
   - Allez dans l'onglet "Importer" puis choisissez `create_blog_articles.sql`.
   - Cliquez sur Exécuter.

2. Avec mysql CLI (PowerShell / Terminal)

   - Depuis le dossier `backend/db` exécutez :
     ```powershell
     mysql -u root -p aufildessentiers_db < create_blog_articles.sql
     ```

3. Vérification
   - Connectez-vous à votre base et lancez :
     ```sql
     SELECT id, title, slug, published_at FROM blog_articles ORDER BY published_at DESC;
     ```

Remarques

- Le script init-database.js du projet crée aussi cette table et insère les mêmes exemples; utilisez l'une ou l'autre méthode.
- Si vous utilisez XAMPP avec un mot de passe vide pour `root`, laissez `-p` vide ou utilisez `-p` et appuyez sur Entrée sans mot de passe.
