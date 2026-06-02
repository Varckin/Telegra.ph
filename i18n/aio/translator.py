from typing import List, Optional, Any
from i18n.aio.manager import AsyncLocaleManager
from i18n.common.plural import get_plural_form
from i18n.common.exceptions import KeyNotFoundError


class AsyncTranslator:
    def __init__(
        self,
        locale: str,
        path: str,
        fallbacks: Optional[List[str]] = None,
        auto_reload: bool = False,
    ):
        self.locale = locale
        self.fallbacks = fallbacks or ["en"]
        self.manager = AsyncLocaleManager(path, auto_reload=auto_reload)

    async def set_locale(self, locale: str):
        self.locale = locale

    def _get_nested(self, data: dict, path: str) -> Any:
        parts = path.split(".")
        current = data
        for part in parts:
            if not isinstance(current, dict):
                return None
            current = current.get(part)
            if current is None:
                return None
        return current

    async def _resolve(self, key: str, count: Optional[int] = None) -> Any:
        for loc in [self.locale] + self.fallbacks:
            data = await self.manager.get(loc)
            value = self._get_nested(data, key)
            if value is not None:
                if count is not None and isinstance(value, dict):
                    form = get_plural_form(loc, count)
                    return value.get(form, value.get("other", ""))
                return value
        raise KeyNotFoundError(key, self.locale)

    async def t(self, key: str, **kwargs) -> str:
        value = await self._resolve(key)
        if isinstance(value, str):
            return value.format(**kwargs)
        return str(value)

    async def plural(self, key: str, count: int, **kwargs) -> str:
        template = await self._resolve(key, count=count)
        if not template:
            raise KeyNotFoundError(f"No plural form for key '{key}'")
        return template.format(count=count, **kwargs)

    async def available_locales(self) -> List[str]:
        return await self.manager.available_locales()
