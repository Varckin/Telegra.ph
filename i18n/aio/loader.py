import json
import asyncio
from pathlib import Path
from typing import Dict, Tuple


class AsyncLocaleLoader:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)

    def _merge_dict(self, base: dict, new: dict) -> dict:
        for key, value in new.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._merge_dict(base[key], value)
            else:
                base[key] = value
        return base

    async def _read_json_file(self, file: Path) -> dict:
        def _sync_read():
            with open(file, "r", encoding="utf-8") as f:
                return json.load(f)
        return await asyncio.to_thread(_sync_read)

    async def load_locale(self, locale: str) -> Tuple[dict, Dict[Path, float]]:
        locale_path = self.base_path / locale
        if not locale_path.exists():
            return {}, {}

        data = {}
        mtimes = {}

        for file in locale_path.glob("*.json"):
            try:
                file_data = await self._read_json_file(file)
                self._merge_dict(data, file_data)
                mtimes[file] = file.stat().st_mtime
            except Exception as e:
                raise RuntimeError(f"Failed to load {file}: {e}")

        return data, mtimes

    async def available_locales(self) -> list[str]:
        if not self.base_path.exists():
            return []
        return [p.name for p in self.base_path.iterdir() if p.is_dir()]
