// test-simple.js - Test simple sans rate limiting
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testLogin() {
  console.log('🧪 Test de connexion...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/login`, {
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
      console.log('✅ Connexion réussie !');
      console.log('👤 Utilisateur:', data.user.name);
      console.log('📧 Email:', data.user.email);
      console.log('🎭 Rôle:', data.user.role);
      console.log('🔑 Token reçu:', data.accessToken ? 'Oui' : 'Non');
    } else {
      console.log('❌ Erreur:', data.error);
    }
  } catch (error) {
    console.log('💥 Erreur de connexion:', error.message);
  }
}

async function testPublicData() {
  console.log('\n🧪 Test des données publiques...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/public-data`, {
      method: 'GET',
      headers: {
        'x-api-key': 'api-key-test-123'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Données publiques récupérées !');
      console.log('📊 Données:', data);
    } else {
      console.log('❌ Erreur:', data.error);
    }
  } catch (error) {
    console.log('💥 Erreur:', error.message);
  }
}

// Lancer les tests
console.log('🚀 Démarrage des tests...');
testLogin();
setTimeout(testPublicData, 1000);
