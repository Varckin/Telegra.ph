from typing import List, Dict
from django.urls import reverse
from posts.models import Post
from sitemapv1.constants import CONFIG


def get_static_urls() -> List[Dict[str, str]]:
    base_url: str = CONFIG.SITE_URL.rstrip('/')
    urls: List[Dict[str, str]] = []

    urls.append({
        'loc': base_url + reverse('post_create'),
        'priority': '0.5',
        'changefreq': 'monthly',
    })

    return urls

def get_blog_urls() -> List[Dict[str, str]]:
    base_url: str = CONFIG.SITE_URL.rstrip('/')
    posts = Post.objects.all()
    urls: List[Dict[str, str]] = []

    for post in posts:
        path: str = post.get_absolute_url()
        urls.append({
            'loc': base_url + path,
            'lastmod': post.updated_at.isoformat(),
            'priority': '0.8',
            'changefreq': 'weekly',
        })

    return urls

def generate_sitemap_xml() -> str:
    urls: List[Dict[str, str]] = get_static_urls() + get_blog_urls()

    xml_parts: List[str] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]

    for url_data in urls:
        xml_parts.append('  <url>')
        xml_parts.append(f'    <loc>{url_data["loc"]}</loc>')
        if 'lastmod' in url_data:
            xml_parts.append(f'    <lastmod>{url_data["lastmod"]}</lastmod>')
        if 'changefreq' in url_data:
            xml_parts.append(f'    <changefreq>{url_data["changefreq"]}</changefreq>')
        if 'priority' in url_data:
            xml_parts.append(f'    <priority>{url_data["priority"]}</priority>')
        xml_parts.append('  </url>')

    xml_parts.append('</urlset>')
    return '\n'.join(xml_parts)
