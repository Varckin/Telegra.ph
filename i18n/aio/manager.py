from i18n.common.cache import TranslationCache
from i18n.aio.loader import AsyncLocaleLoader


class AsyncLocaleManager:
    def __init__(self, base_path: str, auto_reload: bool = False):
        self.loader = AsyncLocaleLoader(base_path)
        self.cache = TranslationCache()
        self.auto_reload = auto_reload

    async def get(self, locale: str) -> dict:
        if not self.auto_reload:
            cached = self.cache.get(locale)
            if cached is not None:
                return cached
        else:
            data, mtimes = await self.loader.load_locale(locale)
            if self.cache.is_fresh(locale, mtimes):
                return self.cache.get(locale)
            self.cache.set(locale, data, mtimes)
            return data

        data, mtimes = await self.loader.load_locale(locale)
        self.cache.set(locale, data, mtimes)
        return data

    async def reload(self, locale: str = None):
        if locale:
            self.cache.clear(locale)
        else:
            self.cache.clear()

    async def available_locales(self) -> list[str]:
        return await self.loader.available_locales()
