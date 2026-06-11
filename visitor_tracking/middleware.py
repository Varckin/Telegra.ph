from django.utils.deprecation import MiddlewareMixin
from visitor_tracking.services import VISITOR_SERVICE


class VisitorTrackingMiddleware(MiddlewareMixin):
    """Middleware for automatic visitor tracking."""

    def process_request(self, request):
        VISITOR_SERVICE.track_request(request)
