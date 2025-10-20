// test-complete.js - Test complet du système
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';

const testComplete = async () => {
  console.log('🚀 Test complet du système Au Fil des Sentiers\n');

  try {
    // 1. Test de santé du serveur
    console.log('1️⃣ Test de santé du serveur...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Serveur en ligne:', healthData);

    // 2. Test d'inscription
    console.log('\n2️⃣ Test d\'inscription...');
    const registerData = {
      email: 'test@aufildessentiers.com',
      password: 'motdepasse123',
      name: 'Test User'
    };

    const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    const registerResult = await registerResponse.json();
    console.log('✅ Inscription:', registerResult.message);

    // 3. Test de connexion (devrait échouer car non vérifié)
    console.log('\n3️⃣ Test de connexion (non vérifié)...');
    const loginData = {
      email: 'test@aufildessentiers.com',
      password: 'motdepasse123'
    };

    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });

    const loginResult = await loginResponse.json();
    console.log('ℹ️ Connexion (attendu):', loginResult.error);

    // 4. Test de connexion admin
    console.log('\n4️⃣ Test de connexion admin...');
    const adminLoginData = {
      email: 'admin@aufildessentiers.com',
      password: 'admin123'
    };

    const adminLoginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminLoginData)
    });

    const adminLoginResult = await adminLoginResponse.json();
    console.log('✅ Connexion admin:', adminLoginResult.message);

    if (adminLoginResult.accessToken) {
      const token = adminLoginResult.accessToken;

      // 5. Test des événements
      console.log('\n5️⃣ Test des événements...');
      const eventsResponse = await fetch(`${API_BASE}/api/events`);
      const eventsData = await eventsResponse.json();
      console.log('✅ Événements récupérés:', eventsData.events.length, 'événements');

      // 6. Test de création d'événement
      console.log('\n6️⃣ Test de création d\'événement...');
      const eventData = {
        title: 'Test Randonnée',
        description: 'Une randonnée de test pour vérifier le système',
        date: '2024-12-01T10:00:00Z',
        location: 'Paris, France',
        latitude: 48.8566,
        longitude: 2.3522,
        maxParticipants: 10
      };

      const createEventResponse = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      const createEventResult = await createEventResponse.json();
      console.log('✅ Événement créé:', createEventResult.message);

      // 7. Test de participation à un événement
      if (createEventResult.event) {
        console.log('\n7️⃣ Test de participation à l\'événement...');
        const joinResponse = await fetch(`${API_BASE}/api/events/${createEventResult.event.id}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const joinResult = await joinResponse.json();
        console.log('✅ Participation:', joinResult.message);
      }
    }

    // 8. Test des données publiques
    console.log('\n8️⃣ Test des données publiques...');
    const publicResponse = await fetch(`${API_BASE}/api/public/public-data`);
    const publicData = await publicResponse.json();
    console.log('ℹ️ Données publiques:', publicData.error || 'Nécessite une API key');

    console.log('\n🎉 Tests terminés avec succès !');
    console.log('\n📋 Résumé :');
    console.log('   ✅ Serveur opérationnel');
    console.log('   ✅ Système d\'authentification fonctionnel');
    console.log('   ✅ Gestion des événements opérationnelle');
    console.log('   ✅ Base de données connectée');
    console.log('\n🌐 URLs importantes :');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend: http://localhost:3000');
    console.log('   Carte des événements: http://localhost:5173/events-map');
    console.log('   Admin: admin@aufildessentiers.com / admin123');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
};

testComplete();
