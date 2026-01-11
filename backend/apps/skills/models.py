r"""
Skills models for Ecobilda.
Based on: Data/Entities/Enums.cs (PermacultureSkill and NaturalBuildingSkill enums)

Preserves the 16 skills from the original system:
- 8 Permaculture skills
- 8 Natural Building skills
"""

from django.db import models


class SkillCategory(models.TextChoices):
    """Skill categories"""
    PERMACULTURE = 'PERM', 'Permaculture'
    NATURAL_BUILDING = 'NATB', 'Natural Building'


class Skill(models.Model):
    """
    Skills that users can have and projects can require.

    Based on original enums:
    - PermacultureSkill (lines 19-31 in Enums.cs)
    - NaturalBuildingSkill (lines 33-48 in Enums.cs)
    """

    # Unique code for the skill (e.g., 'garden_maintenance', 'carpentry')
    code = models.CharField(max_length=50, unique=True, primary_key=True)

    # Category (Permaculture or Natural Building)
    category = models.CharField(max_length=4, choices=SkillCategory.choices)

    # Display names (translatable via django-modeltranslation)
    display_name_en = models.CharField(max_length=100)
    display_name_fr = models.CharField(max_length=100, blank=True)
    display_name_es = models.CharField(max_length=100, blank=True)
    display_name_de = models.CharField(max_length=100, blank=True)

    # Icon (optional, for UI)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon class or emoji")

    # Relationship with Users
    users = models.ManyToManyField(
        'users.User',
        blank=True,
        related_name='skills',
        help_text="Users who have this skill"
    )

    class Meta:
        ordering = ['category', 'display_name_en']

    def __str__(self):
        return f"{self.get_category_display()}: {self.display_name_en}"

    def get_display_name(self, language='en'):
        """Get display name in specified language"""
        return getattr(self, f'display_name_{language}', self.display_name_en)
