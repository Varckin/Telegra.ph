import argparse
import json
import re
from pathlib import Path
from typing import Set


def cmd_init(args):
    base = Path(args.path)
    locales = args.locales.split(",") if args.locales else ["en", "ru"]
    base.mkdir(parents=True, exist_ok=True)

    for locale in locales:
        locale_dir = base / locale
        locale_dir.mkdir(exist_ok=True)
        default_file = locale_dir / "default.json"
        if not default_file.exists() or args.force:
            example = {"hello": "Hello", "greeting": "Hello, {name}!"}
            default_file.write_text(
                json.dumps(example, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
            print(f"Created {default_file}")
    print("Init completed.")

def cmd_validate(args):
    base = Path(args.path)
    errors = []
    locales = [p for p in base.iterdir() if p.is_dir()]
    if not locales:
        print("No locales found.")
        return

    reference_keys: Set[str] = set()
    ref_locale = locales[0]

    def flatten(d, prefix=""):
        items = []
        for k, v in d.items():
            new_prefix = f"{prefix}.{k}" if prefix else k
            if isinstance(v, dict):
                items.extend(flatten(v, new_prefix))
            else:
                items.append(new_prefix)
        return items

    for f in ref_locale.glob("*.json"):
        data = json.loads(f.read_text(encoding="utf-8"))
        for key in flatten(data):
            reference_keys.add(key)

    for locale in locales[1:]:
        locale_keys = set()
        for f in locale.glob("*.json"):
            data = json.loads(f.read_text(encoding="utf-8"))
            for key in flatten(data):
                locale_keys.add(key)
        missing = reference_keys - locale_keys
        extra = locale_keys - reference_keys
        for key in missing:
            errors.append(f"{locale.name}: missing key '{key}'")
        for key in extra:
            errors.append(f"{locale.name}: extra key '{key}'")

    if errors:
        print("\n".join(errors))
        exit(1)
    print("OK: translations are consistent")

def cmd_scan(args):
    path = Path(args.path)
    keys = set()
    for file in path.rglob("*.py"):
        text = file.read_text(encoding="utf-8")
        found = re.findall(r'(?:t|plural)\s*\(\s*["\']([^"\']+)["\']', text)
        keys.update(found)
    for k in sorted(keys):
        print(k)

def cmd_sync(args):
    base = Path(args.path)
    locales = [p for p in base.iterdir() if p.is_dir()]
    if not locales:
        print("No locales found")
        return

    ref_locale = locales[0]
    reference_data = {}
    for f in ref_locale.glob("*.json"):
        reference_data[f.stem] = json.loads(f.read_text(encoding="utf-8"))

    for locale in locales[1:]:
        for ns, ref_content in reference_data.items():
            target_file = locale / f"{ns}.json"
            if target_file.exists():
                target_data = json.loads(target_file.read_text(encoding="utf-8"))
            else:
                target_data = {}

            if ns not in target_data:
                target_data[ns] = {}
            target_ns = target_data[ns]

            def add_missing(ref_dict, target_dict, prefix=""):
                for k, v in ref_dict.items():
                    if isinstance(v, dict):
                        if k not in target_dict:
                            target_dict[k] = {}
                        add_missing(v, target_dict[k], f"{prefix}.{k}" if prefix else k)
                    else:
                        if k not in target_dict:
                            target_dict[k] = ""
            add_missing(ref_content, target_ns)

            target_file.write_text(
                json.dumps(target_data, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
    print("Sync completed")

def cmd_extract(args):
    print("Extract command not yet implemented. Coming soon.")

def main():
    parser = argparse.ArgumentParser(prog="t1-i18n", description="I18n toolkit")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_init = sub.add_parser("init", help="Initialize locale structure")
    p_init.add_argument("--path", required=True)
    p_init.add_argument("--locales", default="en,ru")
    p_init.add_argument("--force", action="store_true")
    p_init.set_defaults(func=cmd_init)

    p_val = sub.add_parser("validate", help="Validate translation files")
    p_val.add_argument("--path", required=True)
    p_val.set_defaults(func=cmd_validate)

    p_scan = sub.add_parser("scan", help="Scan Python files for translation keys")
    p_scan.add_argument("--path", required=True)
    p_scan.set_defaults(func=cmd_scan)

    p_sync = sub.add_parser("sync", help="Sync missing keys from reference locale")
    p_sync.add_argument("--path", required=True)
    p_sync.set_defaults(func=cmd_sync)

    p_ext = sub.add_parser("extract", help="Extract translation keys into template")
    p_ext.add_argument("--path", required=True)
    p_ext.add_argument("--output", default="locales/template.json")
    p_ext.set_defaults(func=cmd_extract)

    args = parser.parse_args()
    if hasattr(args, "func"):
        args.func(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
