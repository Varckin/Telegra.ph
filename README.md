# Telegra.ph

A lightweight, Markdown‑based publishing platform inspired by [Telegra.ph](https://telegra.ph). Create and edit posts anonymously – each author is identified by a secure cookie.

## Features

- **Markdown authoring** with a safe HTML sanitizer (Python‑Markdown + NH3)
- **Cookie‑based authentication** – no registration required
- **Edit your own posts** (as long as the cookie is present)
- **Slug‑based URLs** using secure random tokens
- **Full‑featured internationalization (i18n)** with JSON translation files
- **PDF export** for each post (via WeasyPrint)
- **Visitor tracking** with geolocation (optional, uses GeoIP2)
- **Docker ready** – includes a `docker-compose.yml` for production
- **Secure defaults** – HTTP‑only, Secure, SameSite=Lax cookies

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Django 6.0 + Python 3.12+ |
| Markdown | Python‑Markdown + NH3 (HTML sanitizer) |
| Database | SQLite (easily swappable for PostgreSQL) |
| Server | Uvicorn (ASGI) |
| Container | Docker, Docker Compose |
| PDF generation | WeasyPrint |
| Geolocation | GeoIP2 |
| Internationalization | Custom i18n library (JSON‑based) |

## Internationalization (i18n)

The platform includes a full‑featured localization system built on a custom i18n library. It supports:

- JSON‑based translations (easy to edit)
- Automatic language detection from `Accept‑Language` header or cookie
- User‑selectable language via a dropdown in the footer
- Pluralization rules for multiple languages (English, Russian, German, French, etc.)
- Live reload of translation files in debug mode
- Template tags `{% translate %}` and `{% pluralize %}`
- JavaScript translations via a global `window.i18n` object

### Supported Languages

| Language | Code |
|----------|------|
| English  | `en` |
| Russian  | `ru` |
| Spanish  | `es` |
| German   | `de` |
| French   | `fr` |
| Chinese  | `zh` |
| Polish   | `pl` |

You can easily add more by creating a new folder under `locales/` and adding the corresponding JSON file.

### Using Translations in Templates

```django
{% load locale_tags %}

<h1>{% translate "post.title" %}</h1>
<p>{% translate "post.content" %}</p>
<button>{% translate "post.publish" %}</button>

{# Pluralization #}
<p>{% pluralize "post.comments" count %}</p>
```

### Using Translations in JavaScript

A global object `window.i18n` is injected in `base.html`. You can use it inside your JS files:

```js
window.showNotification(window.i18n.post_created, 'success');
```

### Translation Files Structure

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

### How Language Selection Works

1. The `LocaleMiddleware` checks for a cookie named `locale`.
2. If no cookie, it falls back to the `Accept‑Language` header.
3. The default language is `en`.
4. The footer contains a form that posts to `/set_language/`, updating the cookie and redirecting back.

## Getting Started

### Prerequisites

- Python 3.12 or higher
- `pip` and `venv` (or Docker – which uses the faster `uv` package manager)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/varckin/telegra.ph.git
   cd telegra.ph
   ```

2. **Create and activate a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**  
   Create a `.env` file in the project root (see `.env.example` for reference).

5. **Run migrations and collect static files**
   ```bash
   python manage.py migrate
   python manage.py collectstatic --noinput
   ```

6. **Start the development server**
   ```bash
   python manage.py runserver
   ```
   Then open http://127.0.0.1:8000

### Using Docker (Production)

```bash
docker compose up -d
```

The service will be available at http://localhost:8111 (or the port mapped in your `docker-compose.yml`).

## Contributing

Feature suggestions and bug reports are welcome.  
Please send them by email to: **maestro@varckin.xyz**

If you'd like to contribute code, feel free to open a pull request or issue on GitHub.

## License

This project is licensed under the **MIT License** – see the `LICENSE` file for details.

## Credits

- **Author**: Markus Varckin  
- **Idea**: Inspired by [Telegra.ph](https://telegra.ph) (Telegram's publishing platform)