/* privacy.html 用の軽量言語トグル（main.js 非依存・CSP対応の外部スクリプト） */
(function () {
  "use strict";
  var html = document.documentElement;
  var btnJa = document.getElementById("btn-ja");
  var btnEn = document.getElementById("btn-en");
  function set(l) {
    html.setAttribute("data-lang", l);
    html.setAttribute("lang", l);
    btnJa.setAttribute("aria-pressed", String(l === "ja"));
    btnEn.setAttribute("aria-pressed", String(l === "en"));
    try { localStorage.setItem("tkz-lang", l); } catch (e) { /* private mode */ }
  }
  var init = null;
  try { init = localStorage.getItem("tkz-lang"); } catch (e) { /* ignore */ }
  if (init !== "ja" && init !== "en") {
    init = (navigator.language || "").toLowerCase().indexOf("ja") === 0 ? "ja" : "en";
  }
  set(init);
  btnJa.addEventListener("click", function () { set("ja"); });
  btnEn.addEventListener("click", function () { set("en"); });
})();
