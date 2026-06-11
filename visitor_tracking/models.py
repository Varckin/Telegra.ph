from django.db import models


class Visitor(models.Model):
    ip = models.CharField(max_length=128, db_index=True, unique=True)
    country_code = models.CharField(max_length=2, blank=True, db_index=True)
    city = models.CharField(max_length=128, blank=True, db_index=True)
    visits = models.PositiveBigIntegerField(default=0)
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_seen']

    def __str__(self):
        city_part = f", {self.city}" if self.city else ""
        return f"{self.ip} ({self.visits} visits{city_part})"
