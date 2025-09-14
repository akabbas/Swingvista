# API Documentation

## Overview

SwingVista provides a RESTful API for managing golf swing data and analysis. All endpoints are prefixed with `/api/`.

## Authentication

Currently, the API uses a simple user ID system. In production, implement proper authentication.

## Endpoints

### Swings

#### `POST /api/swings`

Create a new swing record.

**Request Body:**
```json
{
  "club": "driver",
  "metrics": {
    "swingPlaneAngle": 12.5,
    "tempoRatio": 2.1,
    "hipRotation": 30.0,
    "shoulderRotation": 45.0,
    "impactFrame": 15,
    "backswingTime": 1.2,
    "downswingTime": 0.6
  },
  "feedback": ["Good tempo", "Rotate more"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "demo-user",
  "club": "driver",
  "metrics": { ... },
  "feedback": [ ... ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### `GET /api/swings`

Get swing history for a user.

**Query Parameters:**
- `type=stats` - Get club statistics instead of individual swings

**Response:**
```json
[
  {
    "id": "uuid",
    "club": "driver",
    "metrics": { ... },
    "feedback": [ ... ],
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### `GET /api/swings/[id]`

Get specific swing details.

**Response:**
```json
{
  "id": "uuid",
  "user_id": "demo-user",
  "club": "driver",
  "metrics": { ... },
  "feedback": [ ... ],
  "video_url": "optional_video_url",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Ball Detection

#### `POST /api/infer/ball`

Mock ball detection endpoint (ready for YOLOv8 integration).

**Request Body:**
```json
{
  "image": "base64_encoded_image"
}
```

**Response:**
```json
{
  "detected": true,
  "confidence": 0.95,
  "bounding_box": {
    "x": 100,
    "y": 200,
    "width": 50,
    "height": 50
  }
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a message:

```json
{
  "error": "Error message"
}
```

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## Data Models

### SwingRecord

```typescript
interface SwingRecord {
  id: string;
  user_id: string;
  club: string;
  metrics: {
    swingPlaneAngle: number;
    tempoRatio: number;
    hipRotation: number;
    shoulderRotation: number;
    impactFrame: number;
    backswingTime: number;
    downswingTime: number;
  };
  feedback: string[];
  video_url?: string;
  created_at: string;
  updated_at: string;
}
```

### ClubStats

```typescript
interface ClubStats {
  club: string;
  total_swings: number;
  avg_swing_plane: number;
  avg_tempo_ratio: number;
  avg_hip_rotation: number;
  avg_shoulder_rotation: number;
  last_swing: string;
}
```
