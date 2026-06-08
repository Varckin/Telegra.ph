from weasyprint import HTML, CSS
from django.template.loader import render_to_string
from django.contrib.staticfiles import finders
from posts.services import safe_markdown
from pdf_generator.config import POSTS_LOGO_PATH


def post_to_pdf(post, request=None):
    """
    Generate PDF bytes for the given Post object.
    If a request is provided, it will be used to build absolute URLs for static files.
    """
    content_html = safe_markdown(post.content)
    logo_url = None

    if request:
        from django.templatetags.static import static
        logo_relative = POSTS_LOGO_PATH
        logo_url = request.build_absolute_uri(static(logo_relative))
    else:
        logo_path = finders.find(POSTS_LOGO_PATH)
        if logo_path:
            logo_url = logo_path

    html_string = render_to_string('pdf/pdf.html', {
        'post': post,
        'content_html': content_html,
        'logo_url': logo_url,
        'title': post.title,
        'created_at': post.created_at,
        'updated_at': post.updated_at,
    })
    css_string = """
        @page {
            size: A4;
            margin: 2cm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #000;
            background: #fff;
        }
        .logo {
            max-width: 150px;
            margin-bottom: 1rem;
        }
        .post-title {
            font-size: 28pt;
            margin-top: 1rem;
        }
        .meta {
            color: #666;
            font-size: 10pt;
            border-bottom: 1px solid #ddd;
            padding-bottom: 1rem;
        }
        .content {
            margin-top: 2rem;
        }
        .content img {
            max-width: 100%;
        }
        .content pre {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
        }
        .content code {
            font-family: monospace;
        }
    """

    html = HTML(string=html_string, base_url=request.build_absolute_uri('/') if request else None)
    pdf_bytes = html.write_pdf(stylesheets=[CSS(string=css_string)])

    return pdf_bytes
