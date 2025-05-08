# Travel Routes Platform

A web platform for sharing and discovering travel routes, with user authentication and review functionality.

## Features

- User authentication (register/login)
- Create, read, update, and delete travel routes
- Leave reviews and ratings for routes
- View route details including reviews
- Responsive design using Bootstrap

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd travel-routes-platform
```

2. Install dependencies:
```bash
npm install
```

3. Create a PostgreSQL database and update the connection details in `server.js`:
```javascript
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'travel_routes',
    password: 'your_password',
    port: 5432,
});
```

4. Initialize the database:
```bash
psql -U postgres -f database.sql
```

5. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Routes
- `GET /api/routes` - Get all routes
- `POST /api/routes` - Create a new route (requires authentication)
- `GET /api/routes/:id` - Get a specific route
- `PUT /api/routes/:id` - Update a route (requires authentication)
- `DELETE /api/routes/:id` - Delete a route (requires authentication)

### Reviews
- `GET /api/routes/:id/reviews` - Get reviews for a route
- `POST /api/routes/:id/reviews` - Add a review (requires authentication)

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Protected routes require valid authentication
- Users can only modify their own routes

## Backup and Restore

The project includes scripts for backing up and restoring the database and files:

### Windows
- Backup: `backup.bat`
- Restore: `restore.bat path\to\backup.zip`

### Linux
- Backup: `./backup.sh`
- Restore: `./restore.sh path/to/backup.tar.gz`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 