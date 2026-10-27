import markdown, nh3, ipaddress, re
from typing import Optional
from urllib.parse import urlsplit
from django.conf import settings
from django.core.cache import cache
from django.http import HttpRequest, HttpResponse

from posts.constants import CONSTANTS
from posts.models import Author


def strip_breaks_in_pre(html: str) -> str:
    return re.sub(
        r"(?is)(<pre[^>]*>)(.*?)(</pre>)",
        lambda m: m.group(1) + re.sub(r"<br\s*/?>", "", m.group(2)) + m.group(3),
        html,
    )

def safe_markdown(content: str) -> str:
    content = content.replace("\r\n", "\n").replace("\r", "\n")
    raw_html = markdown.markdown(
        content,
        extensions=CONSTANTS.MARKDOWN_EXTENSIONS,
    )
    raw_html = strip_breaks_in_pre(raw_html)

    allowed_tags: set[str] = {
        "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
        "strong", "em", "del", "s", "i", "b", "u",
        "sup", "sub", "mark", "kbd", "abbr", "cite", "q",
        "a", "img",
        "ul", "ol", "li", "dl", "dt", "dd",
        "blockquote", "pre", "code",
        "table", "thead", "tbody", "tr", "th", "td",
        "span", "div", "figure", "figcaption", "details", "summary",
        "iframe", "video", "source",
    }

    allowed_attributes: dict[str, set[str]] = {
        "a": {"href", "title", "target"},
        "img": {"src", "alt", "title", "width", "height", "loading", "class"},
        "iframe": {
            "src", "title", "width", "height",
            "frameborder", "allowfullscreen", "allow",
            "referrerpolicy", "loading", "class",
        },
        "video": {
            "src", "width", "height",
            "controls", "autoplay", "loop", "muted",
            "poster", "preload", "playsinline", "class",
        },
        "source": {"src", "type"},
        "td": {"align", "valign", "colspan", "rowspan"},
        "th": {"align", "valign", "colspan", "rowspan", "scope"},
        "code": {"class"},
        "span": {"class"},
        "div": {"class"},
        "pre": {"class"},
        "p": {"class"},
        "figure": {"class"},
        "figcaption": {"class"},
        "ol": {"start", "class"},
        "ul": {"class"},
        "li": {"class"},
        "table": {"class"},
        "thead": {"class"},
        "tbody": {"class"},
        "tr": {"class"},
        "blockquote": {"class"},
        "h1": {"class"},
        "h2": {"class"},
        "h3": {"class"},
        "h4": {"class"},
        "h5": {"class"},
        "h6": {"class"},
    }

    return nh3.clean(raw_html, tags=allowed_tags,
                     attributes=allowed_attributes, url_schemes={"http", "https", "mailto"},
                     link_rel="noopener noreferrer")

def get_or_create_author_from_cookie(request: HttpRequest) -> tuple[Author, bool]:
    token = request.COOKIES.get(CONSTANTS.AUTHOR_COOKIE_NAME)
    client_ip = get_client_ip(request)
    if token:
        try:
            return (Author.objects.get(token=token), False)
        except Author.DoesNotExist:
            pass

    author = Author.objects.create(ip_address=client_ip)

    return author, True

def set_author_cookie(response: HttpResponse, author: Author) -> None:
    max_age: int = CONSTANTS.COOKIE_MAX_AGE_DAYS * 24 * 60 * 60

    response.set_cookie(CONSTANTS.AUTHOR_COOKIE_NAME, author.token, max_age=max_age,
        httponly=CONSTANTS.COOKIE_HTTP_ONLY, secure=CONSTANTS.COOKIE_SECURE,
        samesite=CONSTANTS.COOKIE_SAMESITE)

def get_author_from_cookie(request: HttpRequest) -> Optional[Author]:
    token = request.COOKIES.get(CONSTANTS.AUTHOR_COOKIE_NAME)
    if token:
        try:
            return Author.objects.get(token=token)
        except Author.DoesNotExist:
            pass

    return None

def set_locale_cookie(response: HttpResponse, locale: str) -> None:
    response.set_cookie(settings.LOCALE_COOKIE_NAME, locale, max_age=365 * 24 * 3600,
        httponly=True, secure=not settings.DEBUG, samesite="Lax")

def rate_limit_exceeded(key: str, limit: int, window: int) -> bool:
    try:
        count = cache.incr(key)
    except ValueError:
        try:
            cache.add(key, 1, timeout=window)
        except Exception:
            return False
        return False
    except Exception:
        return False
    return count > limit

def safe_redirect_path(request: HttpRequest) -> str:
    referer = request.META.get("HTTP_REFERER", "")
    if not referer:
        return "/"
    try:
        parsed = urlsplit(referer)
    except ValueError:
        return "/"

    path = parsed.path
    if not path.startswith("/") or path.startswith(("//", "/\\")):
        return "/"

    netloc = parsed.netloc
    if netloc:
        host = netloc.rpartition("@")[2].rsplit(":", 1)[0].strip("[]").lower()
        request_host = request.get_host().rsplit(":", 1)[0].lower()
        allowed_hosts = {
            value.split(":")[0].lower()
            for value in settings.ALLOWED_HOSTS
            if value and value != "*"
        }
        if host != request_host and host not in allowed_hosts:
            return "/"

    if parsed.query:
        return f"{path}?{parsed.query}"
    return path

def normalize_ip(raw: Optional[str]) -> str:
    if not raw:
        return ""
    candidate = raw.strip().split(",")[0].strip()
    try:
        return ipaddress.ip_address(candidate).compressed
    except Exception:
        return candidate

def get_client_ip(request: HttpRequest) -> str:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    remote = request.META.get("REMOTE_ADDR")

    if xff:
        return normalize_ip(xff)

    if remote:
        return normalize_ip(remote)

    return normalize_ip(remote) if remote else ""
