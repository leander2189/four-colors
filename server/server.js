const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from parent directory (disabled when using nginx)
if (process.env.SERVE_STATIC !== 'false') {
    app.use(express.static(path.join(__dirname, '..')));
}

// Initialize database (use DATA_DIR env var for Docker volume mounting)
const dataDir = process.env.DATA_DIR || __dirname;
const dbPath = path.join(dataDir, 'leaderboard.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT NOT NULL,
        mode TEXT NOT NULL CHECK(mode IN ('easy', 'medium', 'hard')),
        time_seconds REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_mode_time ON scores(mode, time_seconds);
`);

// GET /api/leaderboard/:mode - Get top 10 scores for a mode
app.get('/api/leaderboard/:mode', (req, res) => {
    const { mode } = req.params;

    if (!['easy', 'medium', 'hard'].includes(mode)) {
        return res.status(400).json({ error: 'Invalid mode. Use: easy, medium, or hard' });
    }

    const stmt = db.prepare(`
        SELECT player_name, time_seconds, created_at
        FROM scores
        WHERE mode = ?
        ORDER BY time_seconds ASC
        LIMIT 10
    `);

    const scores = stmt.all(mode);
    res.json(scores);
});

// POST /api/scores - Submit a new score
app.post('/api/scores', (req, res) => {
    const { player_name, mode, time_seconds } = req.body;

    // Validation
    if (!player_name || typeof player_name !== 'string' || player_name.trim().length === 0) {
        return res.status(400).json({ error: 'Player name is required' });
    }

    if (!['easy', 'medium', 'hard'].includes(mode)) {
        return res.status(400).json({ error: 'Invalid mode. Use: easy, medium, or hard' });
    }

    if (typeof time_seconds !== 'number' || time_seconds <= 0) {
        return res.status(400).json({ error: 'Invalid time' });
    }

    const sanitizedName = player_name.trim().substring(0, 20);

    // Insert the score
    const insertStmt = db.prepare(`
        INSERT INTO scores (player_name, mode, time_seconds)
        VALUES (?, ?, ?)
    `);

    const result = insertStmt.run(sanitizedName, mode, time_seconds);

    // Check rank (position in leaderboard)
    const rankStmt = db.prepare(`
        SELECT COUNT(*) as rank
        FROM scores
        WHERE mode = ? AND time_seconds < ?
    `);

    const rankResult = rankStmt.get(mode, time_seconds);
    const rank = rankResult.rank + 1;

    // Check if in top 10
    const isTopTen = rank <= 10;

    res.json({
        success: true,
        id: result.lastInsertRowid,
        rank: rank,
        isTopTen: isTopTen
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Four Colors Leaderboard Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close();
    process.exit();
});
