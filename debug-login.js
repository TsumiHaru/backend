// debug-login.js - Debug de la connexion
import { getUserByEmail } from './test-users.js';
import authService from './auth.js';

async function debugLogin() {
  console.log('🔍 Debug de la connexion...');
  
  const email = 'admin@test.com';
  const password = 'motdepasse123';
  
  console.log('📧 Email recherché:', email);
  
  const user = getUserByEmail(email);
  console.log('👤 Utilisateur trouvé:', user);
  
  if (user) {
    console.log('🔑 Hash stocké:', user.password);
    
    const isValid = await authService.verifyPassword(password, user.password);
    console.log('✅ Mot de passe valide:', isValid);
    
    if (isValid) {
      console.log('🎉 Connexion devrait fonctionner !');
    } else {
      console.log('❌ Problème avec le hash du mot de passe');
      
      // Créer un nouveau hash
      const newHash = await authService.hashPassword(password);
      console.log('🆕 Nouveau hash:', newHash);
    }
  } else {
    console.log('❌ Utilisateur non trouvé');
  }
}

debugLogin();
