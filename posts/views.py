from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render, redirect
from django.views import View

from posts.constants import CONSTANTS
from posts.forms import PostForm
from posts.models import Post
from posts.services import (get_author_from_cookie, get_client_ip,
                            rate_limit_exceeded, safe_redirect_path,
                            safe_markdown, set_author_cookie,
                            set_locale_cookie,
                            get_or_create_author_from_cookie)


def translate_message(request: HttpRequest, key: str, fallback: str) -> str:
    translator = getattr(request, "translator", None)
    if translator is not None:
        try:
            return translator.t(key)
        except Exception:
            return fallback
    return fallback

def rate_limited_response(request: HttpRequest) -> JsonResponse:
    return JsonResponse(
        {
            "error": translate_message(
                request,
                "post.rate_limited",
                "Too many requests. Please try again later."
            )
        },
        status=429
    )

class CreatePostView(View):
    def get(self, request: HttpRequest) -> HttpResponse:
        form = PostForm()

        return render(request, "posts/create.html", {"form": form})

    def post(self, request: HttpRequest) -> JsonResponse:
        client_ip = get_client_ip(request)
        if rate_limit_exceeded(
            f"rate_limit:post_create:{client_ip}",
            CONSTANTS.RATE_LIMIT_CREATE_MAX,
            CONSTANTS.RATE_LIMIT_WINDOW_SECONDS
        ):
            return rate_limited_response(request)

        form = PostForm(request.POST)

        if not form.is_valid():
            return JsonResponse(
                {"error": translate_message(request, "post.invalid_form", "Invalid form.")},
                status=400
            )

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

        return render(request, "posts/detail.html", {"post": post,
                                                     "html_content": html_content,
                                                     "can_edit": can_edit
                                                     })

    def post(self, request: HttpRequest, slug: str) -> JsonResponse:
        post = get_object_or_404(Post, slug=slug)
        author = get_author_from_cookie(request)

        if not author or author.pk != post.author.pk:
            return JsonResponse(
                {"error": translate_message(request, "post.permission_denied", "Permission denied.")},
                status=403
            )

        client_ip = get_client_ip(request)
        if rate_limit_exceeded(
            f"rate_limit:post_edit:{post.pk}:{client_ip}",
            CONSTANTS.RATE_LIMIT_EDIT_MAX,
            CONSTANTS.RATE_LIMIT_WINDOW_SECONDS
        ):
            return rate_limited_response(request)

        form = PostForm(request.POST, instance=post)

        if not form.is_valid():
            return JsonResponse(
                {"error": translate_message(request, "post.validation_error", "Validation error.")},
                status=400
            )

        form.save()
        new_html = safe_markdown(post.content)

        return JsonResponse(
            {
                "success": True,
                "new_content": new_html,
                "updated_at": post.updated_at.isoformat()
            }
        )

def set_language(request: HttpRequest) -> HttpResponse:
    if request.method == 'POST':
        locale = request.POST.get('locale')
        if locale in settings.LOCALE_AVAILABLE:
            response = redirect(safe_redirect_path(request))
            set_locale_cookie(response, locale)
            return response
    return redirect('post_create')
