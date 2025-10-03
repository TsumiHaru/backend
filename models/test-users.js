// test-users.js - Utilisateurs de test pour le développement
import bcrypt from 'bcryptjs';

// Utilisateurs de test avec mots de passe hashés
export const testUsers = [
  {
    id: 1,
    email: 'admin@test.com',
    password: '$2a$12$rd2NsJKmU3jZoTsUK9j7K.t11yqWBVV1T0a/ghp4iop3tKTbY8gH2', // motdepasse123
    name: 'Admin Test',
    role: 'admin'
  },
  {
    id: 2,
    email: 'user@test.com',
    password: '$2a$12$rd2NsJKmU3jZoTsUK9j7K.t11yqWBVV1T0a/ghp4iop3tKTbY8gH2', // motdepasse123
    name: 'User Test',
    role: 'user'
  },
  {
    id: 3,
    email: 'moderator@test.com',
    password: '$2a$12$rd2NsJKmU3jZoTsUK9j7K.t11yqWBVV1T0a/ghp4iop3tKTbY8gH2', // motdepasse123
    name: 'Moderator Test',
    role: 'moderator'
  }
];

// Fonction pour récupérer un utilisateur par email
export function getUserByEmail(email) {
  return testUsers.find(user => user.email === email);
}

// Fonction pour récupérer un utilisateur par ID
export function getUserById(id) {
  return testUsers.find(user => user.id === id);
}

// Fonction pour créer un nouvel utilisateur (simulation)
export function createUser(userData) {
  const newUser = {
    id: Date.now(),
    ...userData,
    role: userData.role || 'user'
  };
  testUsers.push(newUser);
  return newUser;
}

// Mots de passe de test (pour référence)
export const testPasswords = {
  'admin@test.com': 'motdepasse123',
  'user@test.com': 'motdepasse123',
  'moderator@test.com': 'motdepasse123'
};

console.log('🔐 Utilisateurs de test disponibles :');
console.log('📧 admin@test.com / motdepasse123 (admin)');
console.log('📧 user@test.com / motdepasse123 (user)');
console.log('📧 moderator@test.com / motdepasse123 (moderator)');
