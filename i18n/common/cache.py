from pathlib import Path
from typing import Dict, Optional


class TranslationCache:
    def __init__(self):
        self._data: Dict[str, dict] = {}
        self._mtime: Dict[str, Dict[str, float]] = {}

    def get(self, locale: str) -> Optional[dict]:
        return self._data.get(locale)

    def set(self, locale: str, data: dict, files: Dict[Path, float] = None):
        self._data[locale] = data
        if files is not None:
            self._mtime[locale] = {str(p): mtime for p, mtime in files.items()}

    def is_fresh(self, locale: str, current_files: Dict[Path, float]) -> bool:
        if locale not in self._mtime:
            return False
        cached = self._mtime[locale]
        for path, mtime in current_files.items():
            if cached.get(str(path)) != mtime:
                return False
        return True

    def clear(self, locale: str = None):
        if locale:
            self._data.pop(locale, None)
            self._mtime.pop(locale, None)
        else:
            self._data.clear()
            self._mtime.clear()
