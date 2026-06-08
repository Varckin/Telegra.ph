from django.urls import path
from pdf_generator.views import DownloadPostPDFView


urlpatterns = [
    path("<slug:slug>/pdf/", DownloadPostPDFView.as_view(), name="post_pdf")
]
