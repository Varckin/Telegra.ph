from i18n.common.cache import TranslationCache
from i18n.sync.loader import LocaleLoader


class LocaleManager:
    def __init__(self, base_path: str, auto_reload: bool = False):
        self.loader = LocaleLoader(base_path)
        self.cache = TranslationCache()
        self.auto_reload = auto_reload

    def get(self, locale: str) -> dict:
        if not self.auto_reload:
            cached = self.cache.get(locale)
            if cached is not None:
                return cached
        else:
            data, mtimes = self.loader.load_locale(locale)
            if self.cache.is_fresh(locale, mtimes):
                return self.cache.get(locale)
            self.cache.set(locale, data, mtimes)
            return data

        data, mtimes = self.loader.load_locale(locale)
        self.cache.set(locale, data, mtimes)
        return data

    def reload(self, locale: str = None):
        if locale:
            self.cache.clear(locale)
        else:
            self.cache.clear()

    def available_locales(self) -> list[str]:
        return self.loader.available_locales()
