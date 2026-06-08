from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from telegraph.views import robots_txt


urlpatterns = [
    path('xyz/', admin.site.urls),
    path('', include('posts.urls')),
    path('', include('pdf_generator.urls')),
    path("robots.txt", robots_txt)
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
