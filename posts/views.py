from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views import View

from posts.forms import PostForm
from posts.models import Post
from posts.services import (get_author_from_cookie, safe_markdown,
                            set_author_cookie, get_or_create_author_from_cookie)


class CreatePostView(View):
    def get(self, request: HttpRequest) -> HttpResponse:
        form = PostForm()

        return render(request, "posts/create.html", {"form": form})

    def post(self, request: HttpRequest) -> JsonResponse:
        form = PostForm(request.POST)

        if not form.is_valid():
            return JsonResponse({"error": "Invalid form."}, status=400)

        author, _ = get_or_create_author_from_cookie(request)

        post: Post = form.save(commit=False)
        post.author = author
        post.save()

        response = JsonResponse({"redirect_url": post.get_absolute_url()})
        set_author_cookie(response, author)

        return response

class PostDetailView(View):
    def get(self, request: HttpRequest, slug: str) -> HttpResponse:
        post = get_object_or_404(Post, slug=slug)
        author = get_author_from_cookie(request)

        can_edit = (author is not None and author.pk == post.author.pk)
        html_content = safe_markdown(post.content)

        return render(request, "posts/detail.html",{"post": post,
                                                    "html_content": html_content,
                                                    "can_edit": can_edit
                                                    })

    def post(self, request: HttpRequest, slug: str) -> JsonResponse:
        post = get_object_or_404(Post, slug=slug)
        author = get_author_from_cookie(request)

        if not author or author.pk != post.author.pk:
            return JsonResponse({"error": "Permission denied."}, status=403)

        form = PostForm(request.POST, instance=post)

        if not form.is_valid():
            return JsonResponse({"error": "Validation error."}, status=400)

        form.save()
        new_html = safe_markdown(post.content)

        return JsonResponse(
            {
                "success": True,
                "new_content": new_html,
                "updated_at": post.updated_at.isoformat()
            }
        )
