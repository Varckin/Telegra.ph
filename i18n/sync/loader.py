import json
from pathlib import Path
from typing import Dict, Tuple


class LocaleLoader:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)

    def _merge_dict(self, base: dict, new: dict) -> dict:
        for key, value in new.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._merge_dict(base[key], value)
            else:
                base[key] = value
        return base

    def load_locale(self, locale: str) -> Tuple[dict, Dict[Path, float]]:
        locale_path = self.base_path / locale
        if not locale_path.exists():
            return {}, {}

        data = {}
        mtimes = {}

        for file in locale_path.glob("*.json"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    file_data = json.load(f)
                self._merge_dict(data, file_data)
                mtimes[file] = file.stat().st_mtime
            except Exception as e:
                raise RuntimeError(f"Failed to load {file}: {e}")

        return data, mtimes

    def available_locales(self) -> list[str]:
        if not self.base_path.exists():
            return []
        return [p.name for p in self.base_path.iterdir() if p.is_dir()]
