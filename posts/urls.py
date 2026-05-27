from django.urls import path
from posts.views import CreatePostView, PostDetailView


urlpatterns = [
    path("", CreatePostView.as_view(), name="post_create"),
    path("<slug:slug>/", PostDetailView.as_view(), name="post_detail")
]
