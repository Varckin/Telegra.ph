(function() {
    'use strict';

    const sidebar = document.getElementById('nav-sidebar');
    const tocList = document.getElementById('toc-list');
    const topBtn = document.getElementById('scroll-top-btn');
    const bottomBtn = document.getElementById('scroll-bottom-btn');
    const pinBtn = document.getElementById('pin-btn');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const readingTimeEl = document.getElementById('reading-time');

    const lessThanOne = window.i18n.lessThanOne;
    const oneMinute = window.i18n.oneMinute;
    const minutesFormat = window.i18n.minutesFormat;
    const pinText = window.i18n.pin;
    const unpinText = window.i18n.unpin;

    let expandTimer = null;

    function slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 60);
    }

    function getHeadingLevel(tag) {
        const match = tag.match(/^H([1-6])$/i);
        return match ? parseInt(match[1], 10) : 0;
    }

    function buildTOC() {
        const content = document.getElementById('post-content-view');
        if (!content) return;

        const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
            sidebar.classList.remove('visible');
            return;
        }

        const items = [];
        headings.forEach((heading, index) => {
            const level = getHeadingLevel(heading.tagName);
            if (level === 0) return;

            let id = heading.id;
            if (!id) {
                const base = slugify(heading.textContent.trim());
                id = base || `heading-${index}`;
                let counter = 0;
                let uniqueId = id;
                while (document.getElementById(uniqueId) && document.getElementById(uniqueId) !== heading) {
                    counter++;
                    uniqueId = `${id}-${counter}`;
                }
                heading.id = uniqueId;
                id = uniqueId;
            }

            items.push({
                level: level,
                text: heading.textContent.trim(),
                id: id,
                element: heading
            });
        });

        if (items.length === 0) {
            sidebar.classList.remove('visible');
            return;
        }

        tocList.innerHTML = '';
        items.forEach((item) => {
            const li = document.createElement('div');
            li.role = 'listitem';
            li.className = `toc-item level-${item.level}`;
            li.textContent = item.text;
            li.dataset.targetId = item.id;

            li.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.getElementById(this.dataset.targetId);
                if (target) {
                    const topOffset = 20;
                    const targetRect = target.getBoundingClientRect();
                    const absoluteTop = window.pageYOffset + targetRect.top - topOffset;
                    window.scrollTo({
                        top: absoluteTop,
                        behavior: 'smooth'
                    });

                    document.querySelectorAll('.toc-item').forEach(el => el.classList.remove('active'));
                    this.classList.add('active');
                }
            });

            tocList.appendChild(li);
        });

        requestAnimationFrame(() => {
            sidebar.classList.add('visible');
        });

        let activeTimeout = null;
        function updateActiveTOC() {
            const scrollY = window.pageYOffset + 120;
            let activeIndex = -1;

            items.forEach((item, index) => {
                const el = item.element;
                if (!el) return;
                const rect = el.getBoundingClientRect();
                const top = rect.top + window.pageYOffset;
                if (top <= scrollY) {
                    activeIndex = index;
                }
            });

            const tocItems = tocList.querySelectorAll('.toc-item');
            tocItems.forEach((el, idx) => {
                if (idx === activeIndex) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            });

            if (activeIndex >= 0 && tocItems[activeIndex]) {
                const activeEl = tocItems[activeIndex];
                const container = tocList;
                const containerRect = container.getBoundingClientRect();
                const itemRect = activeEl.getBoundingClientRect();
                if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
                    activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }
        }

        function throttledUpdate() {
            if (activeTimeout) cancelAnimationFrame(activeTimeout);
            activeTimeout = requestAnimationFrame(() => {
                updateActiveTOC();
                activeTimeout = null;
            });
        }

        window.addEventListener('scroll', throttledUpdate, { passive: true });
        setTimeout(updateActiveTOC, 100);
    }

    function updateReadingProgress() {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) {
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
            return;
        }
        const scrolled = window.pageYOffset;
        const percent = Math.min(100, (scrolled / scrollHeight) * 100);
        const rounded = Math.round(percent);
        progressFill.style.width = percent + '%';
        progressText.textContent = rounded + '%';
    }

    function updateReadingTime() {
        const contentView = document.getElementById('post-content-view');
        if (!contentView) {
            readingTimeEl.textContent = '–';
            return;
        }
        const text = contentView.textContent || '';
        const words = text.split(/\s+/).filter(w => w.length > 0).length;
        const wordsPerMinute = 200;
        const minutes = Math.ceil(words / wordsPerMinute);
        let display;
        if (minutes < 1) {
            display = lessThanOne;
        } else if (minutes === 1) {
            display = oneMinute;
        } else {
            display = minutes + ' ' + minutesFormat;
        }
        readingTimeEl.textContent = display;
    }

    function updateAll() {
        updateReadingProgress();
        updateReadingTime();
    }

    let scrollTimeout = null;
    function throttledScrollUpdate() {
        if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
        scrollTimeout = requestAnimationFrame(() => {
            updateReadingProgress();
            scrollTimeout = null;
        });
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function scrollToBottom() {
        const bottom = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: bottom, behavior: 'smooth' });
    }

    function togglePin() {
        sidebar.classList.toggle('pinned');
        if (sidebar.classList.contains('pinned')) {
            pinBtn.classList.add('active');
            pinBtn.setAttribute('aria-label', unpinText);
            pinBtn.setAttribute('title', unpinText);
            clearTimeout(expandTimer);
            sidebar.classList.remove('expanded');
        } else {
            pinBtn.classList.remove('active');
            pinBtn.setAttribute('aria-label', pinText);
            pinBtn.setAttribute('title', pinText);
        }
    }

    function handleMouseEnter() {
        if (sidebar.classList.contains('pinned')) return;
        clearTimeout(expandTimer);
        expandTimer = setTimeout(() => {
            sidebar.classList.add('expanded');
            expandTimer = null;
        }, 2500);
    }

    function handleMouseLeave() {
        if (sidebar.classList.contains('pinned')) return;
        clearTimeout(expandTimer);
        expandTimer = null;
        sidebar.classList.remove('expanded');
    }

    if (topBtn) topBtn.addEventListener('click', scrollToTop);
    if (bottomBtn) bottomBtn.addEventListener('click', scrollToBottom);
    if (pinBtn) pinBtn.addEventListener('click', togglePin);

    sidebar.addEventListener('mouseenter', handleMouseEnter);
    sidebar.addEventListener('mouseleave', handleMouseLeave);

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey && e.key === 'ArrowUp') || (e.key === 'Home' && !e.ctrlKey && !e.metaKey)) {
            e.preventDefault();
            scrollToTop();
        }
        if ((e.ctrlKey && e.key === 'ArrowDown') || (e.key === 'End' && !e.ctrlKey && !e.metaKey)) {
            e.preventDefault();
            scrollToBottom();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            buildTOC();
            updateAll();
            window.addEventListener('scroll', throttledScrollUpdate, { passive: true });
        });
    } else {
        setTimeout(function() {
            buildTOC();
            updateAll();
            window.addEventListener('scroll', throttledScrollUpdate, { passive: true });
        }, 100);
    }

    const observer = new MutationObserver(function() {
        clearTimeout(window._tocRebuildTimer);
        window._tocRebuildTimer = setTimeout(() => {
            const content = document.getElementById('post-content-view');
            if (content && content.innerHTML.length > 0) {
                tocList.innerHTML = '';
                sidebar.classList.remove('visible');
                buildTOC();
                updateAll();
            }
        }, 500);
    });

    const contentView = document.getElementById('post-content-view');
    if (contentView) {
        observer.observe(contentView, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    document.addEventListener('postContentUpdated', function() {
        tocList.innerHTML = '';
        sidebar.classList.remove('visible');
        setTimeout(function() {
            buildTOC();
            updateAll();
        }, 150);
    });
})();