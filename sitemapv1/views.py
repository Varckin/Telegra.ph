from django.http import HttpRequest, HttpResponse
from sitemapv1.services import generate_sitemap_xml


def sitemap_view(request: HttpRequest) -> HttpResponse:
    xml: str = generate_sitemap_xml()
    return HttpResponse(xml, content_type='application/xml')
