window.showNotification = function(message, type = 'success') {
    const notification = document.createElement('div');

    notification.className = `alert alert-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transition =
            'opacity 0.3s, transform 0.3s';

        notification.style.opacity = '0';
        notification.style.transform =
            'translateX(30px)';

        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
};

function normalizeLineEndings(str) {
    if (!str) {
        return '';
    }

    return str
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
}

function formatDateRU(dateString) {
    const date = new Date(dateString);

    return date.toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function createEditor(element) {
    return new EasyMDE({
        element,
        spellChecker: false,
        nativeSpellcheck: false,
        autofocus: false,
        minHeight: '300px',

        renderingConfig: {
            singleLineBreaks: false,
            codeSyntaxHighlighting: true,
        },

        toolbar: [
            'bold',
            'italic',
            'strikethrough',
            'heading',
            'heading-smaller',
            'heading-bigger',
            'heading-1',
            'heading-2',
            'heading-3',
            '|',
            'quote',
            'unordered-list',
            'ordered-list',
            '|',
            'link',
            'image',
            'table',
            'horizontal-rule',
            '|',
            'code',
            'preview',
            '|',
            'guide',
        ],
    });
}

const createForm = document.getElementById(
    'create-form'
);

if (createForm) {
    const titleInput = createForm.querySelector(
        'input[name="title"]'
    );

    const contentTextarea = createForm.querySelector(
        'textarea[name="content"]'
    );

    let editor = null;

    if (contentTextarea) {
        contentTextarea.value = normalizeLineEndings(
            contentTextarea.value
        );

        editor = createEditor(contentTextarea);
    }

    createForm.addEventListener(
        'submit',
        async (event) => {
            event.preventDefault();

            const title = normalizeLineEndings(
                titleInput.value
            );

            const content = normalizeLineEndings(
                editor
                    ? editor.value()
                    : contentTextarea.value
            );

            const formData = new FormData();

            formData.append('title', title);
            formData.append('content', content);

            const csrfToken = document.querySelector(
                '[name=csrfmiddlewaretoken]'
            ).value;

            formData.append(
                'csrfmiddlewaretoken',
                csrfToken
            );

            const submitButton =
                createForm.querySelector(
                    '.publish-btn'
                );

            const originalText =
                submitButton.textContent;

            submitButton.textContent =
                'Publishing...';

            submitButton.disabled = true;

            try {
                const response = await fetch(
                    window.location.href,
                    {
                        method: 'POST',

                        headers: {
                            'X-CSRFToken': csrfToken,
                        },

                        body: formData,
                    }
                );

                if (!response.ok) {
                    const error =
                        await response.json();

                    window.showNotification(
                        error.error ||
                        'Server error.',
                        'error'
                    );

                    return;
                }

                const data = await response.json();

                if (!data.redirect_url) {
                    window.showNotification(
                        'Failed to create post.',
                        'error'
                    );

                    return;
                }

                sessionStorage.setItem(
                    'showCreatedNotification',
                    'true'
                );

                window.location.href =
                    data.redirect_url;

            } catch {
                window.showNotification(
                    'Network error.',
                    'error'
                );
            } finally {
                submitButton.textContent =
                    originalText;

                submitButton.disabled = false;
            }
        }
    );
}

const editForm = document.getElementById(
    'edit-form'
);

if (editForm) {
    if (
        sessionStorage.getItem(
            'showCreatedNotification'
        ) === 'true'
    ) {
        sessionStorage.removeItem(
            'showCreatedNotification'
        );

        window.showNotification(
            'Post created.',
            'success'
        );
    }

    const viewer =
        document.getElementById(
            'viewer-container'
        );

    const editorContainer =
        document.getElementById(
            'editor-container'
        );

    const editButton =
        document.getElementById(
            'edit-button'
        );

    const cancelButton =
        document.getElementById(
            'cancel-button'
        );

    const publishButton =
        document.getElementById(
            'publish-button'
        );

    const titleField =
        document.getElementById(
            'edit-title'
        );

    const contentField =
        document.getElementById(
            'edit-content'
        );

    const postSlug =
        editForm.dataset.slug;

    const csrfToken =
        document.querySelector(
            '[name=csrfmiddlewaretoken]'
        ).value;

    let originalTitle =
        editForm.dataset.originalTitle || '';

    originalTitle =
        normalizeLineEndings(
            originalTitle
        );

    let originalContent =
        normalizeLineEndings(
            contentField.value
        );

    const editor =
        createEditor(contentField);

    editor.value(originalContent);

    function updateMetaEditTime(dateString) {
        const meta = document.querySelector(".post-meta");
        if (!meta) return;

        const formatted = formatDateRU(dateString);

        let editedLine = meta.querySelector(".edited-line");

        if (!editedLine) {
            editedLine = document.createElement("span");
            editedLine.className = "edited-line";

            meta.appendChild(editedLine);
        }

        editedLine.textContent = ` · edited ${formatted}`;
    }

    function resetForm() {
        titleField.value =
            originalTitle;

        editor.value(
            originalContent
        );
    }

    function enterEditMode() {
        resetForm();

        viewer.style.opacity = '0';
        viewer.style.transform =
            'translateY(10px)';

        setTimeout(() => {
            viewer.style.display = 'none';

            editorContainer.style.display =
                'block';

            setTimeout(() => {
                editorContainer.style.opacity =
                    '1';

                editorContainer.style.transform =
                    'translateY(0)';

                editor.codemirror.refresh();
            }, 20);

        }, 250);
    }

    function exitEditMode() {
        resetForm();

        editorContainer.style.opacity =
            '0';

        editorContainer.style.transform =
            'translateY(10px)';

        setTimeout(() => {
            editorContainer.style.display =
                'none';

            viewer.style.display =
                'block';

            setTimeout(() => {
                viewer.style.opacity = '1';

                viewer.style.transform =
                    'translateY(0)';
            }, 20);

        }, 250);
    }

    viewer.style.opacity = '1';
    viewer.style.transform =
        'translateY(0)';

    editorContainer.style.opacity = '0';
    editorContainer.style.transform =
        'translateY(10px)';

    editorContainer.style.display =
        'none';

    if (editButton) {
        editButton.addEventListener(
            'click',
            enterEditMode
        );
    }

    if (cancelButton) {
        cancelButton.addEventListener(
            'click',
            exitEditMode
        );
    }

    editForm.addEventListener(
        'submit',
        async (event) => {
            event.preventDefault();

            const title =
                normalizeLineEndings(
                    titleField.value
                );

            const content =
                normalizeLineEndings(
                    editor.value()
                );

            const formData =
                new FormData();

            formData.append(
                'title',
                title
            );

            formData.append(
                'content',
                content
            );

            formData.append(
                'csrfmiddlewaretoken',
                csrfToken
            );

            const originalText =
                publishButton.textContent;

            publishButton.textContent =
                'Saving...';

            publishButton.disabled = true;

            try {
                const response = await fetch(
                    `/${postSlug}/`,
                    {
                        method: 'POST',

                        headers: {
                            'X-CSRFToken':
                                csrfToken,
                        },

                        body: formData,
                    }
                );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.success
                ) {
                    window.showNotification(
                        data.error ||
                        'Server error.',
                        'error'
                    );

                    return;
                }

                document.getElementById(
                    'post-title-view'
                ).textContent = title;

                const contentView =
                    document.getElementById(
                        'post-content-view'
                    );

                contentView.style.transition =
                    'opacity 0.2s';

                contentView.style.opacity =
                    '0';

                setTimeout(() => {
                    contentView.innerHTML =
                        data.new_content;

                    contentView.style.opacity =
                        '1';
                }, 150);

                if (data.updated_at) {
                    updateMetaEditTime(data.updated_at);
                }

                originalTitle = title;
                originalContent = content;

                editForm.dataset.originalTitle =
                    originalTitle;

                exitEditMode();

                window.showNotification(
                    'Post updated.',
                    'success'
                );

            } catch {
                window.showNotification(
                    'Network error.',
                    'error'
                );
            } finally {
                publishButton.textContent =
                    originalText;

                publishButton.disabled =
                    false;
            }
        }
    );
}