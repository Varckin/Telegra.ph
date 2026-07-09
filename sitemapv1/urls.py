from django.urls import path
from sitemapv1.views import sitemap_view


urlpatterns = [
    path('', sitemap_view, name='sitemap')
]
