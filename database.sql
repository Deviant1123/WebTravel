-- Create database
CREATE DATABASE travel_routes;

-- Connect to the database
\c travel_routes;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create routes table
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    start_location VARCHAR(100) NOT NULL,
    end_location VARCHAR(100) NOT NULL,
    duration_days INTEGER NOT NULL,
    difficulty_level VARCHAR(20) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create points_of_interest table
CREATE TABLE points_of_interest (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create route_points table (junction table for routes and points of interest)
CREATE TABLE route_points (
    route_id INTEGER REFERENCES routes(id),
    point_id INTEGER REFERENCES points_of_interest(id),
    order_in_route INTEGER NOT NULL,
    PRIMARY KEY (route_id, point_id)
);

-- Create reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_favorites table
CREATE TABLE user_favorites (
    user_id INTEGER REFERENCES users(id),
    route_id INTEGER REFERENCES routes(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, route_id)
);

-- Create shared_routes table
CREATE TABLE shared_routes (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    shared_by INTEGER REFERENCES users(id),
    shared_with INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample users
INSERT INTO users (username, email, password_hash) VALUES
('john_doe', 'john@example.com', '$2a$10$abcdefghijklmnopqrstuv'),
('jane_smith', 'jane@example.com', '$2a$10$abcdefghijklmnopqrstuv'),
('travel_lover', 'travel@example.com', '$2a$10$abcdefghijklmnopqrstuv');

-- Insert sample routes
INSERT INTO routes (title, description, start_location, end_location, duration_days, difficulty_level, created_by) VALUES
('Paris to Rome Adventure', 'A beautiful journey through France and Italy', 'Paris', 'Rome', 7, 'medium', 1),
('Alpine Hiking Trail', 'Scenic mountain route through the Alps', 'Geneva', 'Munich', 5, 'hard', 2),
('Coastal Road Trip', 'Stunning coastal views from Barcelona to Nice', 'Barcelona', 'Nice', 4, 'easy', 3),
('Eastern Europe Explorer', 'Cultural journey through historic cities', 'Prague', 'Budapest', 6, 'medium', 1);

-- Insert sample points of interest
INSERT INTO points_of_interest (name, description, latitude, longitude, type) VALUES
('Eiffel Tower', 'Iconic Paris landmark', 48.8584, 2.2945, 'landmark'),
('Colosseum', 'Ancient Roman amphitheater', 41.8902, 12.4922, 'historical'),
('Matterhorn', 'Famous mountain peak', 45.9767, 7.6583, 'natural'),
('Sagrada Familia', 'Gaudi''s masterpiece', 41.4036, 2.1744, 'architecture'),
('Charles Bridge', 'Historic bridge in Prague', 50.0865, 14.4115, 'historical'),
('Fisherman''s Bastion', 'Neo-Gothic terrace in Budapest', 47.5025, 19.0344, 'architecture');

-- Insert route points connections
INSERT INTO route_points (route_id, point_id, order_in_route) VALUES
(1, 1, 1), -- Eiffel Tower in Paris to Rome route
(1, 2, 2), -- Colosseum in Paris to Rome route
(2, 3, 1), -- Matterhorn in Alpine route
(3, 4, 1), -- Sagrada Familia in Coastal route
(4, 5, 1), -- Charles Bridge in Eastern Europe route
(4, 6, 2); -- Fisherman's Bastion in Eastern Europe route

-- Insert sample reviews
INSERT INTO reviews (route_id, user_id, rating, comment) VALUES
(1, 2, 5, 'Amazing experience! The views were breathtaking.'),
(1, 3, 4, 'Great route, but could use more rest stops.'),
(2, 1, 5, 'Challenging but rewarding hike.'),
(3, 2, 4, 'Beautiful coastal views throughout the journey.');

-- Insert sample user favorites
INSERT INTO user_favorites (user_id, route_id) VALUES
(1, 2), -- John likes Alpine Hiking Trail
(2, 1), -- Jane likes Paris to Rome Adventure
(3, 3); -- Travel lover likes Coastal Road Trip

-- Insert sample shared routes
INSERT INTO shared_routes (route_id, shared_by, shared_with) VALUES
(1, 1, 2), -- John shared Paris to Rome with Jane
(2, 2, 3), -- Jane shared Alpine Trail with Travel lover
(3, 3, 1); -- Travel lover shared Coastal Trip with John

-- Create indexes
CREATE INDEX idx_routes_created_by ON routes(created_by);
CREATE INDEX idx_reviews_route_id ON reviews(route_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id); 