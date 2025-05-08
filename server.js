const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files from current directory

// Database configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'travel_routes',
    password: '123123',
    port: '5432',
});

// JWT secret key
const JWT_SECRET = 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const userCheck = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            userId: user.id,
            username: user.username,
            email: user.email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Routes
app.get('/api/routes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM routes ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/routes', authenticateToken, async (req, res) => {
    const { title, description, start_location, end_location, duration_days, difficulty_level } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO routes (title, description, start_location, end_location, duration_days, difficulty_level, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, description, start_location, end_location, duration_days, difficulty_level, req.user.userId]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reviews routes
app.post('/api/routes/:id/reviews', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            'INSERT INTO reviews (route_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, userId, rating, comment]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/routes/:id/reviews', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT r.*, u.username 
             FROM reviews r 
             JOIN users u ON r.user_id = u.id 
             WHERE r.route_id = $1 
             ORDER BY r.created_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/routes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM routes WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Route not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/routes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, start_location, end_location, duration_days, difficulty_level } = req.body;
    try {
        const result = await pool.query(
            'UPDATE routes SET title = $1, description = $2, start_location = $3, end_location = $4, duration_days = $5, difficulty_level = $6 WHERE id = $7 AND created_by = $8 RETURNING *',
            [title, description, start_location, end_location, duration_days, difficulty_level, id, req.user.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Route not found or unauthorized' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/routes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM routes WHERE id = $1 AND created_by = $2 RETURNING *',
            [id, req.user.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Route not found or unauthorized' });
        }
        res.json({ message: 'Route deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Points of Interest routes
app.get('/api/points-of-interest', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM points_of_interest ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/points-of-interest', async (req, res) => {
    const { name, description, latitude, longitude, type } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO points_of_interest (name, description, latitude, longitude, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, latitude, longitude, type]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 