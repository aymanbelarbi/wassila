# Wassila | Code Quality Analysis Platform

> A modern, full-stack platform for analyzing JavaScript, PHP, and Python code quality with AI-powered suggestions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Wassila is an open-source code quality analysis platform that helps developers identify security vulnerabilities, code smells, and best practice violations in their JavaScript, PHP, and Python projects. With AI-powered suggestions and real-time feedback, Wassila makes it easy to maintain high code quality standards.

## Features

- **Multi-Language Support** - Analyze JavaScript, PHP, and Python with intelligent language detection
- **Real-Time Analysis** - Get instant feedback with 3-second scan turnaround
- **AI-Powered Fixes** - Gemini AI integration for automated code improvements
- **Security Scanning** - Detect hardcoded secrets, SQL injection, XSS vulnerabilities
- **Interactive Dashboard** - Visualize code quality metrics and track improvements
- **Project Management** - Organize code with full CRUD operations
- **Scan History** - Track code quality improvements over time

## Quick Start

### Prerequisites

- Node.js 18+
- PHP 8.2+
- MySQL 8.0+
- Composer
- Gemini API Key ([Get one here](https://aistudio.google.com/))

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/aymanbelarbi/wassila.git
cd wassila
```

**2. Backend Setup**

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Edit `.env` and configure your database:
```env
DB_DATABASE=wassila
DB_USERNAME=root
DB_PASSWORD=your_password
```

Run migrations and start the server:
```bash
php artisan migrate
php artisan serve
```

**3. Frontend Setup**

```bash
cd ../frontend
npm install
cp .env.local.example .env.local
```

Edit `.env.local` and add your API key:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_URL=http://localhost:8000/api
```

Start the development server:
```bash
npm run dev
```

**4. Access the Application**

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

## Usage

1. Register an account
2. Create a project
3. Add code files (.js, .php, .py)
4. Click "Run Scan" to analyze your code
5. Review detected issues and AI suggestions
6. Track improvements in the Dashboard

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Recharts  
**Backend:** Laravel 11, MySQL, Sanctum Auth  
**AI:** Google Gemini API

## Code Analysis

### Security Checks
- Hardcoded secrets (API keys, passwords)
- SQL injection vulnerabilities
- XSS risks
- Unsafe eval() usage

### Code Quality
- Naming conventions
- Line length limits
- Cyclomatic complexity
- Dead code detection

### Best Practices
- Console.log removal (JavaScript)
- Print statement removal (Python)
- Empty catch blocks
- Strict equality checks

## API Reference

### Authentication
```
POST   /api/register
POST   /api/login
POST   /api/logout
GET    /api/me
PUT    /api/profile
DELETE /api/profile
```

### Projects
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/{id}
PUT    /api/projects/{id}
DELETE /api/projects/{id}
```

### Files
```
GET    /api/projects/{id}/files
POST   /api/projects/{id}/files
GET    /api/files/{id}
PUT    /api/files/{id}
DELETE /api/files/{id}
```

### Scans
```
GET    /api/scans?project_id={id}&file_id={id}
POST   /api/scans
GET    /api/scans/{id}
DELETE /api/scans/{id}
```

## Development

### Running Tests

```bash
cd backend && php artisan test
cd frontend && npm run test
```

### Building for Production

```bash
cd frontend && npm run build
```

## Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## Roadmap

- [ ] Support for more languages (Java, C#, Go)
- [ ] Custom rule configuration
- [ ] Team collaboration features
- [ ] CI/CD integration
- [ ] VS Code extension
- [ ] Self-hosted deployment guides

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Laravel](https://laravel.com/) and [React](https://react.dev/)
- Powered by [Google Gemini AI](https://ai.google.dev/)
- Icons by [Lucide](https://lucide.dev/)

## Support

- **Issues:** [GitHub Issues](https://github.com/aymanbelarbi/wassila/issues)
- **Discussions:** [GitHub Discussions](https://github.com/aymanbelarbi/wassila/discussions)
- **Email:** [your-email@example.com](mailto:your-email@example.com)

## Authors

- **Ayman Belarbi** - [GitHub](https://github.com/aymanbelarbi)
