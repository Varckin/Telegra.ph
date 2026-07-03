(function() {
    'use strict';

    const sidebar = document.getElementById('nav-sidebar');
    const tocList = document.getElementById('toc-wrapper').querySelector('.ds-virtual-list-visible-items');
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
    let isScrollingToHeading = false;
    let tocItems = [];
    let scrollRaf = null;

    document.querySelectorAll('.nav-arrow').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            clearTimeout(expandTimer);
            expandTimer = null;
        });
    });

    function showSidebar() {
        sidebar.classList.add('visible');
    }

    function hideSidebar() {
        sidebar.classList.remove('visible');
        if (!sidebar.classList.contains('pinned')) {
            sidebar.classList.remove('expanded');
        }
    }

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
            tocItems = [];
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
            tocItems = [];
            return;
        }

        tocItems = items;

        tocList.innerHTML = '';
        items.forEach((item) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = '_81e7b5e level-' + item.level;
            itemDiv.dataset.targetId = item.id;

            const textDiv = document.createElement('div');
            textDiv.className = '_72b6158';
            textDiv.textContent = item.text;

            const extraDiv = document.createElement('div');
            extraDiv.className = 'ef46fbc6';
            const dotDiv = document.createElement('div');
            dotDiv.className = 'fae5876e';
            extraDiv.appendChild(dotDiv);

            itemDiv.appendChild(textDiv);
            itemDiv.appendChild(extraDiv);

            itemDiv.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.getElementById(this.dataset.targetId);
                if (target) {
                    isScrollingToHeading = true;
                    const topOffset = 20;
                    const targetRect = target.getBoundingClientRect();
                    const absoluteTop = window.pageYOffset + targetRect.top - topOffset;
                    window.scrollTo({
                        top: absoluteTop,
                        behavior: 'smooth'
                    });

                    document.querySelectorAll('._81e7b5e').forEach(el => el.classList.remove('_19d617c'));
                    this.classList.add('_19d617c');

                    setTimeout(() => {
                        isScrollingToHeading = false;
                    }, 500);
                }
            });

            tocList.appendChild(itemDiv);
        });

        requestAnimationFrame(() => {
            sidebar.classList.add('visible');
        });

        setTimeout(updateActiveTOC, 100);
    }

    function updateActiveTOC() {
        if (isScrollingToHeading) return;
        if (tocItems.length === 0) return;

        const scrollY = window.pageYOffset + 120;
        let activeIndex = -1;

        tocItems.forEach((item, index) => {
            const el = item.element;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const top = rect.top + window.pageYOffset;
            if (top <= scrollY) {
                activeIndex = index;
            }
        });

        const tocItemElements = tocList.querySelectorAll('._81e7b5e');
        tocItemElements.forEach((el, idx) => {
            if (idx === activeIndex) {
                el.classList.add('_19d617c');
            } else {
                el.classList.remove('_19d617c');
            }
        });

        if (activeIndex >= 0 && tocItemElements[activeIndex]) {
            const activeEl = tocItemElements[activeIndex];
            const container = tocList.closest('.ds-virtual-list');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const itemRect = activeEl.getBoundingClientRect();
                if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
                    activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }
        }
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

    function handleScroll() {
        if (scrollRaf) cancelAnimationFrame(scrollRaf);
        scrollRaf = requestAnimationFrame(() => {
            updateReadingProgress();
            updateActiveTOC();
            scrollRaf = null;
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

    function handleMouseEnter(e) {
        if (sidebar.classList.contains('pinned')) return;
        if (e.target.closest('.nav-arrow')) return;
        clearTimeout(expandTimer);
        expandTimer = setTimeout(() => {
            sidebar.classList.add('expanded');
            expandTimer = null;
        }, 500);
    }

    function handleMouseLeave(e) {
        if (sidebar.classList.contains('pinned')) return;
        if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('#nav-sidebar')) return;
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

    const editBtn = document.getElementById('edit-button');
    const cancelBtn = document.getElementById('cancel-button');

    if (editBtn) {
        editBtn.addEventListener('click', hideSidebar);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            showSidebar();
        });
    }

    document.addEventListener('postContentUpdated', function() {
        tocList.innerHTML = '';
        sidebar.classList.remove('visible');
        setTimeout(function() {
            buildTOC();
            updateReadingTime();
            updateReadingProgress();
            showSidebar();
        }, 150);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            buildTOC();
            updateReadingTime();
            updateReadingProgress();
            window.addEventListener('scroll', handleScroll, { passive: true });
        });
    } else {
        setTimeout(function() {
            buildTOC();
            updateReadingTime();
            updateReadingProgress();
            window.addEventListener('scroll', handleScroll, { passive: true });
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
                updateReadingTime();
                updateReadingProgress();
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
})();