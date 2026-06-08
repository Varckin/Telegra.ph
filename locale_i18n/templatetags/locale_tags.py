from django import template
from django.template.context import RequestContext
from typing import Any


register = template.Library()

@register.simple_tag(takes_context=True)
def translate(context: RequestContext, key: str, **kwargs: Any) -> str:
    """
    Use: {% translate "post.title" %} or {% translate "post.greeting" name=user_name %}
    """
    request = context.get('request')
    if request and hasattr(request, 'translator'):
        try:
            return request.translator.t(key, **kwargs)
        except Exception:
            return key
    return key

@register.simple_tag(takes_context=True)
def pluralize(context: RequestContext, key: str, count: int, **kwargs: Any) -> str:
    """
    Use: {% pluralize "post.comments" count %} or {% pluralize "apples" count n=count %}
    """
    request = context.get('request')
    if request and hasattr(request, 'translator'):
        try:
            return request.translator.plural(key, count, **kwargs)
        except Exception:
            return key
    return key
