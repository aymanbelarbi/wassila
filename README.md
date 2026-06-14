# Wassila

a modern AI-powered code analysis platform that helps teams detect bugs, security flaws, and technical debt in real-time.

---

## Setup

### Step 1 - Clone Project

```bash
git clone https://github.com/aymanbelarbi/wassila.git
cd wassila
code .
```


---

### Step 2 - Install Docker

Windows/Mac:

- Download from: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- Run the installer
- Restart your computer

Linux:

- Ubuntu/Debian:

```bash
sudo apt install docker.io docker-compose-plugin
```

- Fedora:

```bash
sudo dnf install docker docker-compose-plugin
```

- Arch:

```bash
sudo pacman -S docker docker-compose-plugin
```

Check if installed:

```bash
docker --version
docker compose rsion
```

---

### Step 3 - Get Free API Key

1. Go to: [https://aistudio.google.com](https://aistudio.google.com)
2. Click "Get API Key"
3. Create API Key
4. Copy your API key
5. Keep it safe - you will need it in Step 5

---

### Step 4 - Create Configuration Files

Windows (Command Prompt):

```bash
copy frontend\.env.local.example frontend\.env.local
copy backend\.env.example backend\.env
```

Windows (PowerShell):

```powershell
Copy-Item frontend\.env.local.example frontend\.env.local
Copy-Item backend\.env.example backend\.env
```

Mac/Linux (Terminal):

```bash
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env
```

---

### Step 5 - Add Your API Key

Open file: frontend/.env.local

Find this line:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

Replace your_api_key_here with your actual API key from Step 3.

Save the file.

---

### Step 6 - Start Everything

Open Terminal/Command Prompt in project folder and run:

```bash
docker compose up --build
```

Wait until it finishes, then open your browser and go to:
[http://localhost:3000](http://localhost:3000)

---

## Common Commands

Check if everything is running:

```bash
docker compose ps
```

Stop the project:

```bash
docker compose down
```

View logs:

```bash
docker compose logs -f
```

Reset everything (delete database):

```bash
docker compose down -v
docker compose up --build
```

View specific service logs:

```bash
docker compose logs backend    # Backend logs
docker compose logs mysql      # Database logs
docker compose logs frontend   # Frontend logs
```

Linux users: Add sudo before each command:

```bash
sudo docker compose ps
```
