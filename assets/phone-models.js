// Phone model picker for the test sign-up form (shared by the EP7 and BossRan mobile sites; keep both copies the same).
// Any <input data-models="android|ios"> gets a list that narrows as the player types, so the sheet gets one clean name
// per phone ("Samsung Galaxy A54 5G", not "samsung a54" / "SM-A546E" / "a54 5g"). Phones not on the list can still be typed.
(() => {
  // Brand: [shown before every model, extra search words, models newest first separated by |]
  const ANDROID = [
    ['Samsung Galaxy', 'samsung ss', 'S26 Ultra|S26+|S26|S26 FE|S25 Edge|S25 Ultra|S25+|S25|S25 FE|S24 Ultra|S24+|S24|S24 FE|S23 Ultra|S23+|S23|S23 FE|S22 Ultra|S22+|S22|S21 Ultra|S21+|S21|S21 FE|S20 Ultra|S20+|S20|S20 FE|S10+|S10|S10e|S10 Lite|S9+|S9|S8+|S8|'
      + 'Z Fold8 Ultra|Z Fold8|Z Flip8|Z TriFold|Z Fold7|Z Flip7|Z Flip7 FE|Z Fold6|Z Flip6|Z Fold5|Z Flip5|Z Fold4|Z Flip4|Z Fold3|Z Flip3|Z Fold2|Z Flip|Note20 Ultra|Note20|Note10+|Note10|Note10 Lite|Note9|Note8|'
      + 'A57 5G|A37 5G|A27|A18|A08|A07s|A56 5G|A36 5G|A26 5G|A17 5G|A17 4G|A16 5G|A16|A07|A06|A55 5G|A35 5G|A25 5G|A15 5G|A15|A05s|A05|A54 5G|A34 5G|A24|A14 5G|A14|A04s|A04|A04e|'
      + 'A73 5G|A53 5G|A33 5G|A23 5G|A23|A13|A03s|A03|A03 Core|A72|A52s 5G|A52 5G|A52|A42 5G|A32|A22 5G|A22|A12|A02s|A02|A71|A51|A31|A21s|A11|A01|A01 Core|'
      + 'A80|A70|A50s|A50|A30s|A30|A20s|A20|A10s|A10|M47|M36|M17|M17e|M08|M07|M55|M54|M35|M34|M15|M14|M53|M33|M23|M62|M52|M32|M31|M21|M12|M11|'
      + 'Tab S12 Ultra|Tab S12+|Tab S11 Ultra|Tab S11|Tab S10 Ultra|Tab S10+|Tab S10 FE+|Tab S10 FE|Tab S9 Ultra|Tab S9+|Tab S9|Tab S9 FE+|Tab S9 FE|Tab S8 Ultra|Tab S8+|Tab S8|Tab S7 FE|Tab S7+|Tab S7|Tab S6 Lite|Tab A11+|Tab A11|Tab S10 Lite|Tab A9+|Tab A9|Tab A8|Tab A7 Lite|Tab A7|XCover7 Pro'],
    ['Xiaomi', 'mi', '18 Pro Max|18 Pro|18 Fold|17T Pro|17T|17 Ultra|17 Max|17 Pro Max|17 Pro|17|Mix Flip 2|15T Pro|15T|15 Ultra|15|14T Pro|14T|14 Ultra|14|13T Pro|13T|13 Ultra|13 Pro|13|13 Lite|12T Pro|12T|'
      + '12 Pro|12|12 Lite|11T Pro|11T|11 Lite 5G NE|Mi 11 Ultra|Mi 11|Mi 11 Lite|Mi 10T Pro|Mi 10T|Mi 10T Lite|Mi 10|Mi 9T Pro|Mi 9T|Mi 9|Mi 8|Mi A3|Mi A2|Pad 7 Pro|Pad 7|Pad 6|Pad 5'],
    ['Redmi', 'xiaomi', 'Note 17 Pro Max|Note 17 Pro|Note 17 5G|Note 17|Note 17 4G|Note 15 Pro+ 5G|Note 15 Pro 5G|Note 15 Pro|Note 15 Pro 4G|Note 15 5G|Note 15|Note 15 4G|17|17 4G|17C|17C 4G|A7 Pro|A7|15C 4G|'
      + 'Note 14 Pro+ 5G|Note 14 Pro 5G|Note 14 Pro|Note 14 5G|Note 14|Note 13 Pro+ 5G|Note 13 Pro 5G|Note 13 Pro|Note 13 5G|Note 13|Note 12 Pro+ 5G|Note 12 Pro 5G|Note 12 Pro|Note 12S|Note 12 5G|'
      + 'Note 12|Note 11 Pro+ 5G|Note 11 Pro 5G|Note 11 Pro|Note 11S|Note 11|Note 10 Pro|Note 10S|Note 10 5G|Note 10|Note 9 Pro|Note 9S|Note 9|Note 8 Pro|Note 8 2021|Note 8|Note 7|15C|15 5G|15|14C|'
      + '14 5G|13C 5G|13C|13|12C|12 5G|12|10C|10A|10 5G|10|9T|9C|9A|9|8A|8|A5|A3|A3x|A2+|A2|A1|Pad 2|Pad Pro|Pad SE|K90 Pro Max|K90|K80 Ultra|K80 Pro|K80|K70 Pro|K70|K60 Pro|K60|K50|K40 Pro|K40|K30 Pro|K30 5G|K30|K20 Pro|K20'],
    ['POCO', 'xiaomi', 'F9 Ultra|F9 Pro|F8 Ultra|F8 Pro|X8 Pro Max|X8 Pro|X8 Power|X8|M8 Pro|M8 Power|M8s|M8x|M8|M7 Plus|C95 Pro|C85x|C85 4G|C81 Pro|C81|C81x|F7 Ultra|F7 Pro|F7|F6 Pro|F6|F5 Pro|F5|F4 GT|F4|F3|'
      + 'F2 Pro|F1|X7 Pro|X7|X6 Pro|X6|X5 Pro|X5|X4 Pro 5G|X4 GT|X3 Pro|X3 NFC|X3 GT|M7 Pro 5G|M7|M6 Pro|M6|M5s|M5|M4 Pro|M4 5G|M3 Pro 5G|M3|C85|C75|C71|C65|C61|C55|C51|C40|C31|C3|Pad'],
    ['realme', 'real me', '16 Pro+|16 Pro|16|16T|16x|GT 8 Pro|15 Pro|15|15T|15x|15 Lite|Neo8|P4 Pro|P4 Power|P4|P4R|P4s|P4x|P4 Lite|C100|C100x|C100i|C85 Pro|C83|C73|Note 80|Note 70|Note 70T|GT 7 Pro|GT 7|GT 7T|GT 6|'
      + 'GT 6T|GT 3|GT 2 Pro|GT 2|GT Neo 3|GT Neo 2|GT Master Edition|GT|14 Pro+|14 Pro|14T|14x|14|13 Pro+|13 Pro|13+|13|12 Pro+|12 Pro|12+|12|12x|11 Pro+|11 Pro|11|11x|10 Pro+|10 Pro|10|9 Pro+|'
      + '9 Pro|9i|9|8 Pro|8i|8|7 Pro|7i|7|6 Pro|6i|6|5 Pro|5i|5|3 Pro|3|C85|C75|C71|C67|C65|C63|C61|C55|C53|C51|C35|C33|C31|C30s|C30|C25s|C25Y|C21Y|C21|C20|C17|C15|C12|C11|C3|Note 60|Note 50|'
      + 'Narzo 70 Pro|Narzo 60|Pad 2|Pad Mini|Pad'],
    ['OPPO', '', 'Find X10 Pro Max|Find X10|Find X9 Ultra|Find X9s Pro|Find X9s|Find X9 Pro|Find X9|Find N6|Reno16 Pro|Reno16|Reno16 F|Reno16 FS|Reno16c|Reno15 Pro Max|Reno15 Pro|Reno15 Pro Mini|Reno15|'
      + 'Reno15 F|Reno15 FS|Reno15c|A7 Pro Max|A7 Pro|A6 Max|A6 GT|A6s Pro|A6s|A6c|A6k|A6t Pro|A6t|A6x|A6|A5x|F35 Pro|F35|F33 Pro|F33|F31 Pro+|F31 Pro|F31|Find X8 Pro|Find X8|Find N5|Find N3 Flip|'
      + 'Find N3|Find N2 Flip|Find X5 Pro|Find X5|Find X3 Pro|Find X2 Pro|Reno14 Pro 5G|Reno14 5G|Reno14 F 5G|Reno13 Pro 5G|Reno13 5G|Reno13 F|Reno12 Pro 5G|Reno12 5G|Reno12 F|Reno11 Pro 5G|'
      + 'Reno11 5G|Reno11 F 5G|Reno10 Pro+ 5G|Reno10 Pro 5G|Reno10 5G|Reno8 Pro 5G|Reno8 5G|Reno8 T 5G|Reno8 T|Reno8 Z 5G|Reno8|Reno7 Pro 5G|Reno7 5G|Reno7 Z 5G|Reno7|Reno6 Pro 5G|Reno6 5G|'
      + 'Reno6 Z 5G|Reno6|Reno5 Pro 5G|Reno5 5G|Reno5|Reno4 Pro|Reno4|Reno3 Pro|Reno3|Reno2 F|Reno2|Reno|A6 Pro|A5 Pro 5G|A5 Pro|A5|A3 Pro|A3x|A3|A98 5G|A79 5G|A78 5G|A78|A77s|A77 5G|A76|A74 5G|A74|'
      + 'A60|A58|A57|A55|A54|A53|A38|A18|A17|A17k|A16|A16k|A15|A15s|A12|A1k|A9 2020|A5 2020|A5s|A7|A31|A92|A93|A94|A95|F11 Pro|F11|F9|Pad 3|Pad 2|Pad Air|Pad Neo'],
    ['vivo', '', 'X500 Pro Max|X500 Pro|X500|X300 Ultra|X300 Pro|X300|X300 FE|X300 E|X200T|X Fold6|V80|V80 Lite|V70 Elite|V70|V70 FE|V70 Lite|V60e|Y600 Pro|Y600i|Y500 Pro|Y500|Y500i|Y51 Pro|Y32|Y31 Pro|Y31d|'
      + 'Y31t|Y21d|Y19s Pro|Y19s GT|Y11d|Y05|Y05e|Pad6 Pro|X200 Pro|X200|X200 FE|X100 Pro|X100|X90 Pro|X80 Pro|X70 Pro|X60 Pro|X Fold5|V60|V60 Lite|V50|V50 Lite|V40 Pro|V40|V40 Lite|V30 Pro|V30|V30e|'
      + 'V29|V29e|V27 5G|V25 Pro|V25|V25e|V23 5G|V23e|V21 5G|V21|V21e|V20|V20 SE|V19|V17 Pro|V15 Pro|V15|V11|V9|Y400|Y300|Y39 5G|Y29|Y28|Y28s|Y19s|Y18|Y17s|Y16|Y100|Y78 5G|Y76 5G|Y36|Y35|Y27|Y27s|'
      + 'Y22|Y22s|Y21|Y21s|Y21T|Y20|Y20s|Y20i|Y15|Y12|Y12s|Y11|Y17|Y19|Y30|Y31|Y33s|Y51|Y53s|Y04|Y03|Y02|Y02s|Y01|Y1s|Y91|Y91C|Y93|Y95|Pad3|Pad2'],
    ['Infinix', '', 'GT 50 Pro|Hot 70 Pro|Hot 70|Note 60 Ultra|Note 60 Pro|Note 60|Note Edge|GT 30 Pro|GT 30|Smart 20|Smart 10 Plus|Smart 10 HD|Note 50x|Note 40S|Note 40X 5G|Xpad 30 Pro|Xpad 20 Pro|Xpad 20|'
      + 'Xpad GT|GT 20 Pro|GT 10 Pro|Zero 40 5G|Zero Flip|Zero 30 5G|Zero 30|Zero Ultra|Zero 20|Zero X Pro|Note 50 Pro+ 5G|Note 50 Pro|Note 50|Note 50s|Note 40 Pro+ 5G|Note 40 Pro|Note 40|'
      + 'Note 30 Pro|Note 30 5G|Note 30|Note 12 Pro|Note 12 G96|Note 12|Note 11 Pro|Note 11|Note 10 Pro|Note 10|Hot 60 Pro+|Hot 60 Pro|Hot 60|Hot 60i|Hot 50 Pro+|Hot 50 Pro|Hot 50|Hot 50i|Hot 40 Pro|'
      + 'Hot 40|Hot 40i|Hot 30|Hot 30i|Hot 30 Play|Hot 20S|Hot 20|Hot 20i|Hot 12|Hot 12i|Hot 12 Play|Hot 11S|Hot 11|Hot 11 Play|Hot 10S|Hot 10|Hot 10i|Hot 10 Play|Hot 9|Hot 9 Play|Smart 10|Smart 9|'
      + 'Smart 8|Smart 7|Smart 6|Smart 5|Smart 4|Xpad|Zero 5G 2023|Zero 5G'],
    ['Tecno', '', 'Camon 50 Ultra|Camon 50 Pro|Camon 50|Camon Air|Camon Slim|Spark 50 Pro|Spark 50s|Spark 50c|Spark 50|Spark Go 3 Pro|Spark Go 3|Spark Go 2|Spark Go 1S|Spark Slim|Pova 8 Pro|Pova 8|Pova Curve 2|Pova Curve|Pova Slim|Pova 7 Ultra|Pop X|Pop 9|Phantom V Fold2|Megapad Pro|Megapad SE|Megapad 11|Camon 40 Pro|Camon 40|Camon 30 Premier|Camon 30 Pro|Camon 30|Camon 20 Premier|Camon 20 Pro|Camon 20|Camon 19 Pro|Camon 19|Camon 18|Camon 17|Pova 7 Pro|Pova 7|Pova 6 Pro|Pova 6|'
      + 'Pova 5 Pro|Pova 5|Pova 4 Pro|Pova 4|Pova 3|Pova 2|Spark 40 Pro+|Spark 40 Pro|Spark 40|Spark 30 Pro|Spark 30|Spark 30C|Spark 20 Pro+|Spark 20 Pro|Spark 20|Spark 20C|'
      + 'Spark 10 Pro|Spark 10|Spark 10C|Spark 9 Pro|Spark 9|Spark 8|Spark Go 2024|Phantom V Fold|Phantom V Flip|Phantom X2 Pro'],
    ['Huawei', '', 'Mate 90 Pro Max|Mate 90 Pro|Mate 90|Mate XT 2|Mate 80 Pro Max|Mate 80 Pro|Mate 80|Mate X7|Mate X6|Pura 90 Pro Max|Pura 90 Pro|Pura 90|Pura X Max|Pura 80 Ultra|Pura 80 Pro|nova 16 Ultra|'
      + 'nova 16 Pro|nova 16|nova 16 SE|nova 15 Ultra|nova 15 Pro|nova 15|nova Y74|MatePad Pro Max|MatePad 11.5 (2026)|MatePad Air|Pura 70 Ultra|Pura 70 Pro|Pura 70|P60 Pro|P50 Pro|P40 Pro|P40|'
      + 'P40 Lite|P30 Pro|P30|P30 Lite|P20 Pro|P20|Mate 50 Pro|Mate 40 Pro|Mate 30 Pro|Mate 20 Pro|Mate 20|Nova 13 Pro|Nova 13|Nova 12i|Nova 11 Pro|Nova 11|Nova 11i|Nova 10 Pro|Nova 10 SE|Nova 9|'
      + 'Nova 9 SE|Nova 8i|Nova 7i|Nova 7 SE|Nova 5T|Nova 3i|Nova Y91|Nova Y90|Nova Y72|Nova Y71|Nova Y70|Nova Y61|Nova Y60|Y9 Prime 2019|Y9s|Y7p|Y7a|Y6p|MatePad 11.5|MatePad Pro|MatePad SE'],
    ['Honor', '', 'Magic9 Pro Max|Magic9|Magic8 Pro|Magic8|Magic8 Pro Air|Magic8 Lite|Magic V6|Magic V Flip 2|Magic V5|600 Pro|600|600 Lite|600 Smart|500 Pro|500|500 Smart|400 Smart|X9e Pro|X9d|X8d|X7e Plus|'
      + 'X7e|X7d|X6e|X6d|X5d|X5c Plus|X5c|Pad 20 Pro|Pad 20|Pad 10|Pad X8b|Magic7 Pro|Magic6 Pro|Magic5 Pro|Magic V3|Magic V2|400 Pro|400|400 Lite|200 Pro|200|200 Lite|90|90 Lite|70|50|X9c|X9b|X9a|'
      + 'X9|X8c|X8b|X8a|X8 5G|X8|X7c|X7b|X7a|X7|X6c|X6b|X6a|X6|X5 Plus|X5|Pad 9|Pad X9'],
    ['Google Pixel', 'google', '11 Pro Fold|11 Pro XL|11 Pro|11|10 Pro Fold|10 Pro XL|10 Pro|10|10a|9 Pro Fold|9 Pro XL|9 Pro|9|9a|8 Pro|8|8a|Fold|7 Pro|7|7a|6 Pro|6|6a|5|5a|4a 5G|4a|4 XL|4|3a XL|3a|3 XL|3|Tablet'],
    ['OnePlus', 'one plus', '16|15T|15|15R|13s|13|13R|Nord 6|Nord CE6|Nord CE6 Lite|Pad 4|Pad 3 Pro|Pad Go 2|Pad Lite|12|12R|11|10 Pro|10T|9 Pro|9|8T|8 Pro|8|7T Pro|7T|7 Pro|7|6T|6|Open|Nord 5|Nord CE5|Nord 4|Nord CE4|'
      + 'Nord CE4 Lite|Nord 3|Nord CE3|Nord CE3 Lite|Nord 2T|Nord 2|Nord CE 2|Nord CE 2 Lite|Nord CE|Nord N30|Nord N20|Nord N10|Nord|Pad 3|Pad 2|Pad|Ace 6 Ultra|Ace 6T|Ace 6|Ace 5 Ultra|Ace 5 Racing|Ace 5 Pro|Ace 5|Ace 3 Pro|Ace 3V|Ace 3'],
    ['Motorola', 'moto', 'Signature|Razr Fold|Razr 70 Ultra|Razr 70+|Razr 70|Edge 70 Plus|Edge 70 Max|Edge 70 Pro+|Edge 70 Pro|Edge 70 Fusion+|Edge 70 Fusion|Edge 70|Edge 60 Neo|Moto G87|Moto G77 Power|Moto G77|Moto G67 Power|Moto G67|Moto G57 Power|Moto G57|Moto G47|Moto G37 Power|Moto G37|Moto G17 Power|Moto G17|Moto G100S|Moto G100|Moto G96|Moto G86 Power|Moto G06 Power|Moto G06|Moto Pad 70 Pro|Moto Pad 70|Moto Pad 60 Neo|Edge 60 Pro|Edge 60 Fusion|Edge 60|Edge 50 Ultra|Edge 50 Pro|Edge 50 Fusion|Edge 50|Edge 40 Pro|Edge 40 Neo|Edge 40|Edge 30 Ultra|Edge 30 Pro|Edge 30 Fusion|Edge 30|'
      + 'Razr 60 Ultra|Razr 60|Razr 50 Ultra|Razr 50|Razr 40 Ultra|Razr 40|Moto G86|Moto G85|Moto G84|Moto G75|Moto G73|Moto G56|Moto G55|Moto G54|Moto G35|Moto G34|Moto G24 Power|Moto G24|'
      + 'Moto G15|Moto G14|Moto G05|Moto G04|Moto E40|Moto E32|Moto E22|Moto E20|Moto E13'],
    ['Nokia', '', 'X30 5G|X20|X10|G60 5G|G50|G42 5G|G22|G21|G20|G11|G10|C32|C31|C30|C22|C21 Plus|C21|C20|C12|C10|8.3 5G|7.2|6.2|5.4|5.3|4.2|3.4|3.2|2.4|2.3|1.4'],
    ['itel', '', 'Super 26 Ultra|Power 70|A100|S25 Ultra|S25|S24|S23+|S23|P55|P40|A80|A70|A60s|A50|Vision 3'],
    ['ASUS', 'asus', 'ROG Phone 9 FE|ROG Phone 9 Pro|ROG Phone 9|ROG Phone 8 Pro|ROG Phone 8|ROG Phone 7 Ultimate|ROG Phone 7|ROG Phone 6 Pro|ROG Phone 6|ROG Phone 5s|ROG Phone 5|ROG Phone 3|ROG Phone 2|ROG Phone|'
      + 'Zenfone 12 Ultra|Zenfone 11 Ultra|Zenfone 10|Zenfone 9|Zenfone 8|Zenfone Max Pro M2|Zenfone Max Pro M1'],
    ['Nothing', '', 'Phone (4b)|Phone (4a) Pro|Phone (4a)|Phone (3a) Lite|Phone (3)|Phone (3a) Pro|Phone (3a)|Phone (2a) Plus|Phone (2a)|Phone (2)|Phone (1)|CMF Phone 2 Pro|CMF Phone 1'],
    ['nubia', 'zte blade', 'V80 Max|V80 Design|V70 Max|V70 Design|V60 Design|Neo 3 5G|Neo 3|Neo 2|Focus 2 Ultra|Focus Pro|Music|Flip 2|Z70 Ultra|Z60 Ultra'],
    ['RedMagic', 'nubia red magic', '11S Pro|11 Pro|10S Pro|10 Pro|9S Pro|9 Pro|8S Pro|8 Pro|7S Pro|7'],
    ['Sony Xperia', 'sony', '1 VIII|10 VIII|10 VII|1 VII|1 VI|1 V|1 IV|1 III|5 V|5 IV|10 VI|10 V|10 IV'],
    ['Cherry Mobile', 'cherry', 'Aqua S9|Flare S8'],
    ['Lenovo', '', 'Legion Y70 (2026)|Legion Y70|Legion Y90|Legion Tab (Gen 3)|Legion Tab|Tab P12|Tab P11|Tab M11|Tab M10'],
    ['TCL', '', '40 SE|30 SE'],
  ];
  const IOS = 'iPhone Duo|iPhone 18 Pro Max|iPhone 18 Pro|iPhone 17 Pro Max|iPhone 17 Pro|iPhone Air|iPhone 17|iPhone 17e|iPhone 16 Pro Max|iPhone 16 Pro|iPhone 16 Plus|iPhone 16|iPhone 16e|iPhone 15 Pro Max|iPhone 15 Pro|iPhone 15 Plus|iPhone 15|'
    + 'iPhone 14 Pro Max|iPhone 14 Pro|iPhone 14 Plus|iPhone 14|iPhone 13 Pro Max|iPhone 13 Pro|iPhone 13|iPhone 13 mini|iPhone 12 Pro Max|iPhone 12 Pro|iPhone 12|iPhone 12 mini|'
    + 'iPhone 11 Pro Max|iPhone 11 Pro|iPhone 11|iPhone XS Max|iPhone XS|iPhone XR|iPhone X|iPhone 8 Plus|iPhone 8|iPhone SE (3rd generation)|iPhone SE (2nd generation)|iPhone 7 Plus|iPhone 7|'
    + 'iPad Pro 13-inch (M5)|iPad Pro 11-inch (M5)|iPad Pro 13-inch (M4)|iPad Pro 11-inch (M4)|iPad Pro 12.9-inch (6th generation)|iPad Pro 12.9-inch (5th generation)|iPad Pro 12.9-inch (4th generation)|'
    + 'iPad Pro 12.9-inch (3rd generation)|iPad Pro 11-inch (4th generation)|iPad Pro 11-inch (3rd generation)|iPad Pro 11-inch (2nd generation)|iPad Pro 11-inch (1st generation)|'
    + 'iPad Air 13-inch (M4)|iPad Air 11-inch (M4)|iPad Air 13-inch (M3)|iPad Air 11-inch (M3)|iPad Air 13-inch (M2)|iPad Air 11-inch (M2)|iPad Air (5th generation)|iPad Air (4th generation)|iPad Air (3rd generation)|'
    + 'iPad mini (A17 Pro)|iPad mini (6th generation)|iPad mini (5th generation)|iPad (A16)|iPad (10th generation)|iPad (9th generation)|iPad (8th generation)|iPad (7th generation)|iPad (6th generation)';

  // "Galaxy S24+" and "s24 plus" should find each other; spaces, dots and brackets don't matter
  const squash = (s) => s.toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]/g, '');
  const SHORT = { ip: 'iphone', redme: 'redmi', galaxi: 'galaxy' };
  // Matches only start at a word ("a54" finds "Galaxy A54" but not "Nokia 5.4"), so each entry keeps the text from every word on
  const starts = (text) => { const w = text.split(/\s+/); return w.map((_, i) => squash(w.slice(i).join(''))).filter(Boolean); };
  const entry = (name, extra) => ({ name, key: squash(name), from: starts(name), words: starts(`${name} ${extra}`) });

  const LISTS = {
    android: ANDROID.flatMap(([brand, extra, models]) => models.split('|').map((m) => entry(`${brand} ${m}`, extra))),
    ios: IOS.split('|').map((m) => entry(m, m.startsWith('iPad') ? 'apple tablet' : 'apple')),
  };
  // Shown before anything is typed: brands for Android (tap one to see its phones), every model for iPhone / iPad
  const BRANDS = ANDROID.map(([brand]) => brand);

  function matches(list, text) {
    const q = squash(text);
    if (!q) return [];
    const words = text.toLowerCase().split(/\s+/).map((w) => SHORT[w] || w).map(squash).filter(Boolean);
    const found = [];
    list.forEach((item, i) => {
      let rank;
      if (item.key === q || item.from.includes(q)) rank = 0;
      else if (item.key.startsWith(q)) rank = 1;
      else if (item.from.some((f) => f.startsWith(q))) rank = 2;
      else if (words.every((w) => item.words.some((f) => f.startsWith(w)))) rank = 3;
      else return;
      found.push({ item, rank, i });
    });
    // The exact name first ("note 13" -> "Redmi Note 13"), then the closest matches, newest phones first
    return found.sort((a, b) => a.rank - b.rank || a.i - b.i).slice(0, 300).map((f) => f.item.name);
  }

  // The exact list name for what was typed ("redmi note 13 5g" -> "Redmi Note 13 5G"), or the text as typed if it isn't listed
  function tidy(input) {
    const list = LISTS[input.dataset.models];
    const q = squash(input.value);
    const hit = q && list.find((item) => item.key === q);
    input.value = hit ? hit.name : input.value.trim().replace(/\s+/g, ' ');
  }

  let uid = 0;
  function attach(input) {
    const kind = input.dataset.models;
    const box = document.createElement('div');
    box.className = 'model-pick';
    input.before(box);
    box.append(input);
    const list = document.createElement('ul');
    list.className = 'model-list';
    list.id = `model-list-${++uid}`;
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    box.append(list);
    Object.assign(input, { autocomplete: 'off', spellcheck: false });
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', list.id);

    let options = [];
    let active = -1;

    function close() {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      active = -1;
    }
    function highlight(i) {
      active = i;
      list.querySelectorAll('[role="option"]').forEach((li, n) => li.setAttribute('aria-selected', String(n === i)));
      const li = list.querySelector(`[role="option"][aria-selected="true"]`);
      if (li) { input.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); }
      else input.removeAttribute('aria-activedescendant');
    }
    // Keep the list above the on-screen keyboard: only as tall as the space left under the field
    function fit() {
      const vv = window.visualViewport;
      const bottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
      const room = bottom - input.getBoundingClientRect().bottom - 10;
      list.style.maxHeight = `${Math.max(132, Math.min(320, room))}px`;
    }
    function render() {
      const text = input.value;
      const brandsOnly = kind === 'android' && !squash(text);
      options = brandsOnly ? BRANDS.map((b) => ({ label: b, fill: `${b} `, brand: true }))
        : (squash(text) ? matches(LISTS[kind], text) : LISTS[kind].map((item) => item.name)).map((name) => ({ label: name, fill: name }));
      list.replaceChildren();
      if (brandsOnly) list.append(Object.assign(document.createElement('li'), { className: 'model-note', textContent: 'Pick your brand, or start typing your model' }));
      options.forEach((o, n) => {
        const li = document.createElement('li');
        li.id = `${list.id}-${n}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        li.dataset.n = n;
        li.textContent = o.label;
        if (o.brand) li.className = 'model-brand';
        list.append(li);
      });
      if (!options.length) {
        list.append(Object.assign(document.createElement('li'), { className: 'model-note', textContent: kind === 'ios'
          ? 'Not on the list? Type the name from Settings > General > About.'
          : 'Not on the list? Type the name from Settings > About phone.' }));
      }
      active = -1;
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      fit();
    }
    function choose(n) {
      const o = options[n];
      if (!o) return;
      input.value = o.fill;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (o.brand) { input.focus(); return; } // stays open, now showing that brand's phones
      close();
    }

    input.addEventListener('focus', () => {
      render();
      // On phones the keyboard takes half the screen: lift the field to the top so the list has room under it
      if (window.matchMedia('(max-width: 760px)').matches) {
        setTimeout(() => {
          const header = document.querySelector('.site-header, .hdr');
          const top = input.getBoundingClientRect().top - (header ? header.getBoundingClientRect().bottom : 0) - 12;
          if (Math.abs(top) > 40) window.scrollBy({ top, behavior: 'smooth' });
          setTimeout(fit, 400);
        }, 250);
      }
    });
    input.addEventListener('input', render);
    input.addEventListener('blur', () => { close(); tidy(input); });
    input.addEventListener('keydown', (e) => {
      if (list.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { render(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight(Math.min(active + 1, options.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(active - 1, 0)); }
      else if (e.key === 'Enter' && !list.hidden && active >= 0) { e.preventDefault(); choose(active); }
      else if (e.key === 'Escape' && !list.hidden) { e.preventDefault(); close(); }
    });
    // pointerdown + preventDefault keeps the keyboard up and the field focused while a phone is tapped
    list.addEventListener('pointerdown', (e) => e.preventDefault());
    list.addEventListener('click', (e) => {
      e.preventDefault();
      const li = e.target.closest('[role="option"]');
      if (li) choose(Number(li.dataset.n));
    });
    window.visualViewport?.addEventListener('resize', () => { if (!list.hidden) fit(); });
  }

  document.querySelectorAll('input[data-models]').forEach(attach);
  // Runs before the form's own submit handler, so the sheet gets the tidy name even if the player never left the field
  document.addEventListener('submit', (e) => e.target.querySelectorAll?.('input[data-models]').forEach(tidy), true);
})();
