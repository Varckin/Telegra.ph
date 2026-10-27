(function () {
    'use strict';

    var sidebar = document.getElementById('nav-sidebar');
    var tocList = document.getElementById('toc-list');
    var contentView = document.getElementById('post-content-view');

    if (!sidebar || !tocList || !contentView) {
        return;
    }

    var progressContainer = document.getElementById('top-progress-container');
    var progressFill = document.getElementById('top-progress-fill');
    var progressText = document.getElementById('top-progress-text');
    var progressTime = document.getElementById('top-progress-time');

    var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var REVEAL_SELECTOR = 'p, ul, ol, blockquote, pre, table, figure, hr, iframe, video, .codehilite';
    var ACTIVE_SCROLL_OFFSET = 110;

    var COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    var CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

    var tocItems = [];
    var headingOffsets = [];
    var activeIndex = -1;
    var isProgrammaticScroll = false;
    var programmaticScrollTimer = null;
    var scrollFrame = null;
    var rebuildTimer = null;
    var offsetTimer = null;
    var resizeTimer = null;
    var expandTimer = null;
    var collapseTimer = null;
    var lastSignature = '';

    function expandSidebar() {
        clearTimeout(collapseTimer);
        sidebar.classList.add('expanded');
    }

    function collapseSidebar() {
        clearTimeout(expandTimer);
        sidebar.classList.remove('expanded');
    }

    function scheduleExpand() {
        clearTimeout(collapseTimer);
        clearTimeout(expandTimer);
        expandTimer = setTimeout(expandSidebar, 60);
    }

    function scheduleCollapse() {
        clearTimeout(expandTimer);
        clearTimeout(collapseTimer);
        collapseTimer = setTimeout(collapseSidebar, 180);
    }

    function initSidebarToggle() {
        sidebar.addEventListener('mouseenter', scheduleExpand);
        sidebar.addEventListener('mouseleave', scheduleCollapse);
        sidebar.addEventListener('focusin', scheduleExpand);
        sidebar.addEventListener('focusout', function (event) {
            if (!sidebar.contains(event.relatedTarget)) {
                scheduleCollapse();
            }
        });
        document.addEventListener('pointerdown', function (event) {
            if (!sidebar.contains(event.target)) {
                collapseSidebar();
            }
        });
    }

    function t(key, fallback) {
        var dict = window.i18n || {};
        var value = dict[key];
        return (typeof value === 'string' && value.length > 0) ? value : (fallback || '');
    }

    function prefersReducedMotion() {
        return reducedMotionQuery.matches;
    }

    function isEditing() {
        return document.body.classList.contains('is-editing');
    }

    function getContentSignature() {
        var headings = contentView.querySelectorAll('h1, h2, h3, h4, h5, h6');
        var parts = [];
        headings.forEach(function (heading) {
            parts.push(heading.tagName + ':' + heading.textContent.trim());
        });
        return parts.join('|');
    }

    function slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60);
    }

    function headingLevel(tagName) {
        var match = /^H([1-6])$/.exec(tagName);
        return match ? parseInt(match[1], 10) : 0;
    }

    function cacheHeadingOffsets() {
        if (isEditing()) {
            return;
        }
        headingOffsets = tocItems.map(function (item) {
            if (!item.element || !item.element.isConnected) {
                return Number.POSITIVE_INFINITY;
            }
            return item.element.getBoundingClientRect().top + window.pageYOffset;
        });
    }

    function scheduleOffsetRefresh() {
        clearTimeout(offsetTimer);
        offsetTimer = setTimeout(function () {
            cacheHeadingOffsets();
            applyActiveHeading(true);
        }, 200);
    }

    function scrollTocItemIntoView(item) {
        var listRect = tocList.getBoundingClientRect();
        var itemRect = item.getBoundingClientRect();
        if (listRect.height === 0) {
            return;
        }
        if (itemRect.top < listRect.top || itemRect.bottom > listRect.bottom) {
            var delta = itemRect.top - listRect.top - (listRect.height - itemRect.height) / 2;
            tocList.scrollTop += delta;
        }
    }

    function setActiveIndex(index) {
        if (index === activeIndex) {
            return;
        }
        activeIndex = index;
        var children = tocList.children;
        for (var i = 0; i < children.length; i++) {
            children[i].classList.toggle('is-active', i === index);
        }
        if (index >= 0 && children[index]) {
            scrollTocItemIntoView(children[index]);
        }
    }

    function buildTOC() {
        tocList.textContent = '';
        tocItems = [];
        activeIndex = -1;

        var headings = contentView.querySelectorAll('h1, h2, h3, h4, h5, h6');
        lastSignature = getContentSignature();

        if (!headings.length) {
            sidebar.classList.remove('has-items');
            collapseSidebar();
            return;
        }

        var fragment = document.createDocumentFragment();
        var usedIds = Object.create(null);

        headings.forEach(function (heading, index) {
            var level = headingLevel(heading.tagName);
            if (level === 0) {
                return;
            }

            var id = heading.id;
            if (!id) {
                var base = slugify(heading.textContent.trim()) || 'heading-' + index;
                id = base;
                var counter = 0;
                while (usedIds[id] || (document.getElementById(id) && document.getElementById(id) !== heading)) {
                    counter += 1;
                    id = base + '-' + counter;
                }
                heading.id = id;
            }
            usedIds[id] = true;

            var headingText = heading.textContent.trim();

            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'toc-item level-' + level;
            button.dataset.targetId = id;
            button.title = headingText;

            var marker = document.createElement('span');
            marker.className = 'toc-marker';

            var text = document.createElement('span');
            text.className = 'toc-text';
            text.textContent = headingText;

            button.appendChild(marker);
            button.appendChild(text);
            fragment.appendChild(button);

            tocItems.push({
                level: level,
                id: id,
                element: heading
            });
        });

        tocList.appendChild(fragment);

        if (!tocItems.length) {
            sidebar.classList.remove('has-items');
            collapseSidebar();
            return;
        }

        cacheHeadingOffsets();
        sidebar.classList.add('has-items');
        applyActiveHeading(true);
        attachImageListeners();
    }

    function attachImageListeners() {
        var images = contentView.querySelectorAll('img');
        images.forEach(function (img) {
            if (!img.complete) {
                img.addEventListener('load', scheduleOffsetRefresh, { once: true });
                img.addEventListener('error', scheduleOffsetRefresh, { once: true });
            }
        });
    }

    function applyActiveHeading(force) {
        if (isEditing() || !tocItems.length) {
            return;
        }
        if (isProgrammaticScroll && !force) {
            return;
        }
        if (!headingOffsets.length) {
            return;
        }

        var scrollPos = window.pageYOffset + ACTIVE_SCROLL_OFFSET;
        var next = -1;
        for (var i = 0; i < headingOffsets.length; i++) {
            if (headingOffsets[i] <= scrollPos) {
                next = i;
            }
        }

        var doc = document.documentElement;
        var atBottom = window.innerHeight + window.pageYOffset >= doc.scrollHeight - 8;
        if (atBottom) {
            next = headingOffsets.length - 1;
        }

        setActiveIndex(next);
    }

    function handleTocClick(event) {
        var button = event.target.closest('.toc-item');
        if (!button || !tocList.contains(button)) {
            return;
        }
        var target = document.getElementById(button.dataset.targetId);
        if (!target || !contentView.contains(target)) {
            return;
        }

        var index = Array.prototype.indexOf.call(tocList.children, button);

        isProgrammaticScroll = true;
        clearTimeout(programmaticScrollTimer);
        programmaticScrollTimer = setTimeout(function () {
            isProgrammaticScroll = false;
        }, 900);

        activeIndex = -2;
        setActiveIndex(index);

        target.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start'
        });
    }

    function copyText(text) {
        if (typeof window.copyTextToClipboard === 'function') {
            return window.copyTextToClipboard(text);
        }
        return Promise.reject(new Error('clipboard unavailable'));
    }

    function notifyCopyFailed() {
        if (typeof window.showNotification === 'function') {
            window.showNotification(t('copy_failed', 'Could not copy the link.'), 'error');
        }
    }

    function cleanCodeText(raw) {
        return String(raw || '').replace(/\n$/, '');
    }

    function enhanceCodeBlocks() {
        var pres = contentView.querySelectorAll('pre');
        pres.forEach(function (pre) {
            var host = null;
            var parent = pre.parentElement;

            if (parent && parent.classList.contains('codehilite')) {
                host = parent;
                host.classList.add('code-block-host');
            } else if (parent && parent.classList.contains('code-block-host')) {
                host = parent;
            } else if (parent) {
                host = document.createElement('div');
                host.className = 'code-block-host';
                parent.insertBefore(host, pre);
                host.appendChild(pre);
            }

            if (!host || host.querySelector('.code-copy-btn')) {
                return;
            }

            var label = t('copy_code', 'Copy code');
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'code-copy-btn';
            button.title = label;
            button.setAttribute('aria-label', label);

            var icon = document.createElement('span');
            icon.className = 'code-copy-icon';
            icon.innerHTML = COPY_ICON;

            var text = document.createElement('span');
            text.className = 'code-copy-label';
            text.textContent = label;

            button.appendChild(icon);
            button.appendChild(text);

            button.addEventListener('click', function () {
                var codeElement = pre.querySelector('code');
                var value = cleanCodeText(codeElement ? codeElement.textContent : pre.textContent);
                if (!value) {
                    return;
                }
                copyText(value).then(function () {
                    button.classList.add('is-copied');
                    icon.innerHTML = CHECK_ICON;
                    text.textContent = t('code_copied', 'Copied!');
                    clearTimeout(button._resetTimer);
                    button._resetTimer = setTimeout(function () {
                        button.classList.remove('is-copied');
                        icon.innerHTML = COPY_ICON;
                        text.textContent = label;
                    }, 1600);
                }).catch(notifyCopyFailed);
            });

            host.appendChild(button);
        });

        var inlineCodes = contentView.querySelectorAll('code');
        inlineCodes.forEach(function (code) {
            if (code.closest('pre') || code.dataset.copyReady === '1') {
                return;
            }
            code.dataset.copyReady = '1';
            code.classList.add('inline-code-copy');
            code.setAttribute('tabindex', '0');
            code.setAttribute('role', 'button');
            code.title = t('click_to_copy_code', 'Click to copy');

            function copyInline() {
                var value = cleanCodeText(code.textContent);
                if (!value) {
                    return;
                }
                copyText(value).then(function () {
                    code.classList.add('is-copied');
                    clearTimeout(code._resetTimer);
                    code._resetTimer = setTimeout(function () {
                        code.classList.remove('is-copied');
                    }, 1200);
                }).catch(notifyCopyFailed);
            }

            code.addEventListener('click', copyInline);
            code.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    copyInline();
                }
            });
        });
    }

    function updateProgress() {
        if (!progressFill || isEditing()) {
            return;
        }
        var doc = document.documentElement;
        var scrollable = doc.scrollHeight - window.innerHeight;
        var percent = 0;
        if (scrollable > 0) {
            percent = Math.min(100, Math.max(0, (window.pageYOffset / scrollable) * 100));
        }
        progressFill.style.width = percent + '%';
        if (progressText) {
            progressText.textContent = Math.round(percent) + '%';
        }
        if (progressContainer) {
            progressContainer.classList.toggle('is-scrolled', window.pageYOffset > 80);
        }
    }

    function updateReadingTime() {
        if (!progressTime) {
            return;
        }
        var i18n = window.i18n || {};
        var text = contentView.textContent || '';
        var words = text.split(/\s+/).filter(function (word) {
            return word.length > 0;
        }).length;
        var minutes = Math.ceil(words / 200);
        var display;

        if (minutes < 1) {
            display = i18n.lessThanOne || '<1 min';
        } else if (minutes === 1) {
            display = i18n.oneMinute || '1 min';
        } else {
            display = minutes + ' ' + (i18n.minutesFormat || 'min');
        }

        progressTime.textContent = display;
    }

    function handleScroll() {
        if (scrollFrame) {
            return;
        }
        scrollFrame = requestAnimationFrame(function () {
            scrollFrame = null;
            updateProgress();
            applyActiveHeading(false);
        });
    }

    function scheduleRebuild() {
        clearTimeout(rebuildTimer);
        rebuildTimer = setTimeout(function () {
            if (isEditing()) {
                return;
            }
            enhanceCodeBlocks();
            updateReadingTime();
            if (tocList.childElementCount > 0 && getContentSignature() === lastSignature) {
                cacheHeadingOffsets();
                return;
            }
            buildTOC();
            updateProgress();
        }, 250);
    }

    function initReveal() {
        var candidates = contentView.querySelectorAll(REVEAL_SELECTOR);
        var blocks = Array.prototype.filter.call(candidates, function (el) {
            if (el.tagName === 'PRE' && el.parentElement && el.parentElement.classList.contains('codehilite')) {
                return false;
            }
            return !el.classList.contains('is-visible');
        });

        if (!blocks.length) {
            return;
        }

        if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
            blocks.forEach(function (el) {
                el.classList.add('is-visible');
            });
            return;
        }

        var staggerIndex = 0;

        blocks.forEach(function (el) {
            el.classList.add('reveal');
        });

        var observer = new IntersectionObserver(function (entries) {
            var revealed = false;
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) {
                    return;
                }
                var el = entry.target;
                observer.unobserve(el);
                if (staggerIndex < 7 && el.getBoundingClientRect().top < window.innerHeight * 1.2) {
                    el.style.transitionDelay = (staggerIndex * 70) + 'ms';
                    staggerIndex += 1;
                    setTimeout(function () {
                        el.style.transitionDelay = '';
                    }, 1000);
                }
                el.classList.add('is-visible');
                revealed = true;
            });
            if (revealed) {
                scheduleOffsetRefresh();
            }
        }, {
            rootMargin: '0px 0px -6% 0px',
            threshold: 0.04
        });

        blocks.forEach(function (el) {
            observer.observe(el);
        });
    }

    function observeContent() {
        if (!('MutationObserver' in window)) {
            return;
        }
        var observer = new MutationObserver(function () {
            scheduleRebuild();
        });
        observer.observe(contentView, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    document.addEventListener('postContentUpdated', function () {
        scheduleRebuild();
        setTimeout(function () {
            enhanceCodeBlocks();
            initReveal();
            scheduleOffsetRefresh();
        }, 300);
    });

    tocList.addEventListener('click', handleTocClick);

    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            cacheHeadingOffsets();
            applyActiveHeading(true);
            updateProgress();
        }, 150);
    });

    window.addEventListener('load', function () {
        cacheHeadingOffsets();
        updateReadingTime();
        updateProgress();
    });

    window.addEventListener('scroll', handleScroll, { passive: true });

    function init() {
        initSidebarToggle();
        buildTOC();
        updateReadingTime();
        updateProgress();
        enhanceCodeBlocks();
        initReveal();
        observeContent();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();