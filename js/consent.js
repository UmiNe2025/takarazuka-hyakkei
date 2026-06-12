/* 宝塚百景 Cookie同意 + Google Consent Mode v2（GA4 + AdSense）
   おやこみち consent.js（実績版）を本サイト向けに移植。
   - 同意するまで広告Cookie・パーソナライズ・GA計測Cookieを denied にする。
   - 「同意する」で granted に更新。「同意しない」でも非パーソナライズ広告のみ表示。
   - <head> で adsbygoogle ローダーより前に同期読み込みする（Consent Mode を先に設定）。
   - 同意状態は localStorage(tkz_consent_v1)。window.openCookieSettings() で再表示。
   - GA_ID が空文字のあいだは GA4 を読み込まない（測定IDを設定したら有効化）。 */
(function () {
  "use strict";
  var GA_ID = ""; // ← GA4測定ID（G-XXXXXXXXXX）をここに設定すると計測が有効になる
  var KEY = "tkz_consent_v1";

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  function getState() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setState(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } }

  var startGranted = (getState() === "granted");
  var dv = startGranted ? "granted" : "denied";

  // Consent Mode v2 デフォルト（gtag.js / adsbygoogle.js より前に設定）
  gtag("consent", "default", {
    ad_storage: dv,
    ad_user_data: dv,
    ad_personalization: dv,
    analytics_storage: dv,
    wait_for_update: 500
  });

  // GA4 (gtag.js) — Cookie・計測の可否は Consent Mode が制御
  if (GA_ID) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    (document.head || document.documentElement).appendChild(s);
    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });

    // アンカー遷移（#views 等）を仮想ページビューとして送信
    window.addEventListener("hashchange", function () {
      gtag("event", "page_view", {
        page_location: location.href,
        page_path: location.pathname + location.search + location.hash
      });
    });
  }

  function updateConsent(v) {
    gtag("consent", "update", {
      ad_storage: v,
      ad_user_data: v,
      ad_personalization: v,
      analytics_storage: v
    });
  }

  var STYLE_ID = "tkz-consent-style";
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      "#tkz-consent{position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;justify-content:center;padding:14px;pointer-events:none}" +
      "#tkz-consent .box{pointer-events:auto;max-width:680px;width:100%;background:#fffdf7;border:1px solid #c19a3f;border-radius:14px;" +
      "box-shadow:0 10px 30px rgba(36,29,49,.28);padding:16px 18px;font-family:'Zen Kaku Gothic New','Hiragino Kaku Gothic ProN',sans-serif;color:#241d31}" +
      "#tkz-consent p{margin:0 0 12px;font-size:13px;line-height:1.8}" +
      "#tkz-consent a{color:#5a3e8e;font-weight:700;text-decoration:underline}" +
      "#tkz-consent .btns{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}" +
      "#tkz-consent button{font:inherit;font-weight:700;font-size:13px;border-radius:999px;padding:9px 20px;cursor:pointer;border:1.5px solid #38285c}" +
      "#tkz-consent .ok{background:#38285c;color:#f0dca8}" +
      "#tkz-consent .ok:hover{background:#241d3f}" +
      "#tkz-consent .ng{background:#fffdf7;color:#38285c}" +
      "#tkz-consent .ng:hover{background:#f1ead9}" +
      "@media(max-width:560px){#tkz-consent .btns{justify-content:stretch}#tkz-consent button{flex:1}}";
    var st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent = css;
    document.head.appendChild(st);
  }

  function hideBanner() {
    var el = document.getElementById("tkz-consent");
    if (el) el.parentNode.removeChild(el);
  }

  function showBanner() {
    if (document.getElementById("tkz-consent")) return;
    injectStyles();
    var wrap = document.createElement("div");
    wrap.id = "tkz-consent";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", "Cookie利用の同意 Cookie consent");
    wrap.innerHTML =
      '<div class="box">' +
      '<p><span class="ja" lang="ja">宝塚百景では、サイト改善のための<b>アクセス解析（Google アナリティクス）</b>と、運営費をまかなうための<b>広告（Google AdSense）</b>にCookieを利用します。' +
      "「同意する」を選ぶと、興味関心に応じた広告（パーソナライズ広告）と解析が有効になります。" +
      "「同意しない」場合も、Cookieを使わない広告のみ表示されます。個人を特定する情報は送信しません。" +
      '詳しくは<a href="privacy.html">プライバシーポリシー</a>をご覧ください。</span>' +
      '<span class="en" lang="en">This site uses cookies for <b>analytics (Google Analytics)</b> and <b>ads (Google AdSense)</b> that keep it free. ' +
      "Choosing “Accept” enables personalised ads and analytics; if you decline, only non-personalised ads are shown. " +
      'No personally identifying information is sent. See the <a href="privacy.html">privacy policy</a>.</span></p>' +
      '<div class="btns">' +
      '<button type="button" class="ng" id="tkz-ng"><span class="ja" lang="ja">同意しない</span><span class="en" lang="en">Decline</span></button>' +
      '<button type="button" class="ok" id="tkz-ok"><span class="ja" lang="ja">同意する</span><span class="en" lang="en">Accept</span></button>' +
      "</div></div>";
    document.body.appendChild(wrap);
    document.getElementById("tkz-ok").onclick = function () { setState("granted"); updateConsent("granted"); hideBanner(); };
    document.getElementById("tkz-ng").onclick = function () { setState("denied"); updateConsent("denied"); hideBanner(); };
  }

  // どのページからでも同意設定を開けるよう公開（フッターの「Cookie設定」から呼ぶ）
  window.openCookieSettings = function () { showBanner(); };

  function init() {
    if (!getState()) showBanner(); // 未選択のときだけバナー表示
    var btn = document.getElementById("cookie-settings");
    if (btn) btn.addEventListener("click", showBanner);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
