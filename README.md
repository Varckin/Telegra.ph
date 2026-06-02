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

### Internationalization (i18n)
The platform includes a full-featured localization system built on a custom i18n library. It supports:
* JSON‑based translations (easy to edit)
* Automatic language detection from Accept-Language header or cookie
* User‑selectable language via a dropdown in the footer
* Pluralization rules for multiple languages (English, Russian, German, French, etc.)
* Live reload of translation files in debug mode
* Template tags {% translate %} and {% pluralize %}
* JavaScript translations via a global window.i18n object

#### Supported languages

| Language | Code |
|----------|------|
| English  | `en` |
| Russian  | `ru` |
| Spanish  | `es` |
| German   | `de` |
| French   | `fr` |
| Chinese  | `zh` |
| Polish   | `pl` |

You can easily add more by creating a new folder under locales/ and adding the corresponding JSON file.

#### Using translations in templates

```
{% load locale_tags %}

<h1>{% translate "post.title" %}</h1>
<p>{% translate "post.content" %}</p>
<button>{% translate "post.publish" %}</button>

{# Pluralization #}
<p>{% pluralize "post.comments" count %}</p>
```

#### Using translations in JavaScript

A global object window.i18n is injected in base.html. You can use it inside your JS files:

```js
window.showNotification(window.i18n.post_created, 'success');
```

#### Translation files structure

```
locales/
├── en/default.json
├── ru/default.json
├── es/default.json
├── de/default.json
├── fr/default.json
├── zh/default.json
└── pl/default.json
```

Each file follows the same key hierarchy (e.g., `post.title`, `footer.creator`, `js.draft_restored`).

#### How language selection works

1. The `LocaleMiddleware` checks for a cookie named `locale`.
2. If no cookie, it falls back to the `Accept-Language` header.
3. The default language is `en`.
4. The footer contains a form that posts to `/set_language/`, updating the cookie and redirecting back.


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