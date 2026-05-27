from django.contrib import admin
from posts.models import Author, Post


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ('id', 'token', 'created_at')
    search_fields = ('token',)

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'author', 'created_at', 'updated_at')
    prepopulated_fields = {'slug': ('title',)}
