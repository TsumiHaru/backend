// Blog.js - simple model for blog articles using existing pool
import pool from '../config/db.js';

export class Blog {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.slug = data.slug;
    this.excerpt = data.excerpt;
    this.content = data.content;
    this.author = data.author;
    this.publishedAt = data.published_at;
    // image may be null in older databases; normalize to empty string
    this.image = data.image || '';
  }

  static async findAll({ limit = 20, offset = 0 } = {}) {
    const [rows] = await pool.query(
      `SELECT id, title, slug, excerpt, author, published_at, IFNULL(image, '') as image FROM blog_articles ORDER BY published_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );
    return rows.map(r => new Blog(r));
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM blog_articles WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return new Blog(rows[0]);
  }
}
