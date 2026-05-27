import markdown, nh3, ipaddress
from typing import Optional
from django.http import HttpRequest, HttpResponse

from posts.constants import CONSTANTS
from posts.models import Author


def safe_markdown(content: str) -> str:
    content = content.replace("\r\n", "\n").replace("\r", "\n")
    raw_html = markdown.markdown(
        content,
        extensions=CONSTANTS.MARKDOWN_EXTENSIONS,
    )

    return nh3.clean(raw_html)

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
