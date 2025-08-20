# Leaderboard API Documentation

This document describes the API endpoint for fetching leaderboard data from the referral system.

## Base URL
```
https://your-domain.com/api
```

## Endpoint

### Leaderboard
**GET** `/leaderboard`

Fetches leaderboard data with user information and referral counts.

#### Query Parameters
- `limit` (optional): Number of records to return (1-100, default: 10)

#### Example Request
```bash
curl "https://your-domain.com/api/leaderboard?limit=20"
```

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": "user-id-1",
      "username": "john_doe",
      "referral_code": "JOHN123",
      "total_referrals": 15,
      "rank": 1,
      "avatar_image_url": "https://supabase.co/storage/.../avatar.svg"
    }
  ],
  "count": 20,
  "limit": 20,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid limit parameter. Must be between 1 and 100."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to fetch leaderboard data"
}
```

## CORS Support

The endpoint supports CORS and can be accessed from any domain:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Usage Examples

### JavaScript/Fetch
```javascript
// Fetch top 10 leaderboard
const response = await fetch('https://your-domain.com/api/leaderboard?limit=10');
const data = await response.json();

if (data.success) {
  console.log('Leaderboard:', data.data);
} else {
  console.error('Error:', data.error);
}
```

### React/Next.js
```javascript
import { useState, useEffect } from 'react';

function LeaderboardComponent() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/leaderboard?limit=20');
        const data = await response.json();
        
        if (data.success) {
          setLeaderboard(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {leaderboard.map((user, index) => (
        <div key={user.id}>
          <span>#{user.rank}</span>
          <img src={user.avatar_image_url} alt={user.username} />
          <span>{user.username}</span>
          <span>{user.total_referrals} referrals</span>
        </div>
      ))}
    </div>
  );
}
```

### Python/Requests
```python
import requests

# Fetch leaderboard data
response = requests.get('https://your-domain.com/api/leaderboard?limit=25')
data = response.json()

if data['success']:
    for user in data['data']:
        print(f"#{user['rank']} - {user['username']} ({user['total_referrals']} referrals)")
else:
    print(f"Error: {data['error']}")
```

## Rate Limiting

Currently, there are no rate limits implemented, but it's recommended to:
- Cache responses when possible
- Don't make requests more frequently than every 30 seconds
- Use appropriate error handling

## Data Structure

### User Object
- `id`: Unique user identifier
- `rank`: Position on leaderboard (1 = highest)
- `total_referrals`: Number of successful referrals
- `username`: User's display name
- `avatar_image_url`: URL to user's avatar image
- `referral_code`: User's referral code

## Notes

- All timestamps are in ISO 8601 format
- Avatar URLs are from Supabase Storage
- Rank 1 is the user with the most referrals
- Users without avatars will have `null` for `avatar_image_url`
- Anonymous users will show "Anonymous" as username 