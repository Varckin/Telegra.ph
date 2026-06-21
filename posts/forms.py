from django import forms
from posts.models import Post
from posts.constants import CONSTANTS


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ["title", "content",]
        widgets = {
            "title": forms.TextInput(
                attrs={
                    "class": "telegraph-input",
                    "placeholder": "Title",
                    "autofocus": True,
                }
            ),
            "content": forms.Textarea(
                attrs={
                    "class": "telegraph-textarea",
                    "placeholder": "Your story...",
                    "rows": 12,
                }
            ),
        }

    def clean_title(self) -> str:
        title = self.cleaned_data.get("title")
        if title and len(title) > CONSTANTS.MAX_LEN_TITLE:
            raise forms.ValidationError(
                "Title is too long."
            )

        return title

    def clean_content(self) -> str:
        content = self.cleaned_data.get("content")
        if content and len(content) > CONSTANTS.MAX_LEN_CONTENT:
            raise forms.ValidationError(
                f"Content is too long. Maximum {CONSTANTS.MAX_LEN_CONTENT} characters."
            )

        return content
