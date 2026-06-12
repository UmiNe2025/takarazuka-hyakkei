/* 宝塚くらしの便利帳 — progressive enhancement
   ページは JS なしで全文閲覧可能。ここでは検索・絞り込み・ナビ連動のみ追加する。 */
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

  /* ---------- global search ---------- */
  var input = document.getElementById("q");
  var clearBtn = document.getElementById("q-clear");
  var meta = document.getElementById("q-meta");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".item-card"));
  var sections = Array.prototype.slice.call(document.querySelectorAll(".cat-section"));

  cards.forEach(function (c) { c.setAttribute("data-norm", norm(c.textContent)); });

  function runSearch() {
    var q = norm(input.value.trim());
    var on = q.length >= 1;
    document.body.classList.toggle("search-active", on);
    clearBtn.classList.toggle("on", on);
    if (!on) {
      cards.forEach(function (c) { c.removeAttribute("data-hidden"); c.classList.remove("hit"); });
      sections.forEach(function (s) { s.removeAttribute("data-empty"); });
      meta.textContent = "";
      return;
    }
    var terms = q.split(" ").filter(Boolean);
    var hits = 0;
    cards.forEach(function (c) {
      var t = c.getAttribute("data-norm");
      var ok = terms.every(function (w) { return t.indexOf(w) !== -1; });
      c.setAttribute("data-hidden", ok ? "0" : "1");
      c.classList.toggle("hit", ok);
      if (ok) hits++;
    });
    sections.forEach(function (s) {
      var any = s.querySelector('.item-card[data-hidden="0"]');
      s.setAttribute("data-empty", any ? "0" : "1");
    });
    meta.innerHTML = hits
      ? "<b>" + hits + "件</b>ヒットしました"
      : "見つかりませんでした — 別の言葉でお試しください（例: ごみ、引越し、夜間）";
  }

  if (input) {
    var t = null;
    input.addEventListener("input", function () {
      clearTimeout(t); t = setTimeout(runSearch, 120);
    });
    clearBtn.addEventListener("click", function () {
      input.value = ""; runSearch(); input.focus();
    });
  }

  /* ---------- catnav scrollspy ---------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll(".catchip[data-target]"));
  var byId = {};
  chips.forEach(function (ch) { byId[ch.getAttribute("data-target")] = ch; });
  if ("IntersectionObserver" in window && chips.length) {
    var current = null;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) {
          if (current) current.removeAttribute("aria-current");
          current = byId[e.target.id];
          if (current) {
            current.setAttribute("aria-current", "true");
            current.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
          }
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- open-data table filters ---------- */
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

  /* ---------- events: show more ---------- */
  var evMore = document.getElementById("ev-more-btn");
  if (evMore) {
    evMore.addEventListener("click", function () {
      Array.prototype.slice.call(document.querySelectorAll(".ev-item[hidden]")).forEach(function (li) {
        li.removeAttribute("hidden");
      });
      evMore.parentNode.removeChild(evMore);
    });
  }

  /* ---------- back to top ---------- */
  var top = document.getElementById("to-top");
  if (top) {
    var onScroll = function () { top.classList.toggle("on", window.scrollY > 900); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }
})();
