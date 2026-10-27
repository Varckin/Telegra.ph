from dataclasses import dataclass


@dataclass(frozen=True)
class PostConstants:
    AUTHOR_COOKIE_NAME: str = "author_token"
    COOKIE_MAX_AGE_DAYS: int = 365
    COOKIE_HTTP_ONLY: bool = True
    COOKIE_SECURE: bool = True
    COOKIE_SAMESITE: str = "Lax"
    MARKDOWN_EXTENSIONS: tuple = (
        "extra",
        "codehilite",
        "nl2br"
    )
    MAX_LEN_TITLE: int = 255
    MAX_LEN_CONTENT: int = 600000
    RATE_LIMIT_WINDOW_SECONDS: int = 600
    RATE_LIMIT_CREATE_MAX: int = 10
    RATE_LIMIT_EDIT_MAX: int = 30

CONSTANTS = PostConstants()
