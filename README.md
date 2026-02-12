# Wassila | AI-powered code reviewer and analyzer

## Step 1: Install Requirements

You need:
- Composer
- Node.js
- MySQL

---

## Step 2: Create Database

Open your MySQL terminal and run:

```sql
CREATE DATABASE wassila;
```

---

## Step 3: Setup Backend

```bash
cd backend
cp .env.example .env
composer install
```

Edit `backend/.env` file and set your database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=wassila
DB_USERNAME=root
DB_PASSWORD=your_password
```

Then run:

```bash
php artisan key:generate
php artisan migrate
php artisan serve
```

Backend is ready at: http://localhost:8000

---

## Step 4: Setup Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
```

Edit `frontend/.env.local` file:

```env
VITE_GEMINI_API_KEY=your_api_key_here
VITE_API_URL=http://localhost:8000/api
```

Get your free API key here: https://aistudio.google.com/

Then run:

```bash
npm run dev
```

Frontend is ready at: http://localhost:3000

---

## Step 5: Start Using

1. Open http://localhost:3000
2. Register a new account
3. Create a project
4. Add your code files
5. Click "Run Analysis"
6. Get AI-powered fixes!
