from types import SimpleNamespace
from typing import Optional
from weasyprint import HTML, CSS
from django.conf import settings
from django.template.loader import render_to_string
from django.contrib.staticfiles import finders
from django.http import HttpRequest
from i18n.sync.translator import Translator
from posts.models import Post
from posts.services import safe_markdown
from pdf_generator.config import SITE_NAME, CSS_PDF_PATH


_css_cache: Optional[str] = None

_PDF_GLYPH_MAP: dict[int, Optional[int]] = {
    0x2705: 0x2714,
    0x274C: 0x2716,
    0x274E: 0x2718,
    0x2B50: 0x2605,
    0x2764: 0x2665,
    0xFE0F: None,
}

def pdf_safe_text(html: str) -> str:
    return html.translate(_PDF_GLYPH_MAP)

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

def _get_render_request(request: Optional[HttpRequest]):
    if request is not None and getattr(request, "translator", None) is not None:
        return request
    translator = Translator(
        locale=settings.LOCALE_DEFAULT,
        path=str(settings.LOCALE_PATH),
        fallbacks=getattr(settings, "LOCALE_FALLBACKS", ["en"]),
        auto_reload=False,
    )
    return SimpleNamespace(translator=translator, locale=settings.LOCALE_DEFAULT)

def post_to_pdf(post: Post, request: Optional[HttpRequest] = None) -> bytes:
    """
    Generate PDF bytes for the given Post object.
    If a request is provided, it will be used to build absolute URLs for static files.
    """
    content_html: str = safe_markdown(post.content)

    html_string: str = render_to_string('pdf/pdf.html', {
        'post': post,
        'content_html': pdf_safe_text(content_html),
        'title': pdf_safe_text(post.title),
        'site_name': SITE_NAME,
        'request': _get_render_request(request),
    })

    base_url: Optional[str] = request.build_absolute_uri('/') if request else None

    html = HTML(string=html_string, base_url=base_url)
    css_base_url: str = (settings.BASE_DIR / 'static' / 'css').as_uri() + '/'
    pdf_bytes: bytes = html.write_pdf(
        stylesheets=[CSS(string=_get_css_string(), base_url=css_base_url)])

    return pdf_bytes
