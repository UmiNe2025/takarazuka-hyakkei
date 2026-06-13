/* 宝塚くらしの便利帳 — progressive enhancement（マルチページ）
   ページは JS なしで全文閲覧可能。ここでは
     - 全ページ横断検索（/life/search-index.json を読み込み、結果を該当ページ#項目へリンク）
     - オープンデータ表の絞り込み
     - イベント「もっと見る」
     - ページ上部へ戻る
   のみを追加する。 */
(function () {
  "use strict";

  /* ---------- text normalize: 全角→半角 / カタカナ→ひらがな / 小文字 ---------- */
  function norm(s) {
    return (s || "")
      .toLowerCase()
      .replace(/[！-～]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0); })
      .replace(/[ァ-ヶ]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) - 0x60); })
      .replace(/\s+/g, " ");
  }
  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ==========================================================================
     cross-page search
     ========================================================================== */
  var input = document.getElementById("q");
  var clearBtn = document.getElementById("q-clear");
  var resultsBox = document.getElementById("q-results");

  if (input && clearBtn && resultsBox) {
    var index = null;          // lazy-loaded search index
    var loading = false;
    var debounce = null;

    function ensureIndex(cb) {
      if (index) { cb(); return; }
      if (loading) return;
      loading = true;
      fetch("/life/search-index.json", { cache: "force-cache" })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (data) {
          index = (data || []).map(function (e) {
            return { e: e, hay: norm(e.t + " " + e.s + " " + e.g + " " + e.c) };
          });
          loading = false; cb();
        })
        .catch(function () { loading = false; index = []; cb(); });
    }

    function closeResults() {
      resultsBox.hidden = true;
      resultsBox.innerHTML = "";
    }

    function render(q) {
      var terms = norm(q).split(" ").filter(Boolean);
      if (!terms.length) { closeResults(); return; }
      var hits = index.filter(function (row) {
        return terms.every(function (w) { return row.hay.indexOf(w) !== -1; });
      }).slice(0, 12);

      if (!hits.length) {
        resultsBox.innerHTML = '<p class="sr-empty">「' + escHtml(q.trim()) +
          '」は見つかりませんでした。別の言葉でお試しください（例: ごみ、引越し、夜間、児童手当）。</p>';
        resultsBox.hidden = false;
        return;
      }
      resultsBox.innerHTML = hits.map(function (row) {
        var e = row.e;
        return '<a class="sr-item" href="' + escHtml(e.u) + '" role="option" style="--cat: var(--c-' + escHtml(e.color) + ')">' +
          '<span class="sr-cat">' + escHtml(e.c) + "</span>" +
          '<span class="sr-t">' + escHtml(e.t) + "</span>" +
          '<span class="sr-s">' + escHtml(e.s) + "</span>" +
          "</a>";
      }).join("");
      resultsBox.hidden = false;
    }

    function onInput() {
      var q = input.value;
      clearBtn.hidden = !q;
      clearTimeout(debounce);
      if (!q.trim()) { closeResults(); return; }
      debounce = setTimeout(function () {
        ensureIndex(function () { render(q); });
      }, 120);
    }

    input.addEventListener("input", onInput);
    input.addEventListener("focus", function () { if (input.value.trim() && index) render(input.value); });
    clearBtn.addEventListener("click", function () {
      input.value = ""; clearBtn.hidden = true; closeResults(); input.focus();
    });
    /* Enter → 先頭の結果へ */
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        var first = resultsBox.querySelector(".sr-item");
        if (first) { ev.preventDefault(); window.location.href = first.getAttribute("href"); }
      } else if (ev.key === "Escape") {
        closeResults();
      }
    });
    /* クリック外で閉じる */
    document.addEventListener("click", function (ev) {
      if (!resultsBox.contains(ev.target) && ev.target !== input && !input.contains(ev.target)) closeResults();
    });
  }

  /* ==========================================================================
     open-data table / event filters
     ========================================================================== */
  Array.prototype.slice.call(document.querySelectorAll("[data-odfilter]")).forEach(function (box) {
    var f = box.querySelector("input");
    var sel = box.querySelector("select");
    var rows = Array.prototype.slice.call(box.querySelectorAll("tbody tr, .ev-item"));
    var count = box.querySelector(".od-count");
    var total = rows.length;
    rows.forEach(function (r) { r.setAttribute("data-norm", norm(r.textContent)); });
    function apply() {
      var q = f ? norm(f.value.trim()) : "";
      var area = sel ? sel.value : "";
      var shown = 0;
      rows.forEach(function (r) {
        var ok = (!q || r.getAttribute("data-norm").indexOf(q) !== -1) &&
                 (!area || (r.getAttribute("data-area") || "") === area);
        r.style.display = ok ? "" : "none";
        if (ok) shown++;
      });
      if (count) count.textContent = shown === total ? total + "件" : shown + "件 / " + total + "件";
    }
    if (f) f.addEventListener("input", apply);
    if (sel) sel.addEventListener("change", apply);
    apply();
  });

  /* ==========================================================================
     events: show more
     ========================================================================== */
  var evMore = document.getElementById("ev-more-btn");
  if (evMore) {
    evMore.addEventListener("click", function () {
      Array.prototype.slice.call(document.querySelectorAll(".ev-item[hidden]")).forEach(function (li) {
        li.removeAttribute("hidden");
      });
      evMore.parentNode.removeChild(evMore);
    });
  }

  /* ==========================================================================
     back to top
     ========================================================================== */
  var top = document.getElementById("to-top");
  if (top) {
    var onScroll = function () { top.classList.toggle("on", window.scrollY > 900); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }
})();
