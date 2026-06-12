/* ==========================================================================
   宝塚百景 — interactions
   Language toggle / hero curtain / scroll reveals / 100-views grid / city map
   Depends on js/views-data.js (TKZ_VIEWS, TKZ_CATS).
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- language ---------- */
  const htmlEl = document.documentElement;
  const btnJa = document.getElementById("btn-ja");
  const btnEn = document.getElementById("btn-en");

  function setLang(lang) {
    htmlEl.setAttribute("data-lang", lang);
    htmlEl.setAttribute("lang", lang);
    btnJa.setAttribute("aria-pressed", String(lang === "ja"));
    btnEn.setAttribute("aria-pressed", String(lang === "en"));
    try { localStorage.setItem("tkz-lang", lang); } catch (e) { /* private mode etc. */ }
  }
  let initial = null;
  try { initial = localStorage.getItem("tkz-lang"); } catch (e) { /* ignore */ }
  if (initial !== "ja" && initial !== "en") {
    initial = (navigator.language || "").toLowerCase().startsWith("ja") ? "ja" : "en";
  }
  setLang(initial);
  btnJa.addEventListener("click", () => setLang("ja"));
  btnEn.addEventListener("click", () => setLang("en"));

  /* ---------- hero: stars + curtain ---------- */
  const starsBox = document.querySelector(".hero .stars");
  if (starsBox) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 42; i++) {
      const s = document.createElement("i");
      s.style.left = (Math.random() * 100).toFixed(2) + "%";
      s.style.top = (Math.random() * 92).toFixed(2) + "%";
      s.style.animationDelay = (Math.random() * 3.4).toFixed(2) + "s";
      const sc = (0.5 + Math.random()).toFixed(2);
      s.style.width = s.style.height = (3 * sc).toFixed(2) + "px";
      frag.appendChild(s);
    }
    starsBox.appendChild(frag);
  }
  window.setTimeout(() => {
    document.getElementById("overture").classList.add("is-open");
  }, 450);

  /* ---------- scroll reveals ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- kanji numerals 一〜百 ---------- */
  const KD = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  function toKanji(n) {
    if (n === 100) return "百";
    const t = Math.floor(n / 10), o = n % 10;
    let s = "";
    if (t > 1) s += KD[t];
    if (t >= 1) s += "十";
    s += KD[o];
    return s;
  }

  /* ---------- 100 views: render / filter / search ---------- */
  const grid = document.getElementById("views-grid");
  const filtersBox = document.getElementById("views-filters");
  const searchInput = document.getElementById("views-search");
  const countEl = document.getElementById("views-count");
  const emptyEl = document.getElementById("views-empty");
  let activeCat = "all";

  function bi(ja, en) { return '<span class="ja">' + ja + '</span><span class="en">' + en + "</span>"; }

  // filter chips
  const cats = [["all", { ja: "すべて", en: "All" }]].concat(Object.entries(TKZ_CATS));
  cats.forEach(([key, label]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.cat = key;
    b.setAttribute("aria-pressed", String(key === "all"));
    b.innerHTML = bi(label.ja, label.en);
    b.addEventListener("click", () => {
      activeCat = key;
      filtersBox.querySelectorAll(".chip").forEach((c) =>
        c.setAttribute("aria-pressed", String(c.dataset.cat === key)));
      applyFilter();
    });
    filtersBox.appendChild(b);
  });

  // cards
  const cards = TKZ_VIEWS.map((v, i) => {
    const li = document.createElement("li");
    li.className = "view-card";
    li.dataset.cat = v.cat;
    const cat = TKZ_CATS[v.cat];
    li.innerHTML =
      '<span class="view-num" aria-hidden="true">' + toKanji(i + 1) + "</span>" +
      '<div class="view-body">' +
        "<h3>" + bi(v.ja, v.en) + '<span class="v-en">' + bi(v.en, v.ja) + "</span></h3>" +
        "<p>" + bi(v.dja, v.den) + "</p>" +
        '<div class="view-tags">' +
          '<span class="vtag">' + bi(cat.ja, cat.en) + "</span>" +
          '<span class="vtag area">' + bi(v.aj, v.ae) + "</span>" +
        "</div>" +
      "</div>";
    li.dataset.search = (v.ja + " " + v.en + " " + v.dja + " " + v.den + " " + v.aj + " " + v.ae).toLowerCase();
    grid.appendChild(li);
    return li;
  });

  function applyFilter() {
    const q = (searchInput.value || "").trim().toLowerCase();
    let shown = 0;
    cards.forEach((li) => {
      const okCat = activeCat === "all" || li.dataset.cat === activeCat;
      const okQ = !q || li.dataset.search.indexOf(q) !== -1;
      const show = okCat && okQ;
      li.style.display = show ? "" : "none";
      if (show) shown++;
    });
    countEl.innerHTML = bi(shown + " / 100 景", shown + " / 100 views");
    emptyEl.hidden = shown !== 0;
  }
  searchInput.addEventListener("input", applyFilter);
  applyFilter();

  /* ---------- city map ---------- */
  const MAP_SPOTS = {
    "grand-theater": {
      cja: "舞台", cen: "Stage", ja: "宝塚大劇場", en: "Takarazuka Grand Theater",
      dja: "1914年初演以来の歌劇の本拠地。約2,600席。芝居とショーの二本立てが基本で、初めてでも言葉が分からなくても楽しめます。",
      den: "Home of the Revue since 1914, seating ~2,600. Shows pair a musical with a glittering revue — no Japanese needed to fall for it.",
      mja: "阪急宝塚駅から花のみち経由 徒歩約7分", men: "7 min walk from Hankyu Takarazuka Sta. via Hana-no-michi"
    },
    "hananomichi": {
      cja: "まち", cen: "Town", ja: "花のみち", en: "Hana-no-michi",
      dja: "駅と劇場を結ぶ約420mの遊歩道。桜並木と『ベルばら』の像、小林一三像が並ぶ、街の花道です。",
      den: "A 420 m promenade linking station and theatre, lined with cherry trees and statues — the town's own runway.",
      mja: "阪急宝塚駅すぐ", men: "Right by Hankyu Takarazuka Sta."
    },
    "tezuka": {
      cja: "物語", cen: "Story", ja: "手塚治虫記念館", en: "Osamu Tezuka Manga Museum",
      dja: "マンガの神様の聖地。直筆原稿、ライブラリー、アニメ制作体験。入口ではガラスの火の鳥が迎えてくれます。",
      den: "The shrine to the God of Manga: original art, a library, an animation workshop — and a glass phoenix at the door.",
      mja: "花のみち東端・駅から徒歩約8分 / 大人700円（2026年時点）", men: "8 min walk from the station; adults ¥700 (as of 2026)"
    },
    "onsen": {
      cja: "水", cen: "Waters", ja: "宝塚温泉", en: "Takarazuka Onsen",
      dja: "1887年正式開業の歴史ある湯。金宝泉・銀宝泉の二つの泉質を持ち、武庫川河畔の宿や日帰り湯で楽しめます。",
      den: "The historic springs (est. 1887) with twin 'gold' and 'silver' waters — enjoy them at riverside inns and day-bath houses.",
      mja: "宝塚駅から徒歩5〜10分・武庫川沿い", men: "5–10 min walk from Takarazuka Sta., along the river"
    },
    "bunka": {
      cja: "まち", cen: "Town", ja: "宝塚市立文化芸術センター", en: "Arts & Culture Center",
      dja: "遊園地ファミリーランドの跡地に2020年開館。愛称「たからば」。ギャラリーと庭園は散策無料です。",
      den: "Opened 2020 on the old Family Land funfair site. Galleries plus gardens that are free to wander.",
      mja: "宝塚駅から徒歩約10分 / 月曜休館", men: "10 min walk from the station; closed Mondays"
    },
    "kiyoshikojin": {
      cja: "社寺", cen: "Temples", ja: "清荒神清澄寺", en: "Kiyoshikōjin Seichō-ji",
      dja: "896年開創、台所の神様「荒神さん」。駅から約1.2kmの参道に店が連なり、初詣は三が日で約40万人。",
      den: "Founded 896 — the kitchen deity's temple. A 1.2 km shopping path climbs to it; ~400,000 visit at New Year.",
      mja: "阪急清荒神駅から参道徒歩約20分", men: "20 min up the approach from Hankyu Kiyoshikōjin Sta."
    },
    "nakayamadera": {
      cja: "社寺", cen: "Temples", ja: "中山寺", en: "Nakayama-dera",
      dja: "西国三十三所第24番・安産祈願の大本山。青い五重塔と2〜3月の梅林千本が見事。エスカレーター完備。",
      den: "Saigoku pilgrimage #24 and Japan's safe-birth temple. Famed for its indigo pagoda, 1,000 plum trees — and escalators.",
      mja: "阪急中山観音駅から徒歩約1分", men: "1 min from Hankyu Nakayama-Kannon Sta."
    },
    "mefu": {
      cja: "社寺", cen: "Temples", ja: "売布神社", en: "Mefu Shrine",
      dja: "610年創建と伝わる式内社。機織りと衣食財の女神を祀る、森の中の静かな古社です。",
      den: "A quiet forest shrine traced to 610, honouring the goddess of weaving, clothing, food and fortune.",
      mja: "阪急売布神社駅から徒歩約5分", men: "5 min from Hankyu Mefu-jinja Sta."
    },
    "kohama": {
      cja: "道", cen: "Paths", ja: "小浜宿", en: "Kohama-juku",
      dja: "有馬街道の宿場町・寺内町。灘五郷より先に栄えた酒造りの歴史と、謎の首地蔵が残ります。",
      den: "A post town on the Arima highway — sake history older than Nada's, plus the mysterious Head Jizō.",
      mja: "宝塚駅から徒歩約10〜15分", men: "10–15 min walk from Takarazuka Sta."
    },
    "yamamoto": {
      cja: "里", cen: "Fields", ja: "植木のまち・山本", en: "Yamamoto Nurseries",
      dja: "数百年の伝統を持つ日本有数の植木産地。接ぎ木名人「木接太夫」の伝説が息づく園芸の里。",
      den: "One of Japan's great garden-tree districts, alive with the legend of grafting master Kitsugi-dayū.",
      mja: "阪急山本駅周辺", men: "Around Hankyu Yamamoto Sta."
    },
    "racecourse": {
      cja: "祭", cen: "Festivals", ja: "阪神競馬場", en: "Hanshin Racecourse",
      dja: "住所は「宝塚市駒の町」。4月の桜花賞、6月の宝塚記念（ファン投票のグランプリ）が開かれます。家族向け公園も。",
      den: "Its address means 'Horse Town.' Hosts April's Ōka Shō and June's fan-voted Takarazuka Kinen Grand Prix. Free kids' park inside.",
      mja: "阪急仁川駅から専用通路 徒歩約5分", men: "5 min walkway from Hankyu Nigawa Sta."
    },
    "nakayama-ridge": {
      cja: "道", cen: "Paths", ja: "中山連山", en: "Nakayama Ridge",
      dja: "中山寺奥之院を経て清荒神へ抜ける縦走路。寺から寺へ、約3〜4時間の「祈りの道」です。",
      den: "Ridge trail from Nakayama-dera's inner sanctuary over to Kiyoshikōjin — a 3–4 hour 'prayer path.'",
      mja: "阪急中山観音駅⇔清荒神駅", men: "Hankyu Nakayama-Kannon Sta. ⇔ Kiyoshikōjin Sta."
    },
    "haisenshiki": {
      cja: "道", cen: "Paths", ja: "武庫川渓谷廃線敷", en: "Abandoned Railway Trail",
      dja: "旧国鉄福知山線跡・約4.7km。照明のないトンネル6本と鉄橋を、懐中電灯を頼りに歩きます。",
      den: "4.7 km along the old rail line: six pitch-black tunnels and a trestle bridge. Bring a flashlight — really.",
      mja: "JR生瀬駅 or 武田尾駅起点 / 通行は自己責任", men: "Start at JR Namaze or Takedao Sta.; walk at your own risk"
    },
    "sakuranoen": {
      cja: "道", cen: "Paths", ja: "桜の園・亦楽山荘", en: "Sakura-no-en",
      dja: "桜博士・笹部新太郎が品種保存に生涯を捧げた山林。廃線敷から立ち寄れます。春は必見。",
      den: "Woodland where cherry scholar Sasabe Shintarō preserved Japan's blossom varieties. A spring must, right off the rail trail.",
      mja: "廃線敷コース途中・JR武田尾駅から徒歩", men: "On the rail trail, walkable from JR Takedao Sta."
    },
    "takedao": {
      cja: "水", cen: "Waters", ja: "武田尾温泉", en: "Takedao Onsen",
      dja: "渓谷の隠れ湯。1639年、猿に導かれて見つかったという伝承も。ハイキング後の一泊に最適です。",
      den: "A hidden gorge onsen — legend says a monkey led to its discovery in 1639. Perfect overnight after the hike.",
      mja: "JR武田尾駅から徒歩約7〜15分", men: "7–15 min walk from JR Takedao Sta."
    },
    "dahlia": {
      cja: "里", cen: "Fields", ja: "宝塚ダリア園", en: "Takarazuka Dahlia Garden",
      dja: "上佐曽利のダリア畑。約300品種・10万本、摘み取りは1本100円から。開園は夏（7〜8月）と秋（10〜11月）。",
      den: "300 varieties and 100,000 dahlias; pick-your-own from ¥100. Open summer (Jul–Aug) and autumn (Oct–Nov).",
      mja: "宝塚駅からバス約40分「上佐曽利」下車 / 車が便利", men: "~40 min by bus from Takarazuka Sta.; easier by car"
    },
    "botan": {
      cja: "里", cen: "Fields", ja: "長谷牡丹園", en: "Nagatani Peony Garden",
      dja: "全国から「里帰り」した牡丹を含む約2,000株。例年4月下旬〜5月に開園します。",
      den: "About 2,000 peonies, many 'returned home' from across Japan. Open late April through May.",
      mja: "JR武田尾駅からバス「長谷公民館前」徒歩7分", men: "Bus from JR Takedao Sta., short walk from Nagatani stop"
    },
    "maruyama": {
      cja: "里", cen: "Fields", ja: "丸山湿原", en: "Maruyama Wetlands",
      dja: "県天然記念物の湿原群。夏はサギソウと日本最小のトンボ・ハッチョウトンボに出会えます。",
      den: "Protected wetlands — meet egret orchids and Japan's smallest dragonfly in summer.",
      mja: "西谷の森公園に隣接 / 車またはバス", men: "Next to Nishitani Forest Park; by car or bus"
    },
    "nishitani-mori": {
      cja: "里", cen: "Fields", ja: "県立宝塚西谷の森公園", en: "Nishitani Forest Park",
      dja: "農業体験と自然観察ができる里山公園。入園・駐車無料。丸山湿原とあわせてどうぞ。",
      den: "A satoyama park for farm experiences and nature walks. Free entry and parking — pair it with Maruyama Wetlands.",
      mja: "宝塚駅からバス「西谷の森公園口」徒歩10分", men: "Bus from Takarazuka Sta., 10 min walk from the stop"
    },
    "kita-sa": {
      cja: "里", cen: "Fields", ja: "宝塚北サービスエリア", en: "Takarazuka-Kita S.A.",
      dja: "西日本最大級のサービスエリア。「宝塚モダン」の内装に歌劇・手塚グッズ。一般道からも入れます。",
      den: "One of west Japan's largest service areas, styled 'Takarazuka Modern,' stocking Revue and Tezuka goods. Walk-in gate from local roads.",
      mja: "新名神・宝塚北SA / 一般道ウェルカムゲートあり", men: "Shin-Meishin Expwy; walk-in gate from local roads"
    }
  };

  const mapCard = {
    cat: document.getElementById("mc-cat"),
    title: document.getElementById("mc-title"),
    sub: document.getElementById("mc-sub"),
    desc: document.getElementById("mc-desc"),
    meta: document.getElementById("mc-meta")
  };
  const pins = document.querySelectorAll("#citymap .pin");

  function showSpot(id, pinEl) {
    const s = MAP_SPOTS[id];
    if (!s) return;
    pins.forEach((p) => p.classList.toggle("active", p === pinEl));
    mapCard.cat.innerHTML = bi(s.cja, s.cen);
    mapCard.title.innerHTML = bi(s.ja, s.en);
    mapCard.sub.innerHTML = bi(s.en, s.ja);
    mapCard.desc.innerHTML = bi(s.dja, s.den);
    mapCard.meta.innerHTML = "🚉 " + bi(s.mja, s.men);
  }
  pins.forEach((pin) => {
    pin.addEventListener("click", () => showSpot(pin.dataset.spot, pin));
    pin.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showSpot(pin.dataset.spot, pin); }
    });
  });

  /* ---------- back to top ---------- */
  const toTop = document.getElementById("to-top");
  window.addEventListener("scroll", () => {
    toTop.classList.toggle("show", window.scrollY > 900);
  }, { passive: true });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
})();
