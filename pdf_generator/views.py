from django.http import HttpResponse
from django.views import View
from django.shortcuts import get_object_or_404
from posts.models import Post
from pdf_generator.generator import post_to_pdf


class DownloadPostPDFView(View):
    def get(self, request, slug):
        post = get_object_or_404(Post, slug=slug)
        pdf_bytes = post_to_pdf(post, request=request)

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{post.slug}.pdf"'
        return response
