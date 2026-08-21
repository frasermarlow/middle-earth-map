/*
 * Tiny i18n runtime for a static site with no build step.
 *
 * Design rule: English is never fetched. Every call site passes the English
 * string as its fallback, and the static markup keeps its English text, so
 * with no catalogue loaded the pages render byte-identically to before.
 *
 * A localised page (e.g. /de/index.html) inlines its catalogue ahead of this
 * script:
 *
 *     <script>window.__I18N__ = { ...contents of i18n/de.json... }</script>
 *
 * which means translations are present on first paint — no fetch, no flash of
 * English, and crawlers see the localised text.
 *
 * ?lang=xx fetches i18n/xx.json instead. That path is for previewing and for
 * pseudo-locale QA: it repaints the static markup and anything registered via
 * i18nOnReady(), so treat it as a preview rather than as production.
 */
(function () {
    'use strict';

    var FALLBACK = 'en';
    var params = new URLSearchParams(location.search);
    var requested = (params.get('lang') || document.documentElement.lang || FALLBACK)
        .toLowerCase().slice(0, 5);
    var catalogue = window.__I18N__ || null;
    var readyHooks = [];

    function lookup(key) {
        if (!catalogue) return null;
        var node = catalogue;
        var parts = key.split('.');
        for (var i = 0; i < parts.length; i++) {
            if (node == null || typeof node !== 'object') return null;
            node = node[parts[i]];
        }
        return typeof node === 'string' ? node : null;
    }

    function interpolate(str, vars) {
        if (!vars) return str;
        return str.replace(/\{(\w+)\}/g, function (whole, name) {
            return Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole;
        });
    }

    /**
     * t('legend.satelliteView', 'Satellite view')
     * t('map.coordReadout', 'px: {px}, py: {py}', { px: 10, py: 20 })
     *
     * The second argument is the English source string and is what renders
     * whenever no catalogue supplies the key. Never omit it.
     */
    window.t = function (key, fallback, vars) {
        var hit = lookup(key);
        return interpolate(hit == null ? (fallback == null ? key : fallback) : hit, vars);
    };

    /*
     * Swaps static markup in place. Supported attributes:
     *   data-i18n="key"                  -> textContent
     *   data-i18n-html="key"             -> innerHTML (for strings with links)
     *   data-i18n-attr="title:key"       -> attribute, comma-separated for several
     */
    window.i18nApply = function (root) {
        if (!catalogue) return 0;
        var scope = root || document;
        var applied = 0;

        scope.querySelectorAll('[data-i18n]').forEach(function (el) {
            var v = lookup(el.getAttribute('data-i18n'));
            if (v != null) { el.textContent = v; applied++; }
        });
        scope.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            var v = lookup(el.getAttribute('data-i18n-html'));
            if (v != null) { el.innerHTML = v; applied++; }
        });
        scope.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
            el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
                var bits = pair.split(':');
                if (bits.length !== 2) return;
                var v = lookup(bits[1].trim());
                if (v != null) { el.setAttribute(bits[0].trim(), v); applied++; }
            });
        });
        return applied;
    };

    /* Register work that must re-run if a catalogue arrives after first paint. */
    window.i18nOnReady = function (fn) {
        if (catalogue) { fn(); return; }
        readyHooks.push(fn);
    };

    window.i18nLang = requested;
    window.i18nHasCatalogue = function () { return !!catalogue; };

    /*
     * No inlined catalogue, but a language was asked for. This is the preview
     * and pseudo-locale QA path, so the catalogue is loaded synchronously:
     * this script blocks, which means the page scripts below it see a fully
     * populated catalogue and every t() call — including the ones that build
     * the legend and the timeline cards — resolves on first render. An async
     * fetch would leave all of those stuck in English.
     *
     * Sync XHR is deprecated and never runs for real visitors: English does
     * not fetch at all, and localised pages inline their catalogue instead.
     */
    if (!catalogue && requested.split('-')[0] !== FALLBACK) {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'i18n/' + requested + '.json', false);
            xhr.send(null);
            if (xhr.status >= 200 && xhr.status < 300) {
                catalogue = JSON.parse(xhr.responseText);
            } else {
                console.warn('[i18n] no catalogue for "' + requested + '" (HTTP ' + xhr.status + '), staying in English');
            }
        } catch (err) {
            console.warn('[i18n] could not load "' + requested + '", staying in English:', err.message);
        }
    }

    /* Static markup carries English inline, so it needs swapping once. */
    if (catalogue) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                window.i18nApply(document);
                readyHooks.forEach(function (fn) { fn(); });
            });
        } else {
            window.i18nApply(document);
            readyHooks.forEach(function (fn) { fn(); });
        }
    }
})();
