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
     saved guides — a small personal dashboard, stored in this browser only
     ========================================================================== */
  var savedKey = "takarazuka-life-saved-v1";
  var saveButtons = Array.prototype.slice.call(document.querySelectorAll("[data-save-item]"));
  var savedPanel = document.getElementById("saved-guides");
  var savedList = document.getElementById("saved-list");
  var savedClear = document.getElementById("saved-clear");

  function readSaved() {
    try {
      var raw = JSON.parse(window.localStorage.getItem(savedKey) || "[]");
      return Array.isArray(raw) ? raw.filter(function (item) {
        return item && typeof item.id === "string" && typeof item.title === "string" &&
          typeof item.url === "string" && item.url.indexOf("/life/") === 0;
      }).slice(0, 24) : [];
    } catch (err) {
      return [];
    }
  }
  function writeSaved(items) {
    try { window.localStorage.setItem(savedKey, JSON.stringify(items.slice(0, 24))); } catch (err) { /* storage can be disabled */ }
  }
  function saveData(button) {
    return {
      id: button.getAttribute("data-save-id") || "",
      title: button.getAttribute("data-save-title") || "",
      url: button.getAttribute("data-save-url") || "",
      category: button.getAttribute("data-save-category") || "生活情報",
      color: button.getAttribute("data-save-color") || "procedure"
    };
  }
  function isSaved(id, saved) {
    return saved.some(function (item) { return item.id === id; });
  }
  function updateSaveButtons(saved) {
    saveButtons.forEach(function (button) {
      var active = isSaved(button.getAttribute("data-save-id"), saved);
      button.hidden = false;
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.setAttribute("aria-label", active ? "あとで見るから削除" : "あとで見るに保存");
      var label = button.querySelector("span");
      if (label) label.textContent = active ? "保存済み" : "あとで見る";
    });
  }
  function renderSaved(saved) {
    if (!savedPanel || !savedList) return;
    savedPanel.hidden = !saved.length;
    if (!saved.length) { savedList.innerHTML = ""; return; }
    savedList.innerHTML = saved.map(function (item) {
      return '<li style="--saved-color: var(--c-' + escHtml(item.color) + ')">' +
        '<a class="saved-link" href="' + escHtml(item.url) + '">' +
        '<span class="saved-title">' + escHtml(item.title) + '</span>' +
        '<span class="saved-category">' + escHtml(item.category) + '</span></a>' +
        '<button class="saved-remove" type="button" data-remove-saved="' + escHtml(item.id) + '" aria-label="' + escHtml(item.title) + 'を削除">×</button></li>';
    }).join("");
    Array.prototype.slice.call(savedList.querySelectorAll("[data-remove-saved]")).forEach(function (button) {
      button.addEventListener("click", function () {
        var next = readSaved().filter(function (item) { return item.id !== button.getAttribute("data-remove-saved"); });
        writeSaved(next); updateSaveButtons(next); renderSaved(next);
      });
    });
  }
  if (saveButtons.length || savedPanel) {
    var initialSaved = readSaved();
    updateSaveButtons(initialSaved);
    renderSaved(initialSaved);
    saveButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var current = readSaved();
        var item = saveData(button);
        var next = isSaved(item.id, current)
          ? current.filter(function (saved) { return saved.id !== item.id; })
          : [item].concat(current);
        writeSaved(next); updateSaveButtons(next); renderSaved(next);
      });
    });
    if (savedClear) savedClear.addEventListener("click", function () {
      writeSaved([]); updateSaveButtons([]); renderSaved([]);
    });
  }

  /* ==========================================================================
     local-life desk — area, children, care, and a printable disaster card
     No address or contact detail is written to storage.
     ========================================================================== */
  var lifeToolsDataEl = document.getElementById("life-tools-data");
  if (lifeToolsDataEl) {
    var lifeToolsData = null;
    try { lifeToolsData = JSON.parse(lifeToolsDataEl.textContent || "{}"); } catch (err) { lifeToolsData = null; }
    if (lifeToolsData && Array.isArray(lifeToolsData.areas)) {
      var profileKey = "takarazuka-life-profile-v1";
      var areaSelect = document.getElementById("local-area");
      var childAgeSelect = document.getElementById("local-child-age");
      var profileSave = document.getElementById("local-profile-save");
      var profileReset = document.getElementById("local-profile-reset");
      var profileStatus = document.getElementById("local-profile-status");
      var districtLede = document.getElementById("district-lede");
      var districtResult = document.getElementById("district-result");
      var careAreaResult = document.getElementById("care-area-result");
      var disasterAreaResult = document.getElementById("disaster-area-result");
      var childWeekLede = document.getElementById("child-week-lede");
      var childWeekList = document.getElementById("child-week-list");
      var printCard = document.getElementById("print-disaster-card");
      var areas = lifeToolsData.areas;
      var events = Array.isArray(lifeToolsData.events) ? lifeToolsData.events : [];
      var shelters = Array.isArray(lifeToolsData.shelters) ? lifeToolsData.shelters : [];
      var toolUrls = lifeToolsData.urls || {};
      var childTerms = ["子ども", "親子", "乳幼児", "幼児", "児童", "赤ちゃん", "保護者", "ファミリー", "子育て", "小学生", "中学生", "高校生", "夏休み", "育児"];
      var ageTerms = {
        pregnancy: ["妊娠", "妊婦", "プレママ", "出産", "赤ちゃん", "親子"],
        baby: ["赤ちゃん", "乳児", "乳幼児", "0歳", "1歳", "2歳", "親子", "子育て"],
        preschool: ["幼児", "未就学", "親子", "子ども", "子育て", "年長"],
        school: ["小学生", "児童", "夏休み", "子ども", "親子"],
        teen: ["中学生", "高校生", "中高生", "学生", "子ども"],
      };

      function todayJst() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
      function formatDate(date) {
        var parts = String(date || "").split("-");
        return parts.length === 3 ? Number(parts[1]) + "/" + Number(parts[2]) : "日程未定";
      }
      function readProfile() {
        try {
          var saved = JSON.parse(window.localStorage.getItem(profileKey) || "{}");
          return {
            area: areas.some(function (area) { return area.id === saved.area; }) ? saved.area : "",
            childAge: ageTerms[saved.childAge] ? saved.childAge : "",
          };
        } catch (err) { return { area: "", childAge: "" }; }
      }
      function writeProfile(profile) {
        try { window.localStorage.setItem(profileKey, JSON.stringify(profile)); } catch (err) { /* storage may be disabled */ }
      }
      function activeEvent(event, day) { return (event.dateEnd || event.date || "") >= day; }
      function eventText(event) { return String(event.title || "") + " " + String(event.place || "") + " " + String(event.desc || "") + " " + (Array.isArray(event.target) ? event.target.join(" ") : ""); }
      function areaEventText(event) { return String(event.title || "") + " " + String(event.place || ""); }
      function childEvent(event, age) {
        var text = eventText(event);
        var terms = age && ageTerms[age] ? ageTerms[age] : childTerms;
        return terms.some(function (term) { return text.indexOf(term) !== -1; });
      }
      function areaById(id) { return areas.filter(function (area) { return area.id === id; })[0] || null; }
      function safeLink(url) { return /^https?:\/\//i.test(String(url || "")) || String(url || "").indexOf("/") === 0 ? String(url) : ""; }
      function eventMarkup(event) {
        var url = safeLink(event.url);
        var deadline = event.application && event.deadline && event.deadline >= todayJst() ? " <small>申込締切 " + escHtml(formatDate(event.deadline)) + "</small>" : "";
        return "<li><span>" + escHtml(formatDate(event.date)) + "</span><div>" +
          (url ? '<a href="' + escHtml(url) + '" rel="noopener">' + escHtml(event.title) + "</a>" : escHtml(event.title)) +
          (event.place ? '<small class="tool-event-place">' + escHtml(event.place) + "</small>" : "") + deadline + "</div></li>";
      }
      function renderChildWeek(profile) {
        if (!childWeekList) return;
        var now = todayJst();
        var end = new Date(now + "T00:00:00+09:00"); end.setDate(end.getDate() + 7);
        var endKey = end.getFullYear() + "-" + String(end.getMonth() + 1).padStart(2, "0") + "-" + String(end.getDate()).padStart(2, "0");
        var matching = events.filter(function (event) { return activeEvent(event, now) && childEvent(event, profile.childAge); });
        var thisWeek = matching.filter(function (event) { return event.date <= endKey; }).slice(0, 4);
        var visible = thisWeek.length ? thisWeek : matching.slice(0, 4);
        if (!visible.length) {
          childWeekList.innerHTML = "<li>今週・近日の該当イベントは見つかりませんでした。公式の子育て情報をご確認ください。</li>";
          if (childWeekLede) childWeekLede.textContent = "年齢に合う公式イベントを毎週の更新データから探します。";
          return;
        }
        childWeekList.innerHTML = visible.map(eventMarkup).join("");
        if (childWeekLede) childWeekLede.textContent = thisWeek.length ? "今週の候補です。申込要否・対象年齢はリンク先で確認してください。" : "今週の候補が少ないため、次に予定されているものを表示しています。";
      }
      function renderArea(profile) {
        var area = areaById(profile.area);
        if (!area) {
          if (districtLede) districtLede.textContent = "地域を選ぶと、介護の相談先と近隣候補の避難所をこの場に出します。";
          if (districtResult) districtResult.hidden = true;
          if (careAreaResult) careAreaResult.textContent = "地域を設定すると、最初に相談する窓口を表示します。";
          if (disasterAreaResult) disasterAreaResult.textContent = "地域を設定すると、近隣候補の避難所を最大3件表示します。";
          return;
        }
        var careUrl = safeLink(toolUrls.care);
        var careLink = careUrl ? '<a href="' + escHtml(careUrl) + '" rel="noopener">公式一覧で担当地区を確認</a>' : "";
        var careHtml = "<strong>最初の相談先: " + escHtml(area.care) + "</strong><br>電話 <a href=\"tel:" + escHtml(String(area.phone || "").replace(/[^0-9+]/g, "")) + "\">" + escHtml(area.phone) + "</a><br><small>町名によって担当が分かれる場合があります。" + careLink + "</small>";
        var nearbyEvents = events.filter(function (event) {
          return activeEvent(event, todayJst()) && area.keywords.some(function (keyword) { return areaEventText(event).indexOf(keyword) !== -1; });
        }).slice(0, 2);
        var localEvents = nearbyEvents.length ? '<div class="area-events"><b>この地区に関係する予定</b><ul>' + nearbyEvents.map(function (event) {
          var url = safeLink(event.url);
          var title = url ? '<a href="' + escHtml(url) + '" rel="noopener">' + escHtml(event.title) + "</a>" : escHtml(event.title);
          return "<li>" + title + "<span>" + escHtml(formatDate(event.date)) + "</span></li>";
        }).join("") + "</ul></div>" : "";
        if (districtLede) districtLede.textContent = area.label + "を表示しています。ごみの収集日は町名単位で確認してください。";
        if (districtResult) { districtResult.hidden = false; districtResult.innerHTML = careHtml + localEvents; }
        if (careAreaResult) careAreaResult.innerHTML = careHtml;
        var nearby = shelters.filter(function (shelter) {
          var text = String(shelter.name || "") + " " + String(shelter.address || "");
          return area.keywords.some(function (keyword) { return text.indexOf(keyword) !== -1; });
        }).slice(0, 3);
        if (!nearby.length) {
          if (disasterAreaResult) disasterAreaResult.innerHTML = "<strong>避難所候補を自動で絞り込めませんでした。</strong><br><a href=\"" + escHtml(safeLink(toolUrls.disaster)) + "\">避難所一覧から確認する</a>";
          return;
        }
        var shelterLinks = nearby.map(function (shelter) {
          var query = encodeURIComponent((shelter.name || "") + " " + (shelter.address || "") + " 宝塚市");
          return '<a href="https://www.google.com/maps/search/?api=1&amp;query=' + query + '" rel="noopener">' + escHtml(shelter.name) + "</a>";
        }).join("");
        if (disasterAreaResult) disasterAreaResult.innerHTML = "<strong>" + escHtml(area.label) + "の近隣候補</strong><br><span class=\"area-links\">" + shelterLinks + "</span><small>開設状況と対応災害は、必ず市の発表で確認してください。</small>";
      }
      function renderProfile(profile) {
        if (areaSelect) areaSelect.value = profile.area;
        if (childAgeSelect) childAgeSelect.value = profile.childAge;
        if (profileReset) profileReset.hidden = !(profile.area || profile.childAge);
        renderArea(profile); renderChildWeek(profile);
      }
      var profile = readProfile();
      renderProfile(profile);
      if (profileSave) profileSave.addEventListener("click", function () {
        profile = { area: areaSelect ? areaSelect.value : "", childAge: childAgeSelect ? childAgeSelect.value : "" };
        writeProfile(profile); renderProfile(profile);
        if (profileStatus) profileStatus.textContent = "この端末に設定を保存しました。";
      });
      if (profileReset) profileReset.addEventListener("click", function () {
        profile = { area: "", childAge: "" };
        try { window.localStorage.removeItem(profileKey); } catch (err) { /* storage may be disabled */ }
        renderProfile(profile);
        if (profileStatus) profileStatus.textContent = "設定を消しました。";
      });
      if (areaSelect) areaSelect.addEventListener("change", function () { renderArea({ area: areaSelect.value, childAge: childAgeSelect ? childAgeSelect.value : "" }); });
      if (childAgeSelect) childAgeSelect.addEventListener("change", function () { renderChildWeek({ area: areaSelect ? areaSelect.value : "", childAge: childAgeSelect.value }); });
      if (printCard) {
        var clearPrintMode = function () { document.body.classList.remove("print-disaster"); };
        window.addEventListener("afterprint", clearPrintMode);
        printCard.addEventListener("click", function () { document.body.classList.add("print-disaster"); window.setTimeout(function () { window.print(); }, 0); });
      }
    }
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
