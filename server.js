require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'handyman_saas'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');
});

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Routes

// Home page - public landing page
app.get('/', (req, res) => {
    res.render('index');
});

// Registration page
app.get('/register', (req, res) => {
    res.render('register', { title: 'Register - Handyman SaaS Platform' });
});

// Login page
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login - Handyman SaaS Platform' });
});

// Dashboard - user's personal portfolio
app.get('/dashboard', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    
    // Get user info
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, userResults) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        
        if (userResults.length === 0) {
            return res.redirect('/login');
        }
        
        const user = userResults[0];
        
        // Get user's services
        db.query('SELECT * FROM services WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, servicesResults) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Server error');
            }
            
            // Get user's portfolio items
            db.query('SELECT * FROM portfolio_items WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, portfolioResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Server error');
                }
                
                res.render('dashboard', {
                    user: user,
                    services: servicesResults,
                    portfolioItems: portfolioResults,
                    title: `${user.business_name} - Dashboard`
                });
            });
        });
    });
});

// Public portfolio view - each user gets a unique URL
app.get('/portfolio/:username', (req, res) => {
    const username = req.params.username;
    
    // Get user info by username
    db.query('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], (err, userResults) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        
        if (userResults.length === 0) {
            return res.status(404).render('404');
        }
        
        const user = userResults[0];
        
        // Get user's services
        db.query('SELECT * FROM services WHERE user_id = ? ORDER BY created_at DESC', [user.id], (err, servicesResults) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Server error');
            }
            
            // Get user's portfolio items
            db.query('SELECT * FROM portfolio_items WHERE user_id = ? ORDER BY created_at DESC', [user.id], (err, portfolioResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Server error');
                }
                
                // Get user's testimonials
                db.query('SELECT * FROM testimonials WHERE user_id = ? ORDER BY date_posted DESC', [user.id], (err, testimonialsResults) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Server error');
                    }
                    
                    res.render('public-portfolio', {
                        user: user,
                        services: servicesResults,
                        portfolioItems: portfolioResults,
                        testimonials: testimonialsResults,
                        title: `${user.business_name} - Professional Handyman Services`
                    });
                });
            });
        });
    });
});

// Register endpoint
app.post('/register', (req, res) => {
    const { username, email, password, businessName } = req.body;
    
    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error hashing password' });
        }
        
        // Insert new user
        const query = 'INSERT INTO users (username, email, password_hash, business_name) VALUES (?, ?, ?, ?)';
        db.query(query, [username, email, hashedPassword, businessName], (err, results) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Username or email already exists' });
                }
                console.error(err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            res.json({ message: 'Registration successful' });
        });
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Find user by email
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = results[0];
        
        // Compare passwords
        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Server error' });
            }
            
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            // Set session
            req.session.userId = user.id;
            req.session.username = user.username;
            
            res.json({ message: 'Login successful', redirectUrl: '/dashboard' });
        });
    });
});

// Logout endpoint
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.redirect('/');
    });
});

// API routes for dashboard management

// Add service
app.post('/api/services', isAuthenticated, (req, res) => {
    const { title, description, price, duration, category, imageUrl } = req.body;
    const userId = req.session.userId;
    
    const query = 'INSERT INTO services (user_id, title, description, price, duration, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [userId, title, description, price, duration, category, imageUrl], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json({ message: 'Service added successfully', id: results.insertId });
    });
});

// Update service
app.put('/api/services/:id', isAuthenticated, (req, res) => {
    const serviceId = req.params.id;
    const userId = req.session.userId;
    const { title, description, price, duration, category, imageUrl } = req.body;
    
    const query = 'UPDATE services SET title = ?, description = ?, price = ?, duration = ?, category = ?, image_url = ? WHERE id = ? AND user_id = ?';
    db.query(query, [title, description, price, duration, category, imageUrl, serviceId, userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Service not found or unauthorized' });
        }
        
        res.json({ message: 'Service updated successfully' });
    });
});

// Delete service
app.delete('/api/services/:id', isAuthenticated, (req, res) => {
    const serviceId = req.params.id;
    const userId = req.session.userId;
    
    const query = 'DELETE FROM services WHERE id = ? AND user_id = ?';
    db.query(query, [serviceId, userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Service not found or unauthorized' });
        }
        
        res.json({ message: 'Service deleted successfully' });
    });
});

// Add portfolio item
app.post('/api/portfolio', isAuthenticated, (req, res) => {
    const { title, description, imageUrl, category, clientName, dateCompleted } = req.body;
    const userId = req.session.userId;
    
    const query = 'INSERT INTO portfolio_items (user_id, title, description, image_url, category, client_name, date_completed) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [userId, title, description, imageUrl, category, clientName, dateCompleted], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json({ message: 'Portfolio item added successfully', id: results.insertId });
    });
});

// Update portfolio item
app.put('/api/portfolio/:id', isAuthenticated, (req, res) => {
    const portfolioId = req.params.id;
    const userId = req.session.userId;
    const { title, description, imageUrl, category, clientName, dateCompleted } = req.body;
    
    const query = 'UPDATE portfolio_items SET title = ?, description = ?, image_url = ?, category = ?, client_name = ?, date_completed = ? WHERE id = ? AND user_id = ?';
    db.query(query, [title, description, imageUrl, category, clientName, dateCompleted, portfolioId, userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Portfolio item not found or unauthorized' });
        }
        
        res.json({ message: 'Portfolio item updated successfully' });
    });
});

// Delete portfolio item
app.delete('/api/portfolio/:id', isAuthenticated, (req, res) => {
    const portfolioId = req.params.id;
    const userId = req.session.userId;
    
    const query = 'DELETE FROM portfolio_items WHERE id = ? AND user_id = ?';
    db.query(query, [portfolioId, userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Portfolio item not found or unauthorized' });
        }
        
        res.json({ message: 'Portfolio item deleted successfully' });
    });
});

// Booking endpoint
app.post('/api/bookings', (req, res) => {
    const { userId, customerName, customerEmail, customerPhone, serviceId, bookingDate, bookingTime, message } = req.body;
    
    const query = 'INSERT INTO bookings (user_id, customer_name, customer_email, customer_phone, service_id, booking_date, booking_time, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [userId, customerName, customerEmail, customerPhone, serviceId, bookingDate, bookingTime, message], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json({ message: 'Booking submitted successfully', id: results.insertId });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});