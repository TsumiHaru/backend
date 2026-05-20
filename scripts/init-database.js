import pool from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        status ENUM('pending', 'active', 'banned') DEFAULT 'pending',
        email_verified_at DATETIME DEFAULT NULL,
        remember_token VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        date DATETIME NOT NULL,
        location VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        max_participants INT NULL,
        current_participants INT DEFAULT 0,
        created_by INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_date (date),
        INDEX idx_location (latitude, longitude),
        INDEX idx_created_by (created_by),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_participation (event_id, user_id),
        INDEX idx_event_id (event_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const bcrypt = await import('bcryptjs');
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (adminEmail && adminPassword) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const [existingAdmin] = await pool.query(
        'SELECT id FROM users WHERE email = ?',
        [adminEmail]
      );

      if (existingAdmin.length === 0) {
        await pool.query(`
          INSERT INTO users (email, password, name, role, status)
          VALUES (?, ?, ?, ?, ?)
        `, [adminEmail, hashedPassword, 'Administrateur', 'admin', 'active']);
      }
    }

    const [existingEvents] = await pool.query('SELECT COUNT(*) as count FROM events');
    
    if (existingEvents[0].count === 0) {
      const [adminUser] = await pool.query('SELECT id FROM users WHERE role = ? ORDER BY id ASC LIMIT 1', ['admin']);
      
      if (adminUser.length > 0) {
        const sampleEvents = [
          {
            title: 'Randonnée en forêt de Fontainebleau',
            description: 'Découverte des sentiers mythiques de la forêt de Fontainebleau. Parcours de 12km avec dénivelé modéré.',
            date: '2024-10-15 09:00:00',
            location: 'Fontainebleau, France',
            latitude: 48.4042,
            longitude: 2.7012,
            max_participants: 20,
            created_by: adminUser[0].id
          },
          {
            title: 'Ascension du Mont Ventoux',
            description: 'Challenge sportif : ascension du Mont Ventoux par le versant de Bédoin. 21km de montée !',
            date: '2024-10-22 07:00:00',
            location: 'Bédoin, France',
            latitude: 44.1744,
            longitude: 5.2781,
            max_participants: 15,
            created_by: adminUser[0].id
          },
          {
            title: 'Balade côtière en Bretagne',
            description: 'Sentier des douaniers entre Cancale et Saint-Malo. Vue imprenable sur la baie du Mont-Saint-Michel.',
            date: '2024-11-05 10:00:00',
            location: 'Cancale, France',
            latitude: 48.6781,
            longitude: -1.8522,
            max_participants: 25,
            created_by: adminUser[0].id
          }
        ];

        for (const event of sampleEvents) {
          await pool.query(`
            INSERT INTO events (title, description, date, location, latitude, longitude, max_participants, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            event.title, event.description, event.date, event.location,
            event.latitude, event.longitude, event.max_participants, event.created_by
          ]);
        }
        
      }
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        excerpt TEXT NULL,
        content LONGTEXT NULL,
        author VARCHAR(150) DEFAULT 'Équipe',
        published_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_published_at (published_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [existingArticles] = await pool.query('SELECT COUNT(*) as count FROM blog_articles');
    if (existingArticles[0].count === 0) {
      const sampleArticles = [
        {
          title: 'Bienvenue sur le blog',
          slug: 'bienvenue-sur-le-blog',
          excerpt: 'Premiers pas : notre blog va partager des récits de randonnées, conseils et actualités locales.',
          content: `Bienvenue sur le blog d'Au fil des sentiers. Ici nous partagerons des retours d'expérience, des conseils pratiques pour vos balades, et des nouvelles des événements à venir. Restez à l'écoute pour plus d'articles !`,
          author: 'Léa',
          published_at: '2024-09-01 10:00:00'
        },
        {
          title: 'Comment préparer une randonnée d\'une journée',
          slug: 'preparer-une-randonnee-1-journee',
          excerpt: 'Checklist et conseils pour une randonnée d\'une journée réussie.',
          content: `Une bonne préparation commence par le choix d\'un itinéraire adapté, des chaussures appropriées, et un sac bien organisé. N\'oubliez pas de vérifier la météo et d\'emporter de l\'eau en quantité suffisante.`,
          author: 'Mathis',
          published_at: '2024-09-10 09:00:00'
        },
        {
          title: 'Rencontrer des personnes lors des événements',
          slug: 'rencontrer-personnes-evenements',
          excerpt: 'Nos événements sont pensés pour favoriser les échanges et le contact humain.',
          content: `Les événements sont l'occasion parfaite pour rencontrer d'autres passionnés. Pensez à venir avec une bonne humeur et à échanger : le partage est au coeur de notre communauté.`,
          author: 'Camille',
          published_at: '2024-09-20 14:00:00'
        }
      ];

      for (const art of sampleArticles) {
        await pool.query(
          `INSERT INTO blog_articles (title, slug, excerpt, content, author, published_at) VALUES (?, ?, ?, ?, ?, ?)`,
          [art.title, art.slug, art.excerpt, art.content, art.author, art.published_at]
        );
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

export default initDatabase;
