// restart-and-test.js - Script pour redémarrer et tester le backend
import { spawn } from 'child_process';
import fetch from 'node-fetch';

console.log('🔄 Redémarrage du backend...');

// Tuer les processus Node.js existants
const killProcesses = () => {
  return new Promise((resolve) => {
    const kill = spawn('taskkill', ['/f', '/im', 'node.exe'], { shell: true });
    kill.on('close', () => {
      console.log('✅ Processus Node.js arrêtés');
      resolve();
    });
  });
};

// Démarrer le serveur
const startServer = () => {
  return new Promise((resolve, reject) => {
    console.log('🚀 Démarrage du serveur...');
    const server = spawn('node', ['server.js'], { 
      stdio: 'pipe',
      shell: true 
    });
    
    let serverReady = false;
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      if (output.includes('Serveur sécurisé démarré') && !serverReady) {
        serverReady = true;
        console.log('✅ Serveur démarré avec succès !');
        resolve(server);
      }
    });
    
    server.stderr.on('data', (data) => {
      console.error('❌ Erreur serveur:', data.toString());
    });
    
    // Timeout après 10 secondes
    setTimeout(() => {
      if (!serverReady) {
        reject(new Error('Timeout: Serveur non démarré'));
      }
    }, 10000);
  });
};

// Tester l'API
const testAPI = async () => {
  console.log('\n🧪 Test de l\'API...');
  
  try {
    // Attendre un peu que le serveur soit prêt
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'motdepasse123'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Test de connexion réussi !');
      console.log('📧 Utilisateur:', data.user.email);
      console.log('🎭 Rôle:', data.user.role);
      console.log('🔑 Token reçu:', data.accessToken ? 'Oui' : 'Non');
    } else {
      console.log('❌ Test de connexion échoué:', data.error);
    }
  } catch (error) {
    console.log('💥 Erreur de test:', error.message);
  }
};

// Exécuter le processus complet
const main = async () => {
  try {
    await killProcesses();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const server = await startServer();
    
    // Tester après 3 secondes
    setTimeout(async () => {
      await testAPI();
      console.log('\n🎉 Test terminé ! Vous pouvez maintenant tester dans le frontend.');
      console.log('🌐 Frontend: http://localhost:5173/test-api');
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

main();
