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

CONSTANTS = PostConstants()
