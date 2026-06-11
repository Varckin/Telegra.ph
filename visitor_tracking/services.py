import re
from typing import Tuple
from pathlib import Path
from geoip2.database import Reader
from django.db.models import F
from django.utils import timezone
from django.http import HttpRequest
from django.conf import settings

from visitor_tracking.constants import CONSTANTS
from visitor_tracking.models import Visitor
from posts.services import get_client_ip


class VisitorService:
    """A service for tracking visitors and determining geolocation (country + city)."""
    def __init__(self) -> None:
        self.constants = CONSTANTS
        self._geoip_reader = None

    def _get_geoip_db_path(self) -> Path:
        """Construct the absolute path to the GeoIP database."""
        return Path(settings.BASE_DIR) / self.constants.GEOIP_DB_PATH

    def _get_geoip_reader(self) -> Reader | None:
        """Lazy initialization of GeoIP2 City reader."""
        if self._geoip_reader is None and self.constants.ENABLE_GEOIP:
            try:
                self._geoip_reader = Reader(self._get_geoip_db_path())
            except Exception:
                self.constants.ENABLE_GEOIP = False
        return self._geoip_reader

    def get_geo_info(self, ip: str) -> Tuple[str, str]:
        """
        Determine the country code and city name by IP.
        Returns (country_code, city_name).
        If GeoIP is disabled or the error is ('', '').
        """
        if not self.constants.ENABLE_GEOIP or not ip:
            return '', ''

        reader = self._get_geoip_reader()
        if reader is None:
            return '', ''

        try:
            response = reader.city(ip)
            country = response.country.iso_code or ''
            city = response.city.name or ''
            return country, city
        except Exception:
            return '', ''

    def record_visit(self, ip: str) -> None:
        """
        Atomically update statistics for IP.
        Geolocation is determined only when the record is created for the first time.,
        unless the constants specify to update on each session.
        """
        if not ip:
            return

        now = timezone.now()
        try:
            visitor = Visitor.objects.get(ip=ip)
            visitor.visits = F('visits') + 1
            visitor.last_seen = now
            visitor.save(update_fields=['visits', 'last_seen'])

            if self.constants.UPDATE_GEOIP_ON_EACH_VISIT:
                country, city = self.get_geo_info(ip)
                if country or city:
                    Visitor.objects.filter(ip=ip).update(
                        country_code=country,
                        city=city
                    )
        except Visitor.DoesNotExist:
            country, city = self.get_geo_info(ip)
            Visitor.objects.create(
                ip=ip,
                country_code=country or '',
                city=city or '',
                visits=1,
                first_seen=now,
                last_seen=now
            )

    def should_track(self, path: str) -> bool:
        """Checks whether the request needs to be tracked along its path."""
        for pattern in self.constants.EXCLUDE_PATHS:
            if re.search(pattern, path):
                return False
        return True

    def track_request(self, request: HttpRequest) -> None:
        """Main method for middleware: extracts IP and records the visit."""
        path = request.path_info
        if not self.should_track(path):
            return

        ip = get_client_ip(request)
        if ip:
            self.record_visit(ip)

VISITOR_SERVICE = VisitorService()
