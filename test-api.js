// test-api.js - Script de test pour les API
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Fonction pour tester une API
async function testAPI(name, method, url, body = null, headers = {}) {
  try {
    log(`\n🧪 Test: ${name}`, 'blue');
    log(`📡 ${method} ${url}`, 'yellow');
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${url}`, options);
    const data = await response.json();
    
    if (response.ok) {
      log(`✅ Succès (${response.status})`, 'green');
      console.log(JSON.stringify(data, null, 2));
    } else {
      log(`❌ Erreur (${response.status})`, 'red');
      console.log(JSON.stringify(data, null, 2));
    }
    
    return { response, data };
  } catch (error) {
    log(`💥 Erreur de connexion: ${error.message}`, 'red');
    return { error };
  }
}

// Tests principaux
async function runTests() {
  log('🚀 Démarrage des tests API', 'blue');
  log('=' * 50, 'blue');
  
  // Test 1: Statut du serveur
  await testAPI('Statut du serveur', 'GET', '/');
  
  // Test 2: Santé du serveur
  await testAPI('Santé du serveur', 'GET', '/health');
  
  // Test 3: Inscription d'un nouvel utilisateur
  const registerResult = await testAPI('Inscription', 'POST', '/api/register', {
    email: 'test@example.com',
    password: 'motdepasse123',
    name: 'Test User'
  });
  
  // Test 4: Connexion avec utilisateur de test
  const loginResult = await testAPI('Connexion admin', 'POST', '/api/login', {
    email: 'admin@test.com',
    password: 'motdepasse123'
  });
  
  let accessToken = null;
  if (loginResult.data && loginResult.data.accessToken) {
    accessToken = loginResult.data.accessToken;
    log(`🔑 Token reçu: ${accessToken.substring(0, 20)}...`, 'green');
  }
  
  // Test 5: Route protégée avec token
  if (accessToken) {
    await testAPI('Route protégée', 'GET', '/api/protected', null, {
      'Authorization': `Bearer ${accessToken}`
    });
  }
  
  // Test 6: Test avec API Key
  await testAPI('Données publiques avec API Key', 'GET', '/api/public-data', null, {
    'x-api-key': 'api-key-test-123'
  });
  
  // Test 7: Test de rate limiting (trop de requêtes)
  log('\n🚦 Test de rate limiting...', 'yellow');
  for (let i = 0; i < 6; i++) {
    await testAPI(`Requête ${i + 1}`, 'POST', '/api/login', {
      email: 'admin@test.com',
      password: 'motdepasse123'
    });
  }
  
  log('\n✨ Tests terminés !', 'green');
}

// Lancer les tests
runTests().catch(console.error);
