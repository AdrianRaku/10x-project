# API Documentation: Movie Ratings Endpoint

## Overview
The `/api/ratings` endpoint allows authenticated users to create or update movie ratings. It implements upsert logic, automatically determining whether to create a new rating or update an existing one.

## Endpoint Details

### URL
```
POST /api/ratings
```

### Authentication
Currently using `DEFAULT_USER_ID` environment variable for development. Production will require JWT authentication via Supabase session.

### Request Headers
```
Content-Type: application/json
```

### Request Body
```typescript
{
  "tmdb_id": number,  // The Movie Database ID (positive integer)
  "rating": number    // User rating (integer between 1-10)
}
```

### Response Codes
- `201 Created` - New rating was successfully created
- `200 OK` - Existing rating was successfully updated
- `400 Bad Request` - Invalid input data or malformed JSON
- `401 Unauthorized` - User is not authenticated (not yet implemented)
- `422 Unprocessable Entity` - Database constraint violation
- `500 Internal Server Error` - Unexpected server error

---

## Examples

### 1. Create New Rating (201 Created)

**Request:**
```bash
curl -X POST http://localhost:3000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{
    "tmdb_id": 550,
    "rating": 9
  }'
```

**Response:**
```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "data": {
    "tmdb_id": 550,
    "rating": 9,
    "created_at": "2025-11-28T11:09:25.206269+00:00",
    "updated_at": "2025-11-28T11:09:25.206269+00:00"
  }
}
```

**Note:** When creating a new rating, `created_at` and `updated_at` timestamps are identical.

---

### 2. Update Existing Rating (200 OK)

**Request:**
```bash
curl -X POST http://localhost:3000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{
    "tmdb_id": 550,
    "rating": 10
  }'
```

**Response:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": {
    "tmdb_id": 550,
    "rating": 10,
    "created_at": "2025-11-28T11:09:25.206269+00:00",
    "updated_at": "2025-11-28T11:09:53.594525+00:00"
  }
}
```

**Note:** When updating, `created_at` remains unchanged while `updated_at` is updated to the current timestamp.

---

### 3. JavaScript/Fetch Example

```javascript
// Create or update a rating
async function rateMovie(tmdbId, rating) {
  try {
    const response = await fetch('http://localhost:3000/api/ratings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tmdb_id: tmdbId,
        rating: rating
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();

    if (response.status === 201) {
      console.log('New rating created:', result.data);
    } else if (response.status === 200) {
      console.log('Rating updated:', result.data);
    }

    return result.data;
  } catch (error) {
    console.error('Failed to rate movie:', error);
    throw error;
  }
}

// Usage
rateMovie(550, 9)
  .then(rating => console.log('Success:', rating))
  .catch(error => console.error('Error:', error));
```

---

## Error Handling

### Validation Errors (400 Bad Request)

#### Invalid Rating (> 10)
**Request:**
```bash
curl -X POST http://localhost:3000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"tmdb_id": 550, "rating": 11}'
```

**Response:**
```json
HTTP/1.1 400 Bad Request

{
  "error": "Bad Request",
  "message": "Invalid request data",
  "details": [
    {
      "code": "too_big",
      "maximum": 10,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "rating must be an integer between 1 and 10",
      "path": ["rating"]
    }
  ]
}
```

#### Invalid Rating (< 1)
**Request:**
```bash
curl -X POST http://localhost:3000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"tmdb_id": 550, "rating": 0}'
```

**Response:**
```json
HTTP/1.1 400 Bad Request

{
  "error": "Bad Request",
  "message": "Invalid request data",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "Number must be greater than or equal to 1",
      "path": ["rating"]
    }
  ]
}
```

#### Invalid TMDb ID (Negative)
**Request:**
```bash
curl -X POST http://localhost:3000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"tmdb_id": -1, "rating": 5}'
```

**Response:**
```json
HTTP/1.1 400 Bad Request

{
  "error": "Bad Request",
  "message": "Invalid request data",
  "details": [
    {
      "code": "too_small",
      "minimum": 0,
      "type": "number",
      "inclusive": false,
      "exact": false,
      "message": "tmdb_id must be a positive integer",
      "path": ["tmdb_id"]
    }
  ]
}
```

#### Malformed JSON
**Request:**
```bash
curl -X POST http://localhost:3000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{invalid json}'
```

**Response:**
```json
HTTP/1.1 400 Bad Request

{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

#### Missing Required Field
**Request:**
```bash
curl -X POST http://localhost:3000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{"tmdb_id": 550}'
```

**Response:**
```json
HTTP/1.1 400 Bad Request

{
  "error": "Bad Request",
  "message": "Invalid request data",
  "details": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "undefined",
      "path": ["rating"],
      "message": "Required"
    }
  ]
}
```

---

## Security Considerations

### Current Implementation (Development)
- Uses `DEFAULT_USER_ID` from environment variables
- No JWT authentication implemented yet
- RLS policies on the database level ensure data isolation

### Planned Production Implementation
```typescript
// Get user session from Supabase
const session = await locals.supabase.auth.getSession();

if (!session.data.session) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "User not authenticated"
    }),
    { status: 401 }
  );
}

const userId = session.data.session.user.id;
```

### RLS Policies
The database enforces Row Level Security (RLS) policies to ensure:
- Users can only create/update their own ratings
- Users can only read their own ratings
- All operations are scoped to `auth.uid()`

---

## Data Flow

1. Client sends POST request with rating data
2. Astro middleware verifies JWT token (future implementation)
3. API handler validates request body using Zod schema
4. RatingsService performs upsert operation via Supabase
5. Database uses unique key `(user_id, tmdb_id)` to determine INSERT vs UPDATE
6. Service compares `created_at` and `updated_at` to determine operation type
7. API handler returns appropriate status code (201 or 200) with rating data

---

## Performance Notes

Based on test results:
- **CREATE operation**: ~265ms (includes database insert)
- **UPDATE operation**: ~6ms (database update only)
- **Validation errors**: ~1ms (rejected before database call)

---

## TypeScript Types

```typescript
// Command Model (Input)
export type AddOrUpdateRatingCommand = {
  tmdb_id: number;
  rating: number;
};

// DTO (Output)
export type RatingDto = {
  tmdb_id: number;
  rating: number;
  created_at: string;
  updated_at: string;
};
```

---

## Testing Checklist

- [x] Create new rating (201)
- [x] Update existing rating (200)
- [x] Validate rating > 10 (400)
- [x] Validate rating < 1 (400)
- [x] Validate negative tmdb_id (400)
- [x] Validate malformed JSON (400)
- [x] Validate missing fields (400)
- [ ] Test with authenticated user (pending JWT implementation)
- [ ] Test RLS policies (pending multi-user testing)
- [ ] Test concurrent updates to same rating

---

## Future Enhancements

1. **Authentication**: Implement JWT-based authentication via Supabase
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Batch Operations**: Support bulk rating creation/updates
4. **Soft Deletes**: Allow users to remove ratings
5. **Rating History**: Track rating changes over time
