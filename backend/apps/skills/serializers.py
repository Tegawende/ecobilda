"""
Skills serializers for Ecobilda API.
"""

from rest_framework import serializers
from .models import Skill


class SkillSerializer(serializers.ModelSerializer):
    """
    Skill serializer.
    Returns skill with translated display name based on request language.
    """

    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Skill
        fields = [
            'code', 'category', 'display_name',
            'display_name_en', 'display_name_fr',
            'display_name_es', 'display_name_de', 'icon'
        ]

    def get_display_name(self, obj):
        """
        Get display name in current language.
        Defaults to English if language not found.
        """
        request = self.context.get('request')
        if request:
            # Get language from Accept-Language header or query param
            lang = request.query_params.get('lang')
            if not lang and hasattr(request, 'LANGUAGE_CODE'):
                lang = request.LANGUAGE_CODE

            if lang:
                # Map language codes
                lang_map = {
                    'en': 'en', 'en-us': 'en', 'en-gb': 'en',
                    'fr': 'fr', 'fr-fr': 'fr', 'fr-ca': 'fr',
                    'es': 'es', 'es-es': 'es', 'es-mx': 'es',
                    'de': 'de', 'de-de': 'de', 'de-at': 'de',
                }
                lang_code = lang_map.get(lang.lower(), 'en')
                return obj.get_display_name(lang_code)

        return obj.display_name_en


class SkillSimpleSerializer(serializers.ModelSerializer):
    """
    Simple skill serializer.
    Only returns code and icon (for compact display).
    """

    class Meta:
        model = Skill
        fields = ['code', 'icon']
