# Telegra.ph

A lightweight, Markdown‑based publishing platform inspired by https://telegra.ph Create and edit posts anonymously – each author is identified by a secure cookie.

### Features
- Markdown authoring with a safe HTML sanitizer (Markdown + NH3)
- Cookie‑based authentication – no registration required
- Edit your own posts (as long as the cookie is present)
- Slug‑based URLs using secure random tokens
- Docker ready – includes a docker‑compose.yml for production
- Secure defaults – HTTP‑only, Secure, SameSite=Lax cookies

### Tech Stack
- Backend: Django 6.0 + Python 3.14+
- Markdown: Python‑Markdown + NH3 (HTML sanitizer)
- Database: SQLite (can be swapped for PostgreSQL)
- Server: Uvicorn
- Container: Docker, Docker Compose

### Getting Started
1. Prerequisites  
   Python 3.12 or higher, pip and venv (or Docker, docker uses a faster and more reliable uv package manager)

2. Clone the repository  
   ```
   git clone https://github.com/varckin/telegra.ph.git  
   cd telegra.ph
   ```

3. Environment configuration  
   Create a .env file (example .env.example) in the project root (next to manage.py)

4. Run with Django development server  
   ```
   python -m venv venv
   source venv/bin/activate (On Windows: venv\Scripts\activate)
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser (optional)
   python manage.py runserver
   ```

   Then open http://127.0.0.1:8000

Running with Docker (Production)
```
docker compose up -d
```

Please send feature suggestions, as well as any bugs you find, by email maestro@varckin.xyz