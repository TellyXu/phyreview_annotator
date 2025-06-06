# Physician Personality Trait Annotation System

A system for annotating physicians' Big Five personality traits and evaluating annotation results from different models. Supports HTML content rendering, education background parsing, and other advanced features.

## 🌟 Key Features

- ✅ **HTML Content Rendering**: Perfect display of HTML tags in physician biographies
- ✅ **Education Background Parsing**: Automatic parsing and formatting of `<education>` tags
- ✅ **Responsive Design**: Two-column layout adaptable to various screen sizes
- ✅ **Real-time Progress Tracking**: Live display of completion status for 5 personality traits
- ✅ **Multi-model Evaluation**: Support for comparing and evaluating multiple AI model results
- ✅ **UX Optimization**: User-friendly interface and interaction design

## Project Structure

```
.
├── backend/             # Go backend API service
│   ├── cmd/             # Command line tools
│   │   └── import/      # Data import tool
│   ├── controllers/     # API controllers
│   │   └── physician.go # Physician-related APIs
│   ├── models/          # Data models
│   │   └── models.go    # Data structure definitions
│   ├── routes/          # API routes
│   │   └── routes.go    # Route configuration
│   ├── db/              # Database related
│   │   ├── database.go  # Database connection
│   │   └── *.sql        # SQL scripts
│   └── main.go          # Application entry point
├── frontend/            # React frontend application
│   ├── public/          # Static assets
│   └── src/             # Source code
│       ├── components/  # Component library
│       │   ├── Login.tsx               # Login component
│       │   ├── PhysicianInfo.tsx       # Physician info display (supports HTML rendering)
│       │   ├── ReviewsList.tsx         # Reviews list
│       │   ├── TraitTabs.tsx           # Trait tabs
│       │   ├── TraitWorkflow.tsx       # Trait evaluation workflow
│       │   ├── HumanAnnotationForm.tsx # Human annotation form
│       │   ├── MachineEvaluationForm.tsx # Machine evaluation form
│       │   └── ReviewAndModifyForm.tsx # Review and modify form
│       ├── pages/       # Page components
│       │   ├── HomePage.tsx    # Home page
│       │   └── TaskPage.tsx    # Task page
│       └── services/    # API services
└── database/            # Database documentation
    ├── README.md        # Database structure documentation
    ├── first_10_phy_records.json # Sample data
    └── etl.py          # Data processing script
```

## Technology Stack

### Backend
- **Language**: Go 1.16+
- **Framework**: Gin Web Framework
- **Database**: PostgreSQL
- **Features**: RESTful API, CORS support, Native SQL queries

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Ant Design
- **State Management**: React Hooks
- **Router**: React Router
- **HTTP Client**: Axios

### Database
- **Main Database**: PostgreSQL
- **Tables**: physicians, reviews, tasks, human_annotations, model_annotations

## Quick Start

### 📋 Prerequisites

- Node.js (v14+)
- Go (v1.16+)
- PostgreSQL (v12+)

### 🚀 Installation and Running

#### 1. Clone Repository

```bash
git clone https://github.com/TellyXu/phyreview_annotator.git
cd phyreview_annotator
```

#### 2. Database Setup

```bash
# Create database
createdb physicians

# Run initialization script (if available)
psql -d physicians -f backend/db/init.sql
```

#### 3. Start Backend Service

```bash
cd backend

# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=your_username
export DB_PASSWORD=your_password
export DB_NAME=physicians
export DB_SSLMODE=disable

# Install dependencies and run
go mod download
go run main.go
```

Backend API will start at `http://localhost:8080`.

#### 4. Start Frontend Application

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend application will start at `http://localhost:3000`.

### 🎯 Usage

1. **Login**: Enter username, physician NPI number, and task ID
2. **View Physician Info**: Browse physician biography (supports HTML format) and education background
3. **Read Patient Reviews**: Scroll through all patient reviews in the left panel
4. **Annotate Personality**: Score and analyze the five personality traits
5. **Evaluate AI Models**: View and evaluate analysis results from multiple AI models
6. **Complete Task**: Complete annotations for all 5 traits

## 🆕 Latest Features

### HTML Content Rendering
- Full HTML tag support in physician biographies
- Automatic cleaning of unsafe script content
- Beautiful CSS styling optimization

