r"""
Core models for Ecobilda.
Reference data and shared models used across the application.
"""

from django.db import models


class Country(models.Model):
    """
    Country reference data.
    Based on: Data/Entities/CountryEntity.cs
    """
    code = models.CharField(max_length=2, primary_key=True, help_text="ISO 3166-1 alpha-2 code")
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = "Countries"
        ordering = ['name']

    def __str__(self):
        return self.name


class Language(models.Model):
    """
    Language reference data.
    Based on: Data/Entities/LanguageEntity.cs
    """
    code = models.CharField(max_length=2, primary_key=True, help_text="ISO 639-1 code")
    name = models.CharField(max_length=50)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Address(models.Model):
    """
    Address model with geolocation.
    Based on: Data/Entities/AddressEntity.cs

    Simplified from the original abstract AddressBase hierarchy.
    Used by both User (OneToOne) and Project (ForeignKey).
    """
    city = models.CharField(max_length=100)
    street = models.CharField(max_length=200, blank=True)
    street_number = models.CharField(max_length=20, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.ForeignKey(Country, on_delete=models.PROTECT)

    # Geolocation for map display
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    formatted_address = models.TextField(help_text="Full formatted address from geocoding API")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Addresses"
        indexes = [
            models.Index(fields=['latitude', 'longitude']),  # For geo queries
            models.Index(fields=['country']),
        ]

    def __str__(self):
        return f"{self.city}, {self.country.name}"
