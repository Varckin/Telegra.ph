def get_plural_form(locale: str, count: int) -> str:
    """Return plural form name ('one', 'few', 'many', 'other') for given locale and count."""
    lang = locale.split('-')[0]
    if lang == "ru":
        return russian_plural(count)
    return english_plural(count)

def russian_plural(count: int) -> str:
    if count % 10 == 1 and count % 100 != 11:
        return "one"
    if 2 <= count % 10 <= 4 and (count % 100 < 10 or count % 100 >= 20):
        return "few"
    return "many"

def english_plural(count: int) -> str:
    return "one" if count == 1 else "other"
