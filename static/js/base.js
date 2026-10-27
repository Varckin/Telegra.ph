(function () {
    'use strict';

    var ALERT_ICONS = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.1V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10.01-3-3"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
    };

    var EDIT_META_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';

    var LOCALE_MAP = {
        en: 'en-US',
        ru: 'ru-RU',
        es: 'es-ES',
        de: 'de-DE',
        fr: 'fr-FR',
        pl: 'pl-PL',
        zh: 'zh-CN'
    };

    var CREATE_DRAFT_KEY = 'blog_draft_create';

    function t(key, fallback) {
        var dict = window.i18n || {};
        var value = dict[key];
        return (typeof value === 'string' && value.length > 0) ? value : (fallback || '');
    }

    function isBlank(value) {
        return typeof value !== 'string' || value.trim().length === 0;
    }

    function normalizeLineEndings(str) {
        if (!str) {
            return '';
        }
        return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDateTime(isoString) {
        var date = new Date(isoString);
        if (isNaN(date.getTime())) {
            return '';
        }
        var locale = LOCALE_MAP[window.appLocale] || LOCALE_MAP.en;
        try {
            return date.toLocaleString(locale, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return date.toLocaleString();
        }
    }

    window.showNotification = function (message, type) {
        type = type || 'success';

        var stack = document.getElementById('alert-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.id = 'alert-stack';
            stack.className = 'alert-stack';
            document.body.appendChild(stack);
        }

        var alertBox = document.createElement('div');
        alertBox.className = 'alert alert-' + type;
        alertBox.setAttribute('role', 'status');

        var icon = document.createElement('span');
        icon.className = 'alert-icon';
        icon.innerHTML = ALERT_ICONS[type] || ALERT_ICONS.info;

        var text = document.createElement('span');
        text.className = 'alert-text';
        text.textContent = message;

        alertBox.appendChild(icon);
        alertBox.appendChild(text);
        stack.appendChild(alertBox);

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                alertBox.classList.add('is-visible');
            });
        });

        window.setTimeout(function () {
            alertBox.classList.remove('is-visible');
            alertBox.classList.add('is-hiding');
            window.setTimeout(function () {
                alertBox.remove();
            }, 360);
        }, 3200);
    };

    function insertVideo(editor) {
        var input = window.prompt(t('video_prompt', 'Paste a video URL or embed HTML code:'));
        if (!input) {
            return;
        }

        var trimmedInput = input.trim();

        if (trimmedInput.startsWith('<iframe') || trimmedInput.startsWith('<video')) {
            editor.codemirror.replaceSelection(trimmedInput + '\n');
            return;
        }

        var embedCode = '';
        var url = trimmedInput;

        var ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) {
            var isShort = url.includes('/shorts/');
            var shortClass = isShort ? ' class="youtube-short"' : '';
            var ytTitle = escapeHtml(t('youtube_player_title', 'YouTube video player'));
            embedCode = '<iframe' + shortClass + ' width="560" height="315" src="https://www.youtube-nocookie.com/embed/' + ytMatch[1] + '" title="' + ytTitle + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>\n';
        } else if (url.includes('vimeo.com')) {
            var vimeoId = url.split('/').pop().split('?')[0];
            embedCode = '<iframe src="https://player.vimeo.com/video/' + vimeoId + '" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>\n';
        } else if (url.includes('rutube.ru')) {
            var rutubeMatch = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)\//);
            if (!rutubeMatch) {
                rutubeMatch = url.match(/rutube\.ru\/play\/embed\/([a-zA-Z0-9]+)/);
            }
            if (rutubeMatch) {
                embedCode = '<iframe width="560" height="315" src="https://rutube.ru/play/embed/' + rutubeMatch[1] + '" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>\n';
            }
        }

        if (!embedCode && url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
            embedCode = '<video width="560" height="315" controls>\n  <source src="' + url + '">\n  ' + t('video_not_supported', 'Your browser does not support the video tag.') + '\n</video>\n';
        }

        if (!embedCode) {
            if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
                embedCode = '<iframe width="560" height="315" src="' + url + '" frameborder="0" allowfullscreen></iframe>\n';
            } else {
                window.showNotification(t('invalid_url', 'Invalid URL.'), 'error');
                return;
            }
        }

        editor.codemirror.replaceSelection(embedCode);
    }

    function createEditor(element) {
        var customVideoButton = {
            name: 'video',
            action: function (editor) {
                insertVideo(editor);
            },
            className: 'video-btn',
            title: t('video_title', 'Insert video')
        };

        return new EasyMDE({
            element: element,
            spellChecker: false,
            nativeSpellcheck: false,
            autofocus: false,
            autoDownloadFontAwesome: false,
            status: false,
            minHeight: '420px',
            renderingConfig: {
                singleLineBreaks: false,
                codeSyntaxHighlighting: true
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
                customVideoButton,
                'table',
                'horizontal-rule',
                '|',
                'code',
                'preview',
                '|',
                'guide'
            ]
        });
    }

    function saveDraftToLocalStorage(key, title, content) {
        if (!key) {
            return;
        }
        try {
            if (isBlank(title) && isBlank(content)) {
                localStorage.removeItem(key);
                return;
            }
            var draft = {
                title: normalizeLineEndings(title),
                content: normalizeLineEndings(content),
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(draft));
        } catch (e) {
            console.warn('Failed to save draft:', e);
        }
    }

    function loadDraftFromLocalStorage(key) {
        if (!key) {
            return null;
        }
        try {
            var raw = localStorage.getItem(key);
            if (!raw) {
                return null;
            }
            var draft = JSON.parse(raw);
            if (!draft || typeof draft.title !== 'string' || typeof draft.content !== 'string') {
                localStorage.removeItem(key);
                return null;
            }
            if (isBlank(draft.title) && isBlank(draft.content)) {
                localStorage.removeItem(key);
                return null;
            }
            return draft;
        } catch (e) {
            try {
                localStorage.removeItem(key);
            } catch (ignored) {
                console.warn('Failed to clear draft:', ignored);
            }
            return null;
        }
    }

    function clearDraft(key) {
        if (!key) {
            return;
        }
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Failed to clear draft:', e);
        }
    }

    function restoreDraftWithNotification(draftKey, titleField, editor) {
        var draft = loadDraftFromLocalStorage(draftKey);
        if (!draft) {
            return false;
        }
        if (titleField) {
            titleField.value = draft.title;
        }
        editor.value(draft.content);
        window.showNotification(t('draft_restored', 'Draft restored'), 'info');
        return true;
    }

    function setupAutoSave(titleField, editor, draftKey, debounceMs) {
        if (!draftKey || !editor) {
            return;
        }
        debounceMs = debounceMs || 250;

        var timeoutId = null;
        var enabled = true;

        function saveCurrent() {
            if (!enabled) {
                return;
            }
            var title = titleField ? normalizeLineEndings(titleField.value) : '';
            var content = normalizeLineEndings(editor.value());
            saveDraftToLocalStorage(draftKey, title, content);
        }

        function debouncedSave() {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(saveCurrent, debounceMs);
        }

        if (titleField) {
            titleField.addEventListener('input', debouncedSave);
        }

        function attachEditorListener() {
            if (editor.codemirror) {
                editor.codemirror.on('change', debouncedSave);
                return true;
            }
            return false;
        }

        if (!attachEditorListener()) {
            setTimeout(attachEditorListener, 100);
        }
    }

    function legacyCopyText(text) {
        try {
            var temp = document.createElement('textarea');
            temp.value = text;
            temp.setAttribute('readonly', '');
            temp.style.position = 'fixed';
            temp.style.top = '-1000px';
            temp.style.opacity = '0';
            document.body.appendChild(temp);
            temp.select();
            var copied = document.execCommand('copy');
            temp.remove();
            return copied;
        } catch (e) {
            return false;
        }
    }

    window.copyTextToClipboard = function (text) {
        return new Promise(function (resolve, reject) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(resolve).catch(function () {
                    if (legacyCopyText(text)) {
                        resolve();
                    } else {
                        reject(new Error('copy failed'));
                    }
                });
                return;
            }
            if (legacyCopyText(text)) {
                resolve();
            } else {
                reject(new Error('copy failed'));
            }
        });
    };

    function setButtonLoading(button, isLoading, loadingText) {
        if (!button) {
            return;
        }
        var label = button.querySelector('.btn-label');
        if (isLoading) {
            button.dataset.originalLabel = label ? label.textContent : '';
            if (label && loadingText) {
                label.textContent = loadingText;
            }
            button.classList.add('is-loading');
            button.disabled = true;
        } else {
            if (label && typeof button.dataset.originalLabel === 'string') {
                label.textContent = button.dataset.originalLabel;
            }
            button.classList.remove('is-loading');
            button.disabled = false;
        }
    }

    function initCreatePage() {
        var createForm = document.getElementById('create-form');
        if (!createForm) {
            return;
        }

        var titleInput = createForm.querySelector('input[name="title"]');
        var contentTextarea = createForm.querySelector('textarea[name="content"]');
        var editor = contentTextarea ? createEditor(contentTextarea) : null;

        if (editor && titleInput) {
            restoreDraftWithNotification(CREATE_DRAFT_KEY, titleInput, editor);
            setupAutoSave(titleInput, editor, CREATE_DRAFT_KEY, 250);
        }

        createForm.addEventListener('submit', function (event) {
            event.preventDefault();

            if (!titleInput || isBlank(titleInput.value)) {
                if (titleInput) {
                    titleInput.focus();
                }
                return;
            }

            var publishButton = createForm.querySelector('.publish-btn');
            var title = normalizeLineEndings(titleInput.value);
            var content = normalizeLineEndings(editor ? editor.value() : (contentTextarea ? contentTextarea.value : ''));

            var formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);

            var csrfInput = createForm.querySelector('[name=csrfmiddlewaretoken]');
            var csrfToken = csrfInput ? csrfInput.value : '';
            formData.append('csrfmiddlewaretoken', csrfToken);

            setButtonLoading(publishButton, true, t('publishing', 'Publishing…'));

            fetch(window.location.href, {
                method: 'POST',
                headers: { 'X-CSRFToken': csrfToken },
                body: formData
            })
                .then(function (response) {
                    return response.json()
                        .catch(function () {
                            return null;
                        })
                        .then(function (data) {
                            return { ok: response.ok, data: data };
                        });
                })
                .then(function (result) {
                    if (!result.ok) {
                        var message = (result.data && result.data.error) || t('server_error', 'Server error.');
                        window.showNotification(message, 'error');
                        return;
                    }
                    if (!result.data || !result.data.redirect_url) {
                        window.showNotification(t('failed_create', 'Failed to create post.'), 'error');
                        return;
                    }
                    clearDraft(CREATE_DRAFT_KEY);
                    sessionStorage.setItem('showCreatedNotification', 'true');
                    window.location.href = result.data.redirect_url;
                })
                .catch(function () {
                    window.showNotification(t('network_error', 'Network error.'), 'error');
                })
                .finally(function () {
                    setButtonLoading(publishButton, false);
                });
        });
    }

    function initEditPage() {
        var editForm = document.getElementById('edit-form');
        if (!editForm) {
            return;
        }

        if (sessionStorage.getItem('showCreatedNotification') === 'true') {
            sessionStorage.removeItem('showCreatedNotification');
            window.showNotification(t('post_created', 'Post created.'), 'success');
        }

        var viewer = document.getElementById('viewer-container');
        var editorContainer = document.getElementById('editor-container');
        var editButton = document.getElementById('edit-button');
        var cancelButton = document.getElementById('cancel-button');
        var publishButton = document.getElementById('publish-button');
        var copyButton = document.getElementById('copy-link-button');
        var titleField = document.getElementById('edit-title');
        var contentField = document.getElementById('edit-content');

        if (!viewer || !editorContainer || !titleField || !contentField) {
            return;
        }

        var postSlug = editForm.dataset.slug || '';
        var csrfInput = editForm.querySelector('[name=csrfmiddlewaretoken]');
        var csrfToken = csrfInput ? csrfInput.value : '';

        var originalTitle = normalizeLineEndings(editForm.dataset.originalTitle || '');
        var originalContent = normalizeLineEndings(contentField.value);

        var editor = createEditor(contentField);
        editor.value(originalContent);

        function updateMetaEditTime(isoString) {
            var meta = document.querySelector('.post-meta');
            if (!meta) {
                return;
            }
            var formatted = formatDateTime(isoString);
            if (!formatted) {
                return;
            }
            var editedLine = meta.querySelector('.edited-line');
            if (!editedLine) {
                editedLine = document.createElement('span');
                editedLine.className = 'meta-item edited-line';
                meta.appendChild(editedLine);
            }
            editedLine.innerHTML = EDIT_META_ICON + escapeHtml(t('edited_prefix', 'edited') + ' ' + formatted);
        }

        function resetForm() {
            titleField.value = originalTitle;
            editor.value(originalContent);
        }

        function enterEditMode() {
            resetForm();
            document.body.classList.add('is-editing');
            viewer.classList.add('is-leaving');
            setTimeout(function () {
                viewer.classList.add('is-hidden');
                viewer.classList.remove('is-leaving');
                editorContainer.classList.add('is-active');
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        editorContainer.classList.add('is-entered');
                    });
                });
                try {
                    editor.codemirror.refresh();
                } catch (e) {
                    console.warn('Editor refresh failed:', e);
                }
            }, 220);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function exitEditMode(onComplete) {
            editorContainer.classList.remove('is-entered');
            setTimeout(function () {
                editorContainer.classList.remove('is-active');
                viewer.classList.add('is-leaving');
                viewer.classList.remove('is-hidden');
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        viewer.classList.remove('is-leaving');
                    });
                });
                document.body.classList.remove('is-editing');
                if (typeof onComplete === 'function') {
                    setTimeout(onComplete, 80);
                }
            }, 220);
        }

        if (editButton) {
            editButton.addEventListener('click', enterEditMode);
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', function () {
                resetForm();
                exitEditMode();
            });
        }

        if (copyButton) {
            copyButton.addEventListener('click', function () {
                var url = window.location.href;

                window.copyTextToClipboard(url).then(function () {
                    copyButton.classList.add('is-copied');
                    setTimeout(function () {
                        copyButton.classList.remove('is-copied');
                    }, 1600);
                    window.showNotification(t('link_copied', 'Link copied to clipboard'), 'success');
                }).catch(function () {
                    window.showNotification(t('copy_failed', 'Could not copy the link.'), 'error');
                });
            });
        }

        editForm.addEventListener('submit', function (event) {
            event.preventDefault();

            if (isBlank(titleField.value)) {
                titleField.focus();
                return;
            }

            var title = normalizeLineEndings(titleField.value);
            var content = normalizeLineEndings(editor.value());

            var formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('csrfmiddlewaretoken', csrfToken);

            setButtonLoading(publishButton, true, t('saving', 'Saving…'));

            fetch('/' + postSlug + '/', {
                method: 'POST',
                headers: { 'X-CSRFToken': csrfToken },
                body: formData
            })
                .then(function (response) {
                    return response.json()
                        .catch(function () {
                            return null;
                        })
                        .then(function (data) {
                            return { ok: response.ok, data: data };
                        });
                })
                .then(function (result) {
                    var data = result.data;
                    if (!result.ok || !data || !data.success) {
                        var message = (data && data.error) || t('server_error', 'Server error.');
                        window.showNotification(message, 'error');
                        return;
                    }

                    var titleView = document.getElementById('post-title-view');
                    if (titleView) {
                        titleView.textContent = title;
                    }
                    document.title = title;

                    var contentTarget = document.getElementById('post-content-view');
                    if (contentTarget) {
                        contentTarget.classList.add('is-swapping');
                        setTimeout(function () {
                            contentTarget.innerHTML = data.new_content;
                            contentTarget.classList.remove('is-swapping');
                        }, 180);
                    }

                    if (data.updated_at) {
                        updateMetaEditTime(data.updated_at);
                    }

                    originalTitle = title;
                    originalContent = content;
                    editForm.dataset.originalTitle = originalTitle;
                    resetForm();

                    exitEditMode(function () {
                        document.dispatchEvent(new CustomEvent('postContentUpdated'));
                    });

                    window.showNotification(t('post_updated', 'Post updated.'), 'success');
                })
                .catch(function () {
                    window.showNotification(t('network_error', 'Network error.'), 'error');
                })
                .finally(function () {
                    setButtonLoading(publishButton, false);
                });
        });
    }

    function init() {
        initCreatePage();
        initEditPage();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();