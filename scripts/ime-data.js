// iMongol IME data layer
// Keep this file simple and portable. It should be reusable by future Web, macOS, iOS, and chat-tool implementations.

window.iMongolIMEData = {
  rules: [
    ['ch', 'ᠴ', 'U+1834', 'CHA'],
    ['sh', 'ᠱ', 'U+1831', 'SHA'],
    ['ng', 'ᠩ', 'U+1829', 'ANG'],
    ['oe', 'ᠥ', 'U+1825', 'OE'],
    ['ö', 'ᠥ', 'U+1825', 'OE'],
    ['ue', 'ᠦ', 'U+1826', 'UE'],
    ['ü', 'ᠦ', 'U+1826', 'UE'],
    ['aa', 'ᠠᠠ', 'U+1820 U+1820', 'experimental long A'],
    ['ee', 'ᠡᠡ', 'U+1821 U+1821', 'experimental long E'],
    ['ii', 'ᠢᠢ', 'U+1822 U+1822', 'experimental long I'],
    ['oo', 'ᠣᠣ', 'U+1823 U+1823', 'experimental long O'],
    ['uu', 'ᠤᠤ', 'U+1824 U+1824', 'experimental long U'],
    ['a', 'ᠠ', 'U+1820', 'A'],
    ['e', 'ᠡ', 'U+1821', 'E'],
    ['i', 'ᠢ', 'U+1822', 'I'],
    ['o', 'ᠣ', 'U+1823', 'O'],
    ['u', 'ᠤ', 'U+1824', 'U'],
    ['n', 'ᠨ', 'U+1828', 'NA'],
    ['b', 'ᠪ', 'U+182A', 'BA'],
    ['p', 'ᠫ', 'U+182B', 'PA'],
    ['q', 'ᠬ', 'U+182C', 'QA'],
    ['g', 'ᠭ', 'U+182D', 'GA'],
    ['m', 'ᠮ', 'U+182E', 'MA'],
    ['l', 'ᠯ', 'U+182F', 'LA'],
    ['s', 'ᠰ', 'U+1830', 'SA'],
    ['t', 'ᠲ', 'U+1832', 'TA'],
    ['d', 'ᠳ', 'U+1833', 'DA'],
    ['j', 'ᠵ', 'U+1835', 'JA'],
    ['y', 'ᠶ', 'U+1836', 'YA'],
    ['r', 'ᠷ', 'U+1837', 'RA'],
    ['w', 'ᠸ', 'U+1838', 'WA'],
    ['f', 'ᠹ', 'U+1839', 'FA'],
    ['k', 'ᠺ', 'U+183A', 'KA'],
    ['h', 'ᠾ', 'U+183E', 'HAA'],
    ['z', 'ᠽ', 'U+183D', 'ZA'],
    ['c', 'ᠼ', 'U+183C', 'TSA'],
    ['x', 'ᠱ', 'U+1831', 'temporary fallback: SHA']
  ],

  dictionary: {
    mongol: { text: 'ᠮᠣᠩᠭᠣᠯ', note: 'dictionary: Mongol' },
    monggol: { text: 'ᠮᠣᠩᠭᠣᠯ', note: 'dictionary: common doubled-g spelling' },
    bichig: { text: 'ᠪᠢᠴᠢᠭ', note: 'dictionary: writing/script' },
    ger: { text: 'ᠭᠡᠷ', note: 'dictionary: ger' },
    mori: { text: 'ᠮᠣᠷᠢ', note: 'dictionary: horse' },
    nom: { text: 'ᠨᠣᠮ', note: 'dictionary: book' },
    sain: { text: 'ᠰᠠᠢᠨ', note: 'dictionary: good/hello' },
    baina: { text: 'ᠪᠠᠢᠨᠠ', note: 'dictionary: be/exist' },
    mini: { text: 'ᠮᠢᠨᠢ', note: 'dictionary: my' },
    bi: { text: 'ᠪᠢ', note: 'dictionary: I' },
    ta: { text: 'ᠲᠠ', note: 'dictionary: you' }
  },

  fuzzyAliases: {
    menggu: 'mongol',
    mngol: 'mongol',
    monggul: 'mongol',
    monggvl: 'mongol',
    bicig: 'bichig',
    bichik: 'bichig',
    sayn: 'sain',
    sainu: 'sain',
    bna: 'baina'
  }
};
