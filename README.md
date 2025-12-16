# Handyman SaaS Platform

A comprehensive SaaS platform for handymen to create and manage their online portfolios and services.

## Features

- User registration and authentication system
- Dashboard for managing services and portfolio items
- Public portfolio pages for each handyman
- Service booking system
- Multi-tenant architecture (each handyman has their own data)
- Responsive design for all devices
- MySQL database backend

## Tech Stack

- Node.js/Express.js
- MySQL
- EJS templating
- HTML/CSS/JavaScript
- Bootstrap (via CDN)

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up MySQL database:
   - Create a database named `handyman_saas`
   - Import the schema from `database/schema.sql`
4. Create a `.env` file based on `.env.example`
5. Run the application: `npm start`

## Database Schema

The application uses the following tables:

- `users` - Stores handyman account information
- `services` - Stores services offered by each user
- `portfolio_items` - Stores portfolio items for each user
- `testimonials` - Stores customer reviews for each user
- `bookings` - Stores booking requests from customers

## Usage

1. New handymen can register using the `/register` endpoint
2. After registration, they can log in and access their dashboard at `/dashboard`
3. They can add services and portfolio items to their profile
4. Their public portfolio is accessible at `/portfolio/{username}`
5. Customers can view the portfolio and request bookings

## API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /login` - Login to an account
- `GET /logout` - Logout from the account

### Dashboard Management
- `POST /api/services` - Add a new service
- `PUT /api/services/:id` - Update a service
- `DELETE /api/services/:id` - Delete a service
- `POST /api/portfolio` - Add a portfolio item
- `PUT /api/portfolio/:id` - Update a portfolio item
- `DELETE /api/portfolio/:id` - Delete a portfolio item

### Booking
- `POST /api/bookings` - Submit a booking request

## Public Endpoints
- `GET /` - Landing page
- `GET /portfolio/:username` - Public portfolio view
- `GET /register` - Registration page
- `GET /login` - Login page
- `GET /dashboard` - User dashboard (requires authentication)

## Security

- Passwords are hashed using bcrypt
- Session-based authentication
- Input validation and sanitization
- SQL injection prevention through parameterized queries

## Customization

You can customize the application by:
- Modifying the CSS in `/public/css/style.css`
- Updating the EJS templates in `/views`
- Adding new features to the Express routes in `server.js`
