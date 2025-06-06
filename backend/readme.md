# Backend API Service

Backend API service for the Physician Personality Trait Annotation System, built with Go and Gin framework.

## Technology Stack

- **Language**: Go 1.16+
- **Framework**: Gin Web Framework
- **Database**: PostgreSQL
- **ORM**: Native SQL queries
- **HTTP Router**: Gin Router
- **CORS**: gin-contrib/cors

## Project Structure

```
backend/
├── cmd/                    # Command line tools
│   └── import/            # Data import tool
├── controllers/           # API controllers
│   └── physician.go       # Physician-related APIs
├── db/                    # Database related
│   ├── database.go        # Database connection
│   ├── init.sql          # Database initialization script
│   └── *.sql             # Other SQL scripts
├── models/               # Data models
│   └── models.go         # Data structure definitions
├── routes/               # Route configuration
│   └── routes.go         # API route setup
├── main.go              # Application entry point
└── go.mod               # Go module dependencies
```

## Environment Variables Configuration

Before running the application, you need to set the following environment variables:

```bash
DB_HOST=localhost          # Database host
DB_PORT=5432              # Database port
DB_USER=your_username     # Database username
DB_PASSWORD=your_password # Database password
DB_NAME=physicians        # Database name
DB_SSLMODE=disable        # SSL mode
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
go mod download
```

### 2. Database Setup

Ensure PostgreSQL is installed and running, then create the database:

```sql
CREATE DATABASE physicians;
```

### 3. Run the Application

```bash
# Start with environment variables
DB_HOST=localhost DB_PORT=5432 DB_USER=your_user DB_PASSWORD=your_pass DB_NAME=physicians DB_SSLMODE=disable go run main.go

# Or set environment variables and then run
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=your_user
export DB_PASSWORD=your_pass
export DB_NAME=physicians
export DB_SSLMODE=disable
go run main.go
```

The application will start at `http://localhost:8080`.

## API Documentation

### Base Information

- **Base URL**: `http://localhost:8080/api`
- **Content-Type**: `application/json`

### Physician Information Endpoints

#### Get Physician Information
```
GET /physician/{npi}
```

**Response Example**:
```json
{
  "id": 1,
  "npi": 1234567890,
  "first_name": "John",
  "last_name": "Doe",
  "biography_doc": "<p>Physician biography HTML content</p>",
  "education_doc": "<education>University, Medical School, Graduated, 2000</education>",
  "reviews": [...]
}
```

#### Get Task Information
```
GET /physician/{npi}/task/{taskID}?username={username}
```

### Annotation Endpoints

#### Submit Human Annotation
```
POST /physician/{npi}/task/{taskID}/trait/{trait}/human-annotation
```

#### Get Machine Annotations
```
GET /physician/{npi}/task/{taskID}/trait/{trait}/machine-annotations
```

#### Submit Machine Evaluation
```
POST /physician/{npi}/task/{taskID}/trait/{trait}/machine-evaluation
```

#### Get Progress
```
GET /physician/{npi}/task/{taskID}/trait/{trait}/progress
```

#### Get History
```
GET /physician/{npi}/task/{taskID}/trait/{trait}/history
```

#### Complete Trait Evaluation
```
POST /physician/{npi}/task/{taskID}/trait/{trait}/complete
```

## Data Models

### Main Structs

- `Physician`: Physician information
- `Review`: Patient reviews
- `Task`: Annotation tasks
- `HumanAnnotation`: Human annotations
- `ModelAnnotation`: Model annotations
- `MachineAnnotationEvaluation`: Machine annotation evaluations

For detailed database structure, see `../database/README.md`.

## Development Features

### CORS Support
The API supports cross-origin requests, allowing frontend applications to access from different ports.

### Error Handling
All API endpoints include proper error handling and HTTP status codes.

### Logging
Uses Gin's built-in logging middleware to record request information.

## Data Import

The project includes a data import tool:

```bash
cd backend/cmd/import
go run main.go
```

This tool can import physician and review data from JSON files.

## Deployment Notes

### Production Environment Configuration

1. Set `GIN_MODE=release`
2. Use appropriate database connection pool settings
3. Configure reverse proxy (e.g., Nginx)
4. Enable HTTPS
5. Set appropriate CORS policies

### Docker Deployment

You can create a Dockerfile for containerized deployment:

```dockerfile
FROM golang:1.16-alpine
WORKDIR /app
COPY . .
RUN go build -o main .
EXPOSE 8080
CMD ["./main"]
```

## Contributing Guidelines

1. Fork the project
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
