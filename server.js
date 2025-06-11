const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// flask api base URL
app.locals.apiBase = process.env.API_BASE || 'http://localhost:5000';

// view engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// static asset routes
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// redirect root to /dashboard
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// dashboard page
app.get('/dashboard', (req, res) => {
    res.render('dashboard', { apiBase: app.locals.apiBase });
});

// statistics page
app.get('/stats', (req, res) => {
    res.render('stats', { apiBase: app.locals.apiBase });
});

app.listen(PORT, () => {
    console.log(`Front-end running on http://localhost:${PORT}`);
});
