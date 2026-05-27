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
