from typing import Optional
from weasyprint import HTML, CSS
from django.template.loader import render_to_string
from django.contrib.staticfiles import finders
from django.http import HttpRequest
from posts.models import Post
from posts.services import safe_markdown
from pdf_generator.config import POSTS_LOGO_PATH, SITE_NAME, CSS_PDF_PATH


_css_cache: Optional[str] = None

def _get_css_string() -> str:
    """Load CSS content from file with caching."""
    global _css_cache
    if _css_cache is not None:
        return _css_cache

    css_path = finders.find(CSS_PDF_PATH)
    if css_path:
        path_str = str(css_path)
        with open(path_str, 'r', encoding='utf-8') as f:
            _css_cache = f.read()
    else:
        _css_cache = ""
    return _css_cache

def post_to_pdf(post: Post, request: Optional[HttpRequest] = None) -> bytes:
    """
    Generate PDF bytes for the given Post object.
    If a request is provided, it will be used to build absolute URLs for static files.
    """
    content_html: str = safe_markdown(post.content)
    logo_url: Optional[str] = None

    if request:
        from django.templatetags.static import static
        logo_relative: str = POSTS_LOGO_PATH
        logo_url = request.build_absolute_uri(static(logo_relative))
    else:
        logo_path = finders.find(POSTS_LOGO_PATH)
        if logo_path:
            logo_url = str(logo_path)

    html_string: str = render_to_string('pdf/pdf.html', {
        'post': post,
        'content_html': content_html,
        'logo_url': logo_url,
        'title': post.title,
        'created_at': post.created_at,
        'updated_at': post.updated_at,
        'site_name': SITE_NAME,
    })

    css_path: str = _get_css_string()
    base_url: Optional[str] = request.build_absolute_uri('/') if request else None

    html = HTML(string=html_string, base_url=base_url)
    pdf_bytes: bytes = html.write_pdf(stylesheets=[CSS(string=css_path)])

    return pdf_bytes
