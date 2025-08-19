# Form Builder - MERN Stack Application

A complete form builder application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring drag-and-drop form creation, analytics, and file uploads.

## Features

### Frontend
- **Dashboard**: Overview of forms and submissions with statistics
- **Form Management**: Create, edit, delete, and duplicate forms
- **Form Builder**: Drag-and-drop interface for building forms with various field types
- **Field Types**: Text, email, select, checkbox, radio, textarea, file upload
- **Form Settings**: Customizable themes, thank you messages, submission limits
- **Analytics**: Detailed insights with charts and export functionality
- **Preview Mode**: Test forms before publishing
- **Responsive Design**: Mobile-friendly interface

### Backend
- **RESTful API**: Complete CRUD operations for forms and submissions
- **File Upload**: Support for multiple file types with size limits
- **Validation**: Server-side form validation and error handling
- **Analytics**: Comprehensive submission statistics and reporting
- **Rate Limiting**: Protection against spam submissions
- **CORS Support**: Cross-origin form submissions enabled

### Field Types Supported
- Text Input
- Email Input
- Dropdown Select
- Checkbox
- Radio Buttons
- Text Area
- File Upload (images, documents, text files)

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, React Hook Form
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **File Upload**: Multer with file type validation
- **Charts**: Recharts for data visualization
- **Drag & Drop**: React Beautiful DnD
- **HTTP Client**: Axios

## Prerequisites

### For Development
- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn

### For Production (Docker)
- Docker 20.10+
- Docker Compose 2.0+

## Quick Start

### With Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd form-builder
   ```

2. Copy the example environment file and update the values if needed:
   ```bash
   cp .env.example .env
   ```

3. Start the application in production mode:
   ```bash
   ./start.sh prod
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: mongodb://localhost:27017/form-builder

### Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd form-builder
   ```

2. Install dependencies for both frontend and backend:
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   cd ..
   ```

3. Set up environment variables:
   ```bash
   # Copy example environment files
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

4. Start the development servers:
   ```bash
   # Start both frontend and backend in development mode
   npm run dev
   ```

## Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the environment variables in `.env` as needed.

### Available Commands

- Start in production mode:
  ```bash
  ./start.sh prod
  ```

- Start in development mode:
  ```bash
  ./start.sh dev
  ```

- Stop all services:
  ```bash
  ./start.sh stop
  ```

- View logs:
  ```bash
  docker-compose logs -f
  ```

### Environment Variables

Key environment variables you might want to configure:

```
# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your-strong-password
MONGO_INITDB_DATABASE=form-builder

# Backend Configuration
BACKEND_PORT=5000
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
MAX_FILE_SIZE=5242880  # 5MB

# Frontend Configuration
FRONTEND_PORT=3000
REACT_APP_API_URL=/api

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000
```

## Manual Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd form-builder-mern
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   # Backend
   cd backend
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   - Ensure MongoDB is running
   - Update `MONGODB_URI` in backend `.env` file

5. **Start the application**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev
   
   # Or start separately
   npm run server    # Backend only
   npm run client    # Frontend only
   ```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/form-builder
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
FILE_UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

## API Endpoints

### Forms
- `GET /api/forms` - Get all forms
- `GET /api/forms/:id` - Get form by ID
- `GET /api/forms/:id/public` - Get public form for submissions
- `POST /api/forms` - Create new form
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `POST /api/forms/:id/duplicate` - Duplicate form
- `PATCH /api/forms/:id/publish` - Publish/unpublish form

### Submissions
- `POST /api/submissions` - Submit form
- `GET /api/submissions/form/:formId` - Get form submissions
- `GET /api/submissions/:id` - Get submission by ID
- `PATCH /api/submissions/:id/status` - Update submission status
- `DELETE /api/submissions/:id` - Delete submission
- `GET /api/submissions/form/:formId/export` - Export submissions to CSV

### File Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `DELETE /api/upload/:filename` - Delete uploaded file

### Analytics
- `GET /api/analytics/form/:formId` - Get form analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/form/:formId/field/:fieldId` - Get field-specific analytics

## Usage

### Creating a Form
1. Navigate to "Create Form" in the sidebar
2. Add fields by clicking on field types in the left sidebar
3. Configure field properties in the right sidebar
4. Set form settings (title, description, theme, etc.)
5. Save and publish your form

### Managing Forms
- View all forms in the "Forms" section
- Edit existing forms
- Duplicate forms for quick creation
- Delete unwanted forms
- View submission analytics

### Form Submissions
- Public forms are accessible at `/form/:id`
- Submissions are stored with metadata
- Export submissions to CSV
- View detailed analytics and charts

## File Upload Support

The application supports various file types:
- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, TXT, CSV
- **Size Limit**: 5MB per file
- **Multiple Files**: Up to 5 files per field

## Analytics Features

- **Submission Trends**: Daily submission counts
- **Field Response Rates**: How often each field gets answered
- **Option Distribution**: For select/radio fields
- **Export Functionality**: CSV export of submissions
- **Real-time Updates**: Live statistics

## Development

### Project Structure
```
├── backend/                 # Node.js/Express backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── uploads/            # File upload directory
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── package.json            # Root package.json
└── README.md              # This file
```

### Available Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start backend only
- `npm run client` - Start frontend only
- `npm run build` - Build frontend for production
- `npm run install-all` - Install all dependencies

## Deployment

### Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment
1. Build the frontend: `npm run build`
2. Set production environment variables
3. Start the backend server
4. Serve frontend build files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository. # form-task