### Education Background Parsing
- Smart parsing of `<education>` XML tags
- Formatted display as numbered list
- Card-style layout for enhanced readability

### User Experience Enhancement
- Real-time progress display (Completed X/5 traits)
- Celebration message upon completing all tasks
- Auto-redirect to home page after 3 seconds

### Workflow Optimization
- New TraitWorkflow component for unified flow management
- Support for viewing and modifying annotation history
- Machine learning model results comparison and evaluation

## API Endpoints

### Physician Information
- `GET /api/physician/:npi` - Get physician details
- `GET /api/physician/:npi/task/:taskID` - Get task information

### Personality Trait Annotation
- `POST /api/physician/:npi/task/:taskID/trait/:trait/human-annotation` - Submit human annotation
- `GET /api/physician/:npi/task/:taskID/trait/:trait/machine-annotations` - Get machine annotations
- `POST /api/physician/:npi/task/:taskID/trait/:trait/machine-evaluation` - Submit machine evaluation
- `GET /api/physician/:npi/task/:taskID/trait/:trait/progress` - Get progress
- `GET /api/physician/:npi/task/:taskID/trait/:trait/history` - Get history
- `POST /api/physician/:npi/task/:taskID/trait/:trait/complete` - Complete trait evaluation

## System Features

### 🔐 User Authentication
- Session management (sessionStorage)
- Username and task validation
- Auto-logout functionality

### 👨‍⚕️ Physician Information Display
- Basic information display
- **HTML Biography Rendering**: Supports `<p>`, `<b>`, `<a>` tags
- **Education Background Formatting**: Parses XML tags into structured list
- Collapsible panel to save space

### 💬 Patient Review System
- Review list display
- Metadata parsing (source, date, etc.)
- Custom scrollbar styling

### 🧠 Personality Trait Assessment
- **Big Five Personality Dimensions**: 
  - Openness
  - Conscientiousness
  - Extraversion
  - Agreeableness
  - Neuroticism
- Scoring system (Low/Moderate/High)
- Consistency and sufficiency evaluation
- Evidence text recording

### 🤖 AI Model Evaluation
- Multi-model results comparison
- Model ranking functionality
- Accuracy evaluation
- Subjective comment collection

### 📊 Progress Tracking
- Real-time progress display (X/5 traits)
- Trait completion status indicator
- Auto-save and restore

## Database Structure

For detailed database structure documentation, see [database/README.md](./database/README.md).

Main tables include:
- `physicians` - Physician information table
- `reviews` - Patient reviews table  
- `tasks` - Annotation tasks table
- `human_annotations` - Human annotation results table
- `model_annotations` - AI model annotations table
- `machine_annotation_evaluations` - Model evaluation table

## Deployment Guide

### Development Environment
Refer to the "Quick Start" section above.

### Production Environment

#### Backend Deployment
```bash
# Build
go build -o phyreview-api main.go

# Run
./phyreview-api
```

#### Frontend Deployment
```bash
# Build
npm run build

# Deploy to static file server
cp -r build/* /var/www/html/
```

#### Docker Deployment
The project supports Docker containerization. Please refer to README files in subdirectories for specific configurations.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards
- Backend follows Go language standards
- Frontend uses TypeScript strict mode
- Use Ant Design components for UI consistency
- Add proper error handling and logging

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v1.2.0 (Latest)
- ✅ Added HTML content rendering functionality
- ✅ Automatic education background parsing and formatting
- ✅ Improved user interface and experience
- ✅ Enhanced API documentation and error handling

### v1.1.0
- ✅ Implemented complete personality trait annotation workflow
- ✅ Added machine learning model evaluation features
- ✅ Optimized database structure

### v1.0.0
- ✅ Basic system framework
- ✅ User login and physician information display
- ✅ Patient review browsing

## Contact

For questions or suggestions, please contact:

- 📧 Email: [xutelly@gmail.com](mailto:xutelly@gmail.com)
- 🐛 Issues: [GitHub Issues](https://github.com/TellyXu/phyreview_annotator/issues)
- 📚 Wiki: [Project Documentation](https://github.com/TellyXu/phyreview_annotator/wiki)

---

⭐ If this project helps you, please give us a star! 