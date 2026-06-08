from django.conf import settings
from django.http import HttpRequest, HttpResponse
from typing import Callable

from i18n.sync.translator import Translator


class LocaleMiddleware:
    """Middleware to determine the user's locale and provide a translator."""
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        locale = self.get_locale(request)
        translator = Translator(
            locale=locale,
            path=str(settings.LOCALE_PATH),
            fallbacks=getattr(settings, 'LOCALE_FALLBACKS', ['en']),
            auto_reload=settings.DEBUG,
        )
        request.translator = translator
        request.locale = locale
        response = self.get_response(request)
        if not request.COOKIES.get(settings.LOCALE_COOKIE_NAME):
            response.set_cookie(settings.LOCALE_COOKIE_NAME, locale, max_age=365*24*3600)
        return response

    def get_locale(self, request: HttpRequest) -> str:
        cookie_lang = request.COOKIES.get(settings.LOCALE_COOKIE_NAME)
        if cookie_lang and cookie_lang in settings.LOCALE_AVAILABLE:
            return cookie_lang

        accept = request.META.get('HTTP_ACCEPT_LANGUAGE', '')
        for lang in accept.split(','):
            lang_code = lang.split(';')[0].strip().lower()
            if lang_code in settings.LOCALE_AVAILABLE:
                return lang_code
            short = lang_code.split('-')[0]
            if short in settings.LOCALE_AVAILABLE:
                return short

        return settings.LOCALE_DEFAULT
