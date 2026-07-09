from dataclasses import dataclass
from os import getenv


@dataclass(frozen=True)
class SitemapConfig:
    SITE_URL: str = getenv('CORS_ALLOWED_ORIGINS', 'https://example.com')

CONFIG = SitemapConfig()
