# Technical Documentation

## Project Architecture

### Overall Structure

Azhemon uses a client-server architecture with:

- **Frontend:** TypeScript/Vite application (SPA)
- **Backend:** PHP REST API
- **Database:** MySQL

---

## Frontend Architecture

### Core Components

- **Controllers:** Handle game logic and user interactions
  - `LoginController`: Handles authentication
  - `TeamBuilderController`: Manages team creation/editing
  - `BattleController`: Manages battle mechanics
  - `TurnManager`: Handles turn execution
  - `BattleEngine`: Handles battle calculations
  - `EffectManager`: Handles battle effects
  - `PokemonAI`: Handles CPU's intelligence and decision making
  - `AudioManager`: Controls game audio

- **Services:** API communication
  - `ApiService`: Base service for API requests
  - `AuthService`: Handles authentication tokens

- **Views:** HTML templates for UI components
  - Uses custom HTML template imports via Vite plugin

### Build System

- TypeScript for type-safe code
- Vite for development and production builds
- Custom template loading for HTML components

---

## Backend Architecture

- **Controllers:** Handle API requests
  - Use attribute-based routing (`#[Route()]`)
  - Return JSON responses

- **Models:** Database interaction
  - Use PDO for database queries
  - Follow repository pattern

- **Middlewares:** Request processing
  - `AuthMiddleware`: JWT validation
  - `RoleMiddleware`: Permission checking

### Routing System

- Custom router with attribute-based route definitions
- Middleware support for protected routes
- RESTful API design

---

## Authentication

- JWT (JSON Web Tokens) for stateless authentication
- Refresh token pattern for extended sessions
- Role-based access control

---

## API Endpoints

### Authentication

- `POST /back/auth/register`: Create new user account
- `POST /back/auth/login`: Authenticate user
- `POST /back/auth/refresh`: Refresh authentication token

### Teams

- `GET /back/team/player_id/:id`: Get teams by player ID
- `POST /back/create_team`: Create new team
- `PATCH /back/update_team/:id`: Update team
- `DELETE /back/team/:id`: Delete team

---

## Database Schema

- `player`: User accounts
- `role`: User roles (admin/player)
- `revoked_token`: Token black-list
- `team`: Pokémon teams
- `team_pokemon`: Pokémon in teams
- `team_pokemon_move`: Moves assigned to team Pokémon

---

## Deployment

- Frontend built with Vite and deployed to Ionos shared server
- Backend deployed as PHP application with custom `.htaccess`
- Asset management for sprites and audio files