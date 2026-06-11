from dataclasses import dataclass
from os import getenv


@dataclass(frozen=True)
class VisitorConstants:
    """Constants for the visitor tracking module."""
    EXCLUDE_PATHS: tuple = (
        r'^/xyz/',
        r'^/static/',
        r'^/favicon\.ico$',
        r'^/robots\.txt$',
    )
    GEOIP_DB_PATH: str = getenv('GEOIP_DB_PATH')
    ENABLE_GEOIP: bool = True
    UPDATE_GEOIP_ON_EACH_VISIT: bool = False

CONSTANTS = VisitorConstants()
