import secrets
from django.db import models
from django.urls import reverse


class Author(models.Model):
    token = models.CharField(max_length=48, unique=True, editable=False)
    ip_address = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs) -> None:
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Author {self.token}"

class Post(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    slug = models.SlugField(max_length=16, unique=True, blank=True)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name="posts")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = secrets.token_urlsafe(8)
        super().save(*args, **kwargs)

    def get_absolute_url(self) -> str:
        return reverse("post_detail", args=[self.slug])

    def __str__(self) -> str:
        return self.title
