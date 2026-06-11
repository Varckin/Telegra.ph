from django.contrib import admin
from visitor_tracking.models import Visitor


@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = ('ip', 'country_code', 'city', 'visits', 'first_seen', 'last_seen')
    list_filter = ('country_code', 'city')
    search_fields = ('ip', 'city')
    readonly_fields = ('first_seen', 'last_seen')
