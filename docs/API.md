# API Documentation

## Overview

The Social Experiment API is built using Next.js API Routes. All endpoints are located in `src/app/api/`.

## Authentication

All API endpoints (except `/api/auth/*`) require authentication via NextAuth session.

### Session Management

Sessions are managed via HTTP-only cookies set by NextAuth.

**Headers Required:**
```
Cookie: next-auth.session-token=<token>
```

## Endpoints

### Authentication

#### POST `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "User created successfully"
}
```

**Status Codes:**
- `201`: User created
- `400`: Invalid input or email already exists
- `500`: Server error

---

#### POST `/api/auth/signin`

Handled by NextAuth. Use the signIn() function from next-auth/react.

---

### API Keys

#### GET `/api/apikeys`

List all API keys for the authenticated user.

**Response:**
```json
[
  {
    "id": "key_123",
    "provider": "openai",
    "keyPreview": "sk-...xyz",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

---

#### POST `/api/apikeys`

Create a new API key.

**Request Body:**
```json
{
  "provider": "openai",
  "key": "sk-1234567890abcdefghijklmnopqrstuvwxyz"
}
```

**Response:**
```json
{
  "id": "key_123",
  "provider": "openai",
  "keyPreview": "sk-...xyz"
}
```

**Status Codes:**
- `201`: Key created
- `400`: Invalid input
- `500`: Server error

---

#### DELETE `/api/apikeys`

Delete an API key.

**Request Body:**
```json
{
  "id": "key_123"
}
```

**Response:**
```json
{
  "message": "API key deleted"
}
```

---

### Datasets

#### GET `/api/datasets`

List all datasets for the authenticated user.

**Response:**
```json
[
  {
    "id": "dataset_123",
    "name": "Twitter Dataset",
    "description": "Sample tweets",
    "rowCount": 100,
    "textField": "tweet",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

---

#### POST `/api/datasets`

Upload a new dataset.

**Request Body:**
```
Content-Type: multipart/form-data

name: Twitter Dataset
description: Sample tweets
textField: tweet
file: <CSV file>
```

**Response:**
```json
{
  "id": "dataset_123",
  "name": "Twitter Dataset",
  "rowCount": 100
}
```

**Status Codes:**
- `201`: Dataset created
- `400`: Invalid CSV or missing fields
- `500`: Server error

---

#### GET `/api/datasets/[id]`

Download a dataset CSV file.

**Response:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="dataset.csv"

<CSV content>
```

---

#### DELETE `/api/datasets/[id]`

Delete a dataset.

**Response:**
```json
{
  "message": "Dataset deleted"
}
```

---

### Classifiers

#### GET `/api/classifiers`

List all classifiers for the authenticated user.

**Response:**
```json
[
  {
    "id": "classifier_123",
    "name": "Sentiment Analysis",
    "prompt": "Classify sentiment. Return: positive, negative, or neutral",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

---

#### POST `/api/classifiers`

Create a new classifier.

**Request Body:**
```json
{
  "name": "Sentiment Analysis",
  "prompt": "Classify the sentiment of this text. Return one of: positive, negative, neutral"
}
```

**Response:**
```json
{
  "id": "classifier_123",
  "name": "Sentiment Analysis"
}
```

---

#### DELETE `/api/classifiers/[id]`

Delete a classifier.

**Response:**
```json
{
  "message": "Classifier deleted"
}
```

---

### Model Constraints

#### GET `/api/constraints`

List all model constraints for the authenticated user.

**Response:**
```json
[
  {
    "id": "constraint_123",
    "name": "Be Concise",
    "instruction": "Keep responses under 50 words",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

---

#### POST `/api/constraints`

Create a new constraint.

**Request Body:**
```json
{
  "name": "Be Concise",
  "instruction": "Keep all responses under 50 words"
}
```

**Response:**
```json
{
  "id": "constraint_123",
  "name": "Be Concise"
}
```

---

#### DELETE `/api/constraints/[id]`

Delete a constraint.

**Response:**
```json
{
  "message": "Constraint deleted"
}
```

---

### Studies

#### GET `/api/studies`

List all studies for the authenticated user.

**Response:**
```json
[
  {
    "id": "study_123",
    "name": "Twitter Sentiment Study",
    "description": "Analyzing tweet sentiment",
    "status": "completed",
    "model": "gpt-4o",
    "sampleSize": 100,
    "progress": 100,
    "runNumber": 1,
    "errorMessage": null,
    "createdAt": "2024-01-15T10:00:00Z",
    "completedAt": "2024-01-15T10:05:00Z",
    "dataset": {
      "id": "dataset_123",
      "name": "Twitter Dataset"
    },
    "classifiers": [
      {
        "id": "classifier_123",
        "name": "Sentiment"
      }
    ]
  }
]
```

---

#### POST `/api/studies`

Create a new study.

**Request Body:**
```json
{
  "name": "Twitter Sentiment Study",
  "description": "Analyzing tweet sentiment",
  "datasetId": "dataset_123",
  "classifierIds": ["classifier_123", "classifier_456"],
  "constraintId": "constraint_123",
  "model": "gpt-4o",
  "sampleSize": 100
}
```

**Response:**
```json
{
  "id": "study_123",
  "name": "Twitter Sentiment Study"
}
```

---

#### POST `/api/studies/[id]/run`

Execute a study.

**Response:**
```json
{
  "message": "Study completed successfully",
  "processed": 100,
  "errors": 0
}
```

**Status Codes:**
- `200`: Study completed
- `400`: Study already running or completed
- `500`: Study failed (check errorMessage in study record)

---

#### POST `/api/studies/[id]/rerun`

Re-run a completed or failed study.

**Response:**
```json
{
  "message": "Study rerun initiated",
  "runNumber": 2
}
```

---

#### GET `/api/studies/[id]/export`

Export study results as CSV.

**Response:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="study_results.csv"

id,tweet,username,timestamp,Sentiment_classification,Sentiment_confidence
1,"Great day!",@user,2024-01-15,positive,0.95
```

---

#### DELETE `/api/studies/[id]`

Delete a study and all its results.

**Response:**
```json
{
  "message": "Study deleted"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

**Common Status Codes:**
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (not authorized for this resource)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

Currently no rate limiting implemented. Consider adding in production:
- Per-user limits
- Per-endpoint limits
- OpenAI API quota management

## Webhooks

Not currently implemented. Future consideration for:
- Study completion notifications
- Dataset processing status
- Error alerts