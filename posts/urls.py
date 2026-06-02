from django.urls import path
from posts.views import CreatePostView, PostDetailView, set_language


urlpatterns = [
    path("", CreatePostView.as_view(), name="post_create"),
    path('set_language/', set_language, name='set_language'),
    path("<slug:slug>/", PostDetailView.as_view(), name="post_detail")
]
