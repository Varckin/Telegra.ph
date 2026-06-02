class TranslationError(Exception):
    """Base exception for translation errors."""
    pass

class KeyNotFoundError(TranslationError):
    def __init__(self, key: str, locale: str = None):
        msg = f"Translation key not found: {key}"
        if locale:
            msg += f" (locale: {locale})"
        super().__init__(msg)

class LocaleNotFoundError(TranslationError):
    def __init__(self, locale: str):
        super().__init__(f"Locale not found: {locale}")
