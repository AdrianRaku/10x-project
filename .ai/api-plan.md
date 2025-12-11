# REST API Plan

## 1. Resources

- **Ratings**: Represents a user's rating for a specific movie. Corresponds to the `ratings` database table.
- **User Lists**: Represents a movie's inclusion in a user's personal list (e.g., 'watchlist', 'favorite'). Corresponds to the `user_lists` database table.
- **AI Recommendations**: Represents the business logic for generating movie recommendations for a user. It interacts with `ratings`, `ai_recommendation_requests`, and an external AI service.
- **Movies (Proxy)**: A pass-through resource to an external API (TMDb) for searching movie details. This is to protect the external API key.

## 2. Endpoints

### 2.1. Ratings

#### Get All User Ratings

- **Method**: `GET`
- **Path**: `/api/ratings`
- **Description**: Retrieves all movie ratings for the currently authenticated user.
- **Query Parameters**: None.
- **Request Payload**: N/A
- **Response Payload**:
  ```json
  {
    "data": [
      {
        "tmdb_id": 123,
        "rating": 8,
        "created_at": "2025-11-21T10:00:00Z",
        "updated_at": "2025-11-21T10:00:00Z"
      }
    ]
  }
  ```
- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`

#### Add or Update a Movie Rating

- **Method**: `POST`
- **Path**: `/api/ratings`
- **Description**: Creates a new rating for a movie or updates an existing one for the authenticated user. This "upsert" logic simplifies client-side operations.
- **Request Payload**:
  ```json
  {
    "tmdb_id": 123,
    "rating": 8
  }
  ```
- **Response Payload**:
  ```json
  {
    "data": {
      "tmdb_id": 123,
      "rating": 8,
      "created_at": "2025-11-21T10:00:00Z",
      "updated_at": "2025-11-21T10:05:00Z"
    }
  }
  ```
- **Success Codes**: `201 Created` (if new), `200 OK` (if updated)
- **Error Codes**: `400 Bad Request`, `401 Unauthorized`, `422 Unprocessable Entity`

#### Delete a Movie Rating

- **Method**: `DELETE`
- **Path**: `/api/ratings/:tmdb_id`
- **Description**: Deletes a specific movie rating for the authenticated user.
- **Request Payload**: N/A
- **Response Payload**: N/A
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`, `404 Not Found`

### 2.2. User Lists

#### Get User's Lists

- **Method**: `GET`
- **Path**: `/api/lists`
- **Description**: Retrieves all movies on the user's 'watchlist' and 'favorite' lists.
- **Query Parameters**: None.
- **Response Payload**:
  ```json
  {
    "data": {
      "watchlist": [{ "tmdb_id": 456, "created_at": "2025-11-20T10:00:00Z" }],
      "favorite": [{ "tmdb_id": 789, "created_at": "2025-11-19T10:00:00Z" }]
    }
  }
  ```
- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`

#### Add a Movie to a List

- **Method**: `POST`
- **Path**: `/api/lists`
- **Description**: Adds a movie to a specified list ('watchlist' or 'favorite') for the authenticated user.
- **Request Payload**:
  ```json
  {
    "tmdb_id": 456,
    "list_type": "watchlist"
  }
  ```
- **Response Payload**:
  ```json
  {
    "data": {
      "tmdb_id": 456,
      "list_type": "watchlist",
      "created_at": "2025-11-21T11:00:00Z"
    }
  }
  ```
- **Success Codes**: `201 Created`
- **Error Codes**: `400 Bad Request`, `401 Unauthorized`, `409 Conflict` (if already in list), `422 Unprocessable Entity`

#### Remove a Movie from a List

- **Method**: `DELETE`
- **Path**: `/api/lists/:list_type/:tmdb_id`
- **Description**: Removes a movie from a specified list for the authenticated user.
- **Request Payload**: N/A
- **Response Payload**: N/A
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`, `404 Not Found`

### 2.3. AI Recommendations

#### Generate Movie Recommendations

- **Method**: `POST`
- **Path**: `/api/recommendations`
- **Description**: Generates movie recommendations based on the user's rating history and an optional text prompt.
- **Request Payload**:
  ```json
  {
    "prompt": "I'm in the mood for a mind-bending sci-fi movie."
  }
  ```
- **Response Payload**:
  ```json
  {
    "data": [
      { "tmdb_id": 101, "title": "Inception", "year": 2010 },
      { "tmdb_id": 102, "title": "The Matrix", "year": 1999 },
      { "tmdb_id": 103, "title": "Blade Runner 2049", "year": 2017 },
      { "tmdb_id": 104, "title": "Arrival", "year": 2016 },
      { "tmdb_id": 105, "title": "Interstellar", "year": 2014 }
    ]
  }
  ```
- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`, `403 Forbidden` (if user has < 10 ratings), `429 Too Many Requests` (if daily limit is exceeded), `500 Internal Server Error` (if AI service fails)

### 2.4. Movies (TMDb Proxy)

#### Search for Movies

- **Method**: `GET`
- **Path**: `/api/movies/search`
- **Description**: Searches for movies on TMDb using a query string. This endpoint acts as a secure proxy to the TMDb API.
- **Query Parameters**: `query: string` (required)
- **Request Payload**: N/A
- **Response Payload**:
  ```json
  {
    "data": [
      {
        "tmdb_id": 278,
        "title": "The Shawshank Redemption",
        "poster_path": "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
        "release_date": "1994-09-23"
      }
    ]
  }
  ```
- **Success Codes**: `200 OK`
- **Error Codes**: `400 Bad Request` (if query is missing), `500 Internal Server Error` (if TMDb is unreachable)

## 3. Authentication and Authorization

- **Authentication**: Authentication will be handled using JSON Web Tokens (JWTs) provided by Supabase Auth. The client will send the JWT in the `Authorization: Bearer <token>` header for all protected endpoints. Astro middleware will be used to validate the token on the server for each request.
- **Authorization**: Row-Level Security (RLS) policies are enabled on all tables (`ratings`, `user_lists`, `ai_recommendation_requests`). These policies ensure that users can only access and modify their own data. The API endpoints rely on these database-level policies for authorization, checking that `auth.uid()` matches the `user_id` in the table.

## 4. Validation and Business Logic

- **Validation**: Input validation for all `POST` requests will be performed using Zod schemas within the Astro server endpoints. This ensures data integrity before it reaches the database.
  - `ratings`: `tmdb_id` must be an integer, `rating` must be an integer between 1 and 10.
  - `user_lists`: `tmdb_id` must be an integer, `list_type` must be either 'watchlist' or 'favorite'.
  - `recommendations`: `prompt` is an optional string.
- **Business Logic**:
  - **Recommendation Prerequisite**: The `POST /api/recommendations` endpoint will first query the `ratings` table to count the user's ratings. If the count is less than 10, it will return a `403 Forbidden` error.
  - **Rate Limiting**: The `POST /api/recommendations` endpoint will check the `ai_recommendation_requests` table. It will count entries for the current user within the last 24 hours. If the count is 3 or more, it will return a `429 Too Many Requests` error. On a successful request, it will insert a new record into this table.
  - **Upsert Logic**: The `POST /api/ratings` endpoint will implement an "upsert" (update or insert) pattern. It will attempt to insert a new rating and, if a unique constraint violation occurs (meaning a rating for that movie by that user already exists), it will perform an update instead.
