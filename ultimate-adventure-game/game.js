// Ultimate Adventure Game - Phaser Edition (no external assets)

// Config
const TILE = 40;
const MAX_HEALTH = 9;
// Player flight is available when unlocked or enabled in the settings.
const FLIGHT_ENABLED = true;
// Removed fixed WORLD_TILES_X to support endless world
const WORLD_TILES_Y = 100; // world is now much taller: 40 tiles of sky + 60 underground
const SURFACE_Y = 40;      // deeper surface gives room for taller mountains and more sky
// Endless world params
const CHUNK_W = 32;        // tiles per chunk horizontally
const LOAD_RADIUS = 3;     // chunks to load around player
const WORLD_SEED = 987654321;
const INF_W = 10000000;    // huge world bounds width

// Chatin suodatin tunnistaa yleisiä kirosanoja useista kielistä. Lista ei voi
// täydellisesti kattaa jokaista maailman kieltä, joten mukana on myös kirjain-
// ja numeromuunnosten käsittely (esim. f.u.c.k ja 5aatana).
const CHAT_PROFANITY_TERMS = [
  // Suomi
  'perkele', 'vittu', 'vitun', 'vituttaa', 'saatana', 'helvetti', 'jumalauta',
  'paska', 'kusipaa', 'runkkari', 'huora', 'persereika', 'mulkku',
  // English
  'fuck', 'fucking', 'shit', 'bitch', 'asshole', 'dickhead', 'dick', 'cunt',
  'bastard', 'damn', 'crap', 'motherfucker', 'bullshit', 'whore', 'piss',
  // Svenska, norska, dansk
  'fan', 'helvete', 'javlar', 'javla', 'fitta', 'fitte', 'kuk', 'hora', 'skit',
  'knulla', 'faen', 'lort', 'satans',
  // Deutsch
  'scheisse', 'fick', 'ficken', 'arschloch', 'hure', 'fotze', 'schwanz', 'verdammt',
  // Français
  'merde', 'putain', 'connard', 'connasse', 'salope', 'encule', 'bite', 'nique', 'bordel',
  // Español
  'mierda', 'puta', 'puto', 'joder', 'cabron', 'gilipollas', 'coño', 'culo',
  // Italiano
  'cazzo', 'stronzo', 'puttana', 'vaffanculo', 'bastardo',
  // Português
  'caralho', 'foda', 'foder', 'porra',
  // Nederlands
  'kut', 'lul', 'hoer', 'tering', 'godverdomme',
  // Polski
  'kurwa', 'cholera', 'gowno', 'chuj', 'pizda', 'jebac', 'skurwysyn',
  // Eesti ja Türkçe
  'kurat', 'persse', 'raisk', 'sitapea', 'siktir', 'orospu', 'pezevenk',
  // Русский: kyrillinen ja yleinen translitterointi
  'блядь', 'бля', 'хуй', 'пизда', 'ебать', 'сука', 'дерьмо', 'мудак',
  'blyad', 'blyat', 'khuy', 'hui', 'ebat', 'suka', 'dermo', 'mudak'
].map((term) => term.replace(/\s+/g, ''));

function normalizeChatFilterText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en-US')
    .replace(/[０-９]/gu, (char) => String.fromCharCode(char.charCodeAt(0) - 0xff10 + 48))
    .replace(/[４-５７]/gu, (char) => ({ '４': 'a', '５': 's', '７': 't' }[char] || char))
    .replace(/[@４]/g, 'a')
    .replace(/[3ｅ]/g, 'e')
    .replace(/[1ｉ]/g, 'i')
    .replace(/[0ｏ]/g, 'o')
    .replace(/[5＄ｓ]/g, 's')
    .replace(/[7ｔ]/g, 't');
}

function chatTokenIsProfane(token) {
  const normalized = normalizeChatFilterText(token).replace(/[^\p{L}\p{N}]+/gu, '');
  if (!normalized) return false;
  return CHAT_PROFANITY_TERMS.some((term) => {
    const normalizedTerm = normalizeChatFilterText(term).replace(/[^\p{L}\p{N}]+/gu, '');
    return normalized === normalizedTerm || (normalizedTerm.length >= 4 && normalized.includes(normalizedTerm));
  });
}

// Extra building blocks shown in the corner palette.
const NEW_BUILD_BLOCK_DEFS = [
  { id: 'red_brick', label: 'Punatiili', color: 0xb84a3a, accent: 0x6e2b24, pattern: 'brick' },
  { id: 'blue_brick', label: 'Sininen tiili', color: 0x477fc1, accent: 0x24476f, pattern: 'brick' },
  { id: 'green_brick', label: 'Vihreä tiili', color: 0x4f9a64, accent: 0x285234, pattern: 'brick' },
  { id: 'yellow_brick', label: 'Keltainen tiili', color: 0xd4aa3a, accent: 0x765b1b, pattern: 'brick' },
  { id: 'purple_brick', label: 'Liila tiili', color: 0x8b5fc2, accent: 0x4a2b70, pattern: 'brick' },
  { id: 'cyan_brick', label: 'Turkoosi tiili', color: 0x35aeb2, accent: 0x1d6063, pattern: 'brick' },
  { id: 'orange_brick', label: 'Oranssi tiili', color: 0xd56a2f, accent: 0x713718, pattern: 'brick' },
  { id: 'pink_brick', label: 'Pinkki tiili', color: 0xd65d91, accent: 0x742b4a, pattern: 'brick' },
  { id: 'white_brick', label: 'Valkoinen tiili', color: 0xdfe8ef, accent: 0x8b9aa7, pattern: 'brick' },
  { id: 'red_concrete', label: 'Punabetoni', color: 0xb93646, accent: 0xf17b82, pattern: 'concrete' },
  { id: 'blue_concrete', label: 'Sinibetoni', color: 0x356fc2, accent: 0x8bb9ff, pattern: 'concrete' },
  { id: 'green_concrete', label: 'Vihreä betoni', color: 0x38945b, accent: 0x8cf0a5, pattern: 'concrete' },
  { id: 'yellow_concrete', label: 'Keltainen betoni', color: 0xd0a72c, accent: 0xffe58b, pattern: 'concrete' },
  { id: 'purple_concrete', label: 'Liila betoni', color: 0x7449b8, accent: 0xc4a0ff, pattern: 'concrete' },
  { id: 'cyan_concrete', label: 'Turkoosi betoni', color: 0x229ca8, accent: 0x8ff8ff, pattern: 'concrete' },
  { id: 'orange_concrete', label: 'Oranssi betoni', color: 0xd75d2b, accent: 0xffb078, pattern: 'concrete' },
  { id: 'pink_concrete', label: 'Pinkki betoni', color: 0xc93f82, accent: 0xff9ad0, pattern: 'concrete' },
  { id: 'black_concrete', label: 'Musta betoni', color: 0x303844, accent: 0x738092, pattern: 'concrete' },
  { id: 'ruby_crystal', label: 'Rubiinikristalli', color: 0xa51f45, accent: 0xff7896, pattern: 'crystal' },
  { id: 'sapphire_crystal', label: 'Safiirikristalli', color: 0x2354bd, accent: 0x8eb6ff, pattern: 'crystal' },
  { id: 'emerald_crystal', label: 'Smaragdikristalli', color: 0x159466, accent: 0x8affc8, pattern: 'crystal' },
  { id: 'amethyst_crystal', label: 'Ametistikristalli', color: 0x793db2, accent: 0xe0a4ff, pattern: 'crystal' },
  { id: 'topaz_crystal', label: 'Topaasikristalli', color: 0xd58a20, accent: 0xffed8a, pattern: 'crystal' },
  { id: 'ice_crystal', label: 'Jääkristalli', color: 0x53bfe8, accent: 0xe0fbff, pattern: 'crystal' },
  { id: 'sun_crystal', label: 'Aurinkokristalli', color: 0xe59b24, accent: 0xffffb0, pattern: 'crystal' },
  { id: 'moon_crystal', label: 'Kuukristalli', color: 0x6575c7, accent: 0xd7dcff, pattern: 'crystal' },
  { id: 'void_crystal', label: 'Tyhjyyskristalli', color: 0x34205e, accent: 0xc48cff, pattern: 'crystal' },
  { id: 'copper_metal', label: 'Kuparimetalli', color: 0xa9653d, accent: 0xf3b081, pattern: 'metal' },
  { id: 'iron_metal', label: 'Rautametalli', color: 0x66717d, accent: 0xc8d3dc, pattern: 'metal' },
  { id: 'steel_metal', label: 'Teräsmetalli', color: 0x8999a8, accent: 0xf2fbff, pattern: 'metal' },
  { id: 'gold_metal', label: 'Kultametalli', color: 0xc18a22, accent: 0xffef86, pattern: 'metal' },
  { id: 'silver_metal', label: 'Hopeametalli', color: 0xaebac7, accent: 0xffffff, pattern: 'metal' },
  { id: 'cobalt_metal', label: 'Kobolttimetalli', color: 0x2455a6, accent: 0x7eb5ff, pattern: 'metal' },
  { id: 'neon_metal', label: 'Neonmetalli', color: 0x315c66, accent: 0x5cf5ff, pattern: 'metal' },
  { id: 'chrome_metal', label: 'Kromimetalli', color: 0x6e7886, accent: 0xdff8ff, pattern: 'metal' },
  { id: 'obsidian_metal', label: 'Obsidiaanilevy', color: 0x202030, accent: 0x9d7dff, pattern: 'metal' },
  { id: 'oak_plank', label: 'Tammit lankku', color: 0x86512d, accent: 0xc5894d, pattern: 'wood' },
  { id: 'birch_plank', label: 'Koivulankku', color: 0xc6a875, accent: 0xf5e7c1, pattern: 'wood' },
  { id: 'dark_wood', label: 'Tumma puu', color: 0x49302d, accent: 0x91605a, pattern: 'wood' },
  { id: 'bamboo', label: 'Bambu', color: 0x72a83b, accent: 0xc4e874, pattern: 'wood' },
  { id: 'mossy_wood', label: 'Sammaloitunut puu', color: 0x496347, accent: 0x9dd66b, pattern: 'wood' },
  { id: 'redwood', label: 'Jättipuu', color: 0x71372d, accent: 0xc7794e, pattern: 'wood' },
  { id: 'coral_block', label: 'Koralliblokki', color: 0xd44d68, accent: 0xffa8b2, pattern: 'organic' },
  { id: 'mushroom_block', label: 'Sieniblokki', color: 0x9e4c7f, accent: 0xf0b3c6, pattern: 'organic' },
  { id: 'bone_block', label: 'Luublokki', color: 0xd9cfad, accent: 0xfff6d5, pattern: 'organic' },
  { id: 'lava_block', label: 'Laavablokki', color: 0x8d2c20, accent: 0xff6b2f, pattern: 'energy' },
  { id: 'ice_block', label: 'Jääblokki', color: 0x63b9d8, accent: 0xd8fbff, pattern: 'energy' },
  { id: 'cloud_block', label: 'Pilviblokki', color: 0x9cb6d1, accent: 0xf5fbff, pattern: 'energy' },
  { id: 'rainbow_block', label: 'Sateenkaariblokki', color: 0xde5f9c, accent: 0x6fffe9, pattern: 'energy' },
  { id: 'star_block', label: 'Tähtiblokki', color: 0x423a7c, accent: 0xffed7a, pattern: 'energy' },
  { id: 'moon_block', label: 'Kuublokki', color: 0x343c6e, accent: 0xc8d7ff, pattern: 'energy' },
  { id: 'tech_block', label: 'Teknoblokki', color: 0x263e4d, accent: 0x54e9ff, pattern: 'energy' },
  { id: 'portal_block', label: 'Portaaliblokki', color: 0x512b86, accent: 0xff70e8, pattern: 'energy' },
  { id: 'galaxy_block', label: 'Galaksiblokki', color: 0x211c50, accent: 0x9ee7ff, pattern: 'energy' },
  { id: 'stair_right', label: 'Porras oikealle', color: 0x9b633b, accent: 0xf0b477, pattern: 'stair', direction: 'right' },
  { id: 'stair_left', label: 'Porras vasemmalle', color: 0x9b633b, accent: 0xf0b477, pattern: 'stair', direction: 'left' },
  { id: 'stair_down_right', label: 'Laskeutuva porras', color: 0x456b91, accent: 0x9ed4ff, pattern: 'stair', direction: 'down-right' },
  { id: 'stair_down_left', label: 'Laskeutuva vasen porras', color: 0x456b91, accent: 0x9ed4ff, pattern: 'stair', direction: 'down-left' },
  { id: 'stair_corner_right', label: 'Kulmaporras oikea', color: 0x6d4a8e, accent: 0xd8a7ff, pattern: 'stair-corner', direction: 'right' },
  { id: 'stair_corner_left', label: 'Kulmaporras vasen', color: 0x6d4a8e, accent: 0xd8a7ff, pattern: 'stair-corner', direction: 'left' }
].map((block) => ({
  ...block,
  textureKey: `tex_build_${block.id}`,
  type: `custom_${block.id}`,
  inv: 'stone',
  cost: 1,
  emptyToast: 'Ei kiveä!'
}));

// 65 ansapalikkaa: 13 ansaperhettä x 5 väriä. Jokainen näyttää erilaiselta,
// mutta käyttää vakaata olemassa olevaa ansatoimintoa taustalla.
const TRAP_BUILD_FAMILIES = [
  { id: 'spike', label: 'Piikkimatto', trapType: 'spike', glyph: '▲' },
  { id: 'bear', label: 'Karhuloukku', trapType: 'bear', glyph: 'U' },
  { id: 'tripwire', label: 'Lasersäie', trapType: 'tripwire', glyph: '—' },
  { id: 'fire', label: 'Liekkoansa', trapType: 'fire', glyph: '🔥' },
  { id: 'poison', label: 'Myrkkypilvi', trapType: 'poison', glyph: '☠' },
  { id: 'spring', label: 'Jousilinko', trapType: 'spring', glyph: '↟' },
  { id: 'freeze', label: 'Jääansa', trapType: 'freeze', glyph: '✦' },
  { id: 'alarm', label: 'Hälytinansa', trapType: 'alarm', glyph: '!' },
  { id: 'trampoline', label: 'Trampoliini · pomppaa', trapType: 'trampoline', glyph: '∩' },
  { id: 'shadow', label: 'Varjopiikit', trapType: 'spike', glyph: '◆' },
  { id: 'ember', label: 'Hiillosansa', trapType: 'fire', glyph: '✹' },
  { id: 'shock', label: 'Sähkölanka', trapType: 'tripwire', glyph: '⚡' },
  { id: 'gravity', label: 'Painovoima-ansa', trapType: 'spring', glyph: '↓' }
];
const TRAP_BUILD_COLORS = [
  { id: 'red', label: 'Punainen', color: 0xef4444, accent: 0x7f1d1d },
  { id: 'blue', label: 'Sininen', color: 0x38bdf8, accent: 0x075985 },
  { id: 'green', label: 'Vihreä', color: 0x4ade80, accent: 0x166534 },
  { id: 'gold', label: 'Kultainen', color: 0xfacc15, accent: 0x854d0e },
  { id: 'purple', label: 'Liila', color: 0xc084fc, accent: 0x581c87 }
];
const TRAP_BUILD_BLOCK_DEFS = TRAP_BUILD_FAMILIES.flatMap((family) => TRAP_BUILD_COLORS.map((color) => ({
  id: `trap_${family.id}_${color.id}`,
  label: `${family.label} · ${color.label}`,
  color: color.color,
  accent: color.accent,
  pattern: 'trap',
  trapFamily: family.id,
  trapType: family.trapType,
  trapGlyph: family.glyph,
  textureKey: `tex_trap_block_${family.id}_${color.id}`,
  type: `trap_block_${family.id}_${color.id}`,
  inv: 'stone',
  cost: 1,
  emptyToast: 'Tarvitset kiveä ansapalikkaan'
})));
const BUILD_BLOCK_IDS = ['plank', 'stone', 'hotstone', ...NEW_BUILD_BLOCK_DEFS.map((block) => block.id), ...TRAP_BUILD_BLOCK_DEFS.map((block) => block.id)];

const WORKSTATION_DEFS = [
  { id: 'grill', label: 'Grilli', textureKey: 'tex_workstation_grill', hint: 'Grillaa ruokaa ja pidä nälkä kurissa.' },
  { id: 'workbench', label: 'Verstaspöytä', textureKey: 'tex_workstation_workbench', hint: 'Craftaa lankkuja ja rakennusmateriaaleja.' },
  { id: 'furnace', label: 'Uuni', textureKey: 'tex_workstation_furnace', hint: 'Sulata kiveä ja valmista kuumia materiaaleja.' },
  { id: 'grindstone', label: 'Tahko', textureKey: 'tex_workstation_grindstone', hint: 'Teroita käytössä oleva työkalu.' },
  { id: 'anvil', label: 'Alasin', textureKey: 'tex_workstation_anvil', hint: 'Korjaa ja vahvista varusteita.' },
  { id: 'toolbench', label: 'Työkalupöytä', textureKey: 'tex_workstation_toolbench', hint: 'Valitse ja säädä työkaluja.' }
];
const WORKSTATION_MAP = Object.fromEntries(WORKSTATION_DEFS.map((station) => [station.id, station]));

const BATTLE_ANIMAL_TEXTURE_PREFIX = 'tex_ba_';
const WEAPON_SKIN_DEFS = {
  classic: { name: 'Klassinen', tint: null },
  neon: { name: 'Neon', tint: 0x5cf5ff },
  magma: { name: 'Magma', tint: 0xff5a36 },
  gold: { name: 'Kulta', tint: 0xffd34e },
  toxic: { name: 'Myrkky', tint: 0x8cff4a },
  watermelon: { name: 'Vesimeloni', tint: 0xff5f7a, weapons: ['pistol', 'minigun', 'ak47', 'rifle', 'sniper'] },
  laser: { name: 'Laser', tint: 0xb86cff, weapons: ['bow', 'crossbow', 'spear', 'trident'] },
  hazard: { name: 'Varoitusraita', tint: 0xffc928, weapons: ['bazooka', 'grenade', 'nuke', 'cannon'] },
  rainbow: { name: 'Sateenkaari', tint: 0xff71d1, weapons: ['knife', 'boomerang', 'mop', 'pamppu', 'roller_skates'] },
  cola_bottle: { name: 'Coca-Cola-pullo', tint: null, weapons: ['tnt'], textureByWeapon: { tnt: 'tex_tnt_cola' } },
  gold_tnt: { name: 'Kultainen TNT', tint: null, weapons: ['tnt'], textureByWeapon: { tnt: 'tex_tnt_gold' } },
  neon_tnt: { name: 'Neon-TNT', tint: null, weapons: ['tnt'], textureByWeapon: { tnt: 'tex_tnt_neon' } },
  cards: { name: 'Pelikortit', tint: null, weapons: ['dakkerssit'], textureByWeapon: { dakkerssit: 'tex_weapon_dakkerssit_cards' } },
  cards_neon: { name: 'Neon-pelikortit', tint: null, weapons: ['dakkerssit'], textureByWeapon: { dakkerssit: 'tex_weapon_dakkerssit_cards_neon' } }
};
const DRONE_DEFS = [
  { id: 'scout', name: 'Tiedusteludrooni', texture: 'tex_drone_scout', projectileTint: 0x5cf5ff, followForce: 2.9, cooldown: 160, projectileSpeed: 980 },
  { id: 'medic', name: 'Parannusdrooni', texture: 'tex_drone_medic', projectileTint: 0x7cff8a, followForce: 2.4, cooldown: 260, projectileSpeed: 820, heals: true },
  { id: 'tesla', name: 'Ukkosdrooni', texture: 'tex_drone_tesla', projectileTint: 0xfff27a, followForce: 2.2, cooldown: 460, projectileSpeed: 760, lightning: true },
  { id: 'rocket', name: 'Rakettidrooni', texture: 'tex_drone_rocket', projectileTint: 0xff8a4c, followForce: 1.9, cooldown: 700, projectileSpeed: 680, explosive: true },
  { id: 'guardian', name: 'Suojadrooni', texture: 'tex_drone_guardian', projectileTint: 0xb8f7ff, followForce: 2.1, cooldown: 340, projectileSpeed: 860, guardian: true }
];
const DRONE_MAP = Object.fromEntries(DRONE_DEFS.map((drone) => [drone.id, drone]));
const DRONE_SKIN_DEFS = {
  classic: { name: 'Klassinen', tint: null },
  neon: { name: 'Neon', tint: 0x5cf5ff },
  magma: { name: 'Magma', tint: 0xff5a36 },
  toxic: { name: 'Myrkky', tint: 0x8cff4a },
  cola: { name: 'Coca-Cola', tint: null, texture: 'tex_drone_cola' },
  crystal: { name: 'Kristalli', tint: 0xd8a4ff },
  rainbow: { name: 'Sateenkaari', tint: 0xff71d1 }
};
const BOSS_DEFS = [
  { id: 'morko', name: 'Mörkö', texture: 'tex_boss_morko', hp: 6, achievement: 'Mörönkaataja', rewardWeapon: 'boost_pistol', rewardArmor: 'storm_armor', rewardCoins: 50 },
  { id: 'palace_guardian', name: 'Palatsin vartija', texture: 'tex_boss_palace', hp: 11, achievement: 'Palatsin pelastaja', rewardWeapon: 'rocket_hammer', rewardArmor: 'neon_runner', rewardCoins: 100 },
  { id: 'robot_overseer', name: 'Robottipomon pysäyttäjä', texture: 'tex_boss_robot', hp: 15, achievement: 'Tehdas sammutettu', rewardWeapon: 'hyperdrive', rewardArmor: 'vortex_core', rewardCoins: 150 },
  { id: 'dragon', name: 'Lohikäärmepomo', texture: 'tex_boss_dragon', hp: 18, achievement: 'Lohikäärmeen kukistaja', rewardWeapon: 'dragon_breath', rewardArmor: 'meteor_shell', rewardCoins: 200 },
  { id: 'ice_titan', name: 'Jääjätti', texture: 'tex_boss_ice', hp: 13, achievement: 'Jäänmurtaja', rewardWeapon: 'frost_ray', rewardArmor: 'chameleon_armor', rewardCoins: 125 }
];
const BOSS_MAP = Object.fromEntries(BOSS_DEFS.map((boss) => [boss.id, boss]));
const MOB_HP_DEFS = {
  boss: { name: 'Bossi', hp: 10, barColor: 0xf0abfc }
};
const GIFT_BOX_DEFS = [
  { id: 'rare', name: 'RARE', texture: 'tex_gift_rare', color: 0x3b82f6, coins: 20, armor: 'wind_suit', guaranteedWeapon: 'gift_rare_prism', weaponCount: 1, weapons: ['gift_rare_prism', 'wind_cannon', 'pulse_shotgun'] },
  { id: 'legendary', name: 'LEGENDARY', texture: 'tex_gift_legendary', color: 0xf59e0b, coins: 60, armor: 'neon_runner', guaranteedWeapon: 'gift_legendary_sunforge', weaponCount: 1, weapons: ['gift_legendary_sunforge', 'rocket_hammer', 'sonic_lance'] },
  { id: 'mythical', name: 'MYTHICAL', texture: 'tex_gift_mythical', color: 0xa855f7, coins: 140, armor: 'meteor_shell', guaranteedWeapon: 'gift_mythical_voidcrown', weaponCount: 2, weapons: ['gift_mythical_voidcrown', 'dragon_breath', 'hyperdrive', 'gravity_grenade'] },
  { id: 'ultra', name: 'OP ULTRA', texture: 'tex_gift_ultra', color: 0xff2d75, coins: 400, armor: 'chameleon_armor', guaranteedWeapon: 'gift_ultra_starsever', weaponCount: 3, weapons: ['gift_ultra_starsever', 'rainbow_core', 'meteor_punch', 'wind_rider'] }
];
const GIFT_BOX_MAP = Object.fromEntries(GIFT_BOX_DEFS.map((gift) => [gift.id, gift]));
const BOOST_WEAPON_SPECS = [
  { id: 'boost_pistol', name: 'Impulssipistooli', texture: 'tex_weapon_boost_pistol', projectile: 'tex_boost_pulse', projectileTint: 0x5cf5ff, trailColor: 0x5cf5ff, projectileSpeed: 920, cooldown: 320, boostX: 420, boostY: 520, trailCount: 7 },
  { id: 'dash_blaster', name: 'Ryntäysblasteri', texture: 'tex_weapon_dash_blaster', projectile: 'tex_boost_dash', projectileTint: 0x7cff8a, trailColor: 0x7cff8a, projectileSpeed: 840, cooldown: 520, boostX: 850, boostY: 180, trailCount: 9 },
  { id: 'jump_howitzer', name: 'Hyppyhaupitsi', texture: 'tex_weapon_jump_howitzer', projectile: 'tex_boost_shell', projectileTint: 0xffd34e, trailColor: 0xffd34e, projectileSpeed: 680, cooldown: 720, boostX: 260, boostY: 980, trailCount: 10 },
  { id: 'wind_cannon', name: 'Tuulipallotykki', texture: 'tex_weapon_wind_cannon', projectile: 'tex_boost_wind', projectileTint: 0xb8f7ff, trailColor: 0xb8f7ff, projectileSpeed: 760, projectileLifeTiles: 240, windBall: true, cooldown: 460, boostX: 620, boostY: 420, trailCount: 8 },
  { id: 'neon_bow', name: 'Neonjousi', texture: 'tex_weapon_neon_bow', projectile: 'tex_boost_arrow', projectileTint: 0xff63e6, trailColor: 0xff63e6, projectileSpeed: 1080, cooldown: 380, boostX: 500, boostY: 650, trailCount: 8 },
  { id: 'gravity_flipper', name: 'Painovoimankääntäjä', texture: 'tex_weapon_gravity_flipper', projectile: 'tex_boost_gravity', projectileTint: 0xa78bfa, trailColor: 0xa78bfa, projectileSpeed: 620, cooldown: 900, boostX: 180, boostY: 1120, trailCount: 12 },
  { id: 'sonic_lance', name: 'Sonic-keihäs', texture: 'tex_weapon_sonic_lance', projectile: 'tex_boost_sonic', projectileTint: 0xfffb91, trailColor: 0xfffb91, projectileSpeed: 1260, cooldown: 280, boostX: 980, boostY: 120, trailCount: 11 },
  { id: 'vortex_launcher', name: 'Pyörrelinko', texture: 'tex_weapon_vortex_launcher', projectile: 'tex_boost_vortex', projectileTint: 0xd8a4ff, trailColor: 0xd8a4ff, projectileSpeed: 700, cooldown: 650, boostX: 700, boostY: 560, trailCount: 10 },
  { id: 'rocket_hammer', name: 'Rakettivasara', texture: 'tex_weapon_rocket_hammer', projectile: 'tex_boost_rocket', projectileTint: 0xff8a4c, trailColor: 0xff8a4c, projectileSpeed: 560, cooldown: 820, boostX: 360, boostY: 1080, trailCount: 13 },
  { id: 'hyperdrive', name: 'Neonkiihdytin', texture: 'tex_weapon_hyperdrive', projectile: 'tex_boost_hyper', projectileTint: 0xffffff, trailColor: 0x66eaff, projectileSpeed: 1400, cooldown: 1100, boostX: 1180, boostY: 760, trailCount: 16 },
  { id: 'frost_ray', name: 'Jääsäde', texture: 'tex_weapon_frost_ray', projectile: 'tex_boost_frost_ray', projectileTint: 0x9cecff, trailColor: 0x9cecff, projectileSpeed: 1180, cooldown: 360, boostX: 700, boostY: 280, trailCount: 8 },
  { id: 'plasma_spear', name: 'Plasmakeihäs', texture: 'tex_weapon_plasma_spear', projectile: 'tex_boost_plasma_spear', projectileTint: 0xff6bce, trailColor: 0xff6bce, projectileSpeed: 1300, cooldown: 340, boostX: 820, boostY: 200, trailCount: 10 },
  { id: 'thunder_orb', name: 'Ukkospallo', texture: 'tex_weapon_thunder_orb', projectile: 'tex_boost_thunder_orb', projectileTint: 0xfff27a, trailColor: 0xfff27a, projectileSpeed: 900, cooldown: 600, boostX: 550, boostY: 650, trailCount: 12 },
  { id: 'lava_mortar', name: 'Laavakranaatinheitin', texture: 'tex_weapon_lava_mortar', projectile: 'tex_boost_lava_mortar', projectileTint: 0xff6538, trailColor: 0xff6538, projectileSpeed: 540, cooldown: 950, boostX: 320, boostY: 1000, trailCount: 13 },
  { id: 'pulse_shotgun', name: 'Pulssipyssy', texture: 'tex_weapon_pulse_shotgun', projectile: 'tex_boost_pulse_shotgun', projectileTint: 0x66ffcc, trailColor: 0x66ffcc, projectileSpeed: 820, cooldown: 700, boostX: 520, boostY: 500, trailCount: 9 },
  { id: 'comet_rifle', name: 'Kiväärikomeetta', texture: 'tex_weapon_comet_rifle', projectile: 'tex_boost_comet_rifle', projectileTint: 0xffb35c, trailColor: 0xffb35c, projectileSpeed: 1100, cooldown: 500, boostX: 760, boostY: 360, trailCount: 11 },
  { id: 'magnet_caster', name: 'Magneettitykki', texture: 'tex_weapon_magnet_caster', projectile: 'tex_boost_magnet_caster', projectileTint: 0xc1a4ff, trailColor: 0xc1a4ff, projectileSpeed: 700, cooldown: 800, boostX: 460, boostY: 720, trailCount: 10 },
  { id: 'prism_beam', name: 'Prismasäde', texture: 'tex_weapon_prism_beam', projectile: 'tex_boost_prism_beam', projectileTint: 0xff73ff, trailColor: 0xff73ff, projectileSpeed: 1250, cooldown: 420, boostX: 720, boostY: 360, trailCount: 8 },
  { id: 'echo_cannon', name: 'Kaikutyki', texture: 'tex_weapon_echo_cannon', projectile: 'tex_boost_echo_cannon', projectileTint: 0x91a7ff, trailColor: 0x91a7ff, projectileSpeed: 850, cooldown: 560, boostX: 600, boostY: 460, trailCount: 9 },
  { id: 'cyclone_staff', name: 'Pyörresauva', texture: 'tex_weapon_cyclone_staff', projectile: 'tex_boost_cyclone_staff', projectileTint: 0x63d8ff, trailColor: 0x63d8ff, projectileSpeed: 760, cooldown: 720, boostX: 640, boostY: 550, trailCount: 12 },
  { id: 'rocket_spear', name: 'Rakettikeihäs', texture: 'tex_weapon_rocket_spear', projectile: 'tex_boost_rocket_spear', projectileTint: 0xff9d5c, trailColor: 0xff9d5c, projectileSpeed: 1000, cooldown: 620, boostX: 760, boostY: 620, trailCount: 11 },
  { id: 'aqua_burst', name: 'Vesipulssi', texture: 'tex_weapon_aqua_burst', projectile: 'tex_boost_aqua_burst', projectileTint: 0x48c9ff, trailColor: 0x48c9ff, projectileSpeed: 980, cooldown: 430, boostX: 650, boostY: 420, trailCount: 8 },
  { id: 'solar_flare', name: 'Aurinkoliekki', texture: 'tex_weapon_solar_flare', projectile: 'tex_boost_solar_flare', projectileTint: 0xffdf5c, trailColor: 0xffdf5c, projectileSpeed: 1150, cooldown: 650, boostX: 850, boostY: 360, trailCount: 10 },
  { id: 'lunar_dart', name: 'Kuunuoli', texture: 'tex_weapon_lunar_dart', projectile: 'tex_boost_lunar_dart', projectileTint: 0xd6c5ff, trailColor: 0xd6c5ff, projectileSpeed: 1300, cooldown: 360, boostX: 650, boostY: 520, trailCount: 8 },
  { id: 'void_pulse', name: 'Tyhjiöpulssi', texture: 'tex_weapon_void_pulse', projectile: 'tex_boost_void_pulse', projectileTint: 0x5b43a8, trailColor: 0x5b43a8, projectileSpeed: 740, cooldown: 880, boostX: 300, boostY: 900, trailCount: 14 },
  { id: 'spark_minigun', name: 'Kipinäminigun', texture: 'tex_weapon_spark_minigun', projectile: 'tex_boost_spark_minigun', projectileTint: 0xffe14c, trailColor: 0xffe14c, projectileSpeed: 1350, cooldown: 220, boostX: 700, boostY: 160, trailCount: 7 },
  { id: 'quake_driver', name: 'Maanjäristysjyrsin', texture: 'tex_weapon_quake_driver', projectile: 'tex_boost_quake_driver', projectileTint: 0xd4a06c, trailColor: 0xd4a06c, projectileSpeed: 620, cooldown: 1000, boostX: 420, boostY: 1100, trailCount: 15 },
  { id: 'bubble_bazooka', name: 'Kuplabazooka', texture: 'tex_weapon_bubble_bazooka', projectile: 'tex_boost_bubble_bazooka', projectileTint: 0x7be6ff, trailColor: 0x7be6ff, projectileSpeed: 600, cooldown: 840, boostX: 380, boostY: 850, trailCount: 12 },
  { id: 'acid_sprayer', name: 'Happoruisku', texture: 'tex_weapon_acid_sprayer', projectile: 'tex_boost_acid_sprayer', projectileTint: 0xb8ff4a, trailColor: 0xb8ff4a, projectileSpeed: 800, cooldown: 380, boostX: 550, boostY: 380, trailCount: 8 },
  { id: 'crystal_cannon', name: 'Kristallitykki', texture: 'tex_weapon_crystal_cannon', projectile: 'tex_boost_crystal_cannon', projectileTint: 0xb2ffff, trailColor: 0xb2ffff, projectileSpeed: 1040, cooldown: 540, boostX: 700, boostY: 460, trailCount: 10 },
  { id: 'teleport_blaster', name: 'Teleporttiblasteri', texture: 'tex_weapon_teleport_blaster', projectile: 'tex_boost_teleport_blaster', projectileTint: 0xf18cff, trailColor: 0xf18cff, projectileSpeed: 900, cooldown: 1150, boostX: 1000, boostY: 520, trailCount: 14 },
  { id: 'boomerang_drive', name: 'Bumerangikiihdytin', texture: 'tex_weapon_boomerang_drive', projectile: 'tex_boost_boomerang_drive', projectileTint: 0xffa45e, trailColor: 0xffa45e, projectileSpeed: 720, cooldown: 660, boostX: 700, boostY: 340, trailCount: 10 },
  { id: 'thunder_hammer', name: 'Ukkosvasara', texture: 'tex_weapon_thunder_hammer', projectile: 'tex_boost_thunder_hammer', projectileTint: 0xe8ecff, trailColor: 0xe8ecff, projectileSpeed: 560, cooldown: 900, boostX: 430, boostY: 1100, trailCount: 14 },
  { id: 'firework_launcher', name: 'Ilotulitusraketti', texture: 'tex_weapon_firework_launcher', projectile: 'tex_boost_firework_launcher', projectileTint: 0xff5eaa, trailColor: 0xff5eaa, projectileSpeed: 880, cooldown: 480, boostX: 620, boostY: 620, trailCount: 13 },
  { id: 'rail_sling', name: 'Kiskolinko', texture: 'tex_weapon_rail_sling', projectile: 'tex_boost_rail_sling', projectileTint: 0x8cf2ff, trailColor: 0x8cf2ff, projectileSpeed: 1500, cooldown: 520, boostX: 1100, boostY: 200, trailCount: 9 },
  { id: 'ice_missile', name: 'Jääohjus', texture: 'tex_weapon_ice_missile', projectile: 'tex_boost_ice_missile', projectileTint: 0x78bfff, trailColor: 0x78bfff, projectileSpeed: 780, cooldown: 700, boostX: 500, boostY: 700, trailCount: 11 },
  { id: 'leaf_storm', name: 'Lehtimyrsky', texture: 'tex_weapon_leaf_storm', projectile: 'tex_boost_leaf_storm', projectileTint: 0x9dff76, trailColor: 0x9dff76, projectileSpeed: 920, cooldown: 460, boostX: 580, boostY: 500, trailCount: 12 },
  { id: 'sand_winder', name: 'Hiekkapyörre', texture: 'tex_weapon_sand_winder', projectile: 'tex_boost_sand_winder', projectileTint: 0xe7c47c, trailColor: 0xe7c47c, projectileSpeed: 680, cooldown: 760, boostX: 600, boostY: 650, trailCount: 13 },
  { id: 'shadow_dagger', name: 'Varjotikari', texture: 'tex_weapon_shadow_dagger', projectile: 'tex_boost_shadow_dagger', projectileTint: 0x9c83ff, trailColor: 0x9c83ff, projectileSpeed: 1400, cooldown: 300, boostX: 820, boostY: 180, trailCount: 8 },
  { id: 'star_caster', name: 'Tähtilinko', texture: 'tex_weapon_star_caster', projectile: 'tex_boost_star_caster', projectileTint: 0xfff2a6, trailColor: 0xfff2a6, projectileSpeed: 1000, cooldown: 620, boostX: 760, boostY: 520, trailCount: 12 },
  { id: 'gravity_grenade', name: 'Painovoimakranaatti', texture: 'tex_weapon_gravity_grenade', projectile: 'tex_boost_gravity_grenade', projectileTint: 0xb389ff, trailColor: 0xb389ff, projectileSpeed: 580, cooldown: 1050, boostX: 300, boostY: 1150, trailCount: 15 },
  { id: 'magma_drill', name: 'Magmapora', texture: 'tex_weapon_magma_drill', projectile: 'tex_boost_magma_drill', projectileTint: 0xff7046, trailColor: 0xff7046, projectileSpeed: 650, cooldown: 820, boostX: 520, boostY: 850, trailCount: 14 },
  { id: 'aurora_lance', name: 'Revontulikeihäs', texture: 'tex_weapon_aurora_lance', projectile: 'tex_boost_aurora_lance', projectileTint: 0x8affdb, trailColor: 0x8affdb, projectileSpeed: 1180, cooldown: 440, boostX: 760, boostY: 480, trailCount: 11 },
  { id: 'pulse_disc', name: 'Pulssikiekko', texture: 'tex_weapon_pulse_disc', projectile: 'tex_boost_pulse_disc', projectileTint: 0x5cf5ff, trailColor: 0x5cf5ff, projectileSpeed: 1080, cooldown: 520, boostX: 680, boostY: 520, trailCount: 9 },
  { id: 'dragon_breath', name: 'Lohikäärmeenhenkäys', texture: 'tex_weapon_dragon_breath', projectile: 'tex_boost_dragon_breath', projectileTint: 0xff6e42, trailColor: 0xff6e42, projectileSpeed: 700, cooldown: 900, boostX: 540, boostY: 900, trailCount: 15 },
  { id: 'sonic_boomer', name: 'Sonicbumerangi', texture: 'tex_weapon_sonic_boomer', projectile: 'tex_boost_sonic_boomer', projectileTint: 0xffff7c, trailColor: 0xffff7c, projectileSpeed: 1320, cooldown: 340, boostX: 940, boostY: 220, trailCount: 10 },
  { id: 'wind_rider', name: 'Tuuliratsastaja', texture: 'tex_weapon_wind_rider', projectile: 'tex_boost_wind_rider', projectileTint: 0x9eefff, trailColor: 0x9eefff, projectileSpeed: 1050, cooldown: 500, boostX: 920, boostY: 460, trailCount: 10 },
  { id: 'meteor_punch', name: 'Meteorinyrkki', texture: 'tex_weapon_meteor_punch', projectile: 'tex_boost_meteor_punch', projectileTint: 0xff8e69, trailColor: 0xff8e69, projectileSpeed: 520, cooldown: 1000, boostX: 420, boostY: 1200, trailCount: 16 },
  { id: 'rainbow_core', name: 'Sateenkaariydin', texture: 'tex_weapon_rainbow_core', projectile: 'tex_boost_rainbow_core', projectileTint: 0xff8eea, trailColor: 0xff8eea, projectileSpeed: 1120, cooldown: 580, boostX: 780, boostY: 620, trailCount: 14 }
];

// Generate the rest of the arsenal from compact data so the game has 300
// regular boost weapons plus the four unique gift-box weapons.
const TARGET_BOOST_WEAPON_COUNT = 300;
const GENERATED_WEAPON_NAMES = [
  'Aurora', 'Storm', 'Plasma', 'Void', 'Crystal', 'Solar', 'Lunar', 'Magma',
  'Sonic', 'Gravity', 'Rocket', 'Prism', 'Comet', 'Toxic', 'Frost', 'Neon',
  'Thunder', 'Vortex', 'Meteor', 'Rainbow', 'Aqua', 'Shadow', 'Dragon', 'Quake'
];
const GENERATED_WEAPON_COLORS = [
  0x5cf5ff, 0x7cff8a, 0xffd34e, 0xff63e6, 0xa78bfa, 0xff7046,
  0x66ffcc, 0xff8eea, 0x9cecff, 0xfff27a, 0x8affdb, 0xf18cff
];
const generatedWeaponCount = Math.max(0, TARGET_BOOST_WEAPON_COUNT - BOOST_WEAPON_SPECS.length);
for (let i = 0; i < generatedWeaponCount; i++) {
  const serial = String(i + 1).padStart(3, '0');
  const color = GENERATED_WEAPON_COLORS[i % GENERATED_WEAPON_COLORS.length];
  const projectileTint = GENERATED_WEAPON_COLORS[(i + 3) % GENERATED_WEAPON_COLORS.length];
  BOOST_WEAPON_SPECS.push({
    id: `boost_generated_${serial}`,
    name: `${GENERATED_WEAPON_NAMES[i % GENERATED_WEAPON_NAMES.length]}-ase ${serial}`,
    texture: `tex_weapon_generated_${serial}`,
    projectile: `tex_boost_generated_${serial}`,
    projectileTint,
    trailColor: color,
    projectileSpeed: 560 + ((i * 83) % 960),
    projectileLifeTiles: 14 + ((i * 7) % 30),
    cooldown: 220 + ((i * 47) % 820),
    boostX: 360 + ((i * 71) % 920),
    boostY: 260 + ((i * 97) % 980),
    trailCount: 7 + (i % 11),
    windBall: i % 17 === 0
  });
}
// Four unique weapons that can only be earned from the nature gift boxes.
const GIFT_WEAPON_SPECS = [
  { id: 'gift_rare_prism', name: 'Prismalahjain', texture: 'tex_weapon_gift_rare_prism', projectile: 'tex_projectile_gift_rare_prism', projectileTint: 0x7dd3fc, trailColor: 0x3b82f6, projectileSpeed: 980, cooldown: 420, boostX: 560, boostY: 420, trailCount: 9 },
  { id: 'gift_legendary_sunforge', name: 'Auringonahjo', texture: 'tex_weapon_gift_legendary_sunforge', projectile: 'tex_projectile_gift_legendary_sunforge', projectileTint: 0xfff08a, trailColor: 0xf59e0b, projectileSpeed: 820, cooldown: 720, boostX: 720, boostY: 650, trailCount: 13 },
  { id: 'gift_mythical_voidcrown', name: 'Tyhjyyskruunu', texture: 'tex_weapon_gift_mythical_voidcrown', projectile: 'tex_projectile_gift_mythical_voidcrown', projectileTint: 0xd8a4ff, trailColor: 0xa855f7, projectileSpeed: 760, cooldown: 680, boostX: 820, boostY: 820, trailCount: 15 },
  { id: 'gift_ultra_starsever', name: 'Tähtikatkaisija', texture: 'tex_weapon_gift_ultra_starsever', projectile: 'tex_projectile_gift_ultra_starsever', projectileTint: 0xffffff, trailColor: 0xff2d75, projectileSpeed: 1500, cooldown: 300, boostX: 1250, boostY: 900, trailCount: 20 }
];
BOOST_WEAPON_SPECS.push(...GIFT_WEAPON_SPECS);

// One hundred extra power weapons. Each family has ten strength levels and a
// different active effect, so these are more than cosmetic weapon variants.
const SPECIAL_POWER_FAMILIES = [
  { id: 'thunder', name: 'Ukkosvoima', behavior: 'shockwave', color: 0xfff27a, description: 'Salama iskee lähellä oleviin vihollisiin.' },
  { id: 'frost', name: 'Jäävoima', behavior: 'homing', color: 0x9cecff, description: 'Jäädyttää ja hidastaa vihollisia.' },
  { id: 'solar', name: 'Aurinkovoima', behavior: 'explosive', color: 0xffdf5c, description: 'Aurinkoräjähdys polttaa alueen.' },
  { id: 'void', name: 'Tyhjyysvoima', behavior: 'vortex', color: 0xa78bfa, description: 'Vetää viholliset tyhjiöön.' },
  { id: 'healing', name: 'Parannusvoima', behavior: 'rapid', color: 0x7cff8a, description: 'Palauttaa elämiä.' },
  { id: 'shield', name: 'Suojavoima', behavior: 'rapid', color: 0xb8f7ff, description: 'Aktivoi suojakentän.' },
  { id: 'blink', name: 'Teleporttivoima', behavior: 'dash', color: 0xf18cff, description: 'Syöksyttää pelaajaa tähtäyssuuntaan.' },
  { id: 'meteor', name: 'Meteorivoima', behavior: 'hammer', color: 0xff7046, description: 'Meteori murskaa alueen ja nostaa ilmaan.' },
  { id: 'wind', name: 'Tuulivoima', behavior: 'scatter', color: 0x8affdb, description: 'Puhaltaa viholliset kauas.' },
  { id: 'clone', name: 'Kloonivoima', behavior: 'burst', color: 0xd8a4ff, description: 'Kutsuu apuvoimaa taisteluun.' }
];
const SPECIAL_POWER_WEAPON_SPECS = [];
SPECIAL_POWER_FAMILIES.forEach((family, familyIndex) => {
  for (let level = 1; level <= 10; level++) {
    const serial = String(familyIndex * 10 + level).padStart(3, '0');
    SPECIAL_POWER_WEAPON_SPECS.push({
      id: `power_weapon_${serial}`,
      name: `${family.name} ${level}`,
      texture: `tex_weapon_power_${serial}`,
      projectile: `tex_projectile_power_${serial}`,
      projectileTint: family.color,
      trailColor: family.color,
      projectileSpeed: 760 + level * 42,
      cooldown: Math.max(180, 720 - level * 36),
      boostX: 420 + level * 58,
      boostY: 360 + level * 48,
      projectileLifeTiles: 18 + level * 4,
      trailCount: 8 + level,
      specialPower: family.id,
      powerLevel: level,
      powerName: family.name,
      powerDescription: family.description,
      specialBehavior: family.behavior
    });
  }
});
BOOST_WEAPON_SPECS.push(...SPECIAL_POWER_WEAPON_SPECS);
const BOOST_WEAPON_MAP = Object.fromEntries(BOOST_WEAPON_SPECS.map((spec) => [spec.id, spec]));
const BOOST_WEAPON_IDS = BOOST_WEAPON_SPECS.map((spec) => spec.id);
const BOOST_BEHAVIOR_OVERRIDES = {
  boost_pistol: 'rapid',
  dash_blaster: 'dash',
  jump_howitzer: 'jump',
  wind_cannon: 'wind',
  neon_bow: 'burst',
  gravity_flipper: 'gravity',
  sonic_lance: 'longshot',
  vortex_launcher: 'vortex',
  rocket_hammer: 'explosive',
  hyperdrive: 'hyper',
  thunder_hammer: 'hammer',
  rocket_spear: 'dash',
  lava_mortar: 'explosive',
  pulse_shotgun: 'scatter',
  comet_rifle: 'longshot',
  magnet_caster: 'vortex',
  cyclone_staff: 'vortex',
  bubble_bazooka: 'explosive',
  crystal_cannon: 'longshot',
  teleport_blaster: 'hyper',
  boomerang_drive: 'boomerang',
  firework_launcher: 'burst',
  rail_sling: 'longshot',
  ice_missile: 'homing',
  shadow_dagger: 'rapid',
  gravity_grenade: 'explosive',
  magma_drill: 'dash',
  sonic_boomer: 'boomerang',
  meteor_punch: 'hammer',
  gift_rare_prism: 'burst',
  gift_legendary_sunforge: 'explosive',
  gift_mythical_voidcrown: 'vortex',
  gift_ultra_starsever: 'shockwave'
};
const BOOST_BEHAVIOR_CYCLE = ['burst', 'explosive', 'homing', 'scatter', 'shockwave', 'vortex', 'gravity', 'boomerang'];
BOOST_WEAPON_SPECS.forEach((spec, index) => {
  spec.behavior = spec.specialBehavior || BOOST_BEHAVIOR_OVERRIDES[spec.id] || BOOST_BEHAVIOR_CYCLE[(index - 10) % BOOST_BEHAVIOR_CYCLE.length];
});

// 56 tavallista asetta. Nämä ovat erillään boostiaseista: ne ampuvat tai
// lyövät normaalisti eivätkä lisää pelaajan nopeutta, neonviivoja tai salamoja.
const NORMAL_WEAPON_SPECS = [
  { id: 'normal_sword', name: 'Miekka', kind: 'melee' },
  { id: 'normal_long_sword', name: 'Pitkä miekka', kind: 'melee' },
  { id: 'normal_short_sword', name: 'Lyhyt miekka', kind: 'melee' },
  { id: 'normal_iron_sword', name: 'Rautamiekka', kind: 'melee' },
  { id: 'normal_steel_sword', name: 'Teräsmiekka', kind: 'melee' },
  { id: 'normal_sabre', name: 'Sapeli', kind: 'melee' },
  { id: 'normal_cutlass', name: 'Viidakkoveitsi', kind: 'melee' },
  { id: 'normal_axe', name: 'Kirves', kind: 'melee' },
  { id: 'normal_battle_axe', name: 'Taistelukirves', kind: 'melee' },
  { id: 'normal_hammer', name: 'Vasara', kind: 'melee' },
  { id: 'normal_mace', name: 'Nuija', kind: 'melee' },
  { id: 'normal_spear', name: 'Keihäs', kind: 'melee' },
  { id: 'normal_halberd', name: 'Hilpari', kind: 'melee' },
  { id: 'normal_staff', name: 'Sauva', kind: 'melee' },
  { id: 'normal_bow', name: 'Puujousi', kind: 'projectile' },
  { id: 'normal_longbow', name: 'Pitkä jousi', kind: 'projectile' },
  { id: 'normal_crossbow', name: 'Varsijousi', kind: 'projectile' },
  { id: 'normal_heavy_crossbow', name: 'Raskas varsijousi', kind: 'projectile' },
  { id: 'normal_sling', name: 'Linko', kind: 'projectile' },
  { id: 'normal_small_pistol', name: 'Pieni pistooli', kind: 'projectile' },
  { id: 'normal_pistol', name: 'Pistooli', kind: 'projectile' },
  { id: 'normal_revolver', name: 'Revolveri', kind: 'projectile' },
  { id: 'normal_handgun', name: 'Käsipistooli', kind: 'projectile' },
  { id: 'normal_machine_pistol', name: 'Konepistooli', kind: 'projectile' },
  { id: 'normal_assault_rifle', name: 'Rynnäkkökivääri', kind: 'projectile' },
  { id: 'normal_carbine', name: 'Karbiini', kind: 'projectile' },
  { id: 'normal_hunting_rifle', name: 'Metsästyskivääri', kind: 'projectile' },
  { id: 'normal_bolt_action', name: 'Pulttilukkokivääri', kind: 'projectile' },
  { id: 'normal_shotgun', name: 'Haulikko', kind: 'projectile' },
  { id: 'normal_double_barrel', name: 'Kaksipiippuinen', kind: 'projectile' },
  { id: 'normal_air_rifle', name: 'Ilmakivääri', kind: 'projectile' },
  { id: 'normal_nail_gun', name: 'Naulapyssy', kind: 'projectile' },
  { id: 'normal_musket', name: 'Musketti', kind: 'projectile' },
  { id: 'normal_flintlock', name: 'Piilukkopistooli', kind: 'projectile' },
  { id: 'normal_harpoon', name: 'Harppuuna', kind: 'projectile' },
  { id: 'normal_water_pistol', name: 'Vesipyssy', kind: 'projectile' },
  { id: 'normal_snowball_gun', name: 'Lumipallopyssy', kind: 'projectile' },
  { id: 'normal_paintball_gun', name: 'Maalipyssy', kind: 'projectile' },
  { id: 'normal_dart_gun', name: 'Dartsipyssy', kind: 'projectile' },
  { id: 'normal_whip', name: 'Ruoska', kind: 'melee' },
  { id: 'normal_baton', name: 'Pamppu', kind: 'melee' },
  { id: 'normal_pickaxe', name: 'Hakku', kind: 'melee' },
  { id: 'normal_shovel', name: 'Lapio', kind: 'melee' },
  { id: 'normal_drill', name: 'Pora', kind: 'melee' },
  { id: 'normal_chainsaw', name: 'Moottorisaha', kind: 'melee' },
  { id: 'normal_hand_saw', name: 'Käsisaha', kind: 'melee' },
  { id: 'normal_slingshot', name: 'Ritsa', kind: 'projectile' },
  { id: 'normal_boomerang', name: 'Puubumerangi', kind: 'projectile' },
  { id: 'normal_throwing_knife', name: 'Heittoveitsi', kind: 'projectile' },
  { id: 'normal_throwing_star', name: 'Heittotähti', kind: 'projectile' },
  { id: 'normal_javelin', name: 'Javeliini', kind: 'projectile' },
  { id: 'normal_billy_club', name: 'Lyöntikeppi', kind: 'melee' },
  { id: 'normal_shield_bash', name: 'Kilpilyönti', kind: 'melee' },
  { id: 'normal_hand_cannon', name: 'Käsitykki', kind: 'projectile' },
  { id: 'normal_grenade_launcher', name: 'Kranaatinheitin', kind: 'projectile' },
  { id: 'normal_scythe', name: 'Viikate', kind: 'melee' }
].map((spec, index) => {
  const isMelee = spec.kind === 'melee';
  const isShotgun = spec.id === 'normal_shotgun';
  const isDoubleBarrel = spec.id === 'normal_double_barrel';
  return {
    ...spec,
    normalWeapon: true,
    texture: `tex_normal_weapon_${String(index + 1).padStart(2, '0')}`,
    projectile: isMelee ? null : ['tex_bullet', 'tex_arrow', 'tex_bolt'][index % 3],
    damage: isMelee ? 2 + (index % 3) : 1 + (index % 3),
    reach: isMelee ? 64 + (index % 4) * 8 : 0,
    cooldown: isMelee ? 260 + (index % 4) * 35 : 210 + (index % 6) * 35,
    projectileSpeed: 560 + (index % 7) * 80,
    lifeTiles: 8 + (index % 5),
    shots: isShotgun ? 3 : (isDoubleBarrel ? 2 : 1)
  };
});
const NORMAL_WEAPON_MAP = Object.fromEntries(NORMAL_WEAPON_SPECS.map((spec) => [spec.id, spec]));
const BOOST_ARMOR_SPECS = [
  { id: 'none', name: 'Ei boost-haarniskaa', description: 'Normaalit boostit.', boostXMultiplier: 1, boostYMultiplier: 1, projectileSpeedMultiplier: 1, cooldownMultiplier: 1, trailColor: null },
  { id: 'storm_armor', name: 'Ukkospanssari', description: 'Salamannopea eteenpäinboost ja kirkkaat ukkosviivat.', boostXMultiplier: 1.22, boostYMultiplier: 1.08, projectileSpeedMultiplier: 1.05, cooldownMultiplier: 0.92, trailColor: 0xfff27a },
  { id: 'rocket_harness', name: 'Rakettirintahaarniska', description: 'Rakettimoottorit nostavat boostin korkealle.', boostXMultiplier: 0.92, boostYMultiplier: 1.35, projectileSpeedMultiplier: 1, cooldownMultiplier: 1, trailColor: 0xff8a4c },
  { id: 'wind_suit', name: 'Tuulipuku', description: 'Kevyt puku tekee ammuksista nopeita ja boostista liukuvan.', boostXMultiplier: 1.12, boostYMultiplier: 0.92, projectileSpeedMultiplier: 1.24, cooldownMultiplier: 0.9, trailColor: 0xb8f7ff },
  { id: 'gravity_plate', name: 'Painovoimalevy', description: 'Kääntää voiman ylöspäin: suuri hyppyboost.', boostXMultiplier: 0.82, boostYMultiplier: 1.42, projectileSpeedMultiplier: 0.96, cooldownMultiplier: 1.06, trailColor: 0xa78bfa },
  { id: 'neon_runner', name: 'Neonjuoksupanssari', description: 'Maksimoi vaakasuuntaisen dashin ja nopean sarjatulen.', boostXMultiplier: 1.36, boostYMultiplier: 0.86, projectileSpeedMultiplier: 1.1, cooldownMultiplier: 0.82, trailColor: 0xff63e6 },
  { id: 'vortex_core', name: 'Pyörresydän', description: 'Vetää liikkeen ja viholliset samaan pyörteeseen.', boostXMultiplier: 1.08, boostYMultiplier: 1.12, projectileSpeedMultiplier: 1, cooldownMultiplier: 0.96, trailColor: 0xd8a4ff },
  { id: 'meteor_shell', name: 'Meteorisuoja', description: 'Raskas kuori antaa voimakkaan isku- ja räjähdysboostin.', boostXMultiplier: 1.28, boostYMultiplier: 1.28, projectileSpeedMultiplier: 0.9, cooldownMultiplier: 1.12, trailColor: 0xff7046 },
  { id: 'chameleon_armor', name: 'Kameleonttihaarniska', description: 'Vaihtaa väriä ympäristön ja ajan mukaan sekä naamioi pelaajan hetkeksi boostatessa.', boostXMultiplier: 1.16, boostYMultiplier: 1.08, projectileSpeedMultiplier: 1.08, cooldownMultiplier: 0.9, trailColor: 0x75ff70, chameleon: true }
];

// The armor collection is deliberately generated from verified patterns so
// every entry has a unique id/name, balanced boost stats, a color and a power.
const TARGET_BOOST_ARMOR_COUNT = 400;
const GENERATED_ARMOR_NAMES = [
  'Aurora', 'Myrsky', 'Plasma', 'Tyhjyys', 'Kristalli', 'Aurinko', 'Kuu', 'Magma',
  'Sonic', 'Painovoima', 'Raketti', 'Prisma', 'Komeetta', 'Myrkky', 'Halla', 'Neon',
  'Ukkonen', 'Pyörre', 'Meteori', 'Sateenkaari', 'Aalto', 'Varjo', 'Lohikäärme', 'Maanjäristys',
  'Salama', 'Tulipyörre', 'Jääydin', 'Tähti', 'Hiekkamyrsky', 'Vesikruunu', 'Valokilpi', 'Pimeäydin'
];
const GENERATED_ARMOR_COLORS = [
  0x5cf5ff, 0x7cff8a, 0xffd34e, 0xff63e6, 0xa78bfa, 0xff7046,
  0x66ffcc, 0xff8eea, 0x9cecff, 0xfff27a, 0x8affdb, 0xf18cff,
  0xb8ff4a, 0xff6bce, 0xd6c5ff, 0x8cf2ff
];
const GENERATED_ARMOR_POWER_DEFS = [
  { id: 'arc', label: 'salamapurkaus' },
  { id: 'rocket', label: 'rakettipotku' },
  { id: 'wind', label: 'tuulikehä' },
  { id: 'gravity', label: 'painovoimanosto' },
  { id: 'afterimage', label: 'neonhaamu' },
  { id: 'vortex', label: 'pyörre' },
  { id: 'meteor', label: 'meteori-isku' },
  { id: 'cloak', label: 'naamiointi' },
  { id: 'pulse', label: 'pulssiaalto' },
  { id: 'nova', label: 'novapurkaus' },
  { id: 'heal', label: 'elvytysenergia' },
  { id: 'flame', label: 'tulikehä' },
  { id: 'magnet', label: 'magneettiveto' },
  { id: 'orbit', label: 'kiertoradat' },
  { id: 'mirror', label: 'peilikuva' },
  { id: 'quake', label: 'maanjäristys' }
];
const generatedArmorCount = Math.max(0, TARGET_BOOST_ARMOR_COUNT - BOOST_ARMOR_SPECS.length);
for (let i = 0; i < generatedArmorCount; i++) {
  const serial = String(i + 1).padStart(3, '0');
  const power = GENERATED_ARMOR_POWER_DEFS[i % GENERATED_ARMOR_POWER_DEFS.length];
  BOOST_ARMOR_SPECS.push({
    id: `generated_armor_${serial}`,
    name: `${GENERATED_ARMOR_NAMES[i % GENERATED_ARMOR_NAMES.length]}haarniska ${serial}`,
    description: `Aktiivinen ${power.label}; oma tasapainotettu boostiprofiili.`,
    boostXMultiplier: Number((0.82 + ((i * 7) % 13) * 0.05).toFixed(2)),
    boostYMultiplier: Number((0.82 + ((i * 11) % 13) * 0.05).toFixed(2)),
    projectileSpeedMultiplier: Number((0.84 + ((i * 5) % 12) * 0.05).toFixed(2)),
    cooldownMultiplier: Number((0.76 + ((i * 13) % 10) * 0.05).toFixed(2)),
    trailColor: GENERATED_ARMOR_COLORS[i % GENERATED_ARMOR_COLORS.length],
    armorPower: power.id,
    powerLevel: 1 + (i % 5)
  });
}
const BOOST_ARMOR_MAP = Object.fromEntries(BOOST_ARMOR_SPECS.map((spec) => [spec.id, spec]));
const WEAPON_SKIN_BASES = new Set([
  'pistol', 'bow', 'crossbow', 'boomerang', 'cannon', 'minigun', 'dakkerssit',
  'caran_bitti', 'ak47', 'knife', 'spear', 'sniper', 'rifle', 'bazooka',
  'tnt', 'grenade', 'nuke', 'trident', 'wizard', 'flame', 'pamppu', 'mop', 'roller_skates', 'plane',
  ...BOOST_WEAPON_SPECS.map((spec) => spec.id),
  ...NORMAL_WEAPON_SPECS.map((spec) => spec.id)
]);
const BATTLE_ANIMAL_SPECS = [
  { id: 'kettu', name: 'Kettu', form: 'runner', ability: 'focus', hp: 24, attack: 7, biomes: ['forest'], colors: { primary: 0xd97a1d, secondary: 0xffd18f, accent: 0x2a1a10 } },
  { id: 'susi', name: 'Susi', form: 'runner', ability: 'pack', hp: 28, attack: 8, biomes: ['forest'], colors: { primary: 0x6f7c84, secondary: 0xc8d0d5, accent: 0x222222 } },
  { id: 'isosusi', name: 'Iso susi', form: 'runner', ability: 'charge', hp: 40, attack: 11, biomes: ['forest', 'snow'], colors: { primary: 0x4e5962, secondary: 0xb8c5cc, accent: 0x1b2025 } },
  { id: 'ilves', name: 'Ilves', form: 'runner', ability: 'focus', hp: 26, attack: 9, biomes: ['forest'], colors: { primary: 0xb47b45, secondary: 0xf1c79f, accent: 0x2b2119 } },
  { id: 'karhu', name: 'Karhu', form: 'tank', ability: 'guard', hp: 34, attack: 7, biomes: ['forest'], colors: { primary: 0x74492f, secondary: 0xc29b79, accent: 0x1f140f } },
  { id: 'hirvi', name: 'Hirvi', form: 'horned', ability: 'charge', hp: 32, attack: 8, biomes: ['forest'], colors: { primary: 0x846340, secondary: 0xc7a680, accent: 0xead7b0 } },
  { id: 'majava', name: 'Majava', form: 'tank', ability: 'guard', hp: 30, attack: 6, biomes: ['forest'], colors: { primary: 0x8c5f36, secondary: 0xd9b78e, accent: 0x5d2f17 } },
  { id: 'saukko', name: 'Saukko', form: 'aquatic', ability: 'heal', hp: 25, attack: 7, biomes: ['forest', 'ocean'], colors: { primary: 0x6c4a2d, secondary: 0xcaa583, accent: 0xeff8ff } },
  { id: 'peura', name: 'Peura', form: 'runner', ability: 'charge', hp: 24, attack: 8, biomes: ['forest'], colors: { primary: 0xb88852, secondary: 0xf0d2a4, accent: 0x3d2716 } },
  { id: 'metso', name: 'Metso', form: 'bird', ability: 'splash', hp: 23, attack: 7, biomes: ['forest'], colors: { primary: 0x3f4a52, secondary: 0x9ea8af, accent: 0xb53a2f } },
  { id: 'pollo', name: 'Pöllö', form: 'bird', ability: 'focus', hp: 22, attack: 8, biomes: ['forest'], colors: { primary: 0x7e674f, secondary: 0xd8c0a4, accent: 0xffefc2 } },
  { id: 'kotka', name: 'Kotka', form: 'bird', ability: 'freeze', hp: 24, attack: 9, biomes: ['forest'], colors: { primary: 0x715739, secondary: 0xdac6a8, accent: 0xffd24a } },
  { id: 'haukka', name: 'Haukka', form: 'bird', ability: 'focus', hp: 26, attack: 10, biomes: ['forest'], colors: { primary: 0x8b7355, secondary: 0xe8d6b8, accent: 0xffc84a } },
  { id: 'joutsen', name: 'Joutsen', form: 'bird', ability: 'heal', hp: 27, attack: 6, biomes: ['ocean'], colors: { primary: 0xf2f6fb, secondary: 0xb8d5ea, accent: 0xffb347 } },
  { id: 'sammakko', name: 'Sammakko', form: 'reptile', ability: 'poison', hp: 21, attack: 7, biomes: ['forest', 'ocean'], colors: { primary: 0x47a447, secondary: 0xaee088, accent: 0x173f17 } },
  { id: 'kilpikonna', name: 'Kilpikonna', form: 'tank', ability: 'shell', hp: 36, attack: 6, biomes: ['ocean'], colors: { primary: 0x3a8c61, secondary: 0xc9b27d, accent: 0x244835 } },
  { id: 'kobra', name: 'Kobra', form: 'reptile', ability: 'poison', hp: 23, attack: 9, biomes: ['desert'], colors: { primary: 0xc4a34f, secondary: 0xf1df8f, accent: 0x3b2b12 } },
  { id: 'krokotiili', name: 'Krokotiili', form: 'tank', ability: 'crush', hp: 33, attack: 8, biomes: ['ocean'], colors: { primary: 0x4c8b44, secondary: 0xa6d18d, accent: 0x1f3d17 } },
  { id: 'hai', name: 'Hai', form: 'aquatic', ability: 'frenzy', hp: 29, attack: 10, biomes: ['ocean'], colors: { primary: 0x4d7696, secondary: 0xbdcfdd, accent: 0xeff8ff } },
  { id: 'delfiini', name: 'Delfiini', form: 'aquatic', ability: 'heal', hp: 26, attack: 7, biomes: ['ocean'], colors: { primary: 0x6ea9cf, secondary: 0xcfe8f8, accent: 0xffffff } },
  { id: 'mustekala', name: 'Mustekala', form: 'aquatic', ability: 'freeze', hp: 28, attack: 8, biomes: ['ocean'], colors: { primary: 0x9250a4, secondary: 0xe0b8ed, accent: 0x33153c } },
  { id: 'rapu', name: 'Rapu', form: 'tank', ability: 'guard', hp: 30, attack: 7, biomes: ['ocean'], colors: { primary: 0xd15d3b, secondary: 0xf2ba8c, accent: 0x622514 } },
  { id: 'kameli', name: 'Kameli', form: 'tank', ability: 'endure', hp: 32, attack: 7, biomes: ['desert'], colors: { primary: 0xbc9060, secondary: 0xe8c79d, accent: 0x5d4022 } },
  { id: 'skorpioni', name: 'Skorpioni', form: 'reptile', ability: 'poison', hp: 22, attack: 9, biomes: ['desert'], colors: { primary: 0x916833, secondary: 0xe1be75, accent: 0x2f2110 } },
  { id: 'gekko', name: 'Gekko', form: 'runner', ability: 'focus', hp: 21, attack: 7, biomes: ['desert'], colors: { primary: 0x73b15e, secondary: 0xd9f0ae, accent: 0x264d1c } },
  { id: 'aavikkokettu', name: 'Aavikkokettu', form: 'runner', ability: 'focus', hp: 23, attack: 8, biomes: ['desert'], colors: { primary: 0xe0a368, secondary: 0xf7dbb7, accent: 0x51321a } },
  { id: 'pingviini', name: 'Pingviini', form: 'bird', ability: 'splash', hp: 26, attack: 6, biomes: ['snow'], colors: { primary: 0x20252b, secondary: 0xf8fbff, accent: 0xffb347 } },
  { id: 'poro', name: 'Poro', form: 'horned', ability: 'charge', hp: 31, attack: 8, biomes: ['snow'], colors: { primary: 0x7e6246, secondary: 0xd5bca0, accent: 0xf0e6cf } },
  { id: 'lumileopardi', name: 'Lumileopardi', form: 'runner', ability: 'focus', hp: 25, attack: 10, biomes: ['snow'], colors: { primary: 0xd7dee3, secondary: 0xffffff, accent: 0x37424a } },
  { id: 'hylje', name: 'Hylje', form: 'aquatic', ability: 'heal', hp: 29, attack: 7, biomes: ['snow', 'ocean'], colors: { primary: 0x8ca0ac, secondary: 0xeaf3f8, accent: 0x2f3e47 } },
  { id: 'villisika', name: 'Villisika', form: 'tank', ability: 'crush', hp: 32, attack: 8, biomes: ['forest'], colors: { primary: 0x6e4a31, secondary: 0xc59a73, accent: 0xf7f0df } },
  { id: 'harka', name: 'Härkä', form: 'horned', ability: 'charge', hp: 34, attack: 9, biomes: ['forest', 'desert'], colors: { primary: 0x5b4637, secondary: 0xbca48d, accent: 0xf1ead6 } },
  { id: 'lohikaarme', name: 'Lohikäärme', form: 'reptile', ability: 'splash', hp: 46, attack: 12, biomes: ['desert', 'snow', 'forest'], colors: { primary: 0x3f8f78, secondary: 0xbce0cf, accent: 0xff715e } },
  { id: 'vesikaarme', name: 'Vesikäärme', form: 'aquatic', ability: 'splash', hp: 42, attack: 11, biomes: ['ocean', 'forest', 'snow'], colors: { primary: 0x2e9fc4, secondary: 0x9ee8ff, accent: 0x164e75 } },
  { id: 'myrskykotka', name: 'Myrskykotka', form: 'bird', ability: 'freeze', hp: 52, attack: 15, biomes: ['forest', 'snow'], colors: { primary: 0x314d79, secondary: 0xaed8ff, accent: 0xffef6b } },
  { id: 'tulileijona', name: 'Tulileijona', form: 'runner', ability: 'splash', hp: 58, attack: 16, biomes: ['desert', 'forest'], colors: { primary: 0xd85a2a, secondary: 0xffc057, accent: 0x5c1b0e } },
  { id: 'jaakarhu', name: 'Jääkarhu', form: 'tank', ability: 'freeze', hp: 64, attack: 12, biomes: ['snow'], colors: { primary: 0xdff6ff, secondary: 0x7fc8e8, accent: 0x24516b } },
  { id: 'varjopantteri', name: 'Varjopantteri', form: 'runner', ability: 'focus', hp: 48, attack: 17, biomes: ['forest'], colors: { primary: 0x1c2029, secondary: 0x6f7aff, accent: 0xbad2ff } },
  { id: 'kivisarvikuono', name: 'Kivisarvikuono', form: 'horned', ability: 'crush', hp: 70, attack: 14, biomes: ['desert', 'forest'], colors: { primary: 0x6f7378, secondary: 0xb9c0c5, accent: 0xe7edf2 } },
  { id: 'taivasvalas', name: 'Taivasvalas', form: 'aquatic', ability: 'heal', hp: 76, attack: 10, biomes: ['ocean', 'forest'], colors: { primary: 0x6bb7d8, secondary: 0xd8f5ff, accent: 0xffffff } },
  { id: 'kuolemanlintu', name: 'Kuoleman lintu', form: 'bird', ability: 'death', hp: 100, attack: 100, biomes: ['forest', 'snow', 'desert'], colors: { primary: 0x16121c, secondary: 0x6f1d45, accent: 0xff2f5f } }
];
const BATTLE_ANIMAL_MAP = Object.fromEntries(BATTLE_ANIMAL_SPECS.map((spec) => [spec.id, spec]));
const BALLOON_SOLDIER_ARCHETYPES = [
  { id: 'lancer', name: 'Keihäspallo', hp: 26, attack: 7 },
  { id: 'bomber', name: 'Pomppupallo', hp: 24, attack: 6 },
  { id: 'captain', name: 'Komentajapallo', hp: 30, attack: 8 }
];
const SPECIAL_MOUNT_SPECS = {
  hawk: {
    key: 'hawk',
    battleId: 'haukka',
    name: 'Haukka',
    textures: ['tex_special_hawk_0', 'tex_special_hawk_1'],
    speed: 460,
    arrive: 22,
    riderOffsetY: -26,
    body: { width: 72, height: 26, offsetX: 16, offsetY: 18 },
    prompt: 'F/Alas: Haukka'
  },
  superHawk: {
    key: 'superHawk',
    battleId: 'haukka',
    name: 'Superhaukka',
    textures: ['tex_super_hawk_0', 'tex_super_hawk_1'],
    speed: 980,
    arrive: 14,
    riderOffsetY: -34,
    body: { width: 104, height: 30, offsetX: 18, offsetY: 20 },
    prompt: 'F/Alas: Superhaukka',
    invincibleRider: true,
    flapMs: 70,
    super: true
  },
  dragon: {
    key: 'dragon',
    battleId: 'lohikaarme',
    name: 'Lohikäärme',
    textures: ['tex_special_dragon_0', 'tex_special_dragon_1'],
    speed: 270,
    arrive: 30,
    riderOffsetY: -34,
    body: { width: 118, height: 36, offsetX: 18, offsetY: 34 },
    prompt: 'F/Alas: Lohikäärme'
  },
  direwolf: {
    key: 'direwolf',
    battleId: 'isosusi',
    name: 'Iso susi',
    textures: ['tex_special_direwolf_0', 'tex_special_direwolf_1'],
    speed: 350,
    jumpVelocity: -760,
    arrive: 22,
    riderOffsetY: -34,
    ground: true,
    body: { width: 86, height: 38, offsetX: 16, offsetY: 30 },
    prompt: 'F/Alas: Iso susi'
  },
  waterSerpent: {
    key: 'waterSerpent',
    battleId: 'vesikaarme',
    name: 'Vesikäärme',
    textures: ['tex_special_water_serpent_0', 'tex_special_water_serpent_1'],
    speed: 330,
    swimSpeed: 520,
    arrive: 24,
    riderOffsetY: -30,
    body: { width: 116, height: 30, offsetX: 18, offsetY: 28 },
    prompt: 'F/Alas: Vesikäärme'
  },
  stormEagle: {
    key: 'stormEagle',
    battleId: 'myrskykotka',
    name: 'Myrskykotka',
    textures: ['tex_mega_storm_eagle_0', 'tex_mega_storm_eagle_1'],
    speed: 560,
    arrive: 22,
    riderOffsetY: -32,
    body: { width: 108, height: 30, offsetX: 20, offsetY: 22 },
    prompt: 'F/Alas: Myrskykotka',
    mega: true,
    megaPower: 'storm'
  },
  fireLion: {
    key: 'fireLion',
    battleId: 'tulileijona',
    name: 'Tulileijona',
    textures: ['tex_mega_fire_lion_0', 'tex_mega_fire_lion_1'],
    speed: 500,
    arrive: 24,
    riderOffsetY: -34,
    body: { width: 116, height: 40, offsetX: 16, offsetY: 30 },
    prompt: 'F/Alas: Tulileijona',
    mega: true,
    megaPower: 'fire'
  },
  iceBear: {
    key: 'iceBear',
    battleId: 'jaakarhu',
    name: 'Jääkarhu',
    textures: ['tex_mega_ice_bear_0', 'tex_mega_ice_bear_1'],
    speed: 420,
    arrive: 26,
    riderOffsetY: -36,
    body: { width: 116, height: 44, offsetX: 15, offsetY: 30 },
    prompt: 'F/Alas: Jääkarhu',
    mega: true,
    megaPower: 'ice'
  },
  shadowPanther: {
    key: 'shadowPanther',
    battleId: 'varjopantteri',
    name: 'Varjopantteri',
    textures: ['tex_mega_shadow_panther_0', 'tex_mega_shadow_panther_1'],
    speed: 620,
    arrive: 18,
    riderOffsetY: -30,
    body: { width: 104, height: 34, offsetX: 16, offsetY: 28 },
    prompt: 'F/Alas: Varjopantteri',
    mega: true,
    megaPower: 'shadow'
  },
  stoneRhino: {
    key: 'stoneRhino',
    battleId: 'kivisarvikuono',
    name: 'Kivisarvikuono',
    textures: ['tex_mega_stone_rhino_0', 'tex_mega_stone_rhino_1'],
    speed: 390,
    arrive: 28,
    riderOffsetY: -38,
    body: { width: 122, height: 48, offsetX: 16, offsetY: 30 },
    prompt: 'F/Alas: Kivisarvikuono',
    mega: true,
    megaPower: 'stone'
  },
  skyWhale: {
    key: 'skyWhale',
    battleId: 'taivasvalas',
    name: 'Taivasvalas',
    textures: ['tex_mega_sky_whale_0', 'tex_mega_sky_whale_1'],
    speed: 330,
    arrive: 34,
    riderOffsetY: -42,
    body: { width: 150, height: 48, offsetX: 18, offsetY: 34 },
    prompt: 'F/Alas: Taivasvalas',
    mega: true,
    megaPower: 'heal'
  },
  deathBird: {
    key: 'deathBird',
    battleId: 'kuolemanlintu',
    name: 'Kuoleman lintu',
    textures: ['tex_mega_death_bird_0', 'tex_mega_death_bird_1'],
    speed: 610,
    arrive: 20,
    riderOffsetY: -34,
    body: { width: 120, height: 34, offsetX: 18, offsetY: 22 },
    prompt: 'F/Alas: Kuoleman lintu',
    mega: true,
    megaPower: 'death'
  }
};

const SUPER_ANIMAL_PREFIXES = [
  { key: 'Aurinko', label: 'Aurinko', colors: { primary: 0xf6b23b, secondary: 0xfff0a8, accent: 0xff5a36 }, power: 'fire' },
  { key: 'Kuu', label: 'Kuu', colors: { primary: 0xcfd9f2, secondary: 0x7c91c9, accent: 0xffffff }, power: 'heal' },
  { key: 'Tahti', label: 'Tähti', colors: { primary: 0x4f7cff, secondary: 0xbdd8ff, accent: 0xffef6b }, power: 'storm' },
  { key: 'Salama', label: 'Salama', colors: { primary: 0x2f5f9f, secondary: 0x97ecff, accent: 0xfffb91 }, power: 'storm' },
  { key: 'Tuli', label: 'Tuli', colors: { primary: 0xd84a26, secondary: 0xff9f3f, accent: 0x5b1409 }, power: 'fire' },
  { key: 'Jaa', label: 'Jää', colors: { primary: 0xdff8ff, secondary: 0x71c7f0, accent: 0x24516b }, power: 'ice' },
  { key: 'Varjo', label: 'Varjo', colors: { primary: 0x161923, secondary: 0x5460cf, accent: 0xc2d3ff }, power: 'shadow' },
  { key: 'Kristalli', label: 'Kristalli', colors: { primary: 0x86ffe7, secondary: 0xd9fff7, accent: 0x9256ff }, power: 'stone' },
  { key: 'Myrsky', label: 'Myrsky', colors: { primary: 0x37445f, secondary: 0xa4c7e7, accent: 0xfff36b }, power: 'storm' },
  { key: 'Kosmos', label: 'Kosmos', colors: { primary: 0x22183f, secondary: 0x7654d9, accent: 0xff5fb4 }, power: 'death' }
];

const SUPER_ANIMAL_BASES = [
  { key: 'Haukka', suffix: 'haukka', battleId: 'haukka', form: 'bird' },
  { key: 'Leijona', suffix: 'leijona', battleId: 'tulileijona', form: 'runner' },
  { key: 'Karhu', suffix: 'karhu', battleId: 'jaakarhu', form: 'tank' },
  { key: 'Pantteri', suffix: 'pantteri', battleId: 'varjopantteri', form: 'runner' },
  { key: 'Sarvikuono', suffix: 'sarvikuono', battleId: 'kivisarvikuono', form: 'tank' },
  { key: 'Valas', suffix: 'valas', battleId: 'taivasvalas', form: 'whale' },
  { key: 'Lohikaarme', suffix: 'lohikäärme', battleId: 'lohikaarme', form: 'serpent' },
  { key: 'Susi', suffix: 'susi', battleId: 'isosusi', form: 'runner' },
  { key: 'Kotka', suffix: 'kotka', battleId: 'myrskykotka', form: 'bird' },
  { key: 'Vesikaarme', suffix: 'vesikäärme', battleId: 'vesikaarme', form: 'serpent' }
];

const SUPER_ANIMAL_BODY_BY_FORM = {
  bird: { body: { width: 120, height: 32, offsetX: 18, offsetY: 24 }, riderOffsetY: -34 },
  runner: { body: { width: 118, height: 38, offsetX: 16, offsetY: 34 }, riderOffsetY: -34 },
  tank: { body: { width: 134, height: 48, offsetX: 16, offsetY: 32 }, riderOffsetY: -40 },
  serpent: { body: { width: 136, height: 34, offsetX: 18, offsetY: 28 }, riderOffsetY: -32 },
  whale: { body: { width: 152, height: 50, offsetX: 18, offsetY: 34 }, riderOffsetY: -44 }
};

function makeGeneratedSuperAnimalSpecs() {
  const specs = [];
  SUPER_ANIMAL_PREFIXES.forEach((prefix, prefixIndex) => {
    SUPER_ANIMAL_BASES.forEach((base, baseIndex) => {
      const number = prefixIndex * SUPER_ANIMAL_BASES.length + baseIndex + 1;
      const shape = SUPER_ANIMAL_BODY_BY_FORM[base.form];
      const textureBase = `tex_super_generated_${String(number).padStart(3, '0')}`;
      specs.push({
        key: `super${prefix.key}${base.key}`,
        battleId: base.battleId,
        name: `${prefix.label}${base.suffix}`,
        textures: [`${textureBase}_0`, `${textureBase}_1`],
        speed: 760 + prefixIndex * 34 + baseIndex * 18,
        arrive: 12 + (baseIndex % 4) * 2,
        riderOffsetY: shape.riderOffsetY,
        body: shape.body,
        prompt: `F/Alas: ${prefix.label}${base.suffix}`,
        invincibleRider: true,
        flapMs: 55 + (baseIndex % 5) * 12,
        super: true,
        mega: true,
        megaPower: prefix.power,
        superForm: base.form,
        colors: prefix.colors,
        superNumber: number
      });
    });
  });
  return specs;
}

const GENERATED_SUPER_ANIMAL_SPECS = makeGeneratedSuperAnimalSpecs();
Object.assign(SPECIAL_MOUNT_SPECS, Object.fromEntries(GENERATED_SUPER_ANIMAL_SPECS.map((spec) => [spec.key, spec])));

function toCssHex(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function buildSuperAnimalPanel() {
  const list = document.getElementById('superAnimalList');
  if (!list) return;
  list.innerHTML = '';
  Object.values(SPECIAL_MOUNT_SPECS)
    .filter((spec) => spec.super)
    .forEach((spec) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = spec.name;
      button.title = `${spec.name} - ${spec.megaPower || 'super'}`;
      button.addEventListener('click', () => window.gameScene?.summonSpecialAnimal(spec.key));
      list.appendChild(button);
    });
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.player = null;
    this.cursors = null;
    this.keys = null;
    this.platforms = null; // static physics group
    this.pickups = null;   // coins/diamonds
    this.blocks = null; // colliding block sprites mapped by tile key
    this.decor = null;  // non-colliding visuals (leaves)
  this.birds = null;  // enemies (air)
  this.slimes = null; // enemies (ground)
  this.zombies = null; // night enemies (2 tiles tall)
  this.zombies = null; // night enemies
  this.bosses = null;  // Mörkö bosses
    this.items = null;  // physics items to pick up
    this.invulnUntil = 0;

    // Simple stackable inventory (shown in DOM slots)
    this.inv = { wood: 0, plank: 0, stone: 0 };
    this.building = { block: 'plank', hotHurtAt: 0 };
    this.landmarks = [];
    this.tutorial = { step: 0, active: false, wasRunning: false, bound: false };
    this.commandUi = { open: false, wasRunning: false, bound: false, keyboardWasEnabled: true };
    this.aiChat = { open: false, wasRunning: false, bound: false, keyboardWasEnabled: true, messages: [] };
    this.performanceMode = false;
    this._nextMobHealthUiAt = 0;
    this._nextGiftBoxUpdateAt = 0;
    this._nextAdventureFeatureAt = 0;
    this.adventureProgress = {
      xp: 0, level: 1, quests: {}, completedQuests: [], stats: {},
      openedChests: [], collectedCrystals: [], activatedCheckpoints: [],
      dailyClaimed: '', respawn: { x: 100, y: 100 }
    };
    this.adventureChests = [];
    this.adventureCrystals = [];
    this.adventureCheckpoints = [];
    this.nearTreasureChest = null;
    this.nearCheckpoint = null;
    this.respawnPoint = { x: 100, y: 100 };
    this._adventureUiNextAt = 0;
    // Nikkarointitila toimii luovana rakennustilana: lento on vapaa ja
    // rakennuspalikoita voi asettaa ilman materiaalikuluja.
    this.builderMode = false;

  // Backpack: up to 3 item stacks (each { item: 'wood'|'stone'|..., qty:number })
  this.backpack = [null, null, null];

  // Core state
    this.state = { health: MAX_HEALTH, coins: 0, canFly: false, bounceShoes: false };
    this.blockDamage = new Map();
    this.nearMerchant = false;

    // Upgrades
    this.upgrades = { copperUnlocked: false };

    // World persistence diff
    this.worldDiff = { removed: [], placed: [] }; // removed: ["tx,ty"], placed: [{tx,ty,type,textureKey}]

  // In water flag
  this.inWater = false;
  // Water tile registry (by tile key => sprite)
  this.waterTiles = new Map();

    // Character customization and outfit
    this.custom = { shirtColor: '#4477ff', pantsColor: '#333333', eyesGlow: false, eyeColor: '#ffffff', hairColor: '#222222', outfit: 'none' };

    // Weapon skins are stored per weapon, so copper variants share the same skin.
    this.weaponSkins = {};
    // Ally drone selection is saved for the next call of Shift+D or the UI button.
    this.droneType = 'scout';
    this.droneSkin = 'neon';
    this.droneShieldUntil = 0;
    this.achievements = {};
    this.giftBoxOpenings = [];
    this.kingNpcs = new Map();
    this._kingToastAt = 0;
    this.carpenterNpcs = new Map();
    this._carpenterToastAt = 0;
    // Boost armor changes boost weapons only; normal tools and weapons are untouched.
    this.boostArmor = 'storm_armor';
    this.chameleonHiddenUntil = 0;

    // Tool system
    this.tools = {
            owned: { hand: true, wooden: false, stone: false, iron: false, pistol: true, bow: true, crossbow: true, boomerang: true, cannon: true, minigun: true, dakkerssit: true, caran_bitti: true, ak47: true, knife: true, spear: true, sniper: true, rifle: true, bazooka: true, tnt: true, mop: true, roller_skates: true, grenade: true, nuke: true, plane: true, hook: true, cloner: true, teleport: true, slimecloner: true, torch: true, campfire: true, wizard: true, flame: true, pamppu: true, mine: true, rod: true, fishingrod: true, tower: true, trap: true, nightbreaker: true,
              lamp: true, sofa: true, table: true,
              grill: true, workbench: true, furnace: true, grindstone: true, anvil: true, toolbench: true,
           pistol_copper: false, bow_copper: false, crossbow_copper: false, minigun_copper: false, ak47_copper: false, knife_copper: false, sniper_copper: false, bazooka_copper: false, grenade_copper: false, nuke_copper: false, pamppu_copper: false, plane_copper: false },
      equipped: 'pistol',
      cannonMode: 'minigun' // 'minigun' | 'sniper'
    };
    BOOST_WEAPON_SPECS.forEach((spec) => { this.tools.owned[spec.id] = true; });
    NORMAL_WEAPON_SPECS.forEach((spec) => { this.tools.owned[spec.id] = true; });
    this.tools.owned.trident = true;

    // Endless world bookkeeping
    this.chunks = new Map(); // cx -> { blocks:Set(keys), decor:[], pickups:[], enemies:[] }
    this.loadedChunks = new Set();
    this.currentChunk = null;
    this.lastCenterChunk = null;

  // Touch/mobile controls state
  this.touchState = { left:false, right:false, jump:false, placeMode:false };

  // Ground slide: one Ctrl/Fn press moves farther and lasts longer.
  this.slide = {
    active: false,
    startX: 0,
    direction: 0,
    speed: 700,
    maxFrameDistance: 18,
    maxDistance: TILE * 8,
    cooldownUntil: 0
  };

  // Online multiplayer connection and remote-player replicas.
  this.multiplayer = {
    socket: null,
    id: null,
    connected: false,
    nextSendAt: 0,
    statusEl: null,
    players: new Map()
  };

  // Cactus hazard bookkeeping
  this.cactusTiles = new Set(); // keys of tiles with cactus
  this._nextCactusHurtAt = 0;

  // Grappling hook state
  this.hook = { active: false, anchor: null };
  // Fishing rod state
  this.fishing = { active: false, bobber: null, baseY: 0, nextNibbleAt: 0, cooldownUntil: 0 };

  // Ninja mode state
  this.ninja = { active: false, swordLevel: 1, knifeLevel: 1, strikeLevel: 1, striking: false, strikeEndAt: 0 };

  // Pamppu (baton) state: modes 'attack' or 'block'
  this.pamppu = { mode: 'attack' };

  // Pause state
  this.isPaused = false;
  this.started = false;

  // Vine (liaani) state
  this.vine = { active:false, reeling:false, anchor:null, length:0 };

  // Game mode: 'classic' | 'galactic' | 'web' | 'wizard'
  this.mode = { current: 'classic' };
  // Start-screen mode: adventure, multiplayer, or Rivals-style race.
  this.startGameMode = 'adventure';
  this.mapType = (() => { try { return localStorage.getItem('UAG_mapType') || 'adventure'; } catch(e) { return 'adventure'; } })();

  // Cloner tool and clones
  this.cloneSettings = { target: 'none' }; // 'none'|'ground'|'stone'|'sand'|'cactus'|'trunk'
  this.clones = this.physics?.add?.group ? this.physics.add.group() : null;
  this.cloneList = [];

  // Moped state
  this.moped = { sprite: null, zone: null, prompt: null, mounted: false, color: '#ff6a00', decal: 'none', speedMult: 1.6, pos: null };
  this.nearMoped = false;

  // Car state (auto-turrets)
  this.car = { sprite: null, turrets: [], mounted: false, zone: null, prompt: null };
  this.nearCar = false;
  // Tank state: allied tanks + spawner devices
  this.tanks = null; // physics group for tank bases
  this.tankClonerPositions = []; // persisted [{tx,ty}]
  this.tankCloners = new Map(); // key -> { image?, zone?, nextAt, count }
  this.nearTank = false;
  this.tankPrompt = null;
  // Default tank appearance (can be changed per tank or globally)
  this.tankAppearance = { color: '#6aa84f', decal: 'none', turretTint: '#444444' };

  // Plane state (auto-turrets, faster)
  this.plane = { sprite: null, turrets: [], mounted: false, zone: null, prompt: null, speedMult: 2.2 };
  this.nearPlane = false;
  // Large controllable airship
  this.nearAirship = false;
  this.nearAirshipEntrance = false;
  this.nearAirshipControl = false;
  this.nearMapGateway = false;
  this.mapGateway = null;
  this._mapGatewayTraveling = false;

  // Special rideable animals
  this.specialAnimals = {};
  this.mountedSpecialAnimal = null;
  this.nearSpecialAnimal = null;

  // Weather: thunderstorms
  this.weather = { isStorm: false, nextLightningAt: 0, nextStormCheckAt: 0, stormEndsAt: 0 };
  // Hunger/food state
  this.hunger = { value: 100, max: 100, nextTickAt: 0 };
  this.food = { meat: 0 };

  // Lightning rods (Ukonjohdatin)
  this.rodPositions = []; // [{tx,ty,hp}]
  this.rods = new Map(); // key -> { image, hp }

  // Day/Night cycle and darkness overlay
  this.day = { period: 120000, start: 0, isNight: false, lastIsNight: false };
  this.darknessGfx = null;
  this._nextZombieSpawnAt = 0;
  this._nextBossSpawnAt = 0;
  // Ambient SFX cadence
  this._nextBirdAt = 0;
  this._nextPeckerAt = 0;
  // Item bag: glider, jetpack, invisibility, speed, shield, decoy
  this.itemBag = { glider: false, jetpack: false, invis: false, speedUntil: 0, shieldUntil: 0, decoyUntil: 0 };
  this._timeStopped = false; // deprecated, kept for migration safety

  // Torches (light sources) prevent zombie spawns nearby
  this.torchPositions = [];
  this.torches = new Map(); // key -> { image }
  // Perch spots for birds (generated with tree branches)
  this.perchSpots = [];
  this.branches = new Map(); // anchorKey -> Array<{dir:number, segments:Array<{tx,ty,img}>}>
  // Furniture (decorative)
  this.lampPositions = []; this.lamps = new Map(); // key -> { image }
  this.sofaPositions = []; this.sofas = new Map(); // key -> { image }
  this.tablePositions = []; this.tables = new Map(); // key -> { image }
  this.workstationPositions = []; this.workstations = new Map(); // key -> { image, zone, type }
  this.nearWorkstation = null;
  this.workstationPrompt = null;

  // Day/Night cycle and darkness overlay
  this.day = { period: 120000, start: 0, isNight: false, lastIsNight: false }; // 120s per full day
  this.darknessGfx = null;
  this._nextZombieSpawnAt = 0;

  // Real-calendar events. The world gets event decorations when a chunk is
  // generated, and the small status badge updates if the date changes while
  // the game is open.
  this.seasonal = this.getSeasonalEvent();
  this.seasonalStatusText = null;
  this._nextSeasonCheckAt = 0;

  // Torches (light sources) to block zombie spawns
  this.torchPositions = []; // persisted [{tx,ty}]
  this.torches = new Map(); // key -> { image }
  // Campfires (nuotio): light + safe zone (zombies avoid area)
  this.campfirePositions = []; // persisted [{tx,ty}]
  this.campfires = new Map(); // key -> { image, flicker }
  
  // Nightbreakers (yönpoistaja): strong light + bigger safe zone and darkness reducer
  this.nightbreakerPositions = []; // persisted [{tx,ty}]
  this.nightbreakers = new Map(); // key -> { image, flicker }
  // Traps
  this.trapPositions = []; // [{tx,ty,type,dir}]
  this.traps = new Map(); // key -> { image, zone, type, dir, nextAt }
  this.trap = { type: 'spike', dir: 'right' }; // current selection when placing
  // Death banner handle
  this.deathText = null;
  this.deathDom = null;
  this.isDead = false;
  this.oxygen = { value: 100, max: 100, nextDamageAt: 0 };

  // Placeable cannons state
  this.cannons = [];
  this.cannonTiles = new Set(); // keys "tx,ty" where cannons are placed
  this.cannonPositions = []; // persisted positions [{tx,ty}]
  // Towers (sniper turrets)
  this.towerPositions = []; // persisted [{tx,ty}]
  this.towers = new Map(); // key -> { base, head, zone, nextAt }
  this.slimeCloners = new Map(); // key -> { tx,ty, image?, zone?, nextAt:number, count:number }
  // Teleports
  this.portalPositions = []; // persisted [{tx,ty,color}]
  this.portals = new Map(); // key -> { color:string, sprite:Phaser.GameObjects.GameObject }
  this.portal = { placeColor: 'blue', countdown: null, countdownKey: null, countdownText: null, cooldownUntil: 0 };
  // Mines (red-dot landmines) - placed by player, explode on enemy contact, then disappear
  this.minePositions = []; // persisted [{tx,ty}]
  this.mines = new Map(); // key -> { image, zone }
  // Soldier cloner devices and spawned allies
  this.soldierClonerPositions = []; // persisted [{tx,ty}]
  this.soldierCloners = new Map(); // key -> { image?, zone?, nextAt, count }
  this.soldiers = null; // physics group, set up in create()

  // Build minipeli state
  this.buildMiniGame = {
    active:false,
    timeLeft:0,
    palette:[],
    selectedBlock:null,
    originTileX:0,
    originTileY:0,
    placed:new Map(), // key "dx,dy" -> type
    container:null, // Phaser container for preview blocks
    blueprint:null, // {blocks:[{dx,dy,type}], w,h}
    awaitingPlacement:false
  };
  this.wolves = null; // wolf enemy group
  
  // Dog system
  this.dog = null;
  this.dogState = { active: false, mode: 'follow', inventory: [], money: 0, stats: { speed: 140, damage: 1 }, name: 'Musti' };
  this.dogMenu = null; // DOM element 

  this.battle = {
    collection: {},
    team: [],
    wins: 0,
    losses: 0,
    wave: 1,
    arenaOpen: false,
    inFight: false,
    allies: [],
    enemies: [],
    selectedAnimalId: null,
    selectedTargetId: null,
    log: ['Ilmapallosotilaat odottavat taistelua.'],
    rewardCoins: 0
  };
  this.battleEls = {};
  
  }

  getBattleAnimalTextureKey(id) {
    return `${BATTLE_ANIMAL_TEXTURE_PREFIX}${id}`;
  }

  generateBattleAnimalTextures(g) {
    BATTLE_ANIMAL_SPECS.forEach((spec) => this.drawBattleAnimalTexture(g, spec));
  }

  drawBattleAnimalTexture(g, spec) {
    const key = this.getBattleAnimalTextureKey(spec.id);
    const w = 30;
    const h = 22;
    const primary = spec.colors.primary;
    const secondary = spec.colors.secondary;
    const accent = spec.colors.accent;
    const legColor = Phaser.Display.Color.IntegerToColor(primary).darken(20).color;
    g.clear();

    if (spec.form === 'bird') {
      g.fillStyle(primary, 1); g.fillEllipse(12, 12, 18, 12);
      g.fillStyle(secondary, 1); g.fillEllipse(20, 8, 12, 10);
      g.fillStyle(accent, 1); g.fillTriangle(24, 9, 29, 11, 24, 13);
      g.fillStyle(secondary, 0.95); g.fillEllipse(10, 12, 8, 6);
      g.fillStyle(0xffcc44, 1); g.fillRect(7, 16, 2, 5); g.fillRect(13, 16, 2, 5);
      g.fillStyle(accent, 1); g.fillCircle(22, 8, 1.4);
      if (spec.ability === 'heal') g.fillStyle(0xffffff, 0.9), g.fillRect(2, 4, 4, 2), g.fillRect(3, 3, 2, 4);
    } else if (spec.form === 'aquatic') {
      g.fillStyle(primary, 1); g.fillEllipse(13, 11, 20, 12);
      g.fillStyle(secondary, 1); g.fillTriangle(23, 11, 30, 5, 30, 17);
      g.fillStyle(secondary, 0.95); g.fillEllipse(10, 11, 7, 4);
      g.fillStyle(accent, 1); g.fillCircle(7, 10, 1.5);
      if (spec.id === 'mustekala') {
        g.fillStyle(primary, 1);
        for (let i = 0; i < 4; i++) g.fillRect(6 + i * 4, 14, 2, 6);
      }
      if (spec.id === 'rapu') {
        g.fillStyle(accent, 1); g.fillRect(2, 7, 4, 2); g.fillRect(2, 13, 4, 2); g.fillRect(20, 7, 4, 2); g.fillRect(20, 13, 4, 2);
      }
    } else {
      g.fillStyle(primary, 1); g.fillRoundedRect(2, 7, 20, 10, 4);
      g.fillStyle(secondary, 1); g.fillRoundedRect(16, 4, 11, 8, 4);
      g.fillStyle(legColor, 1); g.fillRect(5, 16, 3, 5); g.fillRect(11, 16, 3, 5); g.fillRect(18, 16, 3, 5);
      g.fillStyle(accent, 1); g.fillCircle(23, 7, 1.4);
      if (spec.form === 'horned') {
        g.fillStyle(accent, 1); g.fillRect(18, 2, 2, 4); g.fillRect(23, 2, 2, 4);
      }
      if (spec.form === 'reptile') {
        g.fillStyle(accent, 1); g.fillRect(2, 11, 4, 2);
      }
      if (spec.form === 'runner') {
        g.fillStyle(secondary, 1); g.fillRect(21, 8, 6, 3);
      }
      if (spec.form === 'tank') {
        g.fillStyle(secondary, 1); g.fillRect(8, 9, 6, 3);
      }
    }

    if (spec.ability === 'poison') {
      g.fillStyle(0x7a2fa0, 1); g.fillCircle(5, 5, 2);
    } else if (spec.ability === 'focus') {
      g.fillStyle(0xfff3a3, 1); g.fillCircle(4, 5, 2);
    } else if (spec.ability === 'guard' || spec.ability === 'shell') {
      g.fillStyle(0x8fd4de, 1); g.fillRect(2, 2, 4, 4);
    } else if (spec.ability === 'charge') {
      g.fillStyle(0xff9d57, 1); g.fillTriangle(2, 6, 7, 2, 7, 10);
    } else if (spec.ability === 'frenzy') {
      g.fillStyle(0xff6767, 1); g.fillRect(2, 3, 4, 2); g.fillRect(3, 2, 2, 4);
    }

    g.generateTexture(key, w, h);
    g.clear();
  }

  generateGeneratedSuperAnimalTextures(g) {
    GENERATED_SUPER_ANIMAL_SPECS.forEach((spec) => {
      this.drawGeneratedSuperAnimalTexture(g, spec, 0);
      this.drawGeneratedSuperAnimalTexture(g, spec, 1);
    });
  }

  drawGeneratedSuperAnimalTexture(g, spec, pose) {
    const key = spec.textures[pose];
    const { primary, secondary, accent } = spec.colors;
    const dark = Phaser.Display.Color.IntegerToColor(primary).darken(24).color;
    const light = secondary;
    g.clear();

    if (spec.superForm === 'bird') {
      g.fillStyle(secondary, 0.9);
      if (pose) {
        g.fillTriangle(58, 36, 8, 2, 26, 52);
        g.fillTriangle(92, 36, 170, 2, 132, 54);
      } else {
        g.fillTriangle(56, 40, 2, 70, 34, 56);
        g.fillTriangle(94, 40, 176, 72, 124, 56);
      }
      g.fillStyle(primary, 1); g.fillEllipse(76, 42, 70, 30);
      g.fillStyle(dark, 1); g.fillEllipse(108, 35, 40, 28);
      g.fillStyle(light, 0.92); g.fillEllipse(115, 45, 24, 10);
      g.fillStyle(accent, 1); g.fillTriangle(130, 39, 164, 46, 130, 53);
      g.fillStyle(0x101820, 1); g.fillCircle(119, 36, 2.6);
      g.lineStyle(3, accent, 0.82); g.strokeCircle(75, 42, pose ? 38 : 34);
      g.fillStyle(accent, 0.85); g.fillRect(58, 58, 5, 13); g.fillRect(74, 58, 5, 13);
      g.generateTexture(key, 180, 82);
    } else if (spec.superForm === 'runner') {
      g.fillStyle(primary, 1); g.fillRoundedRect(18, 38, 94, 34, 13);
      g.fillStyle(dark, 1); g.fillRoundedRect(98, 25, 44, 34, 12);
      g.fillStyle(secondary, 1); g.fillEllipse(114, 58, 42, 12);
      g.fillStyle(accent, 1); g.fillTriangle(140, 41, 166, 47, 140, 54);
      g.fillStyle(0x111111, 1); g.fillCircle(128, 37, 2.5);
      g.fillStyle(light, 0.8);
      for (let i = 0; i < 6; i++) g.fillTriangle(84 + i * 8, 32, 90 + i * 8, 12 + (i % 2) * 6, 97 + i * 8, 34);
      g.fillStyle(primary, 1);
      if (pose) {
        g.fillRect(35, 66, 10, 25); g.fillRect(64, 62, 10, 19); g.fillRect(88, 66, 10, 25); g.fillRect(108, 62, 10, 19);
      } else {
        g.fillRect(35, 62, 10, 19); g.fillRect(64, 66, 10, 25); g.fillRect(88, 62, 10, 19); g.fillRect(108, 66, 10, 25);
      }
      g.fillStyle(accent, 0.85); g.fillTriangle(20, 50, 0, 34, 5, 66);
      g.lineStyle(3, accent, 0.78); g.strokeRoundedRect(14, 34, 136, 44, 16);
      g.generateTexture(key, 170, 98);
    } else if (spec.superForm === 'tank') {
      g.fillStyle(primary, 1); g.fillRoundedRect(16, 38, 112, 40, 15);
      g.fillStyle(dark, 1); g.fillRoundedRect(112, 27, 48, 36, 12);
      g.fillStyle(secondary, 1); g.fillEllipse(78, 50, 76, 15);
      g.fillStyle(accent, 1); g.fillTriangle(156, 43, 184, 38, 158, 53);
      g.fillStyle(0x111111, 1); g.fillCircle(144, 39, 2.7);
      g.fillStyle(primary, 1);
      if (pose) {
        g.fillRect(35, 72, 13, 24); g.fillRect(70, 68, 13, 18); g.fillRect(100, 72, 13, 24); g.fillRect(125, 68, 13, 18);
      } else {
        g.fillRect(35, 68, 13, 18); g.fillRect(70, 72, 13, 24); g.fillRect(100, 68, 13, 18); g.fillRect(125, 72, 13, 24);
      }
      g.fillStyle(light, 0.86);
      for (let x = 42; x <= 116; x += 18) g.fillTriangle(x, 38, x + 8, 23, x + 16, 38);
      g.lineStyle(4, accent, 0.75); g.strokeRoundedRect(12, 34, 154, 50, 16);
      g.generateTexture(key, 188, 102);
    } else if (spec.superForm === 'whale') {
      g.fillStyle(primary, 1); g.fillEllipse(94, 52, 146, 52);
      g.fillStyle(secondary, 1); g.fillEllipse(106, 66, 102, 22);
      g.fillStyle(dark, 1); g.fillTriangle(22, 51, 0, 24, 0, 80);
      g.fillStyle(light, 0.88);
      g.fillTriangle(78, 42, 42, pose ? 10 : 22, 66, 52);
      g.fillTriangle(120, 42, 166, pose ? 10 : 22, 134, 53);
      g.fillStyle(0x11222e, 1); g.fillCircle(140, 43, 2.8);
      g.lineStyle(3, accent, 0.78); g.strokeEllipse(94, 52, 154, 60);
      g.fillStyle(accent, 0.75);
      for (let i = 0; i < 5; i++) g.fillCircle(64 + i * 14, pose ? 28 - i : 26 + i, 3);
      g.generateTexture(key, 180, 98);
    } else {
      const wobble = pose ? 6 : -4;
      g.fillStyle(secondary, 0.72);
      g.fillTriangle(36, 48 + wobble, 6, 20, 22, 58);
      g.fillTriangle(94, 43 - wobble, 130, 16, 112, 60);
      const parts = [
        { x: 28, y: 50 + wobble, w: 36, h: 24 },
        { x: 58, y: 41 - wobble, w: 42, h: 26 },
        { x: 90, y: 50 + wobble, w: 42, h: 26 },
        { x: 124, y: 42 - wobble, w: 46, h: 27 }
      ];
      parts.forEach((part) => {
        g.fillStyle(primary, 1); g.fillEllipse(part.x, part.y, part.w, part.h);
        g.fillStyle(light, 0.75); g.fillEllipse(part.x, part.y + 6, part.w * 0.56, part.h * 0.4);
      });
      g.fillStyle(dark, 1); g.fillRoundedRect(120, 28 - wobble, 44, 29, 12);
      g.fillStyle(accent, 1); g.fillTriangle(160, 41 - wobble, 184, 37 - wobble, 162, 52 - wobble);
      g.fillStyle(0x071820, 1); g.fillCircle(148, 37 - wobble, 2.5);
      g.lineStyle(3, accent, 0.78); g.strokeEllipse(78, 46, 130, 50);
      g.generateTexture(key, 188, 84);
    }

    g.clear();
  }

  pickBattleAnimalForBiome(biome, rng) {
    const zone = biome === 'snow' || biome === 'desert' || biome === 'ocean' ? biome : 'forest';
    const pool = BATTLE_ANIMAL_SPECS.filter((spec) => spec.biomes.includes(zone));
    const source = pool.length ? pool : BATTLE_ANIMAL_SPECS;
    return source[Math.floor(rng() * source.length)];
  }

  configureBattleAnimalSprite(sprite, spec, rng = Math.random) {
    if (!sprite?.body || !spec) return;
    sprite.setData('battleAnimalId', spec.id);
    sprite.setData('battleAnimalName', spec.name);
    sprite.setData('battleAbility', spec.ability);
    const speed = 38 + rng() * 34;
    sprite.setBounce(0.05, 0.0);
    sprite.setCollideWorldBounds(true);
    sprite.setVelocityX(rng() < 0.5 ? -speed : speed);
    if (spec.form === 'bird') sprite.body.setSize(18, 14).setOffset(4, 4);
    else if (spec.form === 'tank') sprite.body.setSize(22, 14).setOffset(4, 6);
    else if (spec.form === 'horned') sprite.body.setSize(22, 14).setOffset(4, 6);
    else if (spec.form === 'aquatic') sprite.body.setSize(20, 12).setOffset(4, 6);
    else sprite.body.setSize(20, 14).setOffset(4, 6);
  }

  getCollectedBattleAnimalCount() {
    return Object.keys(this.battle.collection).length;
  }

  getBattleAnimalCopies(id) {
    return Math.max(0, this.battle.collection[id] || 0);
  }

  getBattleTeamCopies(id) {
    return this.battle.team.filter((entry) => entry === id).length;
  }

  addBattleAnimalToTeam(id) {
    if (!BATTLE_ANIMAL_MAP[id]) return false;
    if (this.getBattleTeamCopies(id) >= this.getBattleAnimalCopies(id)) {
      this.showToast?.('Kaikki omistetut kappaleet ovat jo joukkueessa');
      return false;
    }
    this.battle.team.push(id);
    this.battle.selectedAnimalId = this.battle.selectedAnimalId || id;
    return true;
  }

  getBattleAnimalCombatStats(id, copyNumber = 1) {
    const spec = BATTLE_ANIMAL_MAP[id];
    if (!spec) return null;
    const copies = this.getBattleAnimalCopies(id);
    const bonus = Math.max(0, copies - 1);
    const fixedAttack = spec.id === 'kuolemanlintu' ? 100 : null;
    return {
      id: `${id}-${copyNumber}`,
      sourceId: id,
      name: copies > 1 ? `${spec.name} ${copyNumber}` : spec.name,
      ability: spec.ability,
      form: spec.form,
      primary: toCssHex(spec.colors.primary),
      secondary: toCssHex(spec.colors.secondary),
      maxHp: spec.hp + bonus * 2 + Math.floor(this.battle.wins / 2),
      hp: spec.hp + bonus * 2 + Math.floor(this.battle.wins / 2),
      attack: fixedAttack ?? (spec.attack + Math.min(4, bonus) + Math.floor(this.battle.wins / 4)),
      fixedBattleDamage: fixedAttack,
      shield: 0,
      poison: 0,
      stun: 0,
      skillUsed: false
    };
  }

  getAliveBattleUnits(group) {
    return group.filter((unit) => unit.hp > 0);
  }

  addBattleLog(message) {
    this.battle.log.unshift(message);
    this.battle.log = this.battle.log.slice(0, 10);
  }

  collectBattleAnimal(animal) {
    if (!animal || !animal.active || animal.getData('battleCollected')) return;
    const id = animal.getData('battleAnimalId');
    const spec = BATTLE_ANIMAL_MAP[id];
    if (!spec) return;
    animal.setData('battleCollected', true);
    this.battle.collection[id] = (this.battle.collection[id] || 0) + 1;
    this.addBattleAnimalToTeam(id);
    if (this.battle.collection[id] === 1) this.showToast(`Taistelueläin saatu: ${spec.name}`);
    else this.showToast(`${spec.name} liittyi joukkoon (+1)`);
    this.updateBattleUI();
    this.saveState();
    animal.destroy();
  }

  buyBattleAnimal(id, cost = 5) {
    const spec = BATTLE_ANIMAL_MAP[id];
    if (!spec) return false;
    if (this.state.coins < cost) {
      this.showToast?.(`Tarvitset ${cost} kolikkoa`);
      return false;
    }
    this.state.coins -= cost;
    this.battle.collection[id] = (this.battle.collection[id] || 0) + 1;
    this.addBattleAnimalToTeam(id);
    this.showToast?.(`Ostit eläimen: ${spec.name}`);
    this.updateUI();
    this.updateBattleUI?.();
    this.saveState();
    this._refreshMerchantAnimalShop?.();
    return true;
  }

  toggleBattleTeamAnimal(id) {
    if (!this.battle.collection[id]) return;
    const inTeam = this.getBattleTeamCopies(id);
    if (inTeam < this.getBattleAnimalCopies(id)) {
      this.addBattleAnimalToTeam(id);
    } else if (inTeam > 0) {
      const removeIndex = this.battle.team.lastIndexOf(id);
      if (removeIndex >= 0) this.battle.team.splice(removeIndex, 1);
    } else {
      this.showToast('Hanki lisää tätä eläintä lisätäksesi lisää taistelijoita');
    }
    if (!this.battle.inFight) {
      this.battle.allies = [];
      this.battle.enemies = [];
      this.battle.selectedAnimalId = this.battle.team[0] || null;
      this.battle.selectedTargetId = null;
    }
    this.renderBattleCollection();
    this.renderBattleArena();
    this.saveState();
  }

  ensureBattleSelection() {
    const aliveAllies = this.getAliveBattleUnits(this.battle.allies);
    const aliveEnemies = this.getAliveBattleUnits(this.battle.enemies);
    if (aliveAllies.length && !aliveAllies.some((unit) => unit.id === this.battle.selectedAnimalId)) this.battle.selectedAnimalId = aliveAllies[0].id;
    if (aliveEnemies.length && !aliveEnemies.some((unit) => unit.id === this.battle.selectedTargetId)) this.battle.selectedTargetId = aliveEnemies[0].id;
  }

  startPlayerSlide(direction) {
    if (!this.player || this.slide.active) return;
    this.slide.active = true;
    this.slide.startX = this.player.x;
    this.slide.direction = direction < 0 ? -1 : 1;
    this.slide.cooldownUntil = this.time.now + 300;
    this.slide.lastX = this.player.x;
    // Movement is advanced in small steps in update(), so a lag spike cannot
    // turn the slide into a long teleport.
    this.player.setVelocityX(0);
    this.player.setScale(1.12, 0.78);
  }

  isSlidePathBlocked(nextX) {
    const body = this.player?.body;
    if (!body) return false;
    const direction = this.slide.direction || 1;
    const halfWidth = (body.width || 20) / 2;
    const halfHeight = (body.height || 34) / 2;
    const frontX = nextX + direction * (halfWidth + 1);
    const topY = this.player.y - halfHeight + 2;
    const bottomY = this.player.y + halfHeight - 2;
    const tx = Math.floor(frontX / TILE);
    const topTy = Math.floor(topY / TILE);
    const bottomTy = Math.floor(bottomY / TILE);
    for (let ty = topTy; ty <= bottomTy; ty++) {
      if (this.hasSolidBlockAt(tx, ty)) return true;
    }
    return false;
  }

  startPlayerSlideFromInput() {
    if (!this.started || this.isPaused || !this.player || this.slide.active) return;
    const ridingSpecialAnimal = !!this.mountedSpecialAnimal;
    const ridingMoped = !!this.moped?.mounted;
    const ridingPlane = !!this.plane?.mounted;
    const onGround = this.player.body?.blocked?.down || this.player.body?.touching?.down;
    const slideAllowed = !ridingSpecialAnimal && !ridingMoped && !ridingPlane && !this.inWater && !this.ninja.striking;
    if (!slideAllowed || !onGround || this.time.now < this.slide.cooldownUntil) return;

    const left = this.cursors?.left?.isDown || this.keys?.A?.isDown || this.touchState?.left;
    const right = this.cursors?.right?.isDown || this.keys?.D?.isDown || this.touchState?.right;
    const direction = left ? -1 : right ? 1 : (this.player.flipX ? -1 : 1);
    this.startPlayerSlide(direction);
  }

  stopPlayerSlide() {
    if (!this.slide.active) return;
    this.slide.active = false;
    this.slide.direction = 0;
    this.player?.setVelocityX(0);
    this.player?.setScale(1, 1);
  }

  setMultiplayerStatus(message, connected = false) {
    this.multiplayer.connected = connected;
    if (this.multiplayer.statusEl) this.multiplayer.statusEl.textContent = `Moninpeli: ${message}`;
  }

  setupMultiplayer() {
    this.multiplayer.statusEl = document.getElementById('multiplayerStatus');
    if (typeof WebSocket === 'undefined' || window.location.protocol === 'file:') {
      this.setMultiplayerStatus('käynnistä palvelin', false);
      return;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    this.multiplayer.socket = socket;
    this.setMultiplayerStatus('yhdistetään…', false);
    socket.addEventListener('open', () => {
      this.setMultiplayerStatus('yhdistetty', true);
      socket.send(JSON.stringify({ type: 'join', x: this.player.x, y: this.player.y, flipX: !!this.player.flipX }));
    });
    socket.addEventListener('message', (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch(e) { return; }
      if (message.type === 'welcome') {
        this.multiplayer.id = message.id;
        return;
      }
      if (message.type === 'state' && Array.isArray(message.players)) {
        this.updateRemotePlayers(message.players);
      }
    });
    socket.addEventListener('error', () => this.setMultiplayerStatus('yhteysvirhe', false));
    socket.addEventListener('close', () => {
      this.setMultiplayerStatus('ei yhdistetty', false);
      this.multiplayer.players.forEach((remote) => { remote.sprite.destroy(); remote.label.destroy(); });
      this.multiplayer.players.clear();
    });
  }

  updateRemotePlayers(players) {
    const seen = new Set();
    players.forEach((data) => {
      if (!data || data.id === this.multiplayer.id) return;
      seen.add(data.id);
      let remote = this.multiplayer.players.get(data.id);
      if (!remote) {
        const sprite = this.add.sprite(data.x, data.y, 'tex_player_dyn').setDepth(5);
        if (typeof data.color === 'number') sprite.setTint(data.color);
        const label = this.add.text(data.x, data.y - 30, `Pelaaja ${data.id}`, {
          fontFamily: 'monospace', fontSize: '11px', color: '#fff', backgroundColor: '#0008'
        }).setOrigin(0.5).setDepth(1000);
        remote = { sprite, label, targetX: data.x, targetY: data.y, flipX: !!data.flipX };
        this.multiplayer.players.set(data.id, remote);
      }
      remote.targetX = Number.isFinite(data.x) ? data.x : remote.targetX;
      remote.targetY = Number.isFinite(data.y) ? data.y : remote.targetY;
      remote.flipX = !!data.flipX;
    });
    this.multiplayer.players.forEach((remote, id) => {
      if (!seen.has(id)) {
        remote.sprite.destroy();
        remote.label.destroy();
        this.multiplayer.players.delete(id);
      }
    });
  }

  updateMultiplayer() {
    this.multiplayer.players.forEach((remote) => {
      remote.sprite.x = Phaser.Math.Linear(remote.sprite.x, remote.targetX, 0.35);
      remote.sprite.y = Phaser.Math.Linear(remote.sprite.y, remote.targetY, 0.35);
      remote.sprite.setFlipX(remote.flipX);
      remote.label.setPosition(remote.sprite.x, remote.sprite.y - 30);
    });
    const socket = this.multiplayer.socket;
    if (typeof WebSocket === 'undefined' || !this.multiplayer.connected || !socket || socket.readyState !== WebSocket.OPEN || this.time.now < this.multiplayer.nextSendAt) return;
    this.multiplayer.nextSendAt = this.time.now + 50;
    socket.send(JSON.stringify({ type: 'state', x: this.player.x, y: this.player.y, flipX: !!this.player.flipX }));
  }

  preload() {
    // Generate simple textures at runtime so the game works without any files
    const g = this.add.graphics();

    // Ground (dirt) with speckles and subtle strata
    g.fillStyle(0x7d4f26, 1); g.fillRect(0, 0, TILE, TILE);
    // subtle darker/lighter noise dots
    for (let i=0;i<50;i++){ const x=Math.random()*TILE, y=Math.random()*TILE; const c=Math.random()<0.5?0x6b3a1b:0x996237; g.fillStyle(c, 0.35); g.fillRect(x, y, 2, 2); }
    // faint horizontal strata lines
    g.lineStyle(1, 0x6b3a1b, 0.25); for (let y=6;y<TILE;y+=6){ g.beginPath(); g.moveTo(0,y+Math.random()*1.5); g.lineTo(TILE, y+Math.random()*1.5); g.strokePath(); }
    // outline
    g.lineStyle(2, 0x553018, 1); g.strokeRect(0, 0, TILE, TILE);
    g.generateTexture('tex_ground', TILE, TILE); g.clear();

  // Ground with grass top for surface tiles
    const GH = Math.max(6, Math.floor(TILE*0.28));
    g.fillStyle(0x7d4f26, 1); g.fillRect(0, 0, TILE, TILE);
    for (let i=0;i<40;i++){ const x=Math.random()*TILE, y=GH + Math.random()*(TILE-GH); const c=Math.random()<0.5?0x6b3a1b:0x996237; g.fillStyle(c, 0.35); g.fillRect(x, y, 2, 2); }
    // grass layer
    g.fillStyle(0x2a8f2a, 1); g.fillRect(0, 0, TILE, GH);
    // blade tips
    g.fillStyle(0x36a536, 1);
    for (let i=0;i<14;i++){ const bx=Math.floor((i+Math.random()*0.8)*(TILE/14)); const h=2+Math.floor(Math.random()*3); g.fillRect(bx, GH-h, 2, h); }
    // darker grass shadows
    g.fillStyle(0x237823, 0.3); for (let i=0;i<8;i++){ const w=4+Math.random()*8; const x=Math.random()*(TILE-w); g.fillRect(x, GH-2, w, 2); }
    g.lineStyle(2, 0x553018, 1); g.strokeRect(0, 0, TILE, TILE);
  g.generateTexture('tex_ground_grass', TILE, TILE); g.clear();

  // Snow base and snow-with-top textures (for snow biome)
  // Base snow: light blue-white with subtle noise specks
  g.fillStyle(0xeaf7ff, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0xdaf0ff, 0.6);
  for (let i=0;i<8;i++) { const x = (Math.random()*TILE)|0; const y = (Math.random()*TILE)|0; g.fillRect(x, y, 1, 1); }
  g.generateTexture('tex_snow', TILE, TILE); g.clear();
  // Snow top: draw a thicker brighter cap at the top few pixels
  g.fillStyle(0xeaf7ff, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0xffffff, 1); g.fillRect(0, 0, TILE, 5);
  g.fillStyle(0xdaf0ff, 0.8);
  for (let i=0;i<10;i++) { const x = (Math.random()*TILE)|0; const y = 1 + ((Math.random()*4)|0); g.fillRect(x, y, 1, 1); }
  g.generateTexture('tex_snow_top', TILE, TILE); g.clear();

    // Stone with grain, speckles, and cracks
    g.fillStyle(0x8a8f93, 1); g.fillRect(0, 0, TILE, TILE);
    // grain speckles
    for (let i=0;i<70;i++){ const x=Math.random()*TILE, y=Math.random()*TILE; const cc=[0x6f757a,0x9aa1a6][(Math.random()*2)|0]; g.fillStyle(cc, 0.35); g.fillRect(x, y, 1, 1); }
    // micro cracks
    g.lineStyle(1, 0x5c646b, 0.5);
    for (let i=0;i<3;i++){
      const x0 = Math.random()*TILE*0.6, y0 = Math.random()*TILE;
      const x1 = x0 + TILE*0.6 + Math.random()*6, y1 = y0 + (Math.random()*2-1)*6;
      g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.strokePath();
    }
    g.lineStyle(2, 0x464b4f, 1); g.strokeRect(0, 0, TILE, TILE);
    g.generateTexture('tex_stone', TILE, TILE); g.clear();

    // Deeper rock layers: each layer is visibly darker and tougher.
    g.fillStyle(0x424b5a, 1); g.fillRect(0, 0, TILE, TILE);
    g.fillStyle(0x596575, 0.45);
    for (let i=0; i<30; i++) g.fillRect(Math.random()*TILE, Math.random()*TILE, 2, 2);
    g.lineStyle(2, 0x293240, 1); g.strokeRect(0, 0, TILE, TILE);
    g.lineStyle(1, 0x718092, 0.7);
    g.beginPath(); g.moveTo(3, 11); g.lineTo(17, 7); g.lineTo(26, 13); g.lineTo(36, 8); g.strokePath();
    g.generateTexture('tex_deep_stone', TILE, TILE); g.clear();

    g.fillStyle(0x171326, 1); g.fillRect(0, 0, TILE, TILE);
    g.fillStyle(0x493b72, 0.6);
    for (let i=0; i<18; i++) g.fillRect(Math.random()*TILE, Math.random()*TILE, 2, 2);
    g.lineStyle(2, 0x090711, 1); g.strokeRect(0, 0, TILE, TILE);
    g.lineStyle(1, 0x9b7dcc, 0.75);
    g.beginPath(); g.moveTo(4, 34); g.lineTo(14, 22); g.lineTo(11, 10); g.lineTo(24, 4); g.lineTo(35, 14); g.strokePath();
    g.generateTexture('tex_obsidian', TILE, TILE); g.clear();

    g.fillStyle(0x20242a, 1); g.fillRect(0, 0, TILE, TILE);
    g.fillStyle(0x343a43, 0.8);
    for (let i=0; i<22; i++) g.fillRect(Math.random()*TILE, Math.random()*TILE, 3, 2);
    g.lineStyle(2, 0x111318, 1); g.strokeRect(0, 0, TILE, TILE);
    g.lineStyle(2, 0x505862, 0.8);
    g.beginPath(); g.moveTo(4, 5); g.lineTo(14, 15); g.lineTo(7, 28); g.lineTo(20, 37); g.strokePath();
    g.beginPath(); g.moveTo(35, 4); g.lineTo(26, 14); g.lineTo(33, 27); g.lineTo(22, 36); g.strokePath();
    g.generateTexture('tex_bedrock', TILE, TILE); g.clear();

    // Sand with ripples and grains
    g.fillStyle(0xE2C572, 1); g.fillRect(0, 0, TILE, TILE);
    // wind ripples
    g.lineStyle(1, 0xceb361, 0.7); for (let y=5;y<TILE;y+=6){ g.beginPath(); g.moveTo(0,y+Math.sin(y*0.4)*0.6); for (let x=0;x<=TILE;x+=5){ g.lineTo(x, y+Math.sin((x+y)*0.18)*0.8); } g.strokePath(); }
    // grains
    for (let i=0;i<40;i++){ const x=Math.random()*TILE, y=Math.random()*TILE; g.fillStyle(0xd8bd6c, 0.35); g.fillRect(x, y, 1, 1); }
    g.lineStyle(2, 0xC9AE5F, 1); g.strokeRect(0, 0, TILE, TILE);
    g.generateTexture('tex_sand', TILE, TILE); g.clear();

    // Sandstone with layered strata
    g.fillStyle(0xCFA35B, 1); g.fillRect(0, 0, TILE, TILE);
    for (let y=4;y<TILE;y+=4){ const shade = [0xB78E4F,0xD8B069,0xA27E44][(Math.random()*3)|0]; g.fillStyle(shade, 0.45); g.fillRect(0, y-1 + Math.random()*1, TILE, 2); }
    g.lineStyle(2, 0xA27E44, 1); g.strokeRect(0, 0, TILE, TILE);
    g.generateTexture('tex_sandstone', TILE, TILE); g.clear();

    // Plank (wood) with slats and grain
    g.fillStyle(0x8b5a2b, 1); g.fillRect(0, 0, TILE, TILE);
    // vertical plank lines
    g.lineStyle(1, 0x6b3a1b, 0.9);
    const planks = 3 + ((Math.random()*2)|0); // 3-4 planks across a tile
    for (let i=1;i<planks;i++){
      const x = Math.floor(i * TILE / planks);
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, TILE); g.strokePath();
    }
    // subtle grain/knots
    g.fillStyle(0x9c6b38, 0.25);
    for (let i=0;i<10;i++){
      const x = Math.random()*TILE, y = Math.random()*TILE;
      const w = 2+Math.random()*3, h = 1+Math.random()*2;
      g.fillRect(x, y, w, h);
    }
    // border
    g.lineStyle(2, 0x4a2a12, 1); g.strokeRect(0, 0, TILE, TILE);
    g.generateTexture('tex_plank', TILE, TILE); g.clear();

    // 54 extra building blocks used by the corner block palette.
    NEW_BUILD_BLOCK_DEFS.forEach((block, index) => {
      g.fillStyle(block.color, 1); g.fillRect(0, 0, TILE, TILE);
      if (block.pattern === 'brick') {
        g.lineStyle(2, block.accent, 0.9);
        g.strokeRect(0, 0, TILE, TILE);
        g.lineStyle(1, block.accent, 0.8);
        g.lineBetween(0, 13, TILE, 13); g.lineBetween(0, 27, TILE, 27);
        g.lineBetween(index % 2 ? 12 : 20, 0, index % 2 ? 12 : 20, 13);
        g.lineBetween(index % 2 ? 28 : 4, 13, index % 2 ? 28 : 4, 27);
        g.lineBetween(index % 2 ? 12 : 20, 27, index % 2 ? 12 : 20, TILE);
      } else if (block.pattern === 'concrete') {
        g.fillStyle(block.accent, 0.22);
        for (let i = 0; i < 13; i++) g.fillCircle(3 + ((i * 17 + index * 5) % 34), 4 + ((i * 11 + index * 7) % 32), 1 + (i % 2));
        g.lineStyle(2, block.accent, 0.75); g.strokeRect(0, 0, TILE, TILE);
      } else if (block.pattern === 'crystal') {
        g.fillStyle(block.accent, 0.7);
        g.fillTriangle(4, 34, 13 + (index % 5), 5, 21, 34);
        g.fillTriangle(19, 37, 28 + (index % 4), 11, 37, 37);
        g.lineStyle(1, 0xffffff, 0.5); g.lineBetween(13, 8, 13, 30); g.lineBetween(29, 14, 29, 33);
        g.lineStyle(2, block.accent, 0.8); g.strokeRect(0, 0, TILE, TILE);
      } else if (block.pattern === 'stair' || block.pattern === 'stair-corner') {
        const step = TILE / 4;
        const risesToRight = block.direction === 'right' || block.direction === 'down-left';
        g.fillStyle(block.color, 1);
        for (let i = 0; i < 4; i++) {
          const height = step * (risesToRight ? i + 1 : 4 - i);
          const x = step * i;
          const y = TILE - height;
          g.fillRect(x, y, step, height);
        }
        if (block.pattern === 'stair-corner') {
          g.fillStyle(block.accent, 0.28);
          const cornerX = block.direction === 'left' ? 0 : TILE - 10;
          g.fillRect(cornerX, 0, 10, TILE);
        }
        g.lineStyle(2, block.accent, 0.95);
        for (let i = 1; i < 4; i++) {
          const x = step * i;
          const height = step * (risesToRight ? i : 5 - i);
          const y = TILE - height;
          g.lineBetween(x, y, x, TILE);
        }
        g.lineStyle(2, block.accent, 0.9); g.strokeRect(0, 0, TILE, TILE);
      } else if (block.pattern === 'metal') {
        g.fillStyle(block.accent, 0.22);
        g.fillRect(4, 5, 32, 4); g.fillRect(4, 31, 32, 4);
        g.lineStyle(2, block.accent, 0.8); g.strokeRect(0, 0, TILE, TILE);
        g.lineStyle(1, block.accent, 0.6); g.lineBetween(5, 5, 35, 35); g.lineBetween(35, 5, 5, 35);
      } else if (block.pattern === 'wood') {
        g.lineStyle(2, block.accent, 0.8);
        for (let x = 7; x < TILE; x += 10) g.lineBetween(x, 0, x, TILE);
        g.lineStyle(1, block.accent, 0.7); g.strokeEllipse(12 + (index % 3) * 7, 18, 9, 4);
        g.strokeEllipse(28, 30 - (index % 3) * 5, 8, 3);
        g.lineStyle(2, block.accent, 0.9); g.strokeRect(0, 0, TILE, TILE);
      } else if (block.pattern === 'organic') {
        g.fillStyle(block.accent, 0.4);
        for (let i = 0; i < 8; i++) g.fillCircle(4 + ((i * 13 + index * 3) % 32), 4 + ((i * 19 + index * 5) % 32), 2 + (i % 3));
        g.lineStyle(2, block.accent, 0.8); g.strokeRect(0, 0, TILE, TILE);
      } else {
        g.fillStyle(block.accent, 0.65);
        for (let i = 0; i < 6; i++) {
          const x = 5 + ((i * 19 + index * 3) % 30); const y = 5 + ((i * 13 + index * 5) % 30);
          g.fillCircle(x, y, 2 + (i % 2));
        }
        g.lineStyle(2, block.accent, 0.85); g.strokeRect(0, 0, TILE, TILE);
      }
      g.generateTexture(block.textureKey, TILE, TILE); g.clear();
    });

    // 65 trap-block textures. They are solid-looking, brightly marked hazard
    // tiles, while their placed detection zones use the matching trap logic.
    TRAP_BUILD_BLOCK_DEFS.forEach((block, index) => {
      g.fillStyle(block.color, 1); g.fillRect(0, 0, TILE, TILE);
      g.fillStyle(0x0f172a, 0.35); g.fillRect(0, TILE - 8, TILE, 8);
      g.lineStyle(2, block.accent, 0.95); g.strokeRect(1, 1, TILE - 2, TILE - 2);
      if (block.trapType === 'spike') {
        g.fillStyle(block.accent, 1);
        for (let i = 0; i < 5; i++) g.fillTriangle(3 + i * 8, 31, 7 + i * 8, 8 + (index % 3) * 2, 11 + i * 8, 31);
      } else if (block.trapType === 'bear') {
        g.lineStyle(4, block.accent, 1); g.strokeEllipse(20, 24, 27, 13);
        g.lineStyle(3, 0xffffff, 0.75); g.lineBetween(7, 21, 16, 12); g.lineBetween(33, 21, 24, 12);
      } else if (block.trapType === 'tripwire') {
        g.fillStyle(block.accent, 1); g.fillRect(4, 27, 7, 7); g.fillRect(29, 27, 7, 7);
        g.lineStyle(3, 0xffffff, 0.9); g.lineBetween(8, 27, 32, 27);
        g.lineStyle(1, 0xfef08a, 0.9); g.lineBetween(8, 23, 32, 23);
      } else if (block.trapType === 'fire') {
        g.fillStyle(block.accent, 1); g.fillTriangle(20, 5, 8, 31, 32, 31);
        g.fillStyle(0xfff7ae, 0.9); g.fillTriangle(20, 13, 15, 29, 25, 29);
      } else if (block.trapType === 'poison') {
        g.fillStyle(block.accent, 0.85); g.fillCircle(12, 24, 8); g.fillCircle(27, 20, 7); g.fillCircle(21, 30, 6);
        g.fillStyle(0xeaffb0, 0.8); g.fillCircle(12, 21, 2); g.fillCircle(27, 17, 2);
      } else if (block.trapType === 'spring') {
        g.lineStyle(3, block.accent, 1); g.lineBetween(7, 31, 33, 31); g.lineBetween(10, 28, 30, 28);
        g.lineStyle(2, 0xffffff, 0.85); g.lineBetween(9, 27, 15, 15); g.lineBetween(15, 15, 21, 27); g.lineBetween(21, 27, 27, 15); g.lineBetween(27, 15, 32, 8);
      } else if (block.trapType === 'freeze') {
        g.fillStyle(block.accent, 0.9); g.fillTriangle(20, 5, 32, 20, 20, 35); g.fillTriangle(20, 5, 8, 20, 20, 35);
        g.lineStyle(2, 0xffffff, 0.75); g.lineBetween(20, 9, 20, 31); g.lineBetween(11, 20, 29, 20);
      } else if (block.trapType === 'alarm') {
        g.fillStyle(block.accent, 1); g.fillRect(8, 25, 24, 7); g.fillCircle(20, 15, 8);
        g.fillStyle(0xffffff, 0.9); g.fillCircle(20, 15, 3); g.lineStyle(2, 0xffffff, 0.7); g.lineBetween(7, 8, 2, 3); g.lineBetween(33, 8, 38, 3);
      } else {
        g.lineStyle(3, block.accent, 1); g.strokeEllipse(20, 21, 30, 12); g.lineStyle(2, 0xffffff, 0.8); g.lineBetween(8, 29, 4, 36); g.lineBetween(32, 29, 36, 36);
      }
      g.lineStyle(1, 0xffffff, 0.48); g.lineBetween(4, 5, 36, 5);
      g.generateTexture(block.textureKey, TILE, TILE); g.clear();
    });

  // Player base texture (keep plain, no border)
  const pw = 28, ph = 36;
  g.fillStyle(0xffdd66, 1);
  g.fillRect(0, 0, pw, ph);
  // removed outline to avoid black border
  g.generateTexture('tex_player', pw, ph);
  g.clear();

  // Visible boost armor shells. The center stays transparent so the player
  // remains readable while the colored plates and energy core show the armor.
  BOOST_ARMOR_SPECS.filter((armor) => armor.id !== 'none').forEach((armor) => {
    const color = armor.trailColor || 0xffffff;
    const w = 48, h = 58;
    g.fillStyle(color, 0.12); g.fillRoundedRect(4, 4, w - 8, h - 8, 12);
    g.lineStyle(2, color, 0.9); g.strokeRoundedRect(4, 4, w - 8, h - 8, 12);
    g.fillStyle(color, 0.82); g.fillRoundedRect(13, 18, 22, 20, 6);
    g.fillStyle(0xffffff, 0.9); g.fillCircle(24, 28, 3);
    g.lineStyle(1, 0xffffff, 0.65); g.strokeLineShape(new Phaser.Geom.Line(10, 13, 38, 13));
    g.generateTexture(`tex_armor_${armor.id}`, w, h); g.clear();
  });

    // Diamond/coin pickup (blue)
    const d = TILE - 10;
    g.fillStyle(0x00ffff, 1);
    g.beginPath();
    g.moveTo(d/2, 0);
    g.lineTo(d, d/2);
    g.lineTo(d/2, d);
    g.lineTo(0, d/2);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, 0x009999, 1);
    g.strokePath();
    g.generateTexture('tex_diamond', d, d);
    g.clear();

    // Small wood item icon
    g.fillStyle(0x8b5a2b, 1); g.fillRect(0,0,22,22);
    g.lineStyle(2,0x6b3a1b,1); g.strokeRect(0,0,22,22);
    g.generateTexture('tex_woodItem',22,22); g.clear();

    // Stone item icon
    g.fillStyle(0x888888, 1); g.fillRect(0,0,22,22);
    g.lineStyle(2, 0x666666, 1); g.strokeRect(0,0,22,22);
    g.generateTexture('tex_stoneItem',22,22); g.clear();

    // Hot stone building block
    g.fillStyle(0x2b2523, 1); g.fillRect(0, 0, TILE, TILE);
    for (let y=6; y<TILE; y+=9) {
      g.lineStyle(2, 0xff5a22, 0.65);
      g.beginPath();
      g.moveTo(2, y);
      for (let x=2; x<TILE; x+=7) g.lineTo(x, y + Math.sin((x + y) * 0.35) * 3);
      g.strokePath();
    }
    g.fillStyle(0xffb13b, 0.8);
    for (let i=0; i<9; i++) g.fillRect(4 + Math.random()*(TILE-10), 4 + Math.random()*(TILE-10), 3, 3);
    g.lineStyle(2, 0xff6a1a, 1); g.strokeRect(0, 0, TILE, TILE);
    g.generateTexture('tex_hot_block', TILE, TILE); g.clear();

    // Red diamond (flight unlock)
    const r = TILE - 10;
    g.fillStyle(0xff3355, 1);
    g.beginPath(); g.moveTo(r/2, 0); g.lineTo(r, r/2); g.lineTo(r/2, r); g.lineTo(0, r/2); g.closePath(); g.fillPath();
    g.lineStyle(2, 0xaa0022, 1); g.strokePath();
    g.generateTexture('tex_red', r, r); g.clear();

  // Coin
  const c = TILE - 16, cx = c/2;
  g.fillStyle(0xffd84d,1); g.fillCircle(cx,cx,cx); g.lineStyle(2,0xb48700,1); g.strokeCircle(cx,cx,cx);
  g.generateTexture('tex_coin', c, c); g.clear();

  // Boots (bounce shoes) pickup
  const bootW=20, bootH=14; g.fillStyle(0x3a3a3a,1); g.fillRect(0,8,bootW,6); // soles
  g.fillStyle(0x77ff77,1); g.fillRect(2,2,6,6); g.fillRect(12,2,6,6); // uppers
  g.lineStyle(2,0x2a992a,1); g.strokeRect(2,2,6,6); g.strokeRect(12,2,6,6);
  g.generateTexture('tex_boots', bootW, bootH); g.clear();

  // Luontoon syntyvien lahjaboksien neljä harvinaisuustasoa.
  const giftBoxColors = { rare: 0x3b82f6, legendary: 0xf59e0b, mythical: 0xa855f7, ultra: 0xff2d75 };
  GIFT_BOX_DEFS.forEach((gift) => {
    const color = giftBoxColors[gift.id] || gift.color;
    g.fillStyle(0x111827, 0.95); g.fillRoundedRect(1, 5, 30, 23, 5);
    g.fillStyle(color, 1); g.fillRoundedRect(3, 3, 26, 22, 4);
    g.fillStyle(0xffffff, 0.88); g.fillRect(14, 3, 4, 22); g.fillRect(3, 12, 26, 4);
    g.lineStyle(2, 0x111827, 1); g.strokeRoundedRect(3, 3, 26, 22, 4);
    g.fillStyle(0xfff4b8, 1); g.fillCircle(16, 14, 3);
    g.lineStyle(1, 0xffffff, 0.9); g.strokeCircle(16, 14, 6);
    g.generateTexture(gift.texture, 32, 30); g.clear();
  });

  // Tree trunk (bark lines + knots)
  g.fillStyle(0x6b3a1b,1); g.fillRect(0,0,TILE,TILE);
  g.lineStyle(1,0x4a2a12,0.5); for (let x=4;x<TILE;x+=4){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (Math.random()*2-1), TILE); g.strokePath(); }
  g.fillStyle(0x4a2a12,0.6); for (let i=0;i<2;i++){ const kx=6+Math.random()*(TILE-12), ky=6+Math.random()*(TILE-12); g.fillCircle(kx, ky, 3+Math.random()*2); }
  g.lineStyle(2,0x402410,1); g.strokeRect(0,0,TILE,TILE); g.generateTexture('tex_trunk',TILE,TILE); g.clear();
  // Oak (tammi) trunk variant
  g.fillStyle(0x8e5b2f,1); g.fillRect(0,0,TILE,TILE);
  g.lineStyle(1,0x6b3f1b,0.5); for (let x=4;x<TILE;x+=4){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (Math.random()*2-1), TILE); g.strokePath(); }
  g.fillStyle(0x6b3f1b,0.55); for (let i=0;i<2;i++){ const kx=6+Math.random()*(TILE-12), ky=6+Math.random()*(TILE-12); g.fillCircle(kx, ky, 3+Math.random()*2); }
  g.lineStyle(2,0x5a3519,1); g.strokeRect(0,0,TILE,TILE); g.generateTexture('tex_tammi',TILE,TILE); g.clear();
  // Birch (koivu) trunk variant: white bark with black patches
  g.fillStyle(0xf2f2f2,1); g.fillRect(0,0,TILE,TILE);
  // subtle horizontal bands
  g.lineStyle(1,0xe6e6e6,0.6);
  for (let y=3; y<TILE; y+=5) { g.beginPath(); g.moveTo(0, y + (Math.random()*1.2-0.6)); g.lineTo(TILE, y + (Math.random()*1.2-0.6)); g.strokePath(); }
  // black patches/eyes
  g.fillStyle(0x2b2b2b, 0.75);
  for (let i=0;i<3;i++){ const px=4+Math.random()*(TILE-8), py=4+Math.random()*(TILE-8); g.fillEllipse(px, py, 5+Math.random()*3, 2+Math.random()*2); }
  g.lineStyle(2,0xbfbfbf,1); g.strokeRect(0,0,TILE,TILE); g.generateTexture('tex_koivu',TILE,TILE); g.clear();
  // Leaves (dappled foliage)
  g.fillStyle(0x2e8b57,1); g.fillRect(0,0,TILE,TILE);
  for (let i=0;i<40;i++){ const x=Math.random()*TILE, y=Math.random()*TILE; const col=[0x2f9b5f,0x277b4b,0x38a867][(Math.random()*3)|0]; g.fillStyle(col, 0.55); g.fillCircle(x, y, 2+Math.random()*2); }
  g.lineStyle(2,0x1d5d3a,1); g.strokeRect(0,0,TILE,TILE); g.generateTexture('tex_leaves',TILE,TILE); g.clear();
  // Tower body (3 tiles, unified) — clean soldier style
  const bodyW = TILE, bodyH = TILE*3;
  // background block
  g.fillStyle(0x4a4f58, 1); g.fillRect(0, 0, bodyW, bodyH);
  // outline
  g.lineStyle(2, 0x2b2f36, 1); g.strokeRect(0, 0, bodyW, bodyH);
  // top parapet
  g.fillStyle(0x3c414a, 1); g.fillRect(2, 4, bodyW-4, TILE-10);
  g.lineStyle(2, 0x262a30, 1); g.strokeRect(2, 4, bodyW-4, TILE-10);
  // view slits (windows)
  g.fillStyle(0x99a4b3, 1);
  g.fillRect(8, TILE/2 - 3, bodyW-16, 6);
  g.fillRect(8, TILE + TILE/2 - 3, bodyW-16, 6);
  // insignia plate at base
  g.fillStyle(0x2e7bd3, 1); g.fillRect(bodyW/2 - 6, bodyH - TILE + 8, 12, 6);
  g.generateTexture('tex_tower_body', bodyW, bodyH); g.clear();
  // Tower gun (rotating, sniper-style)
  g.fillStyle(0x3f444c,1); g.fillRoundedRect(4, 6, TILE-8, TILE-12, 6);
  // scope
  g.fillStyle(0x2b91ff,1); g.fillCircle(10, TILE/2, 3);
  // barrel
  g.fillStyle(0x2f3339,1); g.fillRect(TILE-18, TILE/2-2, 14, 4);
  g.lineStyle(2,0x262a30,1); g.strokeRoundedRect(4,6,TILE-8,TILE-12,6);
  g.generateTexture('tex_tower_gun', TILE, TILE); g.clear();

  // Soldier sprite (to stand on tower top)
  const solW = 28, solH = 36;
  // body
  g.fillStyle(0x2b4d2b,1); g.fillRect(4, 12, solW-8, 14);
  // pants
  g.fillStyle(0x1e361e,1); g.fillRect(6, 26, solW-12, 8);
  // head
  g.fillStyle(0xffdd66,1); g.fillRect(8, 6, solW-16, 8);
  // helmet
  g.fillStyle(0x223d22,1); g.fillRect(6, 4, solW-12, 6);
  // eyes
  g.fillStyle(0x000000,1); g.fillRect(12, 9, 2, 2); g.fillRect(solW-14, 9, 2, 2);
  // vest lines
  g.lineStyle(2, 0x1a2f1a, 1); g.strokeRect(4, 12, solW-8, 14);
  g.generateTexture('tex_soldier', solW, solH); g.clear();

  // Jetpack soldier sprite (adds a backpack and nozzle details)
  // base body
  g.fillStyle(0x2b4d2b,1); g.fillRect(4, 12, solW-8, 14);
  g.fillStyle(0x1e361e,1); g.fillRect(6, 26, solW-12, 8);
  g.fillStyle(0xffdd66,1); g.fillRect(8, 6, solW-16, 8);
  g.fillStyle(0x223d22,1); g.fillRect(6, 4, solW-12, 6);
  g.fillStyle(0x000000,1); g.fillRect(12, 9, 2, 2); g.fillRect(solW-14, 9, 2, 2);
  // backpack
  g.fillStyle(0x666b75,1); g.fillRoundedRect(3, 12, 8, 14, 3);
  // nozzle caps
  g.fillStyle(0x44474f,1); g.fillRect(4, 26, 2, 4); g.fillRect(8, 26, 2, 4);
  // straps
  g.fillStyle(0x4a4f58,1); g.fillRect(10, 12, 2, 14);
  g.lineStyle(2, 0x1a2f1a, 1); g.strokeRect(4, 12, solW-8, 14);
  g.generateTexture('tex_soldier_jetpack', solW, solH); g.clear();

  // Enemy soldier (sniper) — darker uniform with red band
  g.fillStyle(0x2b2f38,1); g.fillRect(4, 12, solW-8, 14);
  g.fillStyle(0x1b1f27,1); g.fillRect(6, 26, solW-12, 8);
  g.fillStyle(0xffcc66,1); g.fillRect(8, 6, solW-16, 8);
  g.fillStyle(0x1e2730,1); g.fillRect(6, 4, solW-12, 6);
  // red band/arm patch
  g.fillStyle(0xcc3333,1); g.fillRect(solW-10, 16, 8, 3);
  g.fillStyle(0x000000,1); g.fillRect(12, 9, 2, 2); g.fillRect(solW-14, 9, 2, 2);
  g.lineStyle(2, 0x0f141a, 1); g.strokeRect(4, 12, solW-8, 14);
  g.generateTexture('tex_enemy_soldier', solW, solH); g.clear();

  // Palace king, robbers, and robot guards.
  g.fillStyle(0x5b21b6, 1); g.fillRect(4, 13, solW-8, 17);
  g.fillStyle(0x7c3aed, 1); g.fillRect(7, 11, solW-14, 4);
  g.fillStyle(0xffd34e, 1); g.fillRect(8, 5, solW-16, 8);
  g.fillTriangle(7, 6, 10, 1, 13, 6); g.fillTriangle(12, 6, 16, 1, 19, 6);
  g.fillStyle(0x111827, 1); g.fillRect(11, 9, 2, 2); g.fillRect(15, 9, 2, 2);
  g.fillStyle(0xffd34e, 1); g.fillRect(6, 29, 6, 5); g.fillRect(16, 29, 6, 5);
  g.lineStyle(2, 0x2e1065, 1); g.strokeRect(4, 13, solW-8, 17);
  g.generateTexture('tex_king', solW, solH); g.clear();

  g.fillStyle(0x78350f, 1); g.fillRect(4, 13, solW-8, 17);
  g.fillStyle(0x451a03, 1); g.fillRect(6, 26, solW-12, 8);
  g.fillStyle(0xf0b27a, 1); g.fillRect(8, 6, solW-16, 9);
  g.fillStyle(0x111827, 1); g.fillRect(6, 8, solW-12, 5);
  g.fillStyle(0xdc2626, 1); g.fillRect(6, 14, solW-12, 4);
  g.fillStyle(0xfacc15, 1); g.fillRect(11, 19, 3, 3); g.fillRect(16, 19, 3, 3);
  g.lineStyle(2, 0x27130a, 1); g.strokeRect(4, 13, solW-8, 17);
  g.generateTexture('tex_robber', solW, solH); g.clear();

  g.fillStyle(0x92400e, 1); g.fillRect(4, 13, solW-8, 17);
  g.fillStyle(0x78350f, 1); g.fillRect(6, 26, solW-12, 8);
  g.fillStyle(0xf0b27a, 1); g.fillRect(8, 6, solW-16, 9);
  g.fillStyle(0xfacc15, 1); g.fillRect(6, 4, solW-12, 5);
  g.fillStyle(0x111827, 1); g.fillRect(11, 10, 2, 2); g.fillRect(15, 10, 2, 2);
  g.fillStyle(0x475569, 1); g.fillRect(1, 15, 5, 3); g.fillRect(22, 15, 5, 3);
  g.lineStyle(2, 0x451a03, 1); g.strokeRect(4, 13, solW-8, 17);
  g.generateTexture('tex_carpenter', solW, solH); g.clear();

  g.fillStyle(0x475569, 1); g.fillRoundedRect(4, 12, solW-8, 18, 3);
  g.fillStyle(0x1e293b, 1); g.fillRect(6, 29, 7, 5); g.fillRect(15, 29, 7, 5);
  g.fillStyle(0x94a3b8, 1); g.fillRect(7, 5, solW-14, 10);
  g.fillStyle(0x22d3ee, 1); g.fillRect(10, 8, 8, 3);
  g.fillStyle(0xf97316, 1); g.fillRect(2, 15, 4, 8); g.fillRect(22, 15, 4, 8);
  g.lineStyle(2, 0x0f172a, 1); g.strokeRoundedRect(4, 12, solW-8, 18, 3);
  g.generateTexture('tex_robot_guard', solW, solH); g.clear();

  // Throwing knife projectile texture
  const kw=16, kh=6; g.fillStyle(0xbfc5ce,1); g.fillRoundedRect(0,1,kw,kh-2,2);
  g.fillStyle(0x88909a,1); g.fillRect(kw-4, 0, 4, kh); // tip shade
  g.lineStyle(2,0x6a7280,1); g.strokeRoundedRect(0,1,kw,kh-2,2);
  g.generateTexture('tex_throwing_knife', kw, kh); g.clear();
  // Trap textures
  // Floor spikes
  const tspw=TILE, tsph=10; g.fillStyle(0x555555,1); g.fillRect(0, tsph-2, tspw, 2); // base strip
  g.fillStyle(0xbdbdbd,1);
  for (let i=0;i<6;i++){ const x=i*(tspw/6)+2; g.fillTriangle(x,tsph-2, x+6,tsph-2, x+3,0); }
  g.lineStyle(2,0x424242,1); g.strokeRect(0, tsph-2, tspw, 2);
  g.generateTexture('tex_trap_spike', tspw, tsph); g.clear();
  // Bear trap (open jaws)
  const btw=TILE, bth=14; g.fillStyle(0x8d8d8d,1); g.fillRoundedRect(2, 6, btw-4, 6, 3);
  g.fillStyle(0xcfd8dc,1); for (let i=0;i<6;i++){ const x=6+i*6; g.fillTriangle(x,6, x+4,6, x+2,2);} // teeth
  g.lineStyle(2,0x5a5a5a,1); g.strokeRoundedRect(2,6,btw-4,6,3);
  g.generateTexture('tex_trap_bear', btw, bth); g.clear();
  // Tripwire emitter box
  const tw=TILE, th=10; g.fillStyle(0x6e6e6e,1); g.fillRoundedRect(2,2,tw-4,th-4,3); g.lineStyle(2,0x424242,1); g.strokeRoundedRect(2,2,tw-4,th-4,3);
  g.generateTexture('tex_trap_tripwire', tw, th); g.clear();
  // Fire trap (red plate with flame)
  const ftw = TILE, fth = TILE; g.fillStyle(0x5a1a1a,1); g.fillRect(2,fth-10,ftw-4,8); g.fillStyle(0xff5533,1); g.fillTriangle(ftw/2, fth-18, ftw/2-6, fth-10, ftw/2+6, fth-10); g.generateTexture('tex_trap_fire', ftw, fth); g.clear();
  // Poison trap (green plate with skull-ish dot)
  const ptw=TILE, pth=TILE; g.fillStyle(0x1a5a1a,1); g.fillRect(2,pth-10,ptw-4,8); g.fillStyle(0x66ff66,1); g.fillCircle(ptw/2, pth-14, 3); g.generateTexture('tex_trap_poison', ptw, pth); g.clear();
  // Spring trap (metallic spring)
  const tsprW=TILE, tsprH=TILE; g.fillStyle(0x444444,1); g.fillRect(2,tsprH-10,tsprW-4,8); g.lineStyle(2,0xbfbfbf,1); g.strokeRect(6,tsprH-20,tsprW-12,6); g.lineStyle(1,0xbfbfbf,1); g.strokeLineShape(new Phaser.Geom.Line(6,tsprH-17,tsprW-6,tsprH-13)); g.strokeLineShape(new Phaser.Geom.Line(6,tsprH-13,tsprW-6,tsprH-17)); g.generateTexture('tex_trap_spring', tsprW, tsprH); g.clear();
  // Poison gas puff texture (for visual cloud)
  g.fillStyle(0x66ff66,0.7); g.fillCircle(8,8,8); g.fillStyle(0xaaffaa,0.5); g.fillCircle(5,6,5); g.generateTexture('tex_gas',16,16); g.clear();
  // Freeze trap (icy blue plate)
  const frw=TILE, frh=TILE; g.fillStyle(0x1a2a5a,1); g.fillRect(2,frh-10,frw-4,8); g.fillStyle(0x88ccff,1); g.fillCircle(frw/2, frh-14, 3); g.generateTexture('tex_trap_freeze', frw, frh); g.clear();
  // Alarm trap (yellow beacon)
  const alw=TILE, alh=TILE; g.fillStyle(0x5a4a1a,1); g.fillRect(2,alh-10,alw-4,8); g.fillStyle(0xffee55,1); g.fillRect(alw/2-2, alh-18, 4, 6); g.generateTexture('tex_trap_alarm', alw, alh); g.clear();
  // Trampoline (springy red frame with a blue jumping surface)
  const trampW = TILE, trampH = TILE;
  g.fillStyle(0x1f2937, 1); g.fillRoundedRect(4, 27, trampW-8, 6, 3);
  g.lineStyle(3, 0xef4444, 1); g.strokeEllipse(trampW/2, 20, 32, 12);
  g.fillStyle(0x38bdf8, 0.92); g.fillEllipse(trampW/2, 20, 27, 8);
  g.lineStyle(2, 0x94a3b8, 1);
  g.lineBetween(8, 27, 3, 38); g.lineBetween(trampW-8, 27, trampW-3, 38);
  g.lineBetween(13, 28, 10, 38); g.lineBetween(trampW-13, 28, trampW-10, 38);
  g.generateTexture('tex_trap_trampoline', trampW, trampH); g.clear();
  // Dart projectile
  const dartW=14, dartH=4; g.fillStyle(0xb0bec5,1); g.fillRoundedRect(0,0,dartW,dartH,2); g.fillStyle(0x90a4ae,1); g.fillRect(dartW-4,0,4,dartH); g.generateTexture('tex_dart', dartW, dartH); g.clear();
  // Spear weapon texture (held icon)
  // Long shaft with metal tip
  const spw=36, sph=6; g.fillStyle(0x7a4e2a,1); g.fillRect(2, 2, spw-10, 2); // wooden shaft
  g.fillStyle(0xcfd8dc,1); g.fillRect(spw-10, 1, 8, 4); // tip base
  g.fillStyle(0xb0bec5,1); g.beginPath(); g.moveTo(spw-2,3); g.lineTo(spw-10,0); g.lineTo(spw-10,6); g.closePath(); g.fillPath();
  g.lineStyle(2,0x4e342e,1); g.strokeRect(2,2,spw-10,2);
  g.lineStyle(2,0x607d8b,1); g.strokeTriangle(spw-2,3, spw-10,0, spw-10,6);
  g.generateTexture('tex_weapon_spear', spw, sph); g.clear();

  // Minecraft-style trident with three prongs.
  const trw = 42, trh = 16;
  g.fillStyle(0x7dd3fc, 1); g.fillRect(3, 7, 27, 2);
  g.fillStyle(0x38bdf8, 1); g.fillRect(27, 5, 4, 6);
  g.fillTriangle(40, 8, 30, 2, 30, 6);
  g.fillTriangle(40, 8, 30, 10, 30, 14);
  g.fillTriangle(39, 8, 32, 6, 32, 10);
  g.lineStyle(1, 0xe0f2fe, 1); g.strokeRect(3, 7, 27, 2);
  g.generateTexture('tex_weapon_trident', trw, trh); g.clear();
  g.fillStyle(0x7dd3fc, 1); g.fillRect(1, 3, 13, 2);
  g.fillTriangle(17, 4, 13, 1, 13, 7);
  g.fillStyle(0xe0f2fe, 1); g.fillCircle(4, 4, 1);
  g.generateTexture('tex_trident', 18, 8); g.clear();
  // Tank textures (base with tracks) and turret
  // Base 44x26 with tracks and body area to tint
  const tbw=44, tbh=26;
  g.fillStyle(0x2d2d2d,1); // tracks
  g.fillRect(2, tbh-8, tbw-4, 6);
  g.fillStyle(0x111111,1);
  for (let i=4;i<tbw-6;i+=8){ g.fillRect(i, tbh-7, 4, 4); }
  // hull (tint area roughly 30x14 centered)
  g.fillStyle(0x666b75,1); g.fillRoundedRect(7, 6, tbw-14, 14, 4);
  g.lineStyle(2,0x1e1e1e,1); g.strokeRoundedRect(7, 6, tbw-14, 14, 4);
  // hatch and details
  g.fillStyle(0x9aa2ad,1); g.fillRect(12, 10, 8, 4);
  g.fillStyle(0x4a4f58,1); g.fillRect(tbw-22, 9, 10, 6);
  g.generateTexture('tex_tank_base', tbw, tbh); g.clear();
  // Turret (rotating cannon) 30x12, origin will be near rear
  const ttw=30, tth=12;
  g.fillStyle(0x3f444c,1); g.fillRoundedRect(2, 2, 16, 8, 3);
  g.fillStyle(0x2f3339,1); g.fillRect(14, tth/2-2, 16, 4); // barrel
  g.lineStyle(2,0x262a30,1); g.strokeRoundedRect(2,2,16,8,3);
  g.generateTexture('tex_tank_turret', ttw, tth); g.clear();

    // Bird texture
    const bw=36,bh=20,mid=8; g.fillStyle(0x222222,1); g.beginPath(); g.moveTo(0,bh); g.lineTo(bw,bh-mid); g.lineTo(bw*0.35,0); g.closePath(); g.fillPath(); g.lineStyle(2,0x000000,1); g.strokePath(); g.generateTexture('tex_bird',bw,bh); g.clear();

    // Slime texture
    const sw=28, sh=20; g.fillStyle(0x44cc55,1); g.fillRoundedRect(0,0,sw,sh,6); g.lineStyle(2,0x2a8c38,1); g.strokeRoundedRect(0,0,sw,sh,6);
    g.fillStyle(0xffffff,1); g.fillCircle(8,8,3); g.fillCircle(20,8,3); g.fillStyle(0x000000,1); g.fillCircle(8,8,1.5); g.fillCircle(20,8,1.5);
    g.generateTexture('tex_slime', sw, sh); g.clear();

  // Torch texture (stick + flame)
  g.fillStyle(0x8b5a2b,1); g.fillRect(TILE/2-2, TILE-18, 4, 16);
  g.fillStyle(0xffcc33,1); g.fillCircle(TILE/2, TILE-20, 6); g.fillStyle(0xff6600,1); g.fillCircle(TILE/2-2, TILE-22, 3);
  g.lineStyle(2,0x6b3a1b,1); g.strokeRect(TILE/2-2, TILE-18, 4, 16);
  g.generateTexture('tex_torch', TILE, TILE); g.clear();

  // Campfire texture (logs + flame + stone ring)
  const cw = TILE, ch = TILE;
  g.fillStyle(0x666666, 1); // stone ring
  g.fillCircle(cw*0.50, ch*0.72, ch*0.20);
  g.fillStyle(0x7a4b2a, 1); // logs
  g.fillRect(cw*0.30, ch*0.70, cw*0.40, ch*0.08); // horizontal log
  g.fillRect(cw*0.46, ch*0.58, cw*0.08, ch*0.28); // vertical log (fake cross without rotation)
  g.fillStyle(0xffc04d, 1); g.fillCircle(cw*0.50, ch*0.48, ch*0.22); // flame outer
  g.fillStyle(0xff7a1a, 0.95); g.fillCircle(cw*0.50, ch*0.48, ch*0.16); // flame inner
  g.fillStyle(0xffffff, 0.9); g.fillCircle(cw*0.50, ch*0.46, ch*0.08); // flame core
  g.generateTexture('tex_campfire', TILE, TILE); g.clear();

  // Branch texture (simple wooden branch)
  g.fillStyle(0x7a4f2b, 1.0);
  g.fillRect(TILE*0.05, TILE*0.45, TILE*0.9, TILE*0.08);
  g.fillStyle(0x5c3a1f, 1.0);
  g.fillRect(TILE*0.65, TILE*0.35, TILE*0.25, TILE*0.06);
  g.generateTexture('tex_branch', TILE, TILE); g.clear();

  // Lamp texture (floor lamp): base + pole + shade glow
  g.fillStyle(0x444444, 1.0);
  g.fillRect(TILE*0.40, TILE*0.8, TILE*0.2, TILE*0.1); // base
  g.fillStyle(0x777777, 1.0);
  g.fillRect(TILE*0.485, TILE*0.25, TILE*0.03, TILE*0.55); // pole
  g.fillStyle(0xfff1b0, 1.0);
  g.fillTriangle(TILE*0.35, TILE*0.28, TILE*0.65, TILE*0.28, TILE*0.5, TILE*0.18); // shade
  g.generateTexture('tex_lamp', TILE, TILE); g.clear();

  // Nightbreaker texture (glowing crystal obelisk)
  const nbw = TILE, nbh = TILE;
  g.fillStyle(0x222222).fillRect(nbw/2-6, nbh-10, 12, 10); // base
  g.fillStyle(0x4466ff).fillRect(nbw/2-4, 8, 8, nbh-18); // core
  g.fillStyle(0x88aaff, 0.9).fillRect(nbw/2-3, 10, 6, nbh-22);
  // side shards
  g.fillStyle(0x3355dd).fillRect(nbw/2-10, 18, 4, 20);
  g.fillStyle(0x3355dd).fillRect(nbw/2+6, 16, 4, 24);
  g.generateTexture('tex_nightbreaker', nbw, nbh); g.clear();

  // Sofa texture (two-seat)
  g.fillStyle(0x5a2d2d, 1.0); g.fillRect(TILE*0.1, TILE*0.55, TILE*0.8, TILE*0.35); // seat
  g.fillStyle(0x7a3d3d, 1.0); g.fillRect(TILE*0.1, TILE*0.35, TILE*0.8, TILE*0.25); // back
  g.fillStyle(0x4a1d1d, 1.0); g.fillRect(TILE*0.08, TILE*0.45, TILE*0.06, TILE*0.35); // arm left
  g.fillRect(TILE*0.86, TILE*0.45, TILE*0.06, TILE*0.35); // arm right
  g.generateTexture('tex_sofa', TILE, TILE); g.clear();

  // Table texture (top + legs)
  g.fillStyle(0x8b5a2b, 1.0); g.fillRect(TILE*0.08, TILE*0.45, TILE*0.84, TILE*0.12); // top
  g.fillStyle(0x6b3a1b, 1.0);
  g.fillRect(TILE*0.12, TILE*0.57, TILE*0.06, TILE*0.25); // leg 1
  g.fillRect(TILE*0.82, TILE*0.57, TILE*0.06, TILE*0.25); // leg 2
  g.fillRect(TILE*0.47, TILE*0.57, TILE*0.06, TILE*0.25); // center leg
  g.generateTexture('tex_table', TILE, TILE); g.clear();

  // Six placeable tool workstations.
  const makeWorkstationTexture = (key, body, accent, detail) => {
    g.fillStyle(0x111827, 1); g.fillRoundedRect(2, 5, TILE - 4, TILE - 8, 6);
    g.fillStyle(body, 1); g.fillRoundedRect(5, 8, TILE - 10, TILE - 13, 4);
    g.lineStyle(2, 0x0b1220, 1); g.strokeRoundedRect(5, 8, TILE - 10, TILE - 13, 4);
    g.fillStyle(accent, 1);
    if (detail === 'grill') {
      g.fillRect(9, 13, 22, 5); g.fillRect(11, 21, 18, 4);
      g.lineStyle(2, 0xff7a18, 0.95); g.lineBetween(13, 29, 17, 25); g.lineBetween(20, 29, 24, 24);
    } else if (detail === 'workbench') {
      g.fillRect(8, 12, 24, 5); g.fillRect(10, 20, 4, 10); g.fillRect(26, 20, 4, 10);
      g.fillStyle(0xffd166, 1); g.fillRect(19, 18, 4, 12); g.fillRect(16, 18, 10, 4);
    } else if (detail === 'furnace') {
      g.fillRect(10, 12, 20, 19); g.fillStyle(0xff8a3d, 1); g.fillRect(15, 17, 10, 9);
      g.fillStyle(0xffdf72, 1); g.fillCircle(20, 21, 3);
    } else if (detail === 'grindstone') {
      g.fillCircle(20, 17, 10); g.fillStyle(0xcbd5e1, 1); g.fillCircle(20, 17, 6);
      g.fillStyle(0x7c3f25, 1); g.fillRect(9, 27, 22, 4); g.fillRect(12, 25, 4, 7); g.fillRect(24, 25, 4, 7);
    } else if (detail === 'anvil') {
      g.fillRect(9, 13, 22, 6); g.fillTriangle(9, 13, 4, 19, 9, 22);
      g.fillRect(14, 19, 12, 7); g.fillRect(12, 26, 5, 5); g.fillRect(23, 26, 5, 5);
    } else {
      g.fillRect(8, 12, 24, 6); g.fillRect(11, 20, 4, 10); g.fillRect(25, 20, 4, 10);
      g.fillStyle(0x5cf5ff, 1); g.fillRect(14, 21, 3, 6); g.fillRect(20, 19, 3, 8); g.fillRect(26, 22, 3, 5);
    }
    g.generateTexture(key, TILE, TILE); g.clear();
  };
  makeWorkstationTexture('tex_workstation_grill', 0x7f1d1d, 0xf97316, 'grill');
  makeWorkstationTexture('tex_workstation_workbench', 0x86512d, 0xc5894d, 'workbench');
  makeWorkstationTexture('tex_workstation_furnace', 0x4b5563, 0xf97316, 'furnace');
  makeWorkstationTexture('tex_workstation_grindstone', 0x64748b, 0xe2e8f0, 'grindstone');
  makeWorkstationTexture('tex_workstation_anvil', 0x334155, 0xcbd5e1, 'anvil');
  makeWorkstationTexture('tex_workstation_toolbench', 0x155e75, 0x38bdf8, 'toolbench');

  // Zombie texture (2-tile tall rectangle with face)
  const zw = Math.floor(TILE*0.7), zh = TILE*2 - 2;
  g.fillStyle(0x557755,1); g.fillRect(0,0,zw,zh); g.lineStyle(2,0x2a442a,1); g.strokeRect(0,0,zw,zh);
  g.fillStyle(0x88ff88,1); g.fillRect(3,3,zw-6,12);
  g.fillStyle(0x000000,1); g.fillRect(6,7,4,4); g.fillRect(zw-10,7,4,4);
  g.generateTexture('tex_zombie', zw, zh); g.clear();

  // Mörkö Boss texture (4x4 tiles)
  const bwT = TILE*4, bhT = TILE*4;
  g.fillStyle(0x3b2a4f,1); g.fillRoundedRect(0,0,bwT,bhT,14);
  g.lineStyle(6,0x221833,1); g.strokeRoundedRect(0,0,bwT,bhT,14);
  // eyes + mouth
  g.fillStyle(0xffffff,1); g.fillCircle(bwT*0.32, bhT*0.28, 14); g.fillCircle(bwT*0.68, bhT*0.28, 14);
  g.fillStyle(0xff3355,1); g.fillRoundedRect(bwT*0.28, bhT*0.58, bwT*0.44, 26, 10);
  g.generateTexture('tex_boss_morko', bwT, bhT); g.clear();

  const drawBossVariant = (key, body, accent, mouth) => {
    g.fillStyle(body, 1); g.fillRoundedRect(0, 0, bwT, bhT, 16);
    g.lineStyle(6, 0x111827, 1); g.strokeRoundedRect(0, 0, bwT, bhT, 16);
    g.fillStyle(accent, 1); g.fillCircle(bwT*0.32, bhT*0.28, 15); g.fillCircle(bwT*0.68, bhT*0.28, 15);
    g.fillStyle(0x111111, 1); g.fillCircle(bwT*0.32, bhT*0.28, 6); g.fillCircle(bwT*0.68, bhT*0.28, 6);
    g.fillStyle(mouth, 1); g.fillRoundedRect(bwT*0.25, bhT*0.58, bwT*0.5, 28, 11);
    g.fillStyle(accent, 0.9); g.fillTriangle(bwT*0.12, 20, bwT*0.2, 0, bwT*0.28, 20); g.fillTriangle(bwT*0.72, 20, bwT*0.8, 0, bwT*0.88, 20);
    g.generateTexture(key, bwT, bhT); g.clear();
  };
  drawBossVariant('tex_boss_palace', 0x5b21b6, 0xffd34e, 0xef4444);
  drawBossVariant('tex_boss_robot', 0x475569, 0x22d3ee, 0x0f172a);
  drawBossVariant('tex_boss_dragon', 0x991b1b, 0xffc928, 0x111827);
  drawBossVariant('tex_boss_ice', 0x2563eb, 0xdbeafe, 0x172554);

  // Pupil texture for boss dynamic eyes
  g.fillStyle(0x000000,1); g.fillCircle(5,5,5); g.generateTexture('tex_pupil', 10, 10); g.clear();

  // Cactus tile (one segment, stacks vertically)
  g.fillStyle(0x2FA05A, 1);
  g.fillRoundedRect(8, 2, TILE-16, TILE-4, 6);
  // thorns
  g.fillStyle(0x1e6b3b, 1);
  for (let i=0;i<4;i++){ g.fillRect(6, 6+i*8, 4, 2); g.fillRect(TILE-10, 10+i*8, 4, 2); }
  g.lineStyle(2, 0x175534, 1);
  g.strokeRoundedRect(8, 2, TILE-16, TILE-4, 6);
  g.generateTexture('tex_cactus', TILE, TILE);
  g.clear();

    // Merchant stall
    g.fillStyle(0x9b7653,1); g.fillRect(0,10,30,26); g.lineStyle(2,0x6b4a2b,1); g.strokeRect(0,10,30,26);
    g.fillStyle(0xff5555,1); g.fillRect(0,0,30,12); g.lineStyle(2,0xaa2222,1); g.strokeRect(0,0,30,12);
    g.generateTexture('tex_merchant',30,36); g.clear();

    // Water tile
    g.fillStyle(0x4a90e2, 0.8); g.fillRect(0,0,TILE,TILE); g.lineStyle(2,0x2e5c8a,1); g.strokeRect(0,0,TILE,TILE);
    g.generateTexture('tex_water',TILE,TILE); g.clear();

    // Bullet texture (with casing + tip highlight)
    g.fillStyle(0xd4af37,1); g.fillRect(0,0,6,4); // brass casing
    g.fillStyle(0x444444,1); g.fillRect(6,1,2,2); // projectile tip
    g.lineStyle(1,0x8f7a25,1); g.strokeRect(0,0,6,4);
    g.generateTexture('tex_bullet',8,4); g.clear();
    // Dakkerssit: a pair of dark ninja knives and their thrown blades.
    g.fillStyle(0x27144f,1); g.fillRect(4,5,5,3); g.fillStyle(0x8b5cf6,1); g.fillTriangle(8,5,25,1,11,8);
    g.fillStyle(0x111827,1); g.fillRect(3,4,5,2); g.fillStyle(0x67e8f9,1); g.fillRect(1,3,3,2);
    g.fillStyle(0x27144f,1); g.fillRect(2,9,5,3); g.fillStyle(0x8b5cf6,1); g.fillTriangle(6,9,22,5,9,12);
    g.generateTexture('tex_weapon_dakkerssit',26,13); g.clear();
    g.fillStyle(0x8b5cf6,1); g.fillTriangle(1,4,11,0,7,7); g.fillStyle(0x67e8f9,1); g.fillRect(0,6,5,2);
    g.generateTexture('tex_projectile_dakkerssit',12,8); g.clear();
    // Playing-card skins for Dakkerssit: a fan of cards replaces the ninja blades.
    const drawCardSkin = (weaponKey, projectileKey, neon = false) => {
      const red = neon ? 0xff4fd8 : 0xd52f55;
      const ink = neon ? 0x55f5ff : 0x151827;
      g.fillStyle(0x111827, 1); g.fillRoundedRect(3, 4, 14, 17, 2);
      g.lineStyle(1, ink, 0.9); g.strokeRoundedRect(3, 4, 14, 17, 2);
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(10, 2, 14, 17, 2);
      g.lineStyle(1, red, 1); g.strokeRoundedRect(10, 2, 14, 17, 2);
      g.fillStyle(red, 1); g.fillCircle(14, 7, 2); g.fillCircle(18, 7, 2); g.fillTriangle(12, 8, 20, 8, 16, 14);
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(18, 5, 14, 17, 2);
      g.lineStyle(1, ink, 1); g.strokeRoundedRect(18, 5, 14, 17, 2);
      g.fillStyle(ink, 1); g.fillTriangle(25, 9, 21, 15, 29, 15); g.fillCircle(25, 8, 2);
      g.generateTexture(weaponKey, 36, 24); g.clear();
      g.fillStyle(0xffffff, 1); g.fillRoundedRect(1, 1, 14, 9, 2);
      g.lineStyle(1, red, 1); g.strokeRoundedRect(1, 1, 14, 9, 2);
      g.fillStyle(red, 1); g.fillCircle(5, 4, 1.5); g.fillCircle(8, 4, 1.5); g.fillTriangle(4, 5, 10, 5, 7, 9);
      g.generateTexture(projectileKey, 16, 11); g.clear();
    };
    drawCardSkin('tex_weapon_dakkerssit_cards', 'tex_projectile_dakkerssit_cards');
    drawCardSkin('tex_weapon_dakkerssit_cards_neon', 'tex_projectile_dakkerssit_cards_neon', true);
    // Caran Bitti: the single knife that is thrown.
    g.fillStyle(0x155e75,1); g.fillRect(0,4,7,4); g.fillStyle(0xf97316,1); g.fillRect(1,3,6,2);
    g.fillStyle(0xfbbf24,1); g.fillTriangle(7,3,26,6,7,9); g.lineStyle(1,0x78350f,1); g.strokeTriangle(7,3,26,6,7,9);
    g.generateTexture('tex_weapon_caran_bitti',27,13); g.clear();
    g.fillStyle(0xfbbf24,1); g.fillTriangle(1,3,10,5,1,7); g.fillStyle(0xf97316,1); g.fillRect(0,1,3,2);
    g.generateTexture('tex_projectile_caran_bitti',11,8); g.clear();
    // Realistic-ish weapon sprites (tiny pixel scale)
    // Pistol: slide, grip, barrel port
    g.fillStyle(0x2f2f2f,1); g.fillRect(0,1,9,4); // slide
    g.fillStyle(0x444444,1); g.fillRect(1,2,7,2); // shade
    g.fillStyle(0x1d1d1d,1); g.fillRect(5,0,2,1); // rear sight
    g.fillStyle(0x3a2815,1); g.fillRect(2,4,3,3); // grip
    g.lineStyle(1,0x111111,1); g.strokeRect(0,1,9,4);
    g.generateTexture('tex_weapon_pistol',14,9); g.clear();
    // Minigun: barrel cluster + body + rear handle
    g.fillStyle(0x3a3a3a,1); g.fillRect(0,2,12,4); // body
    g.fillStyle(0x5a5a5a,1); g.fillRect(1,1,10,2);
    // rotating barrel cluster (front)
    g.fillStyle(0x262626,1); g.fillRect(12,1,6,6);
    g.fillStyle(0x6f6f6f,1); for (let i=0;i<3;i++){ g.fillRect(12,1+i*2,6,1); }
    g.fillStyle(0x7a7a7a,1); g.fillRect(3,6,4,2); // under grip
    g.lineStyle(1,0x181818,1); g.strokeRect(0,2,12,4);
    g.generateTexture('tex_weapon_minigun',20,10); g.clear();
    // AK-47: barrel, gas tube, wood stock & handguard, mag curve
    g.fillStyle(0x2e2e2e,1); g.fillRect(0,3,16,2); // barrel
    g.fillStyle(0x3a3a3a,1); g.fillRect(2,2,10,2); // receiver top
    g.fillStyle(0x91552b,1); g.fillRect(3,4,6,3); // handguard
    g.fillStyle(0x874c21,1); g.fillRect(11,2,4,5); // front block
    g.fillStyle(0x91552b,1); g.fillRect(0,2,3,4); // stock base
    g.fillStyle(0x6d3b16,1); g.fillRect(0,2,2,4); // darker edge
    // magazine (slight curve)
    g.fillStyle(0x3a3a3a,1); g.fillRect(6,5,4,4); g.fillRect(6,6,5,3);
    g.lineStyle(1,0x1a1a1a,1); g.strokeRect(0,2,15,5);
    g.generateTexture('tex_weapon_ak47',22,12); g.clear();
    // Sniper rifle: long barrel, scope with highlights, stock
    g.fillStyle(0x303030,1); g.fillRect(0,4,26,3); // barrel/receiver
    g.fillStyle(0x925d2d,1); g.fillRect(2,7,8,3); // fore wood
    g.fillStyle(0x925d2d,1); g.fillRect(0,4,3,6); // stock core
    g.fillStyle(0x6e441c,1); g.fillRect(0,4,2,6); // stock shadow
    // scope
    g.fillStyle(0x242424,1); g.fillRect(6,2,10,3);
    g.fillStyle(0x4a4a4a,1); g.fillRect(7,2,8,2);
    g.fillStyle(0x99c8ff,1); g.fillRect(8,2,2,2); g.fillRect(11,2,2,2);
    g.lineStyle(1,0x161616,1); g.strokeRect(0,4,26,3);
    g.generateTexture('tex_weapon_sniper',28,12); g.clear();
  // Rifle (kivääri) mid-length iron sights (no scope)
  g.fillStyle(0x333333,1); g.fillRect(0,4,20,3); // barrel
  g.fillStyle(0x91552b,1); g.fillRect(1,5,6,3); // handguard wood
  g.fillStyle(0x6d3b16,1); g.fillRect(1,5,2,3); // darker edge
  g.fillStyle(0x91552b,1); g.fillRect(0,4,4,5); // stock
  g.fillStyle(0x6d3b16,1); g.fillRect(0,4,2,5);
  g.fillStyle(0x2b2b2b,1); g.fillRect(7,3,3,2); // rear sight block
  g.fillStyle(0x2b2b2b,1); g.fillRect(16,3,2,2); // front sight
  g.lineStyle(1,0x181818,1); g.strokeRect(0,4,20,3);
  g.generateTexture('tex_weapon_rifle',22,12); g.clear();
    // Bazooka: tube, rear sight, front ring, warhead tip color
    g.fillStyle(0x2a2f2a,1); g.fillRect(0,3,24,4); // tube
    g.fillStyle(0x3c443c,1); g.fillRect(2,2,20,2);
    g.fillStyle(0x556155,1); g.fillRect(2,7,8,2); // shoulder pad
    g.fillStyle(0x444444,1); g.fillRect(20,2,4,6); // nose block
    g.fillStyle(0x88cc44,1); g.fillRect(22,3,2,4); // warhead tip
    g.lineStyle(1,0x161a16,1); g.strokeRect(0,3,24,4);
    g.generateTexture('tex_weapon_bazooka',26,12); g.clear();
    // Knife: blade gradient + handle rivets
    g.fillStyle(0xcfd2d4,1); g.fillRect(0,3,12,3);
    g.fillStyle(0xe8ecee,1); g.fillRect(1,3,10,2);
    g.fillStyle(0x8b5a2b,1); g.fillRect(12,2,4,5); // handle
    g.fillStyle(0x5c3a15,1); g.fillRect(12,2,1,5);
    g.fillStyle(0xffffff,1); g.fillRect(13,3,1,1); g.fillRect(14,4,1,1); // rivets
    g.lineStyle(1,0x777777,1); g.strokeRect(0,3,12,3);
    g.generateTexture('tex_weapon_knife',18,10); g.clear();
    // Baton (Pamppu): cylindrical shading
    g.fillStyle(0x4f3420,1); g.fillRect(0,4,18,3);
    g.fillStyle(0x6d462a,1); g.fillRect(1,4,16,2);
    g.fillStyle(0x2d1d10,1); g.fillRect(0,4,2,3); // shadow end
    g.generateTexture('tex_weapon_baton',22,12); g.clear();
    // Mop: long handle and a wide, glowing cleaning head for the ultimate weapon.
    g.fillStyle(0x8b5a2b, 1); g.fillRect(27, 1, 3, 14);
    g.fillStyle(0xd7e3eb, 1); g.fillRoundedRect(1, 11, 29, 6, 3);
    g.fillStyle(0x7dd3fc, 1); g.fillRect(3, 12, 25, 2);
    g.fillStyle(0xffffff, 0.9); g.fillRect(5, 12, 5, 1); g.fillRect(15, 12, 5, 1);
    g.lineStyle(1, 0x334155, 1); g.strokeRoundedRect(1, 11, 29, 6, 3);
    g.generateTexture('tex_weapon_mop', 34, 19); g.clear();
    // Roller skates: neon boot with two wheels for the nine-block jump dash.
    g.fillStyle(0x1e293b, 1); g.fillRoundedRect(4, 3, 19, 9, 3);
    g.fillStyle(0x5cf5ff, 1); g.fillRect(7, 4, 13, 3);
    g.fillStyle(0xf472b6, 1); g.fillRect(19, 7, 8, 4);
    g.fillStyle(0x111827, 1); g.fillRect(6, 12, 24, 3);
    g.fillStyle(0xffffff, 1); g.fillCircle(9, 16, 3); g.fillCircle(18, 16, 3); g.fillCircle(27, 16, 3);
    g.fillStyle(0x5cf5ff, 1); g.fillCircle(9, 16, 1); g.fillCircle(18, 16, 1); g.fillCircle(27, 16, 1);
    g.lineStyle(1, 0x0f172a, 1); g.strokeRoundedRect(4, 3, 19, 9, 3);
    g.generateTexture('tex_weapon_roller_skates', 34, 20); g.clear();
    g.fillStyle(0x1e293b, 1); g.fillRoundedRect(1, 1, 14, 6, 2);
    g.fillStyle(0x5cf5ff, 1); g.fillRect(3, 2, 9, 2);
    g.fillStyle(0xf472b6, 1); g.fillRect(10, 5, 5, 2);
    g.fillStyle(0xffffff, 1); g.fillCircle(3, 9, 2); g.fillCircle(9, 9, 2); g.fillCircle(15, 9, 2);
    g.fillStyle(0x5cf5ff, 1); g.fillCircle(3, 9, 0.8); g.fillCircle(9, 9, 0.8); g.fillCircle(15, 9, 0.8);
    g.generateTexture('tex_roller_skate_foot', 18, 11); g.clear();
    // Wand (wizard): gem + stick shading
    g.fillStyle(0x7a4d22,1); g.fillRect(0,4,18,2);
    g.fillStyle(0xa56a33,1); g.fillRect(1,4,16,1);
    g.fillStyle(0xffdd66,1); g.fillCircle(18,5,3);
    g.fillStyle(0xfff6aa,1); g.fillCircle(17,4,1.5);
    g.generateTexture('tex_weapon_wand',22,12); g.clear();
    // Flamethrower: tank + nozzle + hose highlight
    g.fillStyle(0x2e2e2e,1); g.fillRect(0,3,16,5); // body
    g.fillStyle(0x444444,1); g.fillRect(1,3,14,3);
    g.fillStyle(0xcc6622,1); g.fillRect(16,2,5,7); // fuel block
    g.fillStyle(0x666666,1); g.fillRect(5,8,7,2); // grip
    g.fillStyle(0xffaa55,1); g.fillRect(18,3,2,3); // pilot
    g.lineStyle(1,0x181818,1); g.strokeRect(0,3,16,5);
    g.generateTexture('tex_weapon_flamer',24,12); g.clear();

  // Wolf texture
  g.fillStyle(0x6d6d6d,1); g.fillRect(0,6,28,10); // body
  g.fillStyle(0x7a7a7a,1); g.fillRect(18,2,10,8); // head
  g.fillStyle(0x222222,1); g.fillRect(23,5,2,2); // eye
  g.fillStyle(0x555555,1); for(let i=0;i<4;i++){ g.fillRect(4+i*5,16,4,4);} // legs
  g.generateTexture('tex_wolf',30,20); g.clear();
  // Fish texture (simple blue fish with tail)
  g.fillStyle(0x3aa0ff,1); g.fillRect(2,5,16,6); // body
  g.fillStyle(0x2b7ccc,1); g.fillRect(16,6,6,4); // tail base
  g.fillStyle(0x2b7ccc,1); g.fillTriangle(22,8, 16,6, 16,10); // tail fin
  g.fillStyle(0xffffff,1); g.fillCircle(6,8,1.5); // eye white
  g.fillStyle(0x000000,1); g.fillCircle(6,8,0.8); // pupil
  g.generateTexture('tex_fish',24,14); g.clear();
  // Bobber texture (red/white float)
  g.fillStyle(0xffffff,1); g.fillCircle(5,6,4);
  g.fillStyle(0xcc3333,1); g.fillRect(1,2,8,4); // top red cap
  g.fillStyle(0x882222,1); g.fillRect(4,0,2,3); // small peg
  g.lineStyle(1,0x222222,0.9); g.strokeCircle(5,6,4);
  g.generateTexture('tex_bobber',10,10); g.clear();
  // Fox texture (orange body, white chest, dark legs)
  g.fillStyle(0xd97a1d,1); g.fillRect(0,6,26,10); // body
  g.fillStyle(0xe08a34,1); g.fillRect(16,2,10,8); // head
  g.fillStyle(0xffffff,1); g.fillRect(2,10,8,4); // chest
  g.fillStyle(0x111111,1); for(let i=0;i<4;i++){ g.fillRect(3+i*5,16,4,4);} // legs
  g.fillStyle(0xffffff,1); g.fillRect(24,8,6,4); // tail tip
  g.fillStyle(0x111111,1); g.fillRect(21,5,2,2); // eye
  g.generateTexture('tex_fox',30,20); g.clear();
  // Flame particle
  g.fillStyle(0xff9933,0.9); g.fillCircle(4,4,4); g.fillStyle(0xffcc66,0.8); g.fillCircle(3,3,2.4);
  g.generateTexture('tex_flame',8,8); g.clear();
  // Laser (galactic mode)
  g.fillStyle(0xff2a2a,1); g.fillRect(0,0,14,3); g.generateTexture('tex_laser',14,3); g.clear();
  // Web pellet (web mode)
  g.fillStyle(0xffffff,1); g.fillCircle(3,3,3); g.generateTexture('tex_web',6,6); g.clear();
  // Ally drone texture
  const dw=22, dh=14; g.fillStyle(0x3b3f48,1); g.fillRoundedRect(2,4,dw-4,dh-6,4);
  g.fillStyle(0x99c8ff,1); g.fillRect(6,6,10,4); // visor
  g.fillStyle(0x5a616d,1); g.fillRect(3,2,6,2); g.fillRect(dw-9,2,6,2); // rotors
  g.lineStyle(2,0x262a30,1); g.strokeRoundedRect(2,4,dw-4,dh-6,4);
  g.generateTexture('tex_drone', dw, dh); g.clear();
  // Specialized ally drones. Their role is also reflected in the color and shape.
  const drawDrone = (key, body, accent, core) => {
    g.fillStyle(body, 1); g.fillRoundedRect(2, 4, 18, 10, 4);
    g.fillStyle(accent, 1); g.fillRect(5, 2, 5, 2); g.fillRect(13, 2, 5, 2);
    g.fillStyle(core, 1); g.fillRoundedRect(6, 7, 10, 4, 1);
    g.fillStyle(0xffffff, 0.85); g.fillRect(8, 8, 2, 1);
    g.lineStyle(1, 0x111827, 1); g.strokeRoundedRect(2, 4, 18, 10, 4);
    g.generateTexture(key, 22, 16); g.clear();
  };
  drawDrone('tex_drone_scout', 0x1e293b, 0x5cf5ff, 0x67e8f9);
  drawDrone('tex_drone_medic', 0x164e3a, 0x7cff8a, 0xffffff);
  drawDrone('tex_drone_tesla', 0x3b2f11, 0xfff27a, 0xffd34e);
  drawDrone('tex_drone_rocket', 0x4a2020, 0xff8a4c, 0xff5a36);
  drawDrone('tex_drone_guardian', 0x17324a, 0xb8f7ff, 0x60a5fa);
  g.fillStyle(0x153f32, 1); g.fillRoundedRect(2, 4, 18, 10, 4);
  g.fillStyle(0xb51f2f, 1); g.fillRect(3, 8, 16, 4);
  g.fillStyle(0xffffff, 1); g.fillRect(7, 9, 8, 1);
  g.fillStyle(0x245f49, 1); g.fillRect(5, 2, 5, 2); g.fillRect(13, 2, 5, 2);
  g.lineStyle(1, 0x081c16, 1); g.strokeRoundedRect(2, 4, 18, 10, 4);
  g.generateTexture('tex_drone_cola', 22, 16); g.clear();
  // Arrow projectile
  g.fillStyle(0x8b5a2b,1); g.fillRect(0,3,10,2); // shaft
  g.fillStyle(0xffffff,1); g.fillRect(10,2,2,4); // tip
  g.fillStyle(0xbfbfbf,1); g.fillRect(0,2,2,4); // fletching block
  g.generateTexture('tex_arrow',12,8); g.clear();
  // Crossbow bolt projectile (shorter, heavier tip)
  g.fillStyle(0x6b4520,1); g.fillRect(0,3,8,2); // shaft
  g.fillStyle(0xffffff,1); g.fillRect(8,2,3,4); // broadhead tip
  g.fillStyle(0x9f9f9f,1); g.fillRect(0,2,2,4); // small fletch
  g.generateTexture('tex_bolt',11,8); g.clear();
  // Bow weapon sprite (draw arc path for the bow limb)
  g.lineStyle(2,0x8b5a2b,1);
  g.beginPath();
  g.arc(6,4,6,-Math.PI/2,Math.PI/2,false);
  g.strokePath();
  // string
  g.fillStyle(0xffffff,1); g.fillRect(1,3,10,2);
  g.generateTexture('tex_weapon_bow',14,8); g.clear();
  // Crossbow weapon sprite (stock + limbs)
  g.fillStyle(0x7b5228,1); g.fillRect(0,3,12,4); // stock
  g.fillStyle(0x915f2f,1); g.fillRect(2,2,8,2); // rail top
  g.fillStyle(0x333333,1); g.fillRect(11,2,3,6); // limbs mount
  g.fillStyle(0x333333,1); g.fillRect(12,1,2,2); g.fillRect(12,7,2,2); // limbs
  g.fillStyle(0xffffff,1); g.fillRect(1,4,10,1); // string
  g.generateTexture('tex_weapon_crossbow',16,10); g.clear();
  // Boomerang weapon + projectile
  g.lineStyle(4,0xb87932,1);
  g.beginPath(); g.moveTo(2,11); g.lineTo(10,3); g.lineTo(20,11); g.strokePath();
  g.lineStyle(2,0xe2b36a,1);
  g.beginPath(); g.moveTo(4,10); g.lineTo(10,5); g.lineTo(18,10); g.strokePath();
  g.generateTexture('tex_weapon_boomerang',24,16); g.clear();
  g.lineStyle(5,0xb87932,1);
  g.beginPath(); g.moveTo(3,14); g.lineTo(13,4); g.lineTo(25,14); g.strokePath();
  g.lineStyle(2,0xffd98a,1);
  g.beginPath(); g.moveTo(6,13); g.lineTo(13,7); g.lineTo(22,13); g.strokePath();
  g.generateTexture('tex_boomerang',28,18); g.clear();

  // All generated boost weapons and their neon projectiles.
  BOOST_WEAPON_SPECS.forEach((spec, index) => {
    const w = 30, h = 16;
    g.fillStyle(0x10182f, 1); g.fillRoundedRect(1, 4, w - 7, 8, 3);
    g.fillStyle(spec.trailColor, 1);
    if (index % 4 === 0) g.fillRect(7, 2, 15, 3);
    if (index % 4 === 1) g.fillTriangle(8, 8, 24, 1, 24, 15);
    if (index % 4 === 2) g.fillRect(4, 1, 5, 14);
    if (index % 4 === 3) g.fillCircle(20, 8, 6);
    g.fillStyle(0xffffff, 0.85); g.fillRect(5, 6, 11, 2);
    g.fillStyle(0x0a1024, 1); g.fillRect(22, 6, 7, 4);
    g.lineStyle(1, spec.trailColor, 1); g.strokeRoundedRect(1, 4, w - 7, 8, 3);
    g.generateTexture(spec.texture, w, h); g.clear();

    if (spec.windBall) {
      g.fillStyle(spec.projectileTint, 0.28); g.fillCircle(9, 9, 8);
      g.fillStyle(spec.projectileTint, 0.9); g.fillCircle(9, 9, 5);
      g.lineStyle(1, 0xffffff, 0.9); g.strokeCircle(9, 9, 7);
      g.lineStyle(2, spec.trailColor, 0.9);
      g.beginPath(); g.arc(9, 9, 5, -2.4, 0.5); g.strokePath();
      g.generateTexture(spec.projectile, 18, 18); g.clear();
    } else {
      g.fillStyle(spec.projectileTint, 1); g.fillRoundedRect(1, 2, 14, 4, 2);
      g.fillStyle(0xffffff, 0.9); g.fillRect(4, 3, 7, 1);
      g.fillStyle(spec.trailColor, 1); g.fillCircle(15, 4, 2);
      g.generateTexture(spec.projectile, 18, 8); g.clear();
    }
  });

  // Tavallisten aseiden rauhalliset, harmaat/ruskeat ikonit.
  const normalWeaponColors = [0x6b7280, 0x8b5a2b, 0x9ca3af, 0x374151, 0x7c5c3b, 0x59636e];
  NORMAL_WEAPON_SPECS.forEach((spec, index) => {
    const w = 36, h = 20;
    const main = normalWeaponColors[index % normalWeaponColors.length];
    const dark = normalWeaponColors[(index + 3) % normalWeaponColors.length];
    g.clear();
    if (spec.kind === 'melee') {
      g.fillStyle(main, 1);
      g.fillTriangle(3, 10, 25, 3, 25, 17);
      g.fillStyle(0xcbd5e1, 0.9);
      g.fillTriangle(7, 10, 23, 5, 23, 10);
      g.fillStyle(dark, 1);
      g.fillRect(24, 7, 8, 6);
      g.fillStyle(0x9a6a3a, 1);
      g.fillRect(29, 6, 5, 8);
      g.lineStyle(1, 0x1f2937, 1);
      g.beginPath();
      g.moveTo(3, 10); g.lineTo(25, 3); g.lineTo(25, 17); g.closePath();
      g.strokePath();
    } else {
      g.fillStyle(dark, 1);
      g.fillRect(2, 6, 25, 8);
      g.fillStyle(main, 1);
      g.fillRect(5, 4, 18, 5);
      g.fillRect(24, 7, 10, 4);
      g.fillStyle(0x9a6a3a, 1);
      g.fillRect(7, 14, 7, 5);
      g.lineStyle(1, 0x1f2937, 1);
      g.strokeRect(2, 6, 25, 8);
    }
    g.generateTexture(spec.texture, w, h);
  });
  g.clear();

  // Mine red dot
  g.fillStyle(0xff2222,1); g.fillCircle(4,4,3.2); g.lineStyle(1,0xaa0000,1); g.strokeCircle(4,4,3.2);
  g.generateTexture('tex_mine',8,8); g.clear();

  // Rocket texture (for bazooka)
  g.fillStyle(0x777777,1); g.fillRect(0,0,12,4);
  g.fillStyle(0xdd3333,1); g.fillRect(10,0,2,4);
  g.lineStyle(1,0x333333,1); g.strokeRect(0,0,12,4);
  g.generateTexture('tex_rocket',12,4); g.clear();

  // (Hemuli removed)
  // Oppo (jumper) texture
  g.fillStyle(0x884488,1); g.fillRoundedRect(2,6,24,18,6); // body
  g.fillStyle(0xffffff,1); g.fillCircle(10,12,2); g.fillCircle(18,12,2); // eyes
  g.fillStyle(0x222222,1); g.fillCircle(10,12,1); g.fillCircle(18,12,1); // pupils
  g.fillStyle(0x333333,1); g.fillRect(4,22,8,2); g.fillRect(16,22,8,2); // feet
  g.generateTexture('tex_oppo', 28, 26); g.clear();

  // Grenade texture (pin + body)
  g.fillStyle(0x2f2f2f,1); g.fillCircle(8,8,8); g.fillStyle(0x5a5a5a,1); g.fillRect(6,0,4,6);
  g.lineStyle(2,0x1b1b1b,1); g.strokeCircle(8,8,8);
  g.generateTexture('tex_grenade',16,16); g.clear();

  // TNT block (used by the TNT boost weapon)
  g.fillStyle(0xc9362f, 1); g.fillRoundedRect(1, 2, 18, 14, 3);
  g.fillStyle(0xf4d35e, 1); g.fillRect(1, 6, 18, 4);
  g.fillStyle(0x7d1e1b, 1); g.fillRect(5, 7, 2, 2); g.fillRect(13, 7, 2, 2);
  g.lineStyle(1, 0x4a1110, 1); g.strokeRoundedRect(1, 2, 18, 14, 3);
  g.fillStyle(0x2f2f2f, 1); g.fillRect(8, 0, 4, 3);
  g.lineStyle(1, 0xf2a33a, 1); g.strokeLineShape(new Phaser.Geom.Line(10, 1, 14, 0));
  g.generateTexture('tex_tnt', 20, 18); g.clear();

  // Coca-Cola bottle skin for TNT (glass bottle, red label and white shine).
  g.fillStyle(0x153f32, 0.95); g.fillRoundedRect(5, 5, 12, 18, 4);
  g.fillStyle(0x245f49, 1); g.fillRect(8, 1, 6, 6);
  g.fillStyle(0xb51f2f, 1); g.fillRect(5, 11, 12, 6);
  g.fillStyle(0xffffff, 0.95); g.fillRect(7, 13, 8, 1); g.fillRect(9, 15, 4, 1);
  g.lineStyle(1, 0x081c16, 1); g.strokeRoundedRect(5, 5, 12, 18, 4);
  g.lineStyle(1, 0x9fffe0, 0.75); g.strokeLineShape(new Phaser.Geom.Line(7, 7, 7, 18));
  g.generateTexture('tex_tnt_cola', 22, 25); g.clear();

  // Extra TNT skins: shiny gold and bright neon blocks.
  g.fillStyle(0xffc928, 1); g.fillRoundedRect(1, 2, 18, 14, 3);
  g.fillStyle(0xfff1a8, 1); g.fillRect(1, 6, 18, 4);
  g.fillStyle(0x7c4a00, 1); g.fillRect(5, 7, 2, 2); g.fillRect(13, 7, 2, 2);
  g.lineStyle(1, 0x6d4300, 1); g.strokeRoundedRect(1, 2, 18, 14, 3);
  g.generateTexture('tex_tnt_gold', 20, 18); g.clear();
  g.fillStyle(0xff35d1, 1); g.fillRoundedRect(1, 2, 18, 14, 3);
  g.fillStyle(0x5cf5ff, 1); g.fillRect(1, 6, 18, 4);
  g.fillStyle(0x24104a, 1); g.fillRect(5, 7, 2, 2); g.fillRect(13, 7, 2, 2);
  g.lineStyle(1, 0x5712a0, 1); g.strokeRoundedRect(1, 2, 18, 14, 3);
  g.generateTexture('tex_tnt_neon', 20, 18); g.clear();

  // Nuke icon (radiation trefoil)
  g.fillStyle(0x222222,1); g.fillCircle(8,8,7);
  g.fillStyle(0xffe94d,1);
  // three wedges
  const drawWedge=(a)=>{ g.beginPath(); g.moveTo(8,8); const r=6; g.arc(8,8,r,Phaser.Math.DegToRad(a-22),Phaser.Math.DegToRad(a+22)); g.closePath(); g.fillPath(); };
  drawWedge(-90); drawWedge(30); drawWedge(150);
  g.fillStyle(0x222222,1); g.fillCircle(8,8,2.2);
  g.generateTexture('tex_nuke',16,16); g.clear();

  // Plane icon (simple silhouette)
  g.fillStyle(0xffffff,1);
  g.beginPath(); g.moveTo(1,9); g.lineTo(15,9); g.lineTo(10,6); g.lineTo(10,3); g.lineTo(6,6); g.lineTo(1,9); g.closePath(); g.fillPath();
  g.generateTexture('tex_plane',16,16); g.clear();

  // Large airship interior tiles: the player can walk on the deck and under the ceiling.
  g.fillStyle(0x26364a, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0x4b6680, 0.55); g.fillRect(0, 4, TILE, 5); g.fillRect(0, 29, TILE, 4);
  g.lineStyle(2, 0x111c2b, 1); g.strokeRect(0, 0, TILE, TILE);
  g.fillStyle(0xb8d4e8, 0.75); g.fillCircle(8, 20, 2); g.fillCircle(32, 20, 2);
  g.generateTexture('tex_airship_floor', TILE, TILE); g.clear();
  g.fillStyle(0x713f2a, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0xd38b51, 0.55); g.fillRect(4, 5, TILE - 8, 5); g.fillRect(4, 30, TILE - 8, 5);
  g.lineStyle(2, 0x321b19, 1); g.strokeRect(0, 0, TILE, TILE);
  g.fillStyle(0xf6c37a, 0.8); g.fillCircle(8, 20, 2); g.fillCircle(32, 20, 2);
  g.generateTexture('tex_airship_wall', TILE, TILE); g.clear();

  // Hook head texture
  g.fillStyle(0xffffff,1); g.fillCircle(6,6,6); g.lineStyle(2,0x444444,1); g.strokeCircle(6,6,6);
  g.generateTexture('tex_hook',12,12); g.clear();

  // Moped base (gray chassis + wheels), body color applied dynamically
  g.fillStyle(0x333333,1); g.fillRect(2,10,26,8);
  g.fillStyle(0x000000,1); g.fillCircle(8,20,6); g.fillCircle(22,20,6);
  g.lineStyle(2,0x111111,1); g.strokeCircle(8,20,6); g.strokeCircle(22,20,6);
  g.generateTexture('tex_moped_base',32,26); g.clear();
  // Slime cloner device texture
  g.fillStyle(0x2a2a2a,1); g.fillRoundedRect(4,6,TILE-8,TILE-12,6);
  g.lineStyle(2,0x111111,1); g.strokeRoundedRect(4,6,TILE-8,TILE-12,6);
  g.fillStyle(0x55ff77,1); g.fillCircle(TILE/2, TILE/2, 6);
  g.lineStyle(2,0x228844,1); g.strokeCircle(TILE/2, TILE/2, 6);
  g.generateTexture('tex_slimecloner', TILE, TILE); g.clear();
  // Soldier cloner device texture (green military style)
  g.fillStyle(0x2b3a2b,1); g.fillRoundedRect(4,6,TILE-8,TILE-12,6);
  g.lineStyle(2,0x152015,1); g.strokeRoundedRect(4,6,TILE-8,TILE-12,6);
  g.fillStyle(0x55aa44,1); g.fillRect(TILE/2-8, TILE/2-3, 16, 6);
  g.fillStyle(0x77cc66,1); g.fillCircle(TILE/2, TILE/2, 4);
  g.lineStyle(2,0x2a6622,1); g.strokeCircle(TILE/2, TILE/2, 4);
  g.generateTexture('tex_soldiercloner', TILE, TILE); g.clear();
  // Teleport textures (colored rings)
  const makePortal = (name, color)=>{
    g.clear();
    g.lineStyle(4, color, 1);
    g.strokeCircle(TILE/2, TILE/2, TILE*0.38);
    g.lineStyle(2, color, 0.4);
    g.strokeCircle(TILE/2, TILE/2, TILE*0.26);
    g.fillStyle(0x000000, 0.2);
    g.fillCircle(TILE/2, TILE/2, TILE*0.36);
    g.generateTexture(name, TILE, TILE);
  };
  makePortal('tex_portal_blue', 0x4aa3ff);
  makePortal('tex_portal_red', 0xff4a4a);
  makePortal('tex_portal_green', 0x59d659);
  makePortal('tex_portal_yellow', 0xffd34a);
  // Lightning rod (Ukonjohdatin) texture (tile-sized)
  g.clear();
  // base
  g.fillStyle(0x9a9a9a,1); g.fillRect(TILE/2-12, TILE-8, 24, 6);
  g.lineStyle(2,0x666666,1); g.strokeRect(TILE/2-12, TILE-8, 24, 6);
  // pole
  g.fillStyle(0xbfbfbf,1); g.fillRect(TILE/2-3, TILE-26, 6, 20);
  g.lineStyle(2,0x7a7a7a,1); g.strokeRect(TILE/2-3, TILE-26, 6, 20);
  // tip cap
  g.fillStyle(0xffee88,1); g.fillRect(TILE/2-5, TILE-30, 10, 6);
  g.generateTexture('tex_rod', TILE, TILE); g.clear();

  // Lightning bolt segment (8 x TILE), to be stretched vertically
  g.fillStyle(0xffff66,1);
  // simple zig-zag rectangles
  const segH = Math.max(6, Math.floor(TILE/6));
  g.fillRect(2,0,4,segH);
  g.fillRect(0,segH,4,segH);
  g.fillRect(2,segH*2,4,segH);
  g.fillRect(4,segH*3,4,segH);
  g.fillRect(2,segH*4,4,segH);
  g.fillRect(0,segH*5,4,segH);
  g.generateTexture('tex_lightning', 8, TILE); g.clear();
  // Decal icons
  // skull
  g.fillStyle(0xffffff,1); g.fillCircle(3,3,2.2); g.fillRect(1.2,4.5,3.6,2); g.fillStyle(0x000000,1); g.fillCircle(2.3,2.8,0.5); g.fillCircle(3.7,2.8,0.5);
  g.generateTexture('tex_decal_skull',6,7); g.clear();
  // pistol silhouette (simple L shape)
  g.fillStyle(0xffffff,1); g.fillRect(0,2,6,2); g.fillRect(2,4,2,3);
  g.generateTexture('tex_decal_pistol',6,7); g.clear();
  // triangle
  g.fillStyle(0xffffff,1); g.beginPath(); g.moveTo(3,0); g.lineTo(6,6); g.lineTo(0,6); g.closePath(); g.fillPath();
  g.generateTexture('tex_decal_triangle',6,7); g.clear();
  // square
  g.fillStyle(0xffffff,1); g.fillRect(0,0,6,6); g.generateTexture('tex_decal_square',6,6); g.clear();

  // Cannon base and barrel textures (placeable)
  g.fillStyle(0x6e6e6e,1); g.fillRoundedRect(0,0,32,20,5); g.lineStyle(2,0x4a4a4a,1); g.strokeRoundedRect(0,0,32,20,5); g.generateTexture('tex_cannon_base',32,20); g.clear();
  g.fillStyle(0x4a4a4a,1); g.fillRect(0,0,26,8); g.lineStyle(2,0x2e2e2e,1); g.strokeRect(0,0,26,8); g.generateTexture('tex_cannon_barrel',26,8); g.clear();
  // Animal textures
  // Pig
  g.fillStyle(0xff99aa,1); g.fillRect(0,6,24,12);
  g.fillStyle(0xffb5c1,1); g.fillRect(18,2,8,8);
  g.fillStyle(0x000000,1); g.fillRect(22,5,2,2);
  g.fillStyle(0x443322,1); g.fillRect(4,18,4,4); g.fillRect(14,18,4,4);
  g.generateTexture('tex_pig',28,22); g.clear();
  // Chicken
  g.fillStyle(0xffffff,1); g.fillRect(0,8,18,10);
  g.fillStyle(0xffffaa,1); g.fillRect(14,4,6,6);
  g.fillStyle(0xff3333,1); g.fillRect(16,2,2,2);
  g.fillStyle(0x000000,1); g.fillRect(18,6,1,1);
  g.fillStyle(0xffaa00,1); g.fillRect(2,18,2,4); g.fillRect(8,18,2,4);
  g.generateTexture('tex_chicken',22,22); g.clear();
  // Cow
  g.fillStyle(0x8b6f4f,1); g.fillRect(0,6,28,14);
  g.fillStyle(0xa88664,1); g.fillRect(20,2,10,8);
  g.fillStyle(0x000000,1); g.fillRect(24,5,2,2);
  g.fillStyle(0x5a4632,1); g.fillRect(6,18,4,4); g.fillRect(16,18,4,4);
  g.generateTexture('tex_cow',32,22); g.clear();
  // Polar bear (snow biome animal)
  g.fillStyle(0xf8fbff,1); g.fillRect(0,6,28,12);
  g.fillStyle(0xe7f3ff,1); g.fillRect(18,4,10,8);
  g.fillStyle(0x000000,1); g.fillRect(24,7,2,2);
  g.fillStyle(0xddeaf7,1); g.fillRect(6,18,5,4); g.fillRect(16,18,5,4);
  g.generateTexture('tex_polarbear',32,22); g.clear();
  // Special rideable hawk: two wing poses for flapping
  const drawSpecialHawk = (key, wingUp)=>{
    g.clear();
    g.fillStyle(0xe8d6b8,1);
    if (wingUp) {
      g.fillTriangle(35,25,4,4,18,32);
      g.fillTriangle(51,25,96,4,82,34);
    } else {
      g.fillTriangle(34,28,2,48,25,38);
      g.fillTriangle(52,28,100,50,76,38);
    }
    g.fillStyle(0x6a5239,1);
    if (wingUp) {
      g.fillTriangle(35,25,14,12,22,28);
      g.fillTriangle(51,25,84,12,76,29);
    } else {
      g.fillTriangle(34,29,16,42,27,36);
      g.fillTriangle(52,29,82,42,74,36);
    }
    g.fillStyle(0x8b7355,1); g.fillEllipse(44,30,38,20);
    g.fillStyle(0x5f4a32,1); g.fillEllipse(64,25,20,15);
    g.fillStyle(0xf3e1c4,1); g.fillEllipse(68,28,10,6);
    g.fillStyle(0xffc84a,1); g.fillTriangle(75,25,92,29,75,33);
    g.fillStyle(0x111111,1); g.fillCircle(69,23,2);
    g.fillStyle(0x3b2a1b,1); g.fillTriangle(20,30,6,24,8,36);
    g.fillStyle(0xffc84a,1); g.fillRect(36,39,4,10); g.fillRect(48,39,4,10);
    g.fillStyle(0x3b2a1b,1); g.fillRect(34,48,8,2); g.fillRect(46,48,8,2);
    g.generateTexture(key, 104, 58);
  };
  drawSpecialHawk('tex_special_hawk_0', true);
  drawSpecialHawk('tex_special_hawk_1', false);
  g.clear();

  const drawSuperHawk = (key, wingUp)=>{
    g.clear();
    g.fillStyle(0xfff0a8,0.96);
    if (wingUp) {
      g.fillTriangle(48,28,3,0,20,42);
      g.fillTriangle(72,28,146,0,122,44);
    } else {
      g.fillTriangle(47,32,0,66,31,50);
      g.fillTriangle(73,32,150,70,114,50);
    }
    g.fillStyle(0xffc33d,0.92);
    if (wingUp) {
      g.fillTriangle(48,29,18,10,29,38);
      g.fillTriangle(72,29,120,10,110,39);
    } else {
      g.fillTriangle(47,33,22,55,34,46);
      g.fillTriangle(73,33,115,56,103,46);
    }
    g.fillStyle(0xd97817,1); g.fillEllipse(61,36,58,26);
    g.fillStyle(0xffa51f,1); g.fillEllipse(88,30,28,20);
    g.fillStyle(0xfff6cc,1); g.fillEllipse(93,34,14,8);
    g.fillStyle(0xffe66d,1); g.fillTriangle(103,29,134,36,104,43);
    g.fillStyle(0x111111,1); g.fillCircle(94,27,2.8);
    g.fillStyle(0x7a3512,1); g.fillTriangle(32,36,6,25,9,49);
    g.fillStyle(0xffe66d,1); g.fillRect(52,47,5,13); g.fillRect(68,47,5,13);
    g.fillStyle(0x7a3512,1); g.fillRect(49,59,11,3); g.fillRect(65,59,11,3);
    g.lineStyle(3, 0xfff6cc, 0.9);
    g.strokeCircle(60, 36, wingUp ? 34 : 30);
    g.generateTexture(key, 154, 78);
  };
  drawSuperHawk('tex_super_hawk_0', true);
  drawSuperHawk('tex_super_hawk_1', false);
  this.generateGeneratedSuperAnimalTextures(g);
  g.clear();

  // Special rideable dragon: two wing poses for slower, heavier flapping
  const drawSpecialDragon = (key, wingUp)=>{
    g.clear();
    g.fillStyle(0xbce0cf,1);
    if (wingUp) {
      g.fillTriangle(56,36,28,4,44,42);
      g.fillTriangle(82,35,118,4,104,43);
    } else {
      g.fillTriangle(55,39,22,66,48,50);
      g.fillTriangle(83,39,126,66,101,50);
    }
    g.fillStyle(0x2f6d5c,1);
    if (wingUp) {
      g.fillTriangle(56,36,36,16,46,38);
      g.fillTriangle(82,35,108,16,100,39);
    } else {
      g.fillTriangle(55,40,34,58,49,49);
      g.fillTriangle(83,40,111,58,99,49);
    }
    g.fillStyle(0x3f8f78,1); g.fillRoundedRect(22,38,82,24,10);
    g.fillStyle(0x5db69d,1); g.fillRoundedRect(92,28,38,25,9);
    g.fillStyle(0x2f6d5c,1); g.fillTriangle(22,49,2,34,3,66);
    g.fillStyle(0xbce0cf,1); g.fillRect(36,61,8,14); g.fillRect(76,61,8,14);
    g.fillStyle(0x2f6d5c,1); g.fillRect(34,73,14,4); g.fillRect(74,73,14,4);
    g.fillStyle(0xff715e,1); g.fillTriangle(100,25,104,10,110,27); g.fillTriangle(116,25,128,14,125,33);
    g.fillStyle(0xf6f0d0,1); g.fillTriangle(125,41,142,37,126,48);
    g.fillStyle(0x111111,1); g.fillCircle(112,36,2.2);
    g.fillStyle(0x2f6d5c,1);
    for (let x=38; x<=88; x+=12) g.fillTriangle(x,38,x+5,28,x+10,38);
    g.generateTexture(key, 150, 86);
  };
  drawSpecialDragon('tex_special_dragon_0', true);
  drawSpecialDragon('tex_special_dragon_1', false);
  g.clear();

  // Special rideable big wolf: two stride poses
  const drawSpecialDirewolf = (key, stride)=>{
    g.clear();
    g.fillStyle(0x26313a,1); g.fillEllipse(60,46,84,34);
    g.fillStyle(0x4e5962,1); g.fillRoundedRect(24,30,74,32,13);
    g.fillStyle(0x5d6872,1); g.fillRoundedRect(84,18,34,28,10);
    g.fillStyle(0xb8c5cc,1); g.fillEllipse(96,42,26,10);
    g.fillStyle(0x1b2025,1); g.fillTriangle(88,19,94,2,101,22); g.fillTriangle(108,18,119,4,116,28);
    g.fillStyle(0xd8e3e8,1); g.fillTriangle(118,32,136,37,118,42);
    g.fillStyle(0x111111,1); g.fillCircle(105,29,2.2);
    g.fillStyle(0x2f3942,1); g.fillTriangle(24,42,2,26,6,54);
    g.fillStyle(0x4e5962,1);
    if (stride) {
      g.fillRect(34,58,9,24); g.fillRect(54,56,9,18); g.fillRect(75,58,9,24); g.fillRect(91,55,9,20);
      g.fillStyle(0x1b2025,1); g.fillRect(30,80,18,5); g.fillRect(52,72,16,5); g.fillRect(72,80,18,5); g.fillRect(88,73,18,5);
    } else {
      g.fillRect(34,56,9,18); g.fillRect(54,58,9,24); g.fillRect(75,55,9,20); g.fillRect(91,58,9,24);
      g.fillStyle(0x1b2025,1); g.fillRect(30,72,18,5); g.fillRect(52,80,16,5); g.fillRect(72,73,18,5); g.fillRect(88,80,18,5);
    }
    g.fillStyle(0xe8f0f2,0.9); g.fillEllipse(92,32,8,4);
    g.generateTexture(key, 142, 90);
  };
  drawSpecialDirewolf('tex_special_direwolf_0', false);
  drawSpecialDirewolf('tex_special_direwolf_1', true);
  g.clear();

  // Special rideable water serpent: two wave poses, built for flying and swimming.
  const drawSpecialWaterSerpent = (key, wave)=>{
    g.clear();
    g.fillStyle(0x82dfff,0.75);
    g.fillTriangle(36,44,8,18,22,54);
    g.fillTriangle(82,38,112,14,100,54);
    g.fillStyle(0x164e75,1);
    const segments = [
      { x: 24, y: wave ? 44 : 38, w: 34, h: 22 },
      { x: 50, y: wave ? 35 : 45, w: 38, h: 24 },
      { x: 78, y: wave ? 43 : 36, w: 40, h: 24 },
      { x: 110, y: wave ? 34 : 42, w: 38, h: 23 }
    ];
    for (const part of segments) {
      g.fillStyle(0x2e9fc4,1); g.fillEllipse(part.x, part.y, part.w, part.h);
      g.fillStyle(0x9ee8ff,0.9); g.fillEllipse(part.x, part.y+5, part.w*0.55, part.h*0.42);
      g.fillStyle(0x1a7198,1); g.fillCircle(part.x-8, part.y-7, 3);
    }
    g.fillStyle(0x36b8d6,1); g.fillRoundedRect(108, wave ? 22 : 28, 42, 27, 12);
    g.fillStyle(0x9ee8ff,1); g.fillEllipse(124, wave ? 46 : 51, 24, 9);
    g.fillStyle(0xd8fbff,1); g.fillTriangle(148, wave ? 34 : 40, 166, wave ? 30 : 36, 150, wave ? 44 : 50);
    g.fillStyle(0x071820,1); g.fillCircle(132, wave ? 31 : 37, 2.4);
    g.fillStyle(0x164e75,1);
    for (let x=44; x<=104; x+=16) g.fillTriangle(x, wave ? 29 : 34, x+6, wave ? 17 : 22, x+12, wave ? 31 : 36);
    g.fillStyle(0x82dfff,0.85);
    g.fillTriangle(20, wave ? 45 : 38, 0, wave ? 24 : 54, 5, wave ? 58 : 24);
    g.generateTexture(key, 172, 72);
  };
  drawSpecialWaterSerpent('tex_special_water_serpent_0', false);
  drawSpecialWaterSerpent('tex_special_water_serpent_1', true);
  g.clear();

  const drawMegaBird = (key, pose, primary, secondary, accent)=>{
    g.clear();
    g.fillStyle(secondary, 0.9);
    if (pose) {
      g.fillTriangle(58,34,8,4,30,48);
      g.fillTriangle(88,34,154,4,126,50);
    } else {
      g.fillTriangle(56,38,4,66,34,52);
      g.fillTriangle(90,38,160,68,122,52);
    }
    g.fillStyle(primary,1); g.fillEllipse(74,40,64,28);
    g.fillStyle(primary,1); g.fillRoundedRect(96,26,38,28,10);
    g.fillStyle(accent,1); g.fillTriangle(130,36,158,42,130,48);
    g.fillStyle(0x101820,1); g.fillCircle(119,34,2.5);
    g.lineStyle(3, accent, 0.9); g.strokeLineShape(new Phaser.Geom.Line(42,18,54,0)); g.strokeLineShape(new Phaser.Geom.Line(52,22,70,4));
    g.fillStyle(accent,0.85); g.fillCircle(48,18,4); g.fillCircle(68,9,4);
    g.generateTexture(key, 166, 74);
  };
  drawMegaBird('tex_mega_storm_eagle_0', false, 0x314d79, 0xaed8ff, 0xffef6b);
  drawMegaBird('tex_mega_storm_eagle_1', true, 0x314d79, 0xaed8ff, 0xffef6b);
  drawMegaBird('tex_mega_death_bird_0', false, 0x16121c, 0x6f1d45, 0xff2f5f);
  drawMegaBird('tex_mega_death_bird_1', true, 0x16121c, 0x6f1d45, 0xff2f5f);

  const drawMegaRunner = (key, pose, primary, secondary, accent, mane=false)=>{
    g.clear();
    g.fillStyle(primary,1); g.fillRoundedRect(18,34,90,34,13);
    g.fillStyle(primary,1); g.fillRoundedRect(94,22,42,34,12);
    g.fillStyle(secondary,1); g.fillEllipse(108,55,42,12);
    if (mane) {
      g.fillStyle(secondary,1);
      for (let i=0;i<7;i++) g.fillTriangle(88+i*7,28,94+i*7,8+(i%2)*7,101+i*7,31);
    }
    g.fillStyle(accent,1); g.fillTriangle(134,38,158,42,134,49);
    g.fillStyle(0x111111,1); g.fillCircle(123,34,2.5);
    g.fillStyle(primary,1);
    if (pose) {
      g.fillRect(34,62,10,24); g.fillRect(62,58,10,18); g.fillRect(86,62,10,24); g.fillRect(104,58,10,18);
    } else {
      g.fillRect(34,58,10,18); g.fillRect(62,62,10,24); g.fillRect(86,58,10,18); g.fillRect(104,62,10,24);
    }
    g.fillStyle(accent,1); g.fillTriangle(20,45,0,30,4,62);
    g.fillStyle(secondary,0.85); g.fillCircle(50,34,5); g.fillCircle(67,32,4);
    g.generateTexture(key, 164, 92);
  };
  drawMegaRunner('tex_mega_fire_lion_0', false, 0xd85a2a, 0xffc057, 0x5c1b0e, true);
  drawMegaRunner('tex_mega_fire_lion_1', true, 0xd85a2a, 0xffc057, 0x5c1b0e, true);
  drawMegaRunner('tex_mega_shadow_panther_0', false, 0x1c2029, 0x6f7aff, 0xbad2ff, false);
  drawMegaRunner('tex_mega_shadow_panther_1', true, 0x1c2029, 0x6f7aff, 0xbad2ff, false);

  const drawMegaTank = (key, pose, primary, secondary, accent, horn=false)=>{
    g.clear();
    g.fillStyle(primary,1); g.fillRoundedRect(16,34,104,38,15);
    g.fillStyle(primary,1); g.fillRoundedRect(104,24,44,34,12);
    g.fillStyle(secondary,1); g.fillEllipse(72,45,70,14);
    g.fillStyle(accent,1);
    if (horn) g.fillTriangle(146,38,174,33,148,47);
    else g.fillTriangle(119,23,130,7,139,26);
    g.fillStyle(0x111111,1); g.fillCircle(132,35,2.5);
    g.fillStyle(primary,1);
    if (pose) {
      g.fillRect(34,66,13,24); g.fillRect(66,62,13,18); g.fillRect(94,66,13,24); g.fillRect(116,62,13,18);
    } else {
      g.fillRect(34,62,13,18); g.fillRect(66,66,13,24); g.fillRect(94,62,13,18); g.fillRect(116,66,13,24);
    }
    g.fillStyle(accent,0.8);
    for (let x=38; x<=102; x+=16) g.fillTriangle(x,34,x+7,22,x+14,34);
    g.generateTexture(key, 180, 96);
  };
  drawMegaTank('tex_mega_ice_bear_0', false, 0xdff6ff, 0x7fc8e8, 0x24516b, false);
  drawMegaTank('tex_mega_ice_bear_1', true, 0xdff6ff, 0x7fc8e8, 0x24516b, false);
  drawMegaTank('tex_mega_stone_rhino_0', false, 0x6f7378, 0xb9c0c5, 0xe7edf2, true);
  drawMegaTank('tex_mega_stone_rhino_1', true, 0x6f7378, 0xb9c0c5, 0xe7edf2, true);

  const drawMegaWhale = (key, pose)=>{
    g.clear();
    g.fillStyle(0x6bb7d8,1); g.fillEllipse(88,48,138,48);
    g.fillStyle(0xd8f5ff,1); g.fillEllipse(100,61,96,20);
    g.fillStyle(0x4d94bc,1); g.fillTriangle(18,47,0,22,0,74);
    g.fillStyle(0x8edcff,0.9);
    g.fillTriangle(72,39,40,pose?10:20,62,48);
    g.fillTriangle(114,39,154,pose?10:20,127,49);
    g.fillStyle(0x11222e,1); g.fillCircle(132,39,2.8);
    g.fillStyle(0xffffff,0.85);
    for (let i=0;i<4;i++) g.fillCircle(68+i*14, pose ? 25-i*2 : 24+i*2, 3);
    g.generateTexture(key, 172, 92);
  };
  drawMegaWhale('tex_mega_sky_whale_0', false);
  drawMegaWhale('tex_mega_sky_whale_1', true);
  g.clear();
  this.generateBattleAnimalTextures(g);
  // Meat item
  g.fillStyle(0xaa3b2f,1); g.fillRect(2,2,12,8); g.fillStyle(0xffcbbd,1); g.fillRect(12,3,2,6); g.generateTexture('tex_meat',16,12); g.clear();
  
  // Dog texture
  const dogW = 28, dogH = 20;
  // body
  g.fillStyle(0xcc9966, 1); g.fillRoundedRect(0, 6, 20, 12, 4);
  // head
  g.fillStyle(0xcc9966, 1); g.fillRoundedRect(16, 2, 12, 11, 3);
  // eye
  g.fillStyle(0x000000, 1); g.fillCircle(24, 5, 1.5);
  // ear
  g.fillStyle(0x8b5a2b, 1); g.fillRoundedRect(18, 2, 5, 4, 1);
  // legs
  g.fillStyle(0xcc9966, 1); g.fillRect(2, 14, 4, 6); g.fillRect(14, 14, 4, 6);
  // tail
  g.fillStyle(0xb38654, 1); g.fillRect(0, 8, 3, 2);
  g.generateTexture('tex_dog', dogW, dogH); g.clear();
  
  }

  create() {
    this.blocks = new Map();
    this.decor = this.add.group();

    // Static platforms group
    this.platforms = this.physics.add.staticGroup();

    // Load saved state and settings
    this.loadState();
    this.loadAppearanceSettings();

    // Groups
    this.pickups = this.physics.add.group();
    this.items = this.physics.add.group();
  this.birds = this.physics.add.group({ allowGravity: false });
  this.slimes = this.physics.add.group();
  this.zombies = this.physics.add.group();
  this.bosses = this.physics.add.group();
  this.bullets = this.physics.add.group({ allowGravity: false });
  this.soldiers = this.physics.add.group();
  this.enemySoldiers = this.physics.add.group();
  this.drones = this.physics.add.group({ allowGravity: false });
  this.wolves = this.physics.add.group();
  this.physics.add.collider(this.wolves, this.platforms);
  // Fishes (swim in water)
  this.fishes = this.physics.add.group({ allowGravity: false });
  // Neutral animals
  this.animals = this.physics.add.group();
  this.physics.add.collider(this.animals, this.platforms);
    // Tanks group
    this.tanks = this.physics.add.group();
    this.physics.add.collider(this.tanks, this.platforms);
  // Enemy: Oppo group (ground jumper)
  this.oppos = this.physics.add.group();
  this.portalsGroup = this.physics.add.staticGroup();
    this.physics.add.overlap(this.bullets, this.portalsGroup, (bullet, zone)=>{
      try { bullet?.destroy(); } catch(e) {}
      const tx = zone?.getData('tx'); const ty = zone?.getData('ty');
      if (typeof tx === 'number' && typeof ty === 'number') this.removePortalAt(tx, ty);
    });
    this.waters = this.add.group();
  this.clones = this.physics.add.group();

  // Create Dog
  this.dog = this.physics.add.sprite(100, 100, 'tex_dog'); // will handle pos later
  this.dog.setCollideWorldBounds(true);
  this.dog.setBounce(0.1);
  this.dog.body.setSize(20, 12).setOffset(4, 6);
  this.physics.add.collider(this.dog, this.platforms);
  this.dog.setActive(true).setVisible(true); // Starts active/visible
  this.physics.add.overlap(this.dog, this.pickups, this.onDogPickup, null, this);
  // Dog interaction
  this.dog.setInteractive();
  this.dog.on('pointerdown', (pointer) => {
      // Allow interaction even if inactive to wake up
      if (pointer.rightButtonDown()) {
          this.toggleDogActive();
      } else {
          // Left click: Pause & Menu
          this.pauseGame();
          this.showDogMenu();
      }
  });

  // Rope graphics
  this.hookGfx = this.add.graphics();
  this.vineGfx = this.add.graphics();
  // Cannon aim graphics (for tarkka mode)
  this.cannonAimGfx = this.add.graphics();
  // Fishing line graphics
  this.fishingGfx = this.add.graphics();

    // Initialize endless world (generate starting chunks around x=0)
    this.initInfiniteWorld();

    // Player (use dynamic texture, generated below)
    this.updatePlayerAppearance();
    this.player = this.physics.add.sprite(100, 100, 'tex_player_dyn');
    this.player.setBounce(0.06);
    this.player.body.setSize(20, 34).setOffset(4, 2);
    // Portals can request a safe landing tile when switching worlds.
    try {
      const rawSpawn = localStorage.getItem('UAG_mapSpawn');
      if (rawSpawn) {
        const spawn = JSON.parse(rawSpawn);
        if (Number.isFinite(spawn?.tx) && Number.isFinite(spawn?.ty)) {
          this.player.setPosition(spawn.tx * TILE + TILE / 2, spawn.ty * TILE + TILE / 2);
        }
        localStorage.removeItem('UAG_mapSpawn');
      }
    } catch(e) {}
    this.armorSprite = this.add.image(this.player.x, this.player.y, 'tex_armor_storm_armor')
      .setDepth(5)
      .setVisible(false)
      .setAlpha(0.92);
    this.updateBoostArmorVisual();
    this.setupMultiplayer();

  // Colliders/overlaps
  this.col_player_platforms = this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.slimes, this.platforms);
  this.physics.add.collider(this.oppos, this.platforms);
    this.physics.add.collider(this.bullets, this.platforms, this.onBulletHit, null, this);
    this.physics.add.overlap(this.player, this.pickups, this.onPickup, null, this);
    this.physics.add.overlap(this.player, this.waters, this.onEnterWater, null, this);
    // Guard item overlap so already-picked/disabled items don't re-trigger during the same step
    this.physics.add.overlap(
      this.player,
      this.items,
      this.onItemPickup,
      (player, item)=> !!item && item.active && !item.getData('_picked'),
      this
    );
  this.physics.add.overlap(this.player, this.birds, this.onBirdHit, null, this);
  this.physics.add.overlap(this.player, this.slimes, this.onSlimeHit, null, this);
  this.physics.add.overlap(this.player, this.zombies, (p,z)=>{ this._hitByEnemy(z); }, null, this);
  this.physics.add.overlap(this.player, this.enemySoldiers, (p,e)=>{ this._hitByEnemy(e); }, null, this);
  this.physics.add.overlap(this.player, this.animals, (playerSprite, animal)=>{ this.collectBattleAnimal(animal); }, null, this);
  // Player bullets vs animals (enemy bullets do not harm animals)
  this.physics.add.overlap(this.bullets, this.animals, (bullet, animal)=>{
    if (bullet?.getData && bullet.getData('fromEnemy')) { bullet.destroy(); return; }
    const x=animal.x,y=animal.y; animal.destroy(); this.dropMeat(x,y); bullet.destroy();
  }, null, this);
  // Player bullets vs fish (enemies don't kill fish)
  this.physics.add.overlap(this.bullets, this.fishes, (bullet, fish)=>{
    if (bullet?.getData && bullet.getData('fromEnemy')) { bullet.destroy(); return; }
    const x=fish.x, y=fish.y; fish.destroy(); this.dropMeat(x,y); bullet.destroy();
  }, null, this);
  // Allies collide with terrain
  this.physics.add.collider(this.soldiers, this.platforms);
  this.physics.add.collider(this.enemySoldiers, this.platforms);
  
  this.physics.add.overlap(this.player, this.bosses, (p,b)=>{ this._hitByEnemy(b); }, null, this);
  // Oppo contact: lethal on touch if it has bounce shoes
  this.physics.add.overlap(this.player, this.oppos, (p,o)=>{
    if (o?.getData && o.getData('bounceShoes')) { this.damage(999); }
    else { this._hitByEnemy(o); }
  }, null, this);
  // Enemy bullets hurt player
  this.physics.add.overlap(this.player, this.bullets, (p,b)=>{
    if (!b?.getData || !b.getData('fromEnemy')) return;
    if (b.getData('isRocket')) { this.explodeAt(b.x, b.y); b.destroy(); return; }
    if (b.getData('isKnife')) { this.damage(999); b.destroy(); return; }
    this._hitByEnemy(b); b.destroy();
  }, null, this);
  
  // Player bullets vs Oppo
  this.physics.add.overlap(this.bullets, this.oppos, (bullet, oppo)=>{
      if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); bullet.destroy(); return; }
      if (bullet?.getData && bullet.getData('isWeb') && this.mode.current==='web') {
        oppo.setVelocity(0,0); oppo._webbedUntil = this.time.now + 4000; // 4s
      } else {
        this.damageMob(oppo, this.getMobBulletDamage(bullet), 2);
      }
      bullet.destroy();
    }, null, this);
  // Player bullets vs enemy soldiers
  this.physics.add.overlap(this.bullets, this.enemySoldiers, (bullet, enemy)=>{
      if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); bullet.destroy(); return; }
      if (bullet?.getData && bullet.getData('fromEnemy')) return; // ignore friendly fire rules for enemy bullets
      this.damageMob(enemy, this.getMobBulletDamage(bullet), 3 + Math.floor(Math.random()*2)); bullet.destroy();
    }, null, this);
  this.physics.add.overlap(this.bullets, this.birds, (bullet, bird)=>{
      if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); bullet.destroy(); return; }
      if (bullet?.getData && bullet.getData('isWeb') && this.mode.current==='web') {
        bird.setVelocity(0,0); bird.body.allowGravity = false; bird._webbedUntil = this.time.now + 3000; // 3s
      } else {
        this.damageMob(bird, this.getMobBulletDamage(bullet), 1);
      }
      bullet.destroy();
    }, null, this);
  this.physics.add.overlap(this.bullets, this.slimes, (bullet, slime)=>{
      if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); bullet.destroy(); return; }
      if (bullet?.getData && bullet.getData('isWeb') && this.mode.current==='web') {
        slime.setVelocity(0,0); slime._webbedUntil = this.time.now + 4000; // 4s
      } else {
        this.damageMob(slime, this.getMobBulletDamage(bullet), 3);
      }
      bullet.destroy();
    }, null, this);
  this.physics.add.overlap(this.bullets, this.clones, (bullet, clone)=>{
      if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); bullet.destroy(); return; }
      this.removeClone(clone); bullet.destroy();
    }, null, this);
  // Ignore friendly fire: bullets do not harm allied soldiers
  this.physics.add.overlap(this.bullets, this.soldiers, (bullet, soldier)=>{
    // Only rockets explode visually near soldiers; otherwise ignore
    if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); }
    bullet.destroy();
  }, null, this);
  // Ignore friendly fire: bullets do not harm allied tanks
  this.physics.add.overlap(this.bullets, this.tanks, (bullet, tank)=>{
    if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); }
    bullet.destroy();
  }, null, this);
  
  this.physics.add.overlap(this.bullets, this.zombies, (bullet, zombie)=>{
      if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); bullet.destroy(); return; }
      if (bullet?.getData && bullet.getData('isWeb') && this.mode.current==='web') {
        zombie.setVelocity(0,0); zombie._webbedUntil = this.time.now + 4000;
      } else {
        this.damageMob(zombie, this.getMobBulletDamage(bullet), 2);
      }
      bullet.destroy();
    }, null, this);
  // Boss hit handling: only minigun bullets and bazooka/grenade/nuke explosions can damage
  this.physics.add.overlap(this.bullets, this.bosses, (bullet, boss)=>{
      if (bullet?.getData && bullet.getData('isRocket')) {
        // propagate copper info into explosion for extra damage if applicable
        const isCopper = !!bullet.getData('copper');
        this.explodeAt(bullet.x, bullet.y, { copper: isCopper });
        bullet.destroy();
        return;
      }
      const eq = this.tools?.equipped;
      const isMinigunBullet = ((eq === 'minigun' || eq === 'minigun_copper' || eq === 'dakkerssit' || eq === 'caran_bitti') && !bullet.getData('isWeb'));
      if (bullet.getData('isBoomerang')) {
        this.damageBoss(boss, 2);
      } else if (isMinigunBullet) {
        const dmg = eq === 'dakkerssit' ? 3 : (eq === 'caran_bitti' ? 4 : ((bullet.getData('isCopper') || eq === 'minigun_copper') ? 2 : 1));
        this.damageBoss(boss, dmg);
      } else if (bullet.getData('normalWeapon')) {
        const normalSpec = NORMAL_WEAPON_MAP[bullet.getData('normalWeapon')];
        this.damageBoss(boss, normalSpec?.damage || 1);
      }
      bullet.destroy();
    }, null, this);
    

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
  this.keys = this.input.keyboard.addKeys({ A: 'A', D: 'D', S: 'S', W: 'W', SPACE: 'SPACE', CTRL: Phaser.Input.Keyboard.KeyCodes.CTRL, C: 'C', V: 'V', E: 'E', ONE: 'ONE', TWO: 'TWO', THREE: 'THREE', FOUR: 'FOUR', FIVE: 'FIVE', SIX: 'SIX', SEVEN: 'SEVEN', EIGHT: 'EIGHT', NINE: 'NINE', Q: 'Q', R: 'R', T: 'T', G: 'G', X: 'X', M: 'M' });
  // Fn is a hardware modifier and is not emitted by most browsers. Support
  // browsers that do expose it, while Ctrl and F remain reliable fallbacks.
  this._fnSlideKeyListener = (event) => {
    const isFn = event.key === 'Fn' || event.code === 'Fn' || event.code === 'Function' || event.getModifierState?.('Fn');
    if (isFn) {
      event.preventDefault?.();
      this.startPlayerSlideFromInput();
    }
  };
  window.addEventListener('keydown', this._fnSlideKeyListener);
  this.input.mouse?.disableContextMenu();
  // Pointer interactions: on desktop left-click mines/shoots, right-click places
    // On touch, use placeMode toggle to place plank with a tap
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY)=>{
      if (!this.started || this.isPaused) return;
      if (this.mountedSpecialAnimal) {
        this.setSpecialAnimalTargetFromPointer(pointer, deltaY);
        return;
      }
      if (deltaY !== 0) this.cycleTool(deltaY > 0 ? 1 : -1, true);
    });
    this.input.on('pointerdown', (pointer) => {
      if (!this.started || this.isPaused) return;
      if (this.mountedSpecialAnimal) {
        this.setSpecialAnimalTargetFromPointer(pointer);
        return;
      }
      // Ninja mode: Dakkerssit are the ninja's twin daggers; right-click throws Caran Bitti.
      if (this.ninja.active) {
        if (pointer.rightButtonDown()) this.ninjaThrowKnife(pointer);
        else if (this.tools.equipped === 'dakkerssit') this.fireDakkerssit(pointer);
        else this.ninjaSwordSlash(pointer);
        return;
      }
      const isTouch = pointer.pointerType === 'touch';
      if (!isTouch && pointer.rightButtonDown()) {
        // Blueprint placement after minigame
        if (this.buildMiniGame.awaitingPlacement && this.buildMiniGame.blueprint) {
          const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
          const tx = Math.floor(wp.x / TILE), ty = Math.floor(wp.y / TILE);
          this.placeBlueprintAtTiles(tx,ty);
          return;
        }
  if (this.tools.equipped === 'cannon') this.placeCannon(pointer);
        else if (this.tools.equipped === 'teleport') this.placePortal(pointer);
        else if (this.tools.equipped === 'slimecloner') this.placeSlimeCloner(pointer);
  else if (this.tools.equipped === 'soldiercloner') this.placeSoldierCloner(pointer);
  else if (this.tools.equipped === 'tankcloner') this.placeTankCloner(pointer);
  else if (this.tools.equipped === 'torch') this.placeTorch(pointer);
  else if (this.tools.equipped === 'campfire') this.placeCampfire(pointer);
  else if (this.tools.equipped === 'nightbreaker') this.placeNightbreaker(pointer);
  else if (this.tools.equipped === 'tower') this.placeTower(pointer);
  else if (this.tools.equipped === 'trap') this.placeTrap(pointer);
        else if (this.tools.equipped === 'mine') this.placeMine(pointer);
        else if (this.tools.equipped === 'rod') this.placeRod(pointer);
    else if (this.tools.equipped === 'fishingrod') this.castFishing(pointer);
    else if (this.tools.equipped === 'lamp') this.placeLamp(pointer);
    else if (this.tools.equipped === 'sofa') this.placeSofa(pointer);
    else if (this.tools.equipped === 'table') this.placeTable(pointer);
    else if (WORKSTATION_MAP[this.tools.equipped]) this.placeWorkstation(pointer);
        else if (this.tools.equipped === 'cloner') this.cycleCloneTarget();
        else this.placeBuildBlock(pointer);
      } else {
        if (isTouch && this.touchState.placeMode) {
          if (this.tools.equipped === 'cannon') this.placeCannon(pointer);
          else if (this.tools.equipped === 'teleport') this.placePortal(pointer);
          else if (this.tools.equipped === 'slimecloner') this.placeSlimeCloner(pointer);
          else if (this.tools.equipped === 'soldiercloner') this.placeSoldierCloner(pointer);
          else if (this.tools.equipped === 'tankcloner') this.placeTankCloner(pointer);
          else if (this.tools.equipped === 'torch') this.placeTorch(pointer);
          else if (this.tools.equipped === 'campfire') this.placeCampfire(pointer);
          else if (this.tools.equipped === 'nightbreaker') this.placeNightbreaker(pointer);
          else if (this.tools.equipped === 'tower') this.placeTower(pointer);
          else if (this.tools.equipped === 'trap') this.placeTrap(pointer);
          else if (this.tools.equipped === 'cloner') this.spawnClone(pointer);
          else if (this.tools.equipped === 'mine') this.placeMine(pointer);
          else if (this.tools.equipped === 'rod') this.placeRod(pointer);
          else if (this.tools.equipped === 'fishingrod') this.castFishing(pointer);
          else if (this.tools.equipped === 'lamp') this.placeLamp(pointer);
          else if (this.tools.equipped === 'sofa') this.placeSofa(pointer);
          else if (this.tools.equipped === 'table') this.placeTable(pointer);
          else if (WORKSTATION_MAP[this.tools.equipped]) this.placeWorkstation(pointer);
          else this.placeBuildBlock(pointer);
        }
        else {
          // Build minigame: left click toggles block inside virtual area
          if (this.buildMiniGame.active) {
            const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const tx = Math.floor(wp.x / TILE), ty = Math.floor(wp.y / TILE);
            const dx = tx - this.buildMiniGame.originTileX; const dy = ty - this.buildMiniGame.originTileY;
            const key = `${dx},${dy}`;
            if (this.buildMiniGame.placed.has(key)) {
              this.buildMiniGame.placed.delete(key);
              const worldKey = `${tx},${ty}`;
              if (this.blocks.has(worldKey)) this.removeBlockAt(tx,ty);
            } else {
              const type = this.buildMiniGame.selectedBlock;
              this.buildMiniGame.placed.set(key,type);
              if (!this.hasSolidBlockAt(tx,ty)) this.placeBlock(tx,ty,type);
            }
            return;
          }
          // Wizard: start hold detection, action will be decided on pointerup
          if (this.tools.equipped === 'wizard') { this._wizardDownAt = this.time.now; return; }
          // Flamethrower: start continuous stream
          if (this.tools.equipped === 'flame') { this._flameOn = true; this._flameNextAt = 0; return; }
          // AK-47: start continuous fire
          if (this.tools.equipped === 'ak47') { this._akOn = true; this._akNextAt = 0; return; }
          // Pamppu: if in attack mode, perform melee strike
          if (this.tools.equipped === 'pamppu') { if (this.pamppu.mode === 'attack') { this.pamppuAttack(pointer); } return; }
          // Spear: start hold detection; action decided on pointerup (tap = thrust, hold = throw)
          if (this.tools.equipped === 'spear') { this._spearDownAt = this.time.now; return; }
          // Mine: left-click removes (placing handled by right-click/touch placeMode)
          // Cannon fire when equipped
          if (this.tools.equipped === 'cannon') {
            this.fireCannon(pointer);
          } else if (this.tools.equipped === 'teleport') {
            this.removePortalAtPointer(pointer);
          } else if (this.tools.equipped === 'mine') {
            this.removeMineAtPointer(pointer);
          } else if (this.tools.equipped === 'slimecloner') {
            this.removeSlimeClonerAtPointer(pointer);
          } else if (this.tools.equipped === 'soldiercloner') {
            this.removeSoldierClonerAtPointer(pointer);
          } else if (this.tools.equipped === 'tankcloner') {
            this.removeTankClonerAtPointer(pointer);
          } else if (this.tools.equipped === 'torch') {
            this.removeTorchAtPointer(pointer);
          } else if (this.tools.equipped === 'campfire') {
            this.removeCampfireAtPointer(pointer);
          } else if (this.tools.equipped === 'nightbreaker') {
            this.removeNightbreakerAtPointer(pointer);
          } else if (this.tools.equipped === 'tower') {
            this.removeTowerAtPointer(pointer);
          } else if (this.tools.equipped === 'trap') {
            this.removeTrapAtPointer(pointer);
          } else if (this.tools.equipped === 'rod') {
            this.removeRodAtPointer(pointer);
          } else if (this.tools.equipped === 'lamp') {
            this.removeLampAtPointer(pointer);
          } else if (this.tools.equipped === 'sofa') {
            this.removeSofaAtPointer(pointer);
          } else if (this.tools.equipped === 'table') {
            this.removeTableAtPointer(pointer);
          } else if (WORKSTATION_MAP[this.tools.equipped]) {
            this.removeWorkstationAtPointer(pointer);
          } else if (this.tools.equipped === 'cloner') {
            this.spawnClone(pointer);
          } else {
            if (this.tools.equipped === 'fishingrod') { this.reelFishing(); return; }
            this.attemptMine(pointer);
          }
        }
      }
    });
    // pointerup: tap vs hold handlers (wizard, spear)
    this.input.on('pointerup', (pointer)=>{
      if (!this.started || this.isPaused) return;
  if (this.tools.equipped === 'flame') { this._flameOn = false; }
  if (this.tools.equipped === 'ak47') { this._akOn = false; }
      // Spear pointerup: decide throw vs thrust
      if (this.tools.equipped === 'spear') {
        const t0s = this._spearDownAt || 0; this._spearDownAt = 0;
        if (!t0s) return;
        const heldMs = this.time.now - t0s;
        if (heldMs >= 260) this.spearThrow(pointer); else this.spearThrust(pointer);
        return;
      }
      if (this.tools.equipped !== 'wizard') { this._wizardDownAt = 0; return; }
      const t0 = this._wizardDownAt || 0; this._wizardDownAt = 0;
      if (!t0) return;
      const heldMs = this.time.now - t0;
      if (heldMs >= 260) this.wizardChargeRelease(pointer); else this.wizardTapFire(pointer);
    });
  this.input.keyboard.on('keydown-C', () => { if (this.started && !this.isPaused) this.craftPlank(); });
  this.input.keyboard.on('keydown-T', () => { if (this.started && !this.isPaused) this.craftAllPlanks(); });
  // (V removed to avoid conflict; C crafts one plank, T crafts all possible planks)
    // Open backpack with E too; if near merchant, E opens merchant as before
    this.input.keyboard.on('keydown-E', () => {
      if (this.nearMapGateway) { this.enterMapGateway(); return; }
      if (this.nearWorkstation) { this.useWorkstation(this.nearWorkstation); return; }
      if (this.airship?.inside && this.nearAirshipControl) { this.toggleAirship(); return; }
      if (this.airship?.mounted) return;
      if (!this.nearMerchant) this.toggleBackpack();
    });

  // Tool selection keys
    const guard = (fn)=>()=>{ if (this.started && !this.isPaused) fn(); };
  this.input.keyboard.on('keydown-ONE', guard(()=>{ if (this.ninja.active) { this.ninja.swordLevel = 1; this.showToast('Ninja: Miekka Lv1'); } else this.tryEquipTool('hand'); }));
    this.input.keyboard.on('keydown-TWO', guard(()=> this.tryEquipTool('wooden')));
    this.input.keyboard.on('keydown-THREE', guard(()=> this.tryEquipTool('stone')));
    this.input.keyboard.on('keydown-FOUR', guard(()=> this.tryEquipTool('iron')));
    this.input.keyboard.on('keydown-FIVE', guard(()=> this.tryEquipTool('pistol')));
    this.input.keyboard.on('keydown-SIX', guard(()=> this.tryEquipTool('minigun')));
    this.input.keyboard.on('keydown-SEVEN', guard(()=> this.tryEquipTool('knife')));
    this.input.keyboard.on('keydown-EIGHT', guard(()=> this.tryEquipTool('sniper')));
  this.input.keyboard.on('keydown-BACKTICK', guard(()=> this.tryEquipTool('rifle'))); // optional key (tilde)
  // Quick-equip bazooka with V; T is reserved for special crafting.
  this.input.keyboard.on('keydown-V', guard(()=> this.tryEquipTool('bazooka')));
  this.input.keyboard.on('keydown-G', guard(()=> this.tryEquipTool('grenade')));
  this.input.keyboard.on('keydown-Y', guard(()=> this.tryEquipTool('nuke')));
  this.input.keyboard.on('keydown-P', guard(()=> this.tryEquipTool('plane')));
  this.input.keyboard.on('keydown-NINE', guard(()=> this.tryEquipTool('hook')));
  // 0 for cloner (if keyboard row allows)
  this.input.keyboard.on('keydown-ZERO', guard(()=> this.tryEquipTool('cloner')));
    this.input.keyboard.on('keydown-Q', guard(()=> this.cycleTool()));
    // Remove nearest clone hotkey
    this.input.keyboard.on('keydown-X', guard(()=>{
      if (!this.cloneList?.length) return;
      let best=null, bestD2=Infinity;
      for (const c of this.cloneList){ const d2=(c.x-this.player.x)**2+(c.y-this.player.y)**2; if (d2<bestD2){bestD2=d2; best=c;} }
      if (best) this.removeClone(best);
    }));
    // Cannon mode toggle (when cannon equipped)
    this.input.keyboard.on('keydown-R', guard(()=>{
      if (this.tools.equipped === 'cannon') this.toggleCannonMode();
      else if (this.tools.equipped === 'teleport') this.cyclePortalColor();
      else if (this.tools.equipped === 'trap') this.cycleTrapType();
      else this.cycleBuildBlock();
    }));
  // Mode toggle (Classic -> Star -> Spider)
  this.input.keyboard.on('keydown-M', guard(()=> this.cycleMode()));
  // Toggle Ninja mode (J)
  this.input.keyboard.on('keydown-J', guard(()=> this.toggleNinjaMode()));
  // Eat meat to restore hunger (H)
  this.input.keyboard.on('keydown-H', guard(()=>{
    if (this.food.meat > 0 && this.hunger.value < this.hunger.max) {
      this.food.meat -= 1; this.hunger.value = Math.min(this.hunger.max, this.hunger.value + 30);
      this.showToast('Söit lihaa (+nälkä)'); this.updateInventoryUI(); this.saveState();
    }
  }));
  // Ninja jump strike (K)
  this.input.keyboard.on('keydown-K', guard(()=>{ if (this.ninja.active) this.ninjaJumpStrike(); }));
    // Debug: show death banner with B
    this.input.keyboard.on('keydown-B', guard(()=> this.showDeathBanner()));
    // Space = vine toggle (shoot -> reel -> cancel)
    this.input.keyboard.on('keydown-SPACE', guard(()=>{
      const p = this.input.activePointer;
      const fakePointer = { x: p.x, y: p.y };
      this.onSpaceVine(fakePointer);
    }));

    // Pause toggle (Esc)
    this.input.keyboard.on('keydown-ESC', ()=>{
      if (!this.started) return;
      if (this.battle?.arenaOpen) { this.closeBattleArena(); return; }
      if (this.buildMiniGame.active) { this.cancelBuildMiniGame(); return; }
      if (this.isPaused) this.resumeGame(); else this.pauseGame();
    });

    // Mopo: F nouse/poistu, Shift = turbo. When no ride is nearby F is also
    // a visible keyboard fallback for the Fn slide on laptops.
    this.input.keyboard.on('keydown-F', ()=>{
      if (!this.started || this.isPaused) return;
  if (this.nearMapGateway) { this.enterMapGateway(); return; }
  if (this.mountedSpecialAnimal || this.nearSpecialAnimal) { this.toggleSpecialAnimalMount(this.mountedSpecialAnimal || this.nearSpecialAnimal); return; }
  if (this.nearMoped) { this.toggleMoped(); return; }
  if (this.nearCar) { this.toggleCar(); return; }
    if (this.nearTank) { this.toggleTank(); return; }
  if (this.nearTreasureChest) { this.openAdventureChest(this.nearTreasureChest); return; }
  if (this.nearCheckpoint) { this.activateAdventureCheckpoint(this.nearCheckpoint); return; }
  if (this.nearAirship || this.airship?.inside || this.airship?.mounted) { this.toggleAirship(); return; }
  if (this.nearPlane) { this.togglePlane(); return; }
      this.startPlayerSlideFromInput();
    });
    // Enter/exit car with Down arrow
    this.input.keyboard.on('keydown-DOWN', ()=>{
      if (!this.started || this.isPaused) return;
      if (this.airship?.mounted) return;
      // If near car and not mounted, enter. If mounted, allow exit too.
  if (this.mountedSpecialAnimal || this.nearSpecialAnimal) this.toggleSpecialAnimalMount(this.mountedSpecialAnimal || this.nearSpecialAnimal);
  else if ((this.nearCar && !this.car.mounted) || this.car.mounted) this.toggleCar();
  else if ((this.nearTank && !this.tank?.mounted) || this.tank?.mounted) this.toggleTank();
  else if ((this.nearPlane && !this.plane.mounted) || this.plane.mounted) this.togglePlane();
    });
    // Also support cursor down key object
    this.cursors?.down?.on('down', ()=>{
      if (!this.started || this.isPaused) return;
      if (this.airship?.mounted) return;
  if (this.mountedSpecialAnimal || this.nearSpecialAnimal) this.toggleSpecialAnimalMount(this.mountedSpecialAnimal || this.nearSpecialAnimal);
  else if ((this.nearCar && !this.car.mounted) || this.car.mounted) this.toggleCar();
  else if ((this.nearTank && !this.tank?.mounted) || this.tank?.mounted) this.toggleTank();
  else if ((this.nearPlane && !this.plane.mounted) || this.plane.mounted) this.togglePlane();
    });
    this.input.keyboard.on('keydown-SHIFT', ()=>{ this._mopedBoost = true; });
    this.input.keyboard.on('keyup-SHIFT',   ()=>{ this._mopedBoost = false; });
    // Shift toggle for Pamppu mode when equipped
    this.input.keyboard.on('keydown-SHIFT', ()=>{
      if (!this.started || this.isPaused) return;
      if (this.tools.equipped === 'pamppu') {
        this.pamppu.mode = this.pamppu.mode === 'attack' ? 'block' : 'attack';
        this.updateInventoryUI();
        this.showToast(`Pamppu: ${this.pamppu.mode==='attack'?'Lyönti':'Suojaus'}`);
      }
    });

    // Camera/bounds (endless)
    const worldH = WORLD_TILES_Y * TILE;
    this.cameras.main.setBounds(-INF_W/2, 0, INF_W, worldH);
    this.physics.world.setBounds(-INF_W/2, 0, INF_W, worldH);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

  // Merchant placement and interaction (near spawn)
  this.createMerchant();
  // Place moped near spawn
  this.createMoped();
  // Place car near spawn
  this.createCar();
  // Place tank near spawn
  this.createTank();
  
  // Spawn first Oppo a bit later
  this._nextOppoAt = this.time.now + 8000;
  // Place plane near spawn
  this.createPlane();
  // Place a large walkable airship near the starting area
  this.createAirship();
  // Fixed two-way gateway between the normal map and the redstone world.
  this.createMapGateway();
  // Add five more giant walkable landmarks; the airship remains first in the list.
  this.createFiveBigLandmarks();
  // New adventure layer: quests, treasure, checkpoints, crystals and map HUD.
  this.createAdventureFeatures();
  this.workstationPrompt = this.add.text(0, 0, '', {
    fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
    backgroundColor: '#111827ee', padding: { x: 7, y: 4 }
  }).setOrigin(0.5).setDepth(1000).setVisible(false);

  // Instructions
  this.add.text(14,14,
    'Ohjeet:\nVasen/Oikea tai A/D = liiku  |  Ylös/Space = hyppy' +
    '\nVasen klikkaus = mainaa (myös alaspäin) tai ammu  |  Oikea klikkaus = aseta valittu blokki' +
  '\nC = craftaa 3 puusta 1 lankku  |  T = craftaa kaikki puut  |  E = kauppias  |  1-9/Q/hiiren rulla = työkalut' +
      '\nSpace = liaani  |  R = vaihda rakennusblokki / erikoistyökalun tila' +
    '\nM = Pelitila (Klassinen / Star / Spider / Wizard)  |  Ctrl/Fn/F = liu\'u maata pitkin 8 palikkaa' +
      '\nNikkarointitila asetuksista: vapaa lento + rajattomat rakennuspalikat' +
      '\nIlmalaiva: suuri sisätila ja kävelykansi — mene sisään vasemman oven kautta' +
    '\nIlmalaiva ohjattavana: F kyytiin/pois, nuolet tai WASD liikuttavat myös ylös/alas' +
  '\nTyöasemat: Grilli, Verstaspöytä, Uuni, Tahko, Alasin ja Työkalupöytä — oikea asettaa, vasen poistaa, E käyttää' +
  '\nEläimet/Mega eläimet: kutsu kyytejä. F/Alas kyytiin, vedä tai rullaa hiirellä kohde' +
  '\nTeleportti: oikea klikkaus asettaa (8 puuta). Vasen poistaa. R vaihtaa väriä. Mene porttiin: 1,2,3 -> siirto.' +
  '\nLimaklooni: oikea asettaa laitteen, vasen poistaa. Tuottaa limoja ajan kanssa.' +
      '\nLuonnon lahjaboksit: RARE / LEGENDARY / MYTHICAL / OP ULTRA — kosketa avataksesi ja saadaksesi uusia aseita.' +
      '\nPunainen timantti -> Lento  |  Vesi: uida ylös/alas Ylöksellä/Space' +
  '\nVaro lintuja ja limoja!  |  Yö: pimeää ja zombeja. Soihdut estävät spawnit.',
      { fontFamily:'monospace', fontSize:'14px', color:'#fff' })
      .setScrollFactor(0).setDepth(1000).setShadow(2,2,'#000',3);

    this.seasonalStatusText = this.add.text(this.cameras.main.width - 14, 14, '', {
      fontFamily: 'monospace', fontSize: '17px', color: '#fff',
      backgroundColor: '#111827cc', padding: { x: 8, y: 5 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(1001);
    this.updateSeasonalEvent(true);

    // Sync UI and settings checkboxes
  const toggleFly = document.getElementById('toggleFly');
  const toggleDog = document.getElementById('dogEnable');
  const lowPerformanceMode = document.getElementById('lowPerformanceMode');
  if (toggleDog) {
    toggleDog.checked = !!this.dogState.active;
    toggleDog.addEventListener('change', ()=>{
       if (toggleDog.checked && !this.dogState.active) this.toggleDogActive();
       else if (!toggleDog.checked && this.dogState.active) this.toggleDogActive();
    });
  }
  if (toggleFly) toggleFly.checked = !!this.state.canFly;
  if (lowPerformanceMode) lowPerformanceMode.checked = !!this.performanceMode;
  const builderMode = document.getElementById('builderMode');
  if (builderMode) builderMode.checked = !!this.builderMode;
  const toggleBoots = document.getElementById('toggleBoots');
  if (toggleBoots) toggleBoots.checked = !!this.state.bounceShoes;

  this.updateUI();
  this.setupBattleUI();
  this.updateBattleUI();

    // Expose scene for UI handlers
    window.gameScene = this;

    // Populate tool select
    this.setupLandmarkListUI();
    this.updateToolSelect();
    this.updateBoostArmorSelect();
    this.updateDroneSelects();
    this.updateBuilderModeUI();
    this.updateBossAchievementsUI();
  // Create weapon sprite (follows player hand)
  this.weaponSprite = this.add.image(this.player.x, this.player.y, 'tex_weapon_pistol').setDepth(6).setVisible(false);
  this.weaponSprite.setOrigin(0.15, 0.5);
  this.rollerSkateSprites = [
    this.add.image(this.player.x - 7, this.player.y + 18, 'tex_roller_skate_foot').setDepth(6).setScale(0.9).setVisible(false),
    this.add.image(this.player.x + 7, this.player.y + 18, 'tex_roller_skate_foot').setDepth(6).setScale(0.9).setVisible(false)
  ];
  this.updateWeaponSprite?.();

  // Build minigame DOM elements
  this.buildTimerEl = document.createElement('div');
  Object.assign(this.buildTimerEl.style,{position:'absolute',top:'50px',left:'50%',transform:'translateX(-50%)',fontFamily:'monospace',color:'#fff',background:'rgba(0,0,0,0.45)',padding:'4px 10px',borderRadius:'6px',display:'none',zIndex:999});
  document.body.appendChild(this.buildTimerEl);
  this.buildPaletteEl = document.createElement('div');
  Object.assign(this.buildPaletteEl.style,{position:'absolute',bottom:'30px',left:'50%',transform:'translateX(-50%)',display:'none',gap:'6px',flexWrap:'wrap',background:'rgba(0,0,0,0.55)',padding:'8px 10px',borderRadius:'10px',fontFamily:'monospace',color:'#fff',zIndex:999});
  this.buildPaletteEl.style.display='none';
  document.body.appendChild(this.buildPaletteEl);

  // Hotkey start (Shift+B) if not already active
  this.input.keyboard.on('keydown-B', ()=>{ if (!this.buildMiniGame.active && !this.buildMiniGame.awaitingPlacement && this.input.keyboard.checkDown(this.input.keyboard.addKey('SHIFT'),0)) this.startBuildMiniGame(); });

    // Ensure chunks around the player now that player exists
    this.ensureChunksAround(this.player.x);

  // Hook up mobile/touch controls from DOM
  this.setupTouchControls();

  // Hotkey: spawn ally drone (Shift+D), cap to 4
  this.input.keyboard.on('keydown-D', ()=>{
    const shift = this.input.keyboard.addKey('SHIFT');
    if (this.input.keyboard.checkDown(shift, 0)) {
      if ((this.drones?.countActive(true)||0) < 4) { this.spawnAllyDrone(); this.showToast?.('Hyvis drone liittyi'); }
      else this.showToast?.('Dronien enimmäismäärä on 4');
    }
  });
  // Hotkey: Super Laser (Shift+L) — 54 tiles ahead, 3 tiles wide, from top to bottom
  this.input.keyboard.on('keydown-L', ()=>{
    const shift = this.input.keyboard.addKey('SHIFT');
    if (this.input.keyboard.checkDown(shift, 0)) {
      this.fireSuperLaser();
    }
  });

  // Start/pause UI buttons
    this.setupTutorialUI();
    this.setupCommandAndChatUI();
    document.getElementById('btnStart')?.addEventListener('click', ()=> this.startGame());
    document.getElementById('btnStartSettings')?.addEventListener('click', ()=>{
      document.getElementById('settingsMenu')?.classList.toggle('hidden');
      this._refreshMerchantAnimalShop();
    });
    document.getElementById('btnResume')?.addEventListener('click', ()=> this.resumeGame());
    document.getElementById('btnRestart')?.addEventListener('click', ()=> this.restartGame());
    document.getElementById('btnDeathRestart')?.addEventListener('click', ()=> this.restartGame());
    document.getElementById('btnPauseSettings')?.addEventListener('click', ()=>{
      document.getElementById('settingsMenu')?.classList.toggle('hidden');
      this._refreshMerchantAnimalShop();
    });
  // Minigames from pause
  document.getElementById('btnMiniMurder')?.addEventListener('click', ()=>{ try{ window.Sfx?.resume(); }catch(e){} this.startMinigame('murder'); });
  document.getElementById('btnMiniParkour')?.addEventListener('click', ()=>{ try{ window.Sfx?.resume(); }catch(e){} this.startMinigame('parkour'); });
  document.getElementById('btnMiniDesert')?.addEventListener('click', ()=>{ try{ window.Sfx?.resume(); }catch(e){} this.startMinigame('desert'); });
  document.getElementById('btnMiniBuild')?.addEventListener('click', ()=>{ if(!this.buildMiniGame.active && !this.buildMiniGame.awaitingPlacement){ this.startBuildMiniGame(); } });

  // Darkness overlay
  this.darknessGfx = this.add.graphics().setScrollFactor(0).setDepth(900);

  // Initially paused until started
    this.pauseGame(true);

  // Item bag UI
  const btnG = document.getElementById('itemGlider');
  const btnJ = document.getElementById('itemJet');
  const btnI = document.getElementById('itemInvis');
  const btnS = document.getElementById('itemSpeed');
  const btnSh = document.getElementById('itemShield');
  const btnD = document.getElementById('itemDecoy');
  const btnH = document.getElementById('itemHouse');
  const cool = document.getElementById('itemCooldown');
  this._refreshItemBagUI = ()=>{
    try{
      btnG?.classList.toggle('active', !!this.itemBag.glider);
      btnJ?.classList.toggle('active', !!this.itemBag.jetpack);
      btnI?.classList.toggle('active', !!this.itemBag.invis);
      btnS?.classList.toggle('active', (this.itemBag.speedUntil||0) > this.time.now);
      btnSh?.classList.toggle('active', (this.itemBag.shieldUntil||0) > this.time.now);
      btnD?.classList.toggle('active', (this.itemBag.decoyUntil||0) > this.time.now);
      cool?.classList.add('hidden');
    }catch(e){}
  };
  btnG?.addEventListener('click', ()=>{ this.itemBag.glider = !this.itemBag.glider; this.showToast(this.itemBag.glider?'Liitosiivet: päällä':'Liitosiivet: pois'); this._refreshItemBagUI(); this.saveState(); });
  btnI?.addEventListener('click', ()=>{ this.toggleInvisibility(); });
  btnJ?.addEventListener('click', ()=>{ this.itemBag.jetpack = !this.itemBag.jetpack; this.showToast(this.itemBag.jetpack?'Rakettireppu: päällä':'Rakettireppu: pois'); this._refreshItemBagUI(); this.saveState(); });
  btnS?.addEventListener('click', ()=>{ this.activateSpeedBoost(); });
  btnSh?.addEventListener('click', ()=>{ this.activateShield(); });
  btnD?.addEventListener('click', ()=>{ this.deployDecoy(); });
  btnH?.addEventListener('click', ()=>{ this.buildHouseNearPlayer(); });
  this._refreshItemBagUI();
  this.setupBlockMenuUI();
  // Apply persisted item bag states
  try { if (this.itemBag?.invis) this.player.setAlpha(0.55); } catch(e) {}
  }

  update() {
  this.updateDog();
  this.updateKingNpcs();
  this.updateCarpenterNpcs();
  if (!this._nextSeasonCheckAt || this.time.now >= this._nextSeasonCheckAt) {
    this._nextSeasonCheckAt = this.time.now + 60000;
    this.updateSeasonalEvent();
  }
  if (!this.started || this.isPaused) { this.hookGfx?.clear(); this.vineGfx?.clear(); this.cannonAimGfx?.clear(); this.fishingGfx?.clear(); return; }
    if (this.time.now >= this._nextMobHealthUiAt) {
      this._nextMobHealthUiAt = this.time.now + (this.performanceMode ? 500 : 180);
      this.updateAllMobHealthUI();
    }
    if (this.time.now >= this._nextGiftBoxUpdateAt) {
      this._nextGiftBoxUpdateAt = this.time.now + (this.performanceMode ? 100 : 45);
      this.updateGiftBoxes();
    }
    this.updateAdventureFeatures();
    this.updateMultiplayer();
    // Fishing line draw + nibble logic
    this.fishingGfx?.clear();
    if (this.fishing?.active && this.fishing.bobber && this.fishing.bobber.active) {
      try {
        // slight bobbing
        const t = this.time.now * 0.005;
        this.fishing.bobber.y = this.fishing.baseY + Math.sin(t) * 1.5;
        // draw line from player hand-ish to bobber
        this.fishingGfx.lineStyle(2, 0xffffff, 0.9);
        this.fishingGfx.beginPath();
        this.fishingGfx.moveTo(this.player.x, this.player.y - 8);
        this.fishingGfx.lineTo(this.fishing.bobber.x, this.fishing.bobber.y);
        this.fishingGfx.strokePath();
        // auto nibble -> catch
        if (this.time.now >= (this.fishing.nextNibbleAt||0)) {
          this._doFishingCatch();
        }
      } catch(e) {}
    }
    // Jetpack boost: Up-alone (airborne) or Down->Up quick combo
    if (this.itemBag?.jetpack) {
      const downNow = !!this.cursors?.down?.isDown;
      const upNow = !!this.cursors?.up?.isDown || !!this.keys?.W?.isDown || !!this.touchState?.jump;
      // Detect just-pressed for keyboard and touch jump
      const kbUpJust = Phaser.Input.Keyboard.JustDown?.(this.cursors?.up) || Phaser.Input.Keyboard.JustDown?.(this.keys?.W);
      const touchJumpNow = !!this.touchState?.jump;
      const touchUpJust = (!this._jumpPrev) && touchJumpNow;
      const upJust = kbUpJust || touchUpJust;
      const onGroundNow = !!(this.player.body?.blocked?.down || this.player.body?.touching?.down);
      const doBoost = ()=>{
        const g = this.physics.world.gravity.y || 900; const h = 7*TILE; const v = Math.sqrt(2*g*h);
        this.player.setVelocityY(-v);
        this._jpDownAt = 0;
        this._jpNextAt = this.time.now + 700; // small cooldown to avoid spam
        try { window.playSfx?.('jump'); } catch(e){}
      };
      let boosted = false;
      // Up-alone while airborne (on cooldown)
      if (upJust && !onGroundNow && (!this._jpNextAt || this.time.now >= this._jpNextAt)) { doBoost(); boosted = true; }
      // Combo: on up press shortly after down
      if (!boosted && upNow && this._jpDownAt && (this.time.now - this._jpDownAt) < 800) { doBoost(); boosted = true; }
      // Bookkeeping
      if (downNow && !this._jpDownAt) this._jpDownAt = this.time.now;
      if (!downNow && this._jpDownAt && (this.time.now - this._jpDownAt) >= 800) this._jpDownAt = 0;
      this._jumpPrev = touchJumpNow;
    }

  // Speed boost effect flag (applied to movement later)
  const speedActive = (this.itemBag.speedUntil||0) > this.time.now;

    // Shield effect: visual and damage gate
    const shieldActive = (this.itemBag.shieldUntil||0) > this.time.now;
    if (shieldActive) { if (!this._shieldFx) { this._shieldFx = this.add.graphics().setDepth(7); }
      const g=this._shieldFx; g.clear(); g.lineStyle(3,0x55ddff,0.9); g.strokeCircle(this.player.x, this.player.y, 26);
    } else if (this._shieldFx) { this._shieldFx.clear(); }
    // Reset merchant hint each frame, will be re-enabled by overlap
    this.nearMerchant = false;
    if (this.merchantPrompt) this.merchantPrompt.setVisible(false);

    // Water state and drowning
    this.inWater = this.isPlayerInWater();
    this.updateDrowning();
    this.updateHotBlockDamage();

    // Cannon tarkka-aim guide
    this.cannonAimGfx.clear();
    if (this.tools.cannonMode === 'sniper') {
      // From player if cannon equipped; also draw from placed cannons targeting something
      const drawBeam = (sx,sy,tx,ty,color=0xffffff)=>{
        const dx = tx - sx, dy = ty - sy; const dist = Math.hypot(dx,dy);
        const maxL = 18 * TILE; const L = Math.min(dist, maxL);
        const nx = dx / (dist||1), ny = dy / (dist||1);
        const ex = sx + nx * L, ey = sy + ny * L;
        this.cannonAimGfx.lineStyle(2, color, 0.5);
        this.cannonAimGfx.beginPath();
        this.cannonAimGfx.moveTo(sx, sy);
        this.cannonAimGfx.lineTo(ex, ey);
        this.cannonAimGfx.strokePath();
      };
      const p = this.input.activePointer; const wp = this.cameras.main.getWorldPoint(p.x, p.y);
      if (this.tools.equipped === 'cannon') drawBeam(this.player.x, this.player.y, wp.x, wp.y, 0x9ad3ff);
      // placed cannons: draw to their current aim (nearest enemy) if any
      for (const c of this.cannons) {
        if (!c?.barrel) continue;
        // approximate aim by angle -> endpoint far away
        const ang = c.barrel.rotation;
        const sx = c.barrel.x + Math.cos(ang)*18;
        const sy = c.barrel.y + Math.sin(ang)*18;
        const ex = sx + Math.cos(ang) * 18 * TILE;
        const ey = sy + Math.sin(ang) * 18 * TILE;
        drawBeam(sx, sy, ex, ey, 0x9ad3ff);
      }
    }

    // Flamethrower: apply continuous stream when held
    if (this._flameOn && this.tools.equipped === 'flame') {
      if (!this._flameNextAt || this.time.now >= this._flameNextAt) {
        const p = this.input.activePointer; this.tickFlame(p);
        this._flameNextAt = this.time.now + 80; // cadence
      }
    }

    // AK-47: continuous fire while held. Range limited to 9 tiles.
    if (this._akOn && (this.tools.equipped === 'ak47' || this.tools.equipped === 'ak47_copper')) {
      if (!this._akNextAt || this.time.now >= this._akNextAt) {
        const p = this.input.activePointer;
        const wp = this.cameras.main.getWorldPoint(p.x, p.y);
        // fire a slightly inaccurate bullet with short life (9 tiles)
        const extra = (this.tools.equipped === 'ak47_copper') ? 17 : 0;
        this.spawnBulletFrom(this.player.x, this.player.y, wp.x, wp.y, { speed: 820, lifeTiles: 9 + extra, spread: 0.06, isMinigun: true });
        this._akNextAt = this.time.now + 90; // ~11 rps
      }
    }

  // Thunderstorm scheduler and lightning strikes
  this.maybeRunStorm();

    // Enemy sniper spawns: cap at 2 active, perch in trees near player
    if (!this.isPaused && this.time.now >= (this._nextEnemySoldierAt||0)) {
      this._nextEnemySoldierAt = this.time.now + Phaser.Math.Between(16000, 26000);
      if ((this.enemySoldiers?.countActive(true) || 0) < 2) this.trySpawnEnemySoldierNearPlayer();
    }

    // Enemy soldier AI
    this.enemySoldiers?.children?.iterate?.((e)=>{
      if (!e || !e.active) return;
      if (this._timeStopped) { try{ e.setVelocity(0,0); }catch(_){} return; }
      const onGround = e.body?.blocked?.down || e.body?.touching?.down;
      const sx=e.x, sy=e.y;
      // choose target: player or decoy if taunted
      const taunted = !!(e._tauntUntil && this.time.now < e._tauntUntil && this._decoyPos);
      let tx=this.player.x, ty=this.player.y;
      if (taunted) {
        tx = e._tauntPos?.x ?? this._decoyPos.x; ty = e._tauntPos?.y ?? this._decoyPos.y;
      }
      const dx=tx-sx, dy=ty-sy; const dist2=dx*dx+dy*dy; const range=22*TILE, range2=range*range;
      // LOS
      let los=false; if (dist2<range2){ const steps=Math.ceil(Math.hypot(dx,dy)/(TILE/3)); los=true; for(let i=1;i<=steps;i++){ const ix=sx+dx*i/steps, iy=sy+dy*i/steps; const txi=Math.floor(ix/TILE), tyi=Math.floor(iy/TILE); if (this.hasSolidBlockAt(txi,tyi)) { los=false; break; } } }
      const dpx=this.player.x-sx, dpy=this.player.y-sy; const d2Player=dpx*dpx+dpy*dpy;
      if (!taunted && this.isPlayerCloaked() && d2Player > (3*TILE)*(3*TILE)) { los = false; }
      // Mode: perched (gravity off) vs ground
      const mode = e.getData('mode')||'perch';
      if (mode==='perch'){
        // Occasionally drop to ground
        if (!e._ai) e._ai={};
        if (!e._ai.nextDescendAt) e._ai.nextDescendAt = this.time.now + Phaser.Math.Between(4000,9000);
        if (this.time.now >= e._ai.nextDescendAt){
          e.setData('mode','ground'); e.body.setAllowGravity(true); e._ai.nextDescendAt = this.time.now + Phaser.Math.Between(6000,12000);
        }
        // Snipe when LOS
        if (los && (!e._ai.nextShotAt || this.time.now>=e._ai.nextShotAt)){
          e._ai.nextShotAt = this.time.now + Phaser.Math.Between(800, 1300);
          const ang=Math.atan2(dy,dx)+Phaser.Math.FloatBetween(-0.01,0.01);
          const nx=Math.cos(ang), ny=Math.sin(ang); const sx2=sx+nx*14, sy2=sy+ny*6;
          const b=this.spawnBulletFrom(sx2, sy2, tx, ty, { speed: 1100, lifeTiles: 16, spread: 0.008, noBlockDamage: true, fromEnemy: true });
          try{ window.playSfx?.('shoot'); }catch(e){}
          // Rare special: throwing knife (insta-kill)
          if (Math.random()<0.07){ const kb=this.bullets.create(sx2,sy2,'tex_throwing_knife'); kb.setData('fromEnemy',true); kb.setData('isKnife',true); kb.setVelocity(nx*900, ny*900); kb.setRotation(ang); this.time.delayedCall(((12*TILE)/900)*1000,()=>kb.destroy()); }
        }
        // face player
        e.setFlipX(dx<0);
      } else {
        // Ground mode: simple chase + occasional jump, sometimes try re-perch to nearest leaves above
        const dir=Math.sign(dx)||1; e.setVelocityX(dir*140); e.setFlipX(dir<0);
        const hitWall=e.body?.blocked?.left || e.body?.blocked?.right;
        if (onGround && hitWall && (!e._ai?.nextJumpAt || this.time.now>=e._ai.nextJumpAt)) { if(!e._ai) e._ai={}; e._ai.nextJumpAt=this.time.now+600; e.setVelocityY(-360); }
        // shoot with worse accuracy
        if (los && (!e._ai?.nextShotAt || this.time.now>=e._ai.nextShotAt)) { if(!e._ai) e._ai={}; e._ai.nextShotAt=this.time.now+Phaser.Math.Between(450,900); const ang=Math.atan2(dy,dx)+Phaser.Math.FloatBetween(-0.05,0.05); const nx=Math.cos(ang), ny=Math.sin(ang); const sx2=sx+nx*12, sy2=sy+ny*6; const b=this.spawnBulletFrom(sx2,sy2,tx,ty,{ speed:900, lifeTiles:10, spread:0.04, noBlockDamage:true, fromEnemy:true }); }
        // occasionally seek leaves above to climb/perch: teleport to a nearby leaves block top to simulate climb
        if (!e._ai) e._ai={}; if (!e._ai.nextPerchAt) e._ai.nextPerchAt=this.time.now+Phaser.Math.Between(5000,9000);
        if (this.time.now>=e._ai.nextPerchAt){
          const spot=this.findLeavesSpotNear(e.x,e.y,8,6);
          if (spot){ e.setPosition(spot.x, spot.y); e.setVelocity(0,0); e.body.setAllowGravity(false); e.setData('mode','perch'); }
          e._ai.nextPerchAt=this.time.now+Phaser.Math.Between(7000,12000);
        }
      }
    });

    // Ally drone AI: hover and assist fire
    this.drones?.children?.iterate?.((d)=>{
      if (!d || !d.active) return;
      const droneSpec = DRONE_MAP[d._ai?.typeId] || DRONE_MAP.scout;
      if (!d._ai) d._ai = {};
      // hover to a target offset from player
      const toX = this.player.x + (d._ai?.targetOffX||-60);
      const toY = this.player.y + (d._ai?.targetOffY||-90);
      const dx = toX - d.x, dy = toY - d.y;
      d.setVelocity(dx * (droneSpec.followForce || 2.2), dy * (droneSpec.followForce || 2.2));
      if (droneSpec.guardian && (!d._ai.nextShieldAt || this.time.now >= d._ai.nextShieldAt)) {
        d._ai.nextShieldAt = this.time.now + 2800;
        this.droneShieldUntil = this.time.now + 1400;
        const shield = this.add.graphics().setDepth(6);
        shield.lineStyle(2, 0xb8f7ff, 0.85); shield.strokeCircle(this.player.x, this.player.y, 28);
        this.time.delayedCall(420, ()=> shield.destroy());
      }
      if (droneSpec.heals && (!d._ai.nextHealAt || this.time.now >= d._ai.nextHealAt)) {
        d._ai.nextHealAt = this.time.now + 2200;
        if (this.state.health < MAX_HEALTH) {
          this.state.health = Math.min(MAX_HEALTH, this.state.health + 1);
          this.updateUI();
          this.showToast?.('Parannusdrooni palautti yhden elämän');
        }
      }
      // target nearest hostile
      const groups = [this.slimes, this.zombies, this.oppos, this.birds, this.enemySoldiers, this.bosses, this.wolves];
      let best=null, bestD2=Infinity; const r=18*TILE, r2=r*r;
      groups.forEach(gr=> gr?.children?.iterate?.(e=>{ if(!e||!e.active) return; const ddx=e.x-d.x, ddy=e.y-d.y; const d2=ddx*ddx+ddy*ddy; if (d2<bestD2 && d2<r2) { best=e; bestD2=d2; } }));
      const now=this.time.now;
      if (best && (!d._ai.nextAt || now>=d._ai.nextAt)){
        d._ai.nextAt = now + (droneSpec.cooldown || 240);
        const ang = Math.atan2(best.y-d.y, best.x-d.x) + Phaser.Math.FloatBetween(-0.015,0.015);
        const nx=Math.cos(ang), ny=Math.sin(ang);
        const sx=d.x+nx*10, sy=d.y+ny*4;
        if (droneSpec.lightning) {
          this.damageOrDestroyHostile(best, 3);
          const arc = this.add.graphics().setDepth(7);
          arc.lineStyle(3, droneSpec.projectileTint, 0.95);
          arc.beginPath(); arc.moveTo(d.x, d.y); arc.lineTo(best.x, best.y); arc.strokePath();
          this.time.delayedCall(120, ()=> arc.destroy());
        } else {
          this.spawnBulletFrom(sx,sy,best.x,best.y,{
            speed: droneSpec.projectileSpeed || 900,
            lifeTiles: droneSpec.explosive ? 15 : 12,
            spread: 0.01,
            noBlockDamage: true,
            projectileKey: droneSpec.explosive ? 'tex_rocket' : undefined
          });
        }
        try{ window.playSfx?.('shoot'); }catch(e){}
      }
    });

    // Build minigame timer
    if (this.buildMiniGame.active) {
      this.buildMiniGame.timeLeft -= this.game.loop.delta/1000;
      if (this.buildMiniGame.timeLeft <= 0) {
        this.finalizeBuildMiniGame();
      } else if (this.buildTimerEl) {
        this.buildTimerEl.textContent = `Rakennus: ${this.buildMiniGame.timeLeft.toFixed(1)}s`;
      }
    }

    // Wolves AI
    if (this.wolves) {
    this.wolves.children.iterate(w=>{
        if (!w || !w.active) return;
      if (this._timeStopped) { w.setVelocity(0,0); return; }
    // choose target
    const taunted = !!(w._tauntUntil && this.time.now < w._tauntUntil && this._decoyPos);
    let tx=this.player.x, ty=this.player.y; if (taunted) { tx = w._tauntPos?.x ?? this._decoyPos.x; ty = w._tauntPos?.y ?? this._decoyPos.y; }
        const dx = tx - w.x;
        const dir = dx>0?1:-1;
    const dyAll = ty - w.y; const d2All = dx*dx + dyAll*dyAll;
    const dpx=this.player.x-w.x, dpy=this.player.y-w.y; const d2Player=dpx*dpx+dpy*dpy;
    if (!taunted && this.isPlayerCloaked() && d2Player > (3*TILE)*(3*TILE)) { w.setVelocityX(0); return; }
        w.setVelocityX(dir*120);
        if ((w.body.blocked.left || w.body.blocked.right) && w.body.blocked.down) w.setVelocityY(-250);
        const dy = Math.abs(ty - w.y);
        if (Math.abs(dx)<34 && dy<42) {
          const t=this.time.now;
          if (!w._nextBite || t>=w._nextBite) { w._nextBite = t+650; this.playerHp = Math.max(0,(this.playerHp||100)-5); }
        }
      });
    }

    // Update car proximity and prompt
    if (this.car?.sprite) {
      const dx = Math.abs(this.player.x - this.car.sprite.x);
      const dy = Math.abs(this.player.y - this.car.sprite.y);
      const wasNear = this.nearCar;
  this.nearCar = (dx < 110 && dy < 80);
      if (this.car.prompt) this.car.prompt.setPosition(this.car.sprite.x, this.car.sprite.y - 38).setVisible(this.nearCar && !this.car.mounted);
    }

    

    // Spawn Oppo periodically (cap at 3 active)
    if (!this.isPaused && this.time.now >= (this._nextOppoAt||0)) {
      this._nextOppoAt = this.time.now + Phaser.Math.Between(14000, 22000);
      if ((this.oppos?.countActive(true) || 0) < 3) this.trySpawnOppoNearPlayer();
    }

    // (Hemuli removed)

    // Oppo AI: hop toward player; if has bounce shoes, jumps higher and kills on touch
    this.oppos?.children?.iterate?.((o)=>{
      if (!o || !o.body) return;
      if (this._timeStopped) { o.setVelocity(0,0); return; }
      if (o._webbedUntil && this.time.now < o._webbedUntil) { o.setVelocity(0,0); return; } else if (o._webbedUntil && this.time.now >= o._webbedUntil) { o._webbedUntil = 0; }
  // choose target
  const taunted = !!(o._tauntUntil && this.time.now < o._tauntUntil && this._decoyPos);
  let tx=this.player.x, ty=this.player.y; if (taunted) { tx = o._tauntPos?.x ?? this._decoyPos.x; ty = o._tauntPos?.y ?? this._decoyPos.y; }
      const dir = Math.sign(tx - o.x) || (Math.random()<0.5?-1:1);
      const ddx=tx - o.x, ddy=ty - o.y; const d2=ddx*ddx+ddy*ddy;
  const dpx=this.player.x-o.x, dpy=this.player.y-o.y; const d2Player=dpx*dpx+dpy*dpy;
  if (!taunted && this.isPlayerCloaked() && d2Player > (3*TILE)*(3*TILE)) { o.setVelocityX(0); o.setFlipX(dir<0); return; }
      o.setVelocityX(dir * 110);
      if ((o.body.blocked.down || o.body.touching.down) && (!o._nextHopAt || this.time.now >= o._nextHopAt)) {
        o._nextHopAt = this.time.now + Phaser.Math.Between(600, 1100);
        const high = o.getData('bounceShoes') ? -520 : -320;
        o.setVelocityY(high);
      }
      o.setFlipX(dir<0);
    });

    // Update plane proximity and prompt
    if (this.plane?.sprite) {
      const dx = Math.abs(this.player.x - this.plane.sprite.x);
      const dy = Math.abs(this.player.y - this.plane.sprite.y);
      this.nearPlane = (dx < 120 && dy < 90);
      if (this.plane.prompt) this.plane.prompt.setPosition(this.plane.sprite.x, this.plane.sprite.y - 42).setVisible(this.nearPlane && !this.plane.mounted);
    }

    // Fixed world gateway: keep the prompt reliable even if the physics
    // overlap fires only for one frame.
    if (this.mapGateway?.zone) {
      const dx = Math.abs(this.player.x - this.mapGateway.x);
      const dy = Math.abs(this.player.y - this.mapGateway.y);
      this.nearMapGateway = dx < 92 && dy < 108;
      this.mapGateway.portal?.setRotation(Math.sin(this.time.now * 0.002) * 0.04);
      this.mapGateway.prompt?.setVisible(this.nearMapGateway && !this._mapGatewayTraveling);
    }

    // Update controllable airship proximity and its boarding hint.
    if (this.airship?.entranceZone) {
      const dx = Math.abs(this.player.x - this.airship.entranceZone.x);
      const dy = Math.abs(this.player.y - this.airship.entranceZone.y);
      this.nearAirshipEntrance = !!this.airship.inside && !this.airship.mounted && dx < 92 && dy < 82;
      this.nearAirship = !this.airship.mounted && !this.airship.inside && dx < 150 && dy < 100;
      if (this.airship.prompt) {
        this.airship.prompt.setPosition(this.airship.entranceZone.x - 58, this.airship.entranceZone.y - 82);
        this.airship.prompt.setText(this.airship.inside ? 'F: POIS HYTISTÄ ←' : 'F: HYTTIIN →');
        this.airship.prompt.setVisible(this.nearAirship || this.nearAirshipEntrance);
      }
      const controlDx = Math.abs(this.player.x - this.airship.controlZone.x);
      const controlDy = Math.abs(this.player.y - this.airship.controlZone.y);
      this.nearAirshipControl = !!this.airship.inside && controlDx < 125 && controlDy < 105;
      if (this.airship.controlPrompt) {
        this.airship.controlPrompt.setPosition(this.airship.controlZone.x - 110, this.airship.controlZone.y - 78);
        this.airship.controlPrompt.setVisible(this.nearAirshipControl && !this.airship.mounted);
      }
    }

    // Update tank proximity and prompt
    this.nearWorkstation = null;
    let nearestWorkstationDistance = Infinity;
    this.workstations?.forEach((station) => {
      if (!station?.image?.active) return;
      const dx = this.player.x - station.image.x;
      const dy = this.player.y - station.image.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 78 && distance < nearestWorkstationDistance) {
        nearestWorkstationDistance = distance;
        this.nearWorkstation = station;
      }
    });
    if (this.workstationPrompt) {
      if (this.nearWorkstation) {
        this.workstationPrompt.setPosition(this.nearWorkstation.image.x, this.nearWorkstation.image.y - 48);
        this.workstationPrompt.setText(`E: ${this.nearWorkstation.label}`);
      }
      this.workstationPrompt.setVisible(!!this.nearWorkstation);
    }

    if (this.tank?.sprite) {
      const dx = Math.abs(this.player.x - this.tank.sprite.x);
      const dy = Math.abs(this.player.y - this.tank.sprite.y);
      this.nearTank = (dx < 120 && dy < 90);
      if (this.tank.prompt) this.tank.prompt.setPosition(this.tank.sprite.x, this.tank.sprite.y - 40).setVisible(this.nearTank && !this.tank.mounted);
    }

    const ridingSpecialAnimal = this.updateSpecialAnimals();

    // Car turrets: auto-target mobs with line-of-sight (no shooting through walls)
    // If mounted, attach car to player for clear feedback
    if (this.car?.mounted && this.car.sprite) {
      this.car.sprite.setPosition(this.player.x, this.player.y+10);
      const [tL, tR] = this.car.turrets || [];
      if (tL) tL.setPosition(this.car.sprite.x-28, this.car.sprite.y-12).setVisible(true);
      if (tR) tR.setPosition(this.car.sprite.x+28, this.car.sprite.y-12).setVisible(true);
    }

    if (this.car?.mounted && this.car.turrets?.length) {
  const groups = [this.slimes, this.birds, this.zombies, this.oppos, this.enemySoldiers];
      const range2 = (16*TILE)*(16*TILE);
      for (const t of this.car.turrets) {
        let best=null, bestD2=range2;
        for (const g of groups) {
          g?.children?.iterate?.(e=>{
            if (!e || !e.active) return;
            const dx=e.x - t.x, dy=e.y - t.y; const d2=dx*dx+dy*dy; if (d2>=bestD2) return;
            // line cast over tiles for LOS
            const steps = Math.ceil(Math.hypot(dx,dy)/TILE);
            let blocked=false; for (let i=1;i<=steps;i++){
              const ix = t.x + dx*i/steps, iy = t.y + dy*i/steps;
              const tx = Math.floor(ix/TILE), ty = Math.floor(iy/TILE);
              if (this.hasSolidBlockAt(tx,ty)) { blocked=true; break; }
            }
            if (!blocked) { best=e; bestD2=d2; }
          });
        }
        if (best) {
          const ang = Math.atan2(best.y - t.y, best.x - t.x);
          t.setRotation(ang);
          if (!t._nextFireAt || this.time.now >= t._nextFireAt) {
            t._nextFireAt = this.time.now + 120; // minigun cadence
            const sx = t.x + Math.cos(ang)*18, sy = t.y + Math.sin(ang)*6;
            this.spawnBulletFrom(sx, sy, best.x, best.y, { speed: 700, lifeTiles: 7, spread: 0.08, noBlockDamage: true, isMinigun: true });
          }
        }
      }
    }

    // Plane turrets + attach to player when mounted
    if (this.plane?.mounted && this.plane.sprite) {
      this.plane.sprite.setPosition(this.player.x, this.player.y+8);
      const [tL, tR] = this.plane.turrets || [];
      if (tL) tL.setPosition(this.plane.sprite.x-28, this.plane.sprite.y-14).setVisible(true);
      if (tR) tR.setPosition(this.plane.sprite.x+28, this.plane.sprite.y-14).setVisible(true);
    }
    if (this.plane?.mounted && this.plane.turrets?.length) {
  const groups = [this.slimes, this.birds, this.zombies, this.oppos, this.enemySoldiers];
      const range2 = (18*TILE)*(18*TILE);
      for (const t of this.plane.turrets) {
        let best=null, bestD2=range2;
        for (const g of groups) {
          g?.children?.iterate?.(e=>{
            if (!e || !e.active) return;
            const dx=e.x - t.x, dy=e.y - t.y; const d2=dx*dx+dy*dy; if (d2>=bestD2) return;
            const steps = Math.ceil(Math.hypot(dx,dy)/TILE);
            let blocked=false; for (let i=1;i<=steps;i++){
              const ix = t.x + dx*i/steps, iy = t.y + dy*i/steps;
              const tx = Math.floor(ix/TILE), ty = Math.floor(iy/TILE);
              if (this.hasSolidBlockAt(tx,ty)) { blocked=true; break; }
            }
            if (!blocked) { best=e; bestD2=d2; }
          });
        }
        if (best) {
          const ang = Math.atan2(best.y - t.y, best.x - t.x);
          t.setRotation(ang);
          if (!t._nextFireAt || this.time.now >= t._nextFireAt) {
            t._nextFireAt = this.time.now + 90; // faster than car
            const sx = t.x + Math.cos(ang)*18, sy = t.y + Math.sin(ang)*6;
            this.spawnBulletFrom(sx, sy, best.x, best.y, { speed: 820, lifeTiles: 8, spread: 0.08, noBlockDamage: true, isMinigun: true });
          }
        }
      }
    }

    // Tank: attach to player and auto-aim turret when mounted
    if (this.tank?.mounted && this.tank.sprite) {
      this.tank.sprite.setPosition(this.player.x, this.player.y+10);
      this.tank.turret.setPosition(this.tank.sprite.x, this.tank.sprite.y-12).setVisible(true).setDepth(5);
    }
    if (this.tank?.mounted && this.tank.turret) {
      const t = this.tank.turret;
      const groups = [this.slimes, this.birds, this.zombies, this.oppos, this.enemySoldiers];
      const range2 = (18*TILE)*(18*TILE);
      let best=null, bestD2=range2;
      for (const g of groups) {
        g?.children?.iterate?.(e=>{
          if (!e || !e.active) return;
          const dx=e.x - t.x, dy=e.y - t.y; const d2=dx*dx+dy*dy; if (d2>=bestD2) return;
          const steps = Math.ceil(Math.hypot(dx,dy)/TILE);
          let blocked=false; for (let i=1;i<=steps;i++){
            const ix = t.x + dx*i/steps, iy = t.y + dy*i/steps;
            const tx = Math.floor(ix/TILE), ty = Math.floor(iy/TILE);
            if (this.hasSolidBlockAt(tx,ty)) { blocked=true; break; }
          }
          if (!blocked) { best=e; bestD2=d2; }
        });
      }
      if (best) {
        const ang = Math.atan2(best.y - t.y, best.x - t.x);
        t.setRotation(ang);
        if (!t._nextFireAt || this.time.now >= t._nextFireAt) {
          t._nextFireAt = this.time.now + 160; // tank cadence
          const sx = t.x + Math.cos(ang)*20, sy = t.y + Math.sin(ang)*6;
          this.spawnBulletFrom(sx, sy, best.x, best.y, { speed: 780, lifeTiles: 9, spread: 0.05, noBlockDamage: true });
        }
      }
    }

    // Towers: auto-aim precise sniper fire with reload indicator
    if (this.towers?.size) {
      const groups = [this.slimes, this.birds, this.zombies, this.oppos, this.enemySoldiers];
      const now = this.time.now;
      for (const [key, t] of this.towers) {
        if (!t || !t.head) { if (t && t._gfx) t._gfx.clear(); continue; }
        // Acquire target within range with line-of-sight
        const range = 22 * TILE; const range2 = range*range;
        let best=null, bestD2=range2;
        const sx = t.head.x, sy = t.head.y;
        for (const g of groups) {
          g?.children?.iterate?.((e)=>{
            if (!e || !e.active) return;
            const dx=e.x-sx, dy=e.y-sy; const d2=dx*dx+dy*dy; if (d2>=bestD2) return;
            // LOS: sample along ray every 1/3 tile
            const steps = Math.ceil(Math.hypot(dx,dy)/(TILE/3));
            let blocked=false; for (let i=1;i<=steps;i++){
              const ix=sx + dx*i/steps, iy=sy + dy*i/steps;
              const tx=Math.floor(ix/TILE), ty=Math.floor(iy/TILE);
              if (this.hasSolidBlockAt(tx,ty)) { blocked=true; break; }
            }
            if (!blocked) { best=e; bestD2=d2; }
          });
        }
        if (best) {
          const ang = Math.atan2(best.y - sy, best.x - sx);
          t.head.setRotation(ang);
          // Fancy reload: 1.1s cadence, draw a small progress bar on the head
          const cdMs = 1100;
          if (!t.nextAt) t.nextAt = 0;
          const left = Math.max(0, t.nextAt - now);
          if (!t._gfx) t._gfx = this.add.graphics().setDepth(6);
          t._gfx.clear();
          // Draw progress only if reloading
          if (left>0) {
            const frac = 1 - (left / cdMs);
            const w = 16, h = 3;
            const px = sx - w/2, py = sy - TILE/2 - 6;
            t._gfx.fillStyle(0x222222, 0.7); t._gfx.fillRect(px, py, w, h);
            t._gfx.fillStyle(0x55ff77, 0.9); t._gfx.fillRect(px, py, Math.max(0.001, w*frac), h);
          }
          if (now >= t.nextAt) {
            t.nextAt = now + cdMs;
            // Fire precise long-range shot (no block damage)
            const nx = Math.cos(ang), ny = Math.sin(ang);
            const sx2 = sx + nx*12, sy2 = sy + ny*6;
            const bullet = this.bullets.create(sx2, sy2, 'tex_bullet');
            const speed = 1000;
            bullet.setVelocity(nx*speed, ny*speed);
            bullet.setRotation(ang);
            bullet.setData('noBlockDamage', true);
            const lifeMs = ((24) * TILE / speed) * 1000;
            this.time.delayedCall(lifeMs, ()=>{ if (bullet.active) bullet.destroy(); });
            try { window.playSfx?.('sniper'); } catch(e){}
          }
        } else if (t._gfx) {
          t._gfx.clear();
        }
      }
    }

    // Keep the visible boost armor attached to the player.
    if (this.armorSprite) {
      this.armorSprite.setPosition(this.player.x, this.player.y - 2);
      this.armorSprite.setFlipX(!!this.player.flipX);
      if (this.getBoostArmorSpec?.().chameleon) this.armorSprite.setTint(this.getChameleonArmorColor());
    }

    // Rullaluistimet belong on the player's feet, not in the hand.
    if (this.rollerSkateSprites?.length) {
      const wearingSkates = this.tools.equipped === 'roller_skates';
      const neonColors = [0x5cf5ff, 0xff63e6, 0x8cff4a, 0xfff27a];
      const neonColor = neonColors[Math.floor((this.time.now || 0) / 110) % neonColors.length];
      this.rollerSkateSprites[0].setPosition(this.player.x - 7, this.player.y + 18).setFlipX(!!this.player.flipX).setVisible(wearingSkates).setTint(neonColor);
      this.rollerSkateSprites[1].setPosition(this.player.x + 7, this.player.y + 18).setFlipX(!!this.player.flipX).setVisible(wearingSkates).setTint(neonColor);
    }

    // Position and orient weapon sprite to aim at pointer
    if (this.weaponSprite) {
      const handOffsetX = this.player.flipX ? -10 : 10;
      const handOffsetY = 4;
      this.weaponSprite.setPosition(this.player.x + handOffsetX, this.player.y + handOffsetY);
      const p = this.input.activePointer; const wp = this.cameras.main.getWorldPoint(p.x, p.y);
      const ang = Math.atan2(wp.y - this.weaponSprite.y, wp.x - this.weaponSprite.x);
      this.weaponSprite.setRotation(ang);
      // When facing left, optionally mirror to keep sprite upright for some assets
      this.weaponSprite.setFlipY(false);
    }

    // Aim any placed cannons toward pointer for visual feedback
    if (this.cannons?.length) {
      for (const c of this.cannons) {
        if (!c?.barrel) continue;
        // Acquire nearest enemy (slime or bird) within range
        const range = 14 * TILE;
        let best = null; let bestD2 = range*range;
        const checkGroup = (grp)=>{
          grp?.children?.iterate?.((e)=>{
            if (!e || !e.active) return;
            const dx = e.x - c.barrel.x, dy = e.y - c.barrel.y;
            const d2 = dx*dx + dy*dy;
            if (d2 < bestD2) { bestD2 = d2; best = e; }
          });
        };
        checkGroup(this.slimes);
        checkGroup(this.birds);
        checkGroup(this.enemySoldiers);
        if (best) {
          const angle = Math.atan2(best.y - c.barrel.y, best.x - c.barrel.x);
          c.barrel.setRotation(angle);
          // Fire cadence per cannon
          if (!c._nextFireAt || this.time.now >= c._nextFireAt) {
            c._nextFireAt = this.time.now + (this.tools.cannonMode==='minigun'? 160 : 640);
            // Fire from barrel tip toward target
            const sx = c.barrel.x + Math.cos(angle)*18;
            const sy = c.barrel.y + Math.sin(angle)*18;
            const opts = this.tools.cannonMode==='minigun' ? { speed: 650, lifeTiles: 6, spread: 0.09, isMinigun: true } : { speed: 980, lifeTiles: 19, spread: 0 };
            // Prevent self-destroy immediately: ignore cannon tile
            const k = `${c.tx},${c.ty}`;
            this.spawnBulletFrom(sx, sy, best.x, best.y, { ...opts, ignoreCannonKey: k });
          }
        }
      }
    }

  const onGround = this.player.body.blocked.down
    || this.player.body.touching.down
    || !!this.getPlayerStairSupport()
    || !!this._stairGrounded;

  // Handle active Ninja strike movement (dash through blocks and home into nearest enemy)
  if (this.ninja.active && this.ninja.striking) {
    // Temporarily disable collisions with platforms
    if (this.col_player_platforms) this.col_player_platforms.active = false;
    this.player.body.checkCollision.none = true;
    // Home into nearest enemy
    const groups = [this.slimes, this.birds, this.zombies, this.oppos, this.enemySoldiers];
    let best=null, bestD2=Infinity;
    for (const g of groups) {
      g?.children?.iterate?.(e=>{ if (!e||!e.active) return; const dx=e.x-this.player.x, dy=e.y-this.player.y; const d2=dx*dx+dy*dy; if (d2<bestD2){ bestD2=d2; best=e; }});
    }
    if (best) {
      const dx = best.x - this.player.x, dy = best.y - this.player.y; const d = Math.hypot(dx,dy)||1; const nx=dx/d, ny=dy/d;
      this.player.setVelocity(nx*520, ny*520);
      // Hit on proximity
      if (bestD2 < (1.4*TILE)*(1.4*TILE)) { this.destroyEnemyWithCoinReward(best,3); this.ninja.striking = false; this.ninjaStrikeOff(); this.showToast('Ninja: Hyppyisku!'); }
    }
    if (this.time.now >= this.ninja.strikeEndAt) { this.ninja.striking = false; this.ninjaStrikeOff(); }
  } else {
    // Ensure collisions restored when not striking
    const lockedInAirship = !!this.airship?.mounted;
    if (this.col_player_platforms) this.col_player_platforms.active = !lockedInAirship;
    this.player.body.checkCollision.none = lockedInAirship;
  }

  const left = this.cursors.left.isDown || this.keys.A.isDown || this.touchState.left;
  const right = this.cursors.right.isDown || this.keys.D.isDown || this.touchState.right;
  const jump = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown || this.touchState.jump;
  const down = this.cursors.down.isDown || this.keys.S.isDown;
    const baseSpeed = 220;
  const ridingMoped = this.moped?.mounted;
  const ridingPlane = this.plane?.mounted;
  const ridingAirship = this.airship?.mounted;
  let speed = baseSpeed;
  // Apply speed boost when on foot
  const speedBoostNow = (this.itemBag?.speedUntil||0) > this.time.now;
  if (ridingPlane) speed = baseSpeed * (this.plane.speedMult || 2.2);
  else if (ridingMoped) speed = baseSpeed * (this.moped.speedMult * (this._mopedBoost?1.25:1));
  else if (speedBoostNow) speed = baseSpeed * 1.5;

  const slideAllowed = !ridingSpecialAnimal && !ridingMoped && !ridingPlane && !ridingAirship && !this.inWater && !this.ninja.striking;
  if (Phaser.Input.Keyboard.JustDown(this.keys.CTRL)) this.startPlayerSlideFromInput();

  if (ridingAirship) {
    // The ship carries the player. Do not let the terrain collider pull the
    // player out of the cabin while the airship is moving.
    if (this.col_player_platforms) this.col_player_platforms.active = false;
    this.player.body.checkCollision.none = true;
    this.player.body.setAllowGravity(false);
    this.player.setGravityY(0);
    this.updateAirshipControl(left, right, jump, down);
    this.player.setVelocity(0, 0);
  } else if (ridingSpecialAnimal) {
    const animal = this.specialAnimals[this.mountedSpecialAnimal];
    if (animal?.sprite?.body) this.player.setVelocity(animal.sprite.body.velocity.x, animal.sprite.body.velocity.y);
  } else if (this.slide.active) {
    const blocked = this.slide.direction < 0 ? this.player.body.blocked.left : this.player.body.blocked.right;
    const distance = Math.abs(this.player.x - this.slide.startX);
    if (!slideAllowed || !onGround || blocked || distance >= this.slide.maxDistance) {
      this.stopPlayerSlide();
    } else {
      // Advance the slide in a small, deterministic step. Using only a large
      // velocity can overshoot badly when the browser has a long frame.
      const frameSeconds = Math.max(1, this.game.loop.delta || 16.67) / 1000;
      const remaining = this.slide.maxDistance - distance;
      const step = Math.min(
        remaining,
        this.slide.speed * frameSeconds,
        this.slide.maxFrameDistance
      );
      const nextX = this.player.x + this.slide.direction * step;
      if (step <= 0 || this.isSlidePathBlocked(nextX)) {
        this.stopPlayerSlide();
      } else {
        this.player.setVelocityX(0);
        this.player.setX(nextX);
        this.player.body?.updateFromGameObject?.();
        this.slide.lastX = nextX;
        this.player.setFlipX(this.slide.direction < 0);
      }
    }
  } else if (left) { this.player.setVelocityX(-speed); this.player.setFlipX(true); }
  else if (right) { this.player.setVelocityX(speed); this.player.setFlipX(false); }
    else { this.player.setVelocityX(0); }

    const canFlyNow = FLIGHT_ENABLED && (this.builderMode || this.state.canFly || this.tools.equipped === 'wizard');
    if (ridingAirship || ridingSpecialAnimal) {
      this.player.setGravityY(0);
    } else if (canFlyNow) {
      this.player.setGravityY(0);
      if (jump) this.player.setVelocityY(-280);
      else if (down) this.player.setVelocityY(280);
      else this.player.setVelocityY(0);
    } else if (jump && onGround && !this.slide.active) {
      const jv = this.state.bounceShoes ? -560 : -440;
      this.player.setVelocityY(jv);
      this.player.setScale(1.05,0.95); this.time.delayedCall(120,()=>this.player.setScale(1,1));
      window.playSfx?.('jump');
    }

    // Keep moped sprite attached when riding
    if (this.moped?.sprite) {
      const s = this.moped.sprite;
      if (this.moped.mounted) {
        s.setVisible(true);
        s.setPosition(this.player.x, this.player.y+10);
        s.setFlipX(this.player.flipX);
      } else if (this.moped.pos) {
        s.setVisible(true);
        s.setPosition(this.moped.pos.x, this.moped.pos.y);
      }
    }

    // Keep player within vertical bounds, X is endless
    const worldH = WORLD_TILES_Y*TILE;
    if (this.player.y > worldH+200) { this.respawnAtCheckpoint(); this.damage(1); }

    // Interact with merchant
  if (Phaser.Input.Keyboard.JustDown(this.keys.E) && this.nearMerchant) this.openMerchant();

    // Handle gravity
    if (ridingAirship || ridingSpecialAnimal || canFlyNow) {
      this.player.setGravityY(0);
    } else if (this.inWater) {
      this.player.setGravityY(100);
    } else {
      // Base gravity; glider can override below
      this.player.setGravityY(900);
    }

    // Glider: hold Down in air to glide (if enabled)
    if (this.itemBag?.glider) {
      const onGroundNow = this.player.body.blocked.down || this.player.body.touching.down;
      const holdingDown = !!(this.cursors?.down?.isDown);
      if (!ridingAirship && !onGroundNow && holdingDown && !this.inWater) {
        this.player.setGravityY(160);
        if (this.player.body.velocity.y > 120) this.player.setVelocityY(120);
      }
    }

    // Settings-placed stairs are walkable in both directions. Resolve this
    // after gravity is configured so an ascending/descending step keeps the
    // player grounded instead of turning into a wall or a small jump.
    this.resolvePlayerStairMovement();

    // Slime AI: simple patrol and hop
  if (this.slimes) {
      this.slimes.children.iterate((sl)=>{
        if (!sl || !sl.body) return;
        if (this._timeStopped) { sl.setVelocity(0,0); return; }
        if (sl._webbedUntil && this.time.now < sl._webbedUntil) { sl.setVelocity(0,0); return; } else if (sl._webbedUntil && this.time.now >= sl._webbedUntil) { sl._webbedUntil = 0; }
        if (sl.body.blocked.left) { sl.setVelocityX(80); sl.setFlipX(false); }
        else if (sl.body.blocked.right) { sl.setVelocityX(-80); sl.setFlipX(true); }
        if ((sl.body.blocked.down || sl.body.touching.down) && Math.random()<0.005) sl.setVelocityY(-260);
      });
    }

    // Bird web recovery
    if (this.birds) {
      this.birds.children.iterate((b)=>{
        if (!b || !b.active) return;
        // Recover from web
        if (b._webbedUntil && this.time.now >= b._webbedUntil) {
          b._webbedUntil = 0; b.body && (b.body.allowGravity = false);
          if (b.active) b.setVelocityX((Math.random()<0.5?-1:1) * (120 + Math.random()*120));
        }
        // Simple perching behavior: sometimes choose a nearby perch and sit for a bit
        if (!b._perchUntil || this.time.now >= b._perchUntil) {
          // If currently perching, resume flight
          if (b.getData('isPerched')) {
            b.setData('isPerched', false); b.setVelocityX((Math.random()<0.5?-1:1) * (120 + Math.random()*120)); b.setVelocityY(0);
          } else if (this.perchSpots?.length && Math.random() < 0.003) {
            // find nearest perch within 14 tiles horizontally and 10 vertically
            const rangeX = 14*TILE, rangeY = 10*TILE; let best=null, bestD=1e9;
            const bx = b.x, by = b.y;
            for (const p of this.perchSpots) {
              const px = p.tx*TILE + TILE/2, py = p.ty*TILE + TILE/2;
              const dx = Math.abs(px - bx), dy = Math.abs(py - by);
              if (dx <= rangeX && dy <= rangeY) {
                const d = dx+dy; if (d < bestD) { bestD = d; best = {px,py}; }
              }
            }
            if (best) {
              // fly quickly to perch and stop
              const vx = (best.px > bx ? 1 : -1) * 200; const vy = (best.py > by ? 1 : -1) * 140;
              b.setVelocity(vx, vy);
              b._perchTarget = best; b._perchUntil = this.time.now + Phaser.Math.Between(3000, 8000);
            }
          }
        } else if (b._perchTarget) {
          // If close to target, perch: stop and hover (no gravity), mark perched
          const px = b._perchTarget.px, py = b._perchTarget.py;
          if (Math.abs(b.x - px) < 6 && Math.abs(b.y - py) < 6) {
            b.setVelocity(0,0); b.body && (b.body.allowGravity = false);
            b.setData('isPerched', true);
          }
        }
      });
    }

    // Allied soldiers AI: move and shoot. Types:
    // - Default (ak47): ground runner, AK cadence
    // - Jetpack (rifle_jet): performs vertical boosts (≈7 tiles) and fires rifle bursts mid-air
    if (this.soldiers) {
      const now = this.time.now;
      this.soldiers.children.iterate((s)=>{
        if (!s || !s.active) return;
        // aim at nearest slime/zombie within 18 tiles with simple LOS
        const range = 18*TILE; const range2 = range*range;
        let best=null, bestD2=range2;
        const sx=s.x, sy=s.y;
        const consider = (grp)=> grp?.children?.iterate?.((e)=>{
          if (!e||!e.active) return;
          const dx=e.x-sx, dy=e.y-sy; const d2=dx*dx+dy*dy; if (d2>=bestD2) return;
          // LOS check against solid tiles
          const steps = Math.ceil(Math.hypot(dx,dy)/(TILE/3));
          let blocked=false; for (let i=1;i<=steps;i++){ const ix=sx+dx*i/steps, iy=sy+dy*i/steps; const tx=Math.floor(ix/TILE), ty=Math.floor(iy/TILE); if (this.hasSolidBlockAt(tx,ty)) { blocked=true; break; } }
          if (!blocked) { best=e; bestD2=d2; }
        });
        consider(this.slimes); consider(this.zombies); consider(this.oppos); consider(this.birds); consider(this.enemySoldiers);
        const onGround = s.body?.blocked?.down || s.body?.touching?.down;
        const wtype = s.getData('weapon') || 'ak47';
        if (wtype === 'rifle_jet') {
          // Jetpack logic: if cooldown ready and (no target or target higher), boost up strongly
          if (!s._ai) s._ai = {};
          if (onGround && (!s._ai.nextBoostAt || now >= s._ai.nextBoostAt)) {
            // calculate velocity to reach ~7 tiles height: v = sqrt(2gh)
            const g = this.physics.world.gravity.y || 900; const h = 7*TILE; const v = Math.sqrt(2*g*h);
            s.setVelocityY(-v);
            s._ai.boostingUntil = now + 700; // for flame fx window
            s._ai.nextBoostAt = now + Phaser.Math.Between(1400, 2200);
          }
          // minimal horizontal drift toward target
          if (best) { const dir = Math.sign(best.x - s.x) || 1; s.setVelocityX(dir * 120); s.setFlipX(dir < 0); }
          else s.setVelocityX(0);
          // shooting while airborne (rifle-like precise shots, slower cadence)
          if (best && (!s._ai.shootAt || now >= s._ai.shootAt)){
            s._ai.shootAt = now + 220;
            const ang = Math.atan2(best.y - sy, best.x - sx) + Phaser.Math.FloatBetween(-0.02, 0.02);
            const nx=Math.cos(ang), ny=Math.sin(ang);
            const sx2 = sx + nx*12, sy2 = sy + ny*6;
            const extra = this.upgrades.copperUnlocked ? 12 : 0;
            this.spawnBulletFrom(sx2, sy2, best.x, best.y, { speed: 1000, lifeTiles: 10 + extra, spread: 0.02, noBlockDamage: true });
            try { window.playSfx?.('shoot'); } catch(e){}
          }
          // Optional: small flame particles under jetpack while boosting — skipped to keep code light
        } else {
          // Default ground soldier movement toward target
          if (best) {
            const dir = Math.sign(best.x - s.x) || 1;
            const speed = 180;
            s.setVelocityX(dir * speed);
            s.setFlipX(dir < 0);
            // Jump if blocked left/right occasionally
            const hitWall = s.body?.blocked?.left || s.body?.blocked?.right;
            if (onGround && hitWall && (!s._ai?.nextJumpAt || now >= s._ai.nextJumpAt)) {
              if (!s._ai) s._ai = {};
              s._ai.nextJumpAt = now + 500;
              s.setVelocityY(-360);
            }
          } else {
            // No target: slow to idle
            s.setVelocityX(0);
          }
          if (best && (!s._ai || now >= (s._ai.nextAt||0))){
            // AK-47 burst: single shot cadence ~110ms
            if (!s._ai) s._ai = {};
            s._ai.nextAt = now + 110;
            const ang = Math.atan2(best.y - sy, best.x - sx) + Phaser.Math.FloatBetween(-0.04, 0.04);
            const nx=Math.cos(ang), ny=Math.sin(ang);
            const sx2 = sx + nx*12, sy2 = sy + ny*6;
            const extra = this.upgrades.copperUnlocked ? 17 : 0;
            this.spawnBulletFrom(sx2, sy2, best.x, best.y, { speed: 820, lifeTiles: 9 + extra, spread: 0.06, isMinigun: true, noBlockDamage: true });
            try { window.playSfx?.('shoot'); } catch(e){}
          }
        }
      });
    }

    // Clone AI: follow player and mine selected type
    if (this.cloneList?.length) {
      for (const c of this.cloneList) {
        if (!c || !c.active) continue;
        // follow
        const dx = this.player.x - c.x;
        if (Math.abs(dx) > 50) c.setVelocityX(Math.sign(dx) * 200); else c.setVelocityX(0);
        // jump if stuck and player above
        if ((this.player.y + 12) < c.y && (c.body.blocked.down || c.body.touching.down)) c.setVelocityY(-420);
        // mine
        if (this.cloneSettings.target !== 'none' && this.time.now >= c._nextMineAt) {
          c._nextMineAt = this.time.now + 260;
          // find nearest target block around clone within 2 tiles radius
          const tx = Math.floor(c.x / TILE); const ty = Math.floor(c.y / TILE);
          let bestKey = null; let bestD2 = Infinity; let bestSprite = null; let bestTx = 0; let bestTy = 0;
          for (let ox=-2; ox<=2; ox++) for (let oy=-2; oy<=2; oy++){
            const k = `${tx+ox},${ty+oy}`;
            const spr = this.blocks.get(k);
            if (!spr) continue;
            if (spr.getData('type') !== this.cloneSettings.target) continue;
            const x = (tx+ox)*TILE + TILE/2; const y = (ty+oy)*TILE + TILE/2;
            const d2 = (x-c.x)*(x-c.x) + (y-c.y)*(y-c.y);
            if (d2 < bestD2) { bestD2 = d2; bestKey = k; bestSprite = spr; bestTx = tx+ox; bestTy = ty+oy; }
          }
          if (bestSprite && bestKey) {
            // mine similar to player
            const type = bestSprite.getData('type');
            if (type === 'trunk' || type==='tammi' || type==='koivu') this.dropWood(bestSprite.x, bestSprite.y);
            else if (type === 'ground') { if (Math.random() < 0.30) this.dropCoin(bestSprite.x, bestSprite.y); }
            else if (this.isStoneBlockType(type)) { if (Math.random() < 0.85) this.dropStone(bestSprite.x, bestSprite.y); }
            this.markBlockDestroyedInDiff(bestTx, bestTy, type);
            bestSprite.destroy();
            this.blocks.delete(bestKey);
            if (type === 'cactus') this.cactusTiles.delete(bestKey);
            this.tryFlowWaterFrom(bestTx, bestTy-1);
            this.saveState();
          }
        }
      }
    }

    // Chunk management
    const centerChunk = Math.floor((this.player.x / TILE) / CHUNK_W);
    if (centerChunk !== this.lastCenterChunk) {
      this.lastCenterChunk = centerChunk;
      this.ensureChunksAround(this.player.x);
    }

    // Periodic boss spawn (every ~40s). Spawn underground near player in a 4x4 empty cave space
    if (!this._nextBossSpawnAt) this._nextBossSpawnAt = this.time.now + 40000;
    if (this.time.now >= this._nextBossSpawnAt) {
      this._nextBossSpawnAt = this.time.now + 40000;
      this.trySpawnBossNearPlayer();
    }

    // Update boss eye tracking
    if (this.bosses) {
      this.bosses.children.iterate((b)=>{
        if (!b || !b._eyes) return;
  const eyes = b._eyes;
  const aim = { x: this.player.x - b.x, y: this.player.y - b.y };
  const len = Math.hypot(aim.x, aim.y) || 1;
  const nx = aim.x / len, ny = aim.y / len;
  // Eyeball radius (white) ~14px, pupil radius ~5px => max offset ~9px
  const maxOffset = Math.min(eyes.radius ?? 8, 9);
  // Left eye
  const lx = b.x + eyes.offL.x + nx * maxOffset;
  const ly = b.y + eyes.offL.y + ny * maxOffset;
  eyes.L.setPosition(lx, ly);
  // Right eye
  const rx = b.x + eyes.offR.x + nx * maxOffset;
  const ry = b.y + eyes.offR.y + ny * maxOffset;
  eyes.R.setPosition(rx, ry);
      });
    }

    // Cactus contact damage (tick at most twice per second)
    if (this.time.now >= this._nextCactusHurtAt) {
      const hurt = this.isTouchingCactus();
      if (hurt) {
        this.damage(1);
        this._nextCactusHurtAt = this.time.now + 600; // cooldown
      }
    }

    // Grapple pull update and rope rendering
  this.hookGfx.clear();
    if (this.hook.active && this.hook.anchor) {
      // Draw rope
      this.hookGfx.lineStyle(2, 0xffffff, 0.8);
      this.hookGfx.beginPath();
      this.hookGfx.moveTo(this.player.x, this.player.y);
      this.hookGfx.lineTo(this.hook.anchor.x, this.hook.anchor.y);
      this.hookGfx.strokePath();

      // Pull towards anchor
      const ax = this.hook.anchor.x, ay = this.hook.anchor.y;
      const dx = ax - this.player.x, dy = ay - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 18) {
        this.cancelGrapple();
      } else {
        const nx = dx / dist, ny = dy / dist;
        const pull = 420; // pull speed
        this.player.setVelocity(nx * pull, ny * pull);
        // reduce gravity effect while pulling
        this.player.setGravityY(200);
      }
    }

    // Vine update and rendering
    this.vineGfx.clear();
    if (this.vine.active && this.vine.anchor) {
      // Draw vine line
      const vineColor = this.mode.current==='galactic' ? 0xff2a2a : (this.mode.current==='web' ? 0xffffff : 0x6b8e23);
      this.vineGfx.lineStyle(3, vineColor, 0.95);
      this.vineGfx.beginPath();
      this.vineGfx.moveTo(this.player.x, this.player.y);
      this.vineGfx.lineTo(this.vine.anchor.x, this.vine.anchor.y);
      this.vineGfx.strokePath();

      const ax = this.vine.anchor.x, ay = this.vine.anchor.y;
      const dx = ax - this.player.x, dy = ay - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (!this.vine.length) this.vine.length = dist;
  const reelSpeed = this.mode.current==='web' ? 260 : 200;
  if (this.vine.reeling) this.vine.length = Math.max(18, this.vine.length - reelSpeed * (1/60));
      if (dist > this.vine.length) {
        const nx = dx / dist, ny = dy / dist;
        const pull = 520;
        this.player.setVelocity(nx * pull, ny * pull);
        this.player.setGravityY(300);
      }
      if (dist < 16) this.cancelVine();
    }

    // Day/Night cycle and darkness overlay
    if (!this.day.start) this.day.start = this.time.now;
    const t = (this.time.now - this.day.start) % this.day.period;
    const phase = t / this.day.period; // 0..1
    // Night if outside [0.25, 0.75] (dawn/day/dusk simple curve)
    const isNight = (phase < 0.25) || (phase > 0.75);
    this.day.isNight = isNight;
    // Darkness alpha ease in/out
    const nightAmount = isNight ? (phase < 0.25 ? (0.25 - phase) / 0.25 : (phase - 0.75) / 0.25) : 0;
    const alpha = Math.min(0.72, 0.72 * nightAmount);
    this.darknessGfx.clear();
    const cam = this.cameras.main;
    if (alpha > 0.01) {
      // dark overlay
      this.darknessGfx.setBlendMode(Phaser.BlendModes.NORMAL);
      this.darknessGfx.fillStyle(0x000000, alpha);
      this.darknessGfx.fillRect(0, 0, cam.width, cam.height);
      // torch & campfire light holes
  if ((this.torchPositions?.length||0) || (this.campfirePositions?.length||0) || (this.lampPositions?.length||0) || (this.nightbreakerPositions?.length||0)) {
        this.darknessGfx.setBlendMode(Phaser.BlendModes.ERASE);
  const rad = 140;
  // Torches
  for (const p of this.torchPositions) {
          const wx = p.tx*TILE + TILE/2;
          const wy = p.ty*TILE + TILE/2;
          const sx = wx - cam.scrollX;
          const sy = wy - cam.scrollY;
          if (sx < -rad || sy < -rad || sx > cam.width+rad || sy > cam.height+rad) continue;
          // Radial gradient: strong erase at center, smoothly fading to edge (more transparent overall)
          const steps = this.performanceMode ? 12 : 32; const maxA = 0.30, minA = 0.02;
          const key = `${p.tx},${p.ty}`;
          const torch = this.torches.get(key);
          const flick = torch?.flicker;
          const time = this.time.now / 1000;
          const flickPhase = flick ? (flick.seed + time * flick.speed) : 0;
          const radiusJitter = flick ? (1 + Math.sin(flickPhase) * flick.ampR) : 1;
          const alphaJitter = flick ? (1 + Math.sin(flickPhase*1.3 + 0.7) * flick.ampA) : 1;
          const frad = rad * radiusJitter;
          for (let i = steps; i >= 1; i--) {
            const frac = i / steps;           // 1.0 -> 1/steps (outer->inner radius)
            const rr = frad * frac;
            const t = 1 - frac;               // 0 at edge -> 1 at center
            const eased = t * t;              // quadratic ease-in for smoother center
            const a = (minA + (maxA - minA) * eased) * alphaJitter;
            this.darknessGfx.fillStyle(0xffffff, a);
            this.darknessGfx.fillCircle(sx, sy, rr);
          }
        }
        // Lamps: small steady light (no flicker), radius ~110px
        const radLamp = 110;
        for (const p of this.lampPositions) {
          const wx = p.tx*TILE + TILE/2;
          const wy = p.ty*TILE + TILE/2;
          const sx = wx - cam.scrollX;
          const sy = wy - cam.scrollY;
          if (sx < -radLamp || sy < -radLamp || sx > cam.width+radLamp || sy > cam.height+radLamp) continue;
          const steps = this.performanceMode ? 10 : 26; const maxA = 0.25, minA = 0.02;
          for (let i = steps; i >= 1; i--) {
            const frac = i / steps; const rr = radLamp * frac; const t = 1 - frac; const eased = t*t;
            const a = (minA + (maxA - minA) * eased);
            this.darknessGfx.fillStyle(0xffffff, a);
            this.darknessGfx.fillCircle(sx, sy, rr);
          }
        }
        // Campfires: slightly smaller base radius in tiles (6.6), converted to pixels
        const radCamp = Math.max(40, TILE * 6.6);
        for (const p of this.campfirePositions) {
          const wx = p.tx*TILE + TILE/2;
          const wy = p.ty*TILE + TILE/2;
          const sx = wx - cam.scrollX;
          const sy = wy - cam.scrollY;
          if (sx < -radCamp || sy < -radCamp || sx > cam.width+radCamp || sy > cam.height+radCamp) continue;
          const steps = this.performanceMode ? 12 : 32; const maxA = 0.38, minA = 0.04;
          const key = `${p.tx},${p.ty}`;
          const cf = this.campfires.get(key);
          const flick = cf?.flicker;
          const time = this.time.now / 1000;
          const flickPhase = flick ? (flick.seed + time * flick.speed) : 0;
          const frad = radCamp * (flick ? (1 + Math.sin(flickPhase) * (flick.ampR||0)) : 1);
          const alphaScale = flick ? (1 + Math.sin(flickPhase*1.2 + 0.3) * (flick.ampA||0)) : 1;
          for (let i = steps; i >= 1; i--) {
            const frac = i / steps;
            const rr = frad * frac;
            const t = 1 - frac;
            const eased = t * t;
            const a = (minA + (maxA - minA) * eased) * alphaScale;
            this.darknessGfx.fillStyle(0xffffff, a);
            this.darknessGfx.fillCircle(sx, sy, rr);
          }
        }
        // Nightbreakers: strong light + bluish tint, radius ~7.5 tiles
        const radNB = TILE * 7.5;
        for (const p of this.nightbreakerPositions) {
          const wx = p.tx*TILE + TILE/2;
          const wy = p.ty*TILE + TILE/2;
          const sx = wx - cam.scrollX;
          const sy = wy - cam.scrollY;
          if (sx < -radNB || sy < -radNB || sx > cam.width+radNB || sy > cam.height+radNB) continue;
          const steps = this.performanceMode ? 12 : 34; const maxA = 0.50, minA = 0.05;
          const key = `${p.tx},${p.ty}`;
          const nb = this.nightbreakers.get(key); const flick = nb?.flicker;
          const time = this.time.now / 1000;
          const flickPhase = flick ? (flick.seed + time * flick.speed) : 0;
          const frad = radNB * (flick ? (1 + Math.sin(flickPhase) * (flick.ampR||0)) : 1);
          const alphaScale = flick ? (1 + Math.sin(flickPhase*1.4 + 0.3) * (flick.ampA||0)) : 1;
          for (let i = steps; i >= 1; i--) {
            const frac = i / steps; const rr = frad * frac; const t = 1 - frac; const eased = t*t;
            const a = (minA + (maxA - minA) * eased) * alphaScale;
            this.darknessGfx.fillStyle(0xffffff, a);
            this.darknessGfx.fillCircle(sx, sy, rr);
          }
        }
        // Add a warm yellow glow pass on top to simulate fire tint (also flickers)
        this.darknessGfx.setBlendMode(Phaser.BlendModes.ADD);
        const glowColor = 0xffcc55;
        const glowSteps = this.performanceMode ? 8 : 20; const glowMaxA = 0.12; const glowMinA = 0.0; const glowRad = rad * 0.75;
        for (const p of this.torchPositions) {
          const wx = p.tx*TILE + TILE/2;
          const wy = p.ty*TILE + TILE/2;
          const sx = wx - cam.scrollX;
          const sy = wy - cam.scrollY;
          if (sx < -glowRad || sy < -glowRad || sx > cam.width+glowRad || sy > cam.height+glowRad) continue;
          const key = `${p.tx},${p.ty}`;
          const torch = this.torches.get(key);
          const flick = torch?.flicker;
          const time = this.time.now / 1000;
          const flickPhase = flick ? (flick.seed + time * flick.speed) : 0;
          const glowR = glowRad * (flick ? (1 + Math.sin(flickPhase)*flick.ampR*0.8) : 1);
          const glowScaleA = flick ? (1 + Math.sin(flickPhase*1.3+0.7)*flick.ampA) : 1;
          for (let i=glowSteps; i>=1; i--) {
            const frac = i / glowSteps;
            const rr = glowR * frac;
            const t = 1 - frac;
            const eased = t * t;
            const a = (glowMinA + (glowMaxA - glowMinA) * eased) * glowScaleA;
            this.darknessGfx.fillStyle(glowColor, a);
            this.darknessGfx.fillCircle(sx, sy, rr);
          }
        }
        // Lamp soft warm glow
        const lampGlowColor = 0xffe4a8;
        const lampGlowRad = 100; const lampGlowSteps = this.performanceMode ? 7 : 16; const lampGlowMaxA = 0.09; const lampGlowMinA = 0.0;
        for (const p of this.lampPositions) {
          const wx = p.tx*TILE + TILE/2;
          const wy = p.ty*TILE + TILE/2;
          const sx = wx - cam.scrollX;
          const sy = wy - cam.scrollY;
          if (sx < -lampGlowRad || sy < -lampGlowRad || sx > cam.width+lampGlowRad || sy > cam.height+lampGlowRad) continue;
          for (let i=lampGlowSteps;i>=1;i--){
            const frac=i/lampGlowSteps; const rr=lampGlowRad*frac; const t=1-frac; const eased=t*t; const a=(lampGlowMinA + (lampGlowMaxA - lampGlowMinA)*eased);
            this.darknessGfx.fillStyle(lampGlowColor, a);
            this.darknessGfx.fillCircle(sx, sy, rr);
          }
        }
        // Campfire glow: slightly stronger
        const glowColorCf = 0xffaa44;
        // Nightbreaker bluish aura
        const nbGlowColor = 0x99bbff;
        const nbGlowRad = TILE*7.5*0.85; const nbGlowSteps = this.performanceMode ? 10 : 24; const nbGlowMaxA = 0.18; const nbGlowMinA = 0.0;
        for (const p of this.nightbreakerPositions) {
          const wx = p.tx*TILE + TILE/2;
          const wy = p.ty*TILE + TILE/2;
          const sx = wx - cam.scrollX;
          const sy = wy - cam.scrollY;
          if (sx < -nbGlowRad || sy < -nbGlowRad || sx > cam.width+nbGlowRad || sy > cam.height+nbGlowRad) continue;
          const key = `${p.tx},${p.ty}`; const nb = this.nightbreakers.get(key); const flick = nb?.flicker; const time=this.time.now/1000; const flickPhase = flick ? (flick.seed + time*flick.speed) : 0;
          const glowR = nbGlowRad * (flick ? (1 + Math.sin(flickPhase)*(flick.ampR||0)*0.6) : 1);
          const glowScaleA = flick ? (1 + Math.sin(flickPhase*1.2+0.4)*(flick.ampA||0)) : 1;
          for (let i=nbGlowSteps;i>=1;i--){
            const frac=i/nbGlowSteps; const rr=glowR*frac; const t=1-frac; const eased=t*t; const a=(nbGlowMinA + (nbGlowMaxA - nbGlowMinA)*eased)*glowScaleA;
            this.darknessGfx.fillStyle(nbGlowColor, a);
            this.darknessGfx.fillCircle(sx, sy, rr);
          }
        }
        const glowRadCf = Math.max(30, TILE*6.6*0.8);
        for (const p of this.campfirePositions) {
          const wx = p.tx*TILE + TILE/2;
          const wy = p.ty*TILE + TILE/2;
          const sx = wx - cam.scrollX;
          const sy = wy - cam.scrollY;
          if (sx < -glowRadCf || sy < -glowRadCf || sx > cam.width+glowRadCf || sy > cam.height+glowRadCf) continue;
          const key = `${p.tx},${p.ty}`;
          const cf = this.campfires.get(key);
          const flick = cf?.flicker;
          const time = this.time.now / 1000;
          const flickPhase = flick ? (flick.seed + time * flick.speed) : 0;
          const glowR = glowRadCf * (flick ? (1 + Math.sin(flickPhase)*(flick.ampR||0)*0.8) : 1);
          const glowScaleA = flick ? (1 + Math.sin(flickPhase*1.1+0.4)*(flick.ampA||0)) : 1;
          for (let i=glowSteps; i>=1; i--) {
            const frac = i / glowSteps;
            const rr = glowR * frac;
            const t = 1 - frac;
            const eased = t * t;
            const a = (glowMinA + (glowMaxA - glowMinA) * eased) * glowScaleA * 1.1;
            this.darknessGfx.fillStyle(glowColorCf, a);
            this.darknessGfx.fillCircle(sx, sy, rr);
          }
        }
        this.darknessGfx.setBlendMode(Phaser.BlendModes.NORMAL);
      }
    }

    // Ambient nature sounds (daytime): birds and woodpeckers
    if (!this.day.isNight) {
      const nowMs = this.time.now;
      // Songbirds: every 3–7s, but only if player is near leaves or open sky
      if (!this._nextBirdAt || nowMs >= this._nextBirdAt) {
        // Check nearby leaves within ~8x6 tiles area or simply random chance outdoors
        let nearLeaves = false;
        const ptx = Math.floor(this.player.x / TILE), pty = Math.floor(this.player.y / TILE);
        const rx = 8, ry = 6;
        for (let ox=-rx; ox<=rx && !nearLeaves; ox++) {
          for (let oy=-ry; oy<=ry; oy++) {
            const spr = this.blocks.get(`${ptx+ox},${pty+oy}`);
            if (spr && spr.getData('type')==='leaves') { nearLeaves = true; break; }
          }
        }
        // small chance even without leaves when above ground, to feel alive
        const outdoors = this.player.y < (SURFACE_Y+1)*TILE;
        if (nearLeaves || (outdoors && Math.random()<0.25)) {
          try { window.playSfx?.('bird_chirp'); } catch(e){}
        }
        this._nextBirdAt = nowMs + Phaser.Math.Between(3000, 7000);
      }
      // Woodpecker: rarer, only when near trunks and during day
      if (!this._nextPeckerAt || nowMs >= this._nextPeckerAt) {
        let nearTrunk = false;
        const ptx = Math.floor(this.player.x / TILE), pty = Math.floor(this.player.y / TILE);
        for (let ox=-6; ox<=6 && !nearTrunk; ox++) {
          for (let oy=-5; oy<=5; oy++) {
            const spr = this.blocks.get(`${ptx+ox},${pty+oy}`);
            const tp = spr?.getData && spr.getData('type');
            if (tp==='trunk' || tp==='tammi' || tp==='koivu') { nearTrunk = true; break; }
          }
        }
        if (nearTrunk && Math.random()<0.6) {
          try { window.playSfx?.('woodpecker'); } catch(e){}
          // quick follow-up mini-burst to mimic double-roll sometimes
          if (Math.random()<0.35) this.time.delayedCall(220+Phaser.Math.Between(-40,40), ()=> window.playSfx?.('woodpecker'));
        }
        this._nextPeckerAt = nowMs + Phaser.Math.Between(8000, 16000);
      }
    }

  // Spawn zombies at night in dark areas, not near torches
    if (this.day.isNight && this.time.now >= this._nextZombieSpawnAt) {
      this._nextZombieSpawnAt = this.time.now + 900; // every 0.9s check
      const maxZ = 12;
      const existing = this.zombies?.countActive(true) || 0;
      if (existing < maxZ) {
        // pick a random ground tile near the player within 12 tiles horizontally
        const ptx = Math.floor(this.player.x / TILE);
        const range = 12;
        const tx = ptx + Phaser.Math.Between(-range, range);
        const ty = SURFACE_Y - 2; // near surface wandering
        // require solid ground below and empty spawn space (2 tiles tall)
        if (this.hasSolidBlockAt(tx, SURFACE_Y) && !this.hasSolidBlockAt(tx, SURFACE_Y-1) && !this.hasSolidBlockAt(tx, SURFACE_Y-2)){
          // block if torch nearby within R tiles
          const R = 6; let nearTorch = false;
          for (const p of this.torchPositions){ if (Math.abs(p.tx - tx) <= R && Math.abs(p.ty - ty) <= R) { nearTorch = true; break; } }
          // also block if campfire nearby within ~7 tiles
          let nearCamp = false; const RC = 7;
          if (!nearTorch) { for (const c of this.campfirePositions){ if (Math.abs(c.tx - tx) <= RC && Math.abs(c.ty - ty) <= RC) { nearCamp = true; break; } } }
          if (!nearTorch && !nearCamp) {
            const x = tx*TILE + TILE/2, y = (SURFACE_Y-2)*TILE - 6;
            const z = this.zombies.create(x, y, 'tex_zombie');
            z.body.setAllowGravity(true);
            z.setCollideWorldBounds(true);
            z.body.setSize(Math.floor(TILE*0.6), TILE*1.8).setOffset(2,2);
            this.physics.add.collider(z, this.platforms);
          }
        }
      }
    }

    // Daytime: remove all zombies (no drops)
    if (!this.day.isNight && this.zombies) {
      // Underground hideout zombies remain in their dark nests during the day.
      this.zombies.children.iterate((z)=>{ if (z && z.active && !z._hideoutZombie) z.destroy(); });
    }

    // Zombie AI: shuffle towards player and hop at ledges
    if (this.zombies) {
      this.zombies.children.iterate((z)=>{
        if (!z || !z.body) return;
        if (this._timeStopped) { z.setVelocity(0,0); return; }
        if (z._webbedUntil && this.time.now < z._webbedUntil) { z.setVelocity(0,0); return; } else if (z._webbedUntil && this.time.now >= z._webbedUntil) { z._webbedUntil = 0; }
        const hideoutBounds = z._hideoutBounds;
        const keepInHideout = () => {
          if (!hideoutBounds) return;
          if (z.x < hideoutBounds.minX) { z.setX(hideoutBounds.minX); if (z.body.velocity.x < 0) z.setVelocityX(0); }
          if (z.x > hideoutBounds.maxX) { z.setX(hideoutBounds.maxX); if (z.body.velocity.x > 0) z.setVelocityX(0); }
        };
        // If inside a campfire safe zone, avoid it: move outward instead of toward player
        let avoided = false;
        if (this.campfirePositions?.length) {
          const radPx = Math.max(40, TILE*6.6);
          for (const p of this.campfirePositions) {
            const wx = p.tx*TILE + TILE/2, wy = p.ty*TILE + TILE/2;
            const ddx = z.x - wx, ddy = z.y - wy;
            if (ddx*ddx + ddy*ddy <= radPx*radPx) {
              const dirAway = Math.sign(ddx) || (Math.random()<0.5?1:-1);
              z.setVelocityX(dirAway * 100);
              if ((z.body.blocked.down || z.body.touching.down) && Math.random()<0.02) z.setVelocityY(-320);
              avoided = true;
              break;
            }
          }
        }
        keepInHideout();
        if (avoided) return;
        const targetX = hideoutBounds
          ? Math.max(hideoutBounds.minX, Math.min(hideoutBounds.maxX, this.player.x))
          : this.player.x;
        const dx = targetX - z.x;
        const dy = this.player.y - z.y; const d2 = dx*dx+dy*dy;
        if (this.isPlayerCloaked() && d2 > (3*TILE)*(3*TILE)) { z.setVelocityX(0); return; }
        const dir = Math.sign(dx) || 1;
        z.setVelocityX(dir * 80);
        if ((z.body.blocked.down || z.body.touching.down) && Math.random() < 0.01) z.setVelocityY(-340);
      });
    }

    // Portal entry detection (tile under player's feet)
    const ptx = Math.floor(this.player.x / TILE), pty = Math.floor(this.player.y / TILE);
    const pkey = `${ptx},${pty}`;
    const portal = this.portals.get(pkey);
    if (portal) {
      this.onEnterPortal(ptx, pty, portal.color || 'blue');
    }
  // Run cloner spawners
  this.maybeRunSlimeCloners();
  this.maybeRunSoldierCloners();
  this.maybeRunTankCloners();

  // Animal simple roaming + proximity collection
  if (this.animals && this.player) {
    const px = this.player.x, py = this.player.y;
    const COLLECT_RADIUS = 56; // px — kerätään jos pelaaja astuu lähelle
    const toCollect = [];
    this.animals.children.iterate((a)=>{
      if (!a || !a.body || !a.active) return;
      if ((a.body.blocked.left && a.body.velocity.x<0) || (a.body.blocked.right && a.body.velocity.x>0)) a.setVelocityX(-a.body.velocity.x);
      if (Math.random() < 0.005 && (a.body.blocked.down || a.body.touching.down)) a.setVelocityY(-180);
      if (Math.random() < 0.01) a.setVelocityX((Math.random()<0.5?-1:1)*(40+Math.random()*60));
      if (Math.abs(a.body.velocity.x) > 4) a.setFlipX(a.body.velocity.x < 0);
      // Merkitään keräystä varten — ei destroyta silmukan sisällä
      const dx = a.x - px, dy = a.y - py;
      if (dx*dx + dy*dy < COLLECT_RADIUS*COLLECT_RADIUS) toCollect.push(a);
    });
    // Destroy vasta iteraation jälkeen, ettei ryhmä hajoa
    for (const a of toCollect) this.collectBattleAnimal(a);
  }

  // Hunger decay (every ~6s, -1)
  if (this.time.now >= (this.hunger.nextTickAt||0)){
    this.hunger.nextTickAt = this.time.now + 6000;
    this.hunger.value = Math.max(0, this.hunger.value - 1);
    if (this.hunger.value === 0) { this.damage(1); }
    this.updateInventoryUI();
  }

  // Tank AI tick
  if (this.tanks) {
    const now = this.time.now;
    const hostileGroups = [this.slimes, this.birds, this.zombies, this.oppos, this.enemySoldiers, this.bosses];
    this.tanks.children.iterate((t)=>{
      if (!t || !t.active) return;
      const range = 20*TILE; const range2 = range*range;
      let best=null, bestD2=range2;
      hostileGroups.forEach(gr=> gr?.children?.iterate?.(e=>{ if(!e||!e.active) return; const dx=e.x-t.x, dy=e.y-t.y; const d2=dx*dx+dy*dy; if (d2<bestD2){ best=e; bestD2=d2; } }));
      const onGround = t.body?.blocked?.down || t.body?.touching?.down;
      if (best) {
        const dir = Math.sign(best.x - t.x) || 1;
        t.setVelocityX(dir * 120);
        t.setFlipX(dir<0);
        const hitWall = t.body?.blocked?.left || t.body?.blocked?.right;
        if (onGround && hitWall) t.setVelocityY(-140);
      } else {
        t.setVelocityX(0);
      }
      // Aim turret toward target
      if (t._turret && best) {
        const ang = Math.atan2(best.y - (t.y-12), best.x - t.x);
        t._turret.setRotation(ang);
        t._turret.setPosition(t.x, t.y-12);
      } else if (t._turret) {
        t._turret.setPosition(t.x, t.y-12);
      }
      if (!t._ai) t._ai = {};
      // AK-47 bursts
      if (best && (!t._ai.akAt || now >= t._ai.akAt)) {
        t._ai.akAt = now + 110; // cadence
        const sx = t.x, sy = t.y-10;
        this.spawnBulletFrom(sx, sy, best.x, best.y, { speed: 820, lifeTiles: 9, spread: 0.06, isMinigun: true, noBlockDamage: true });
        try{ window.playSfx?.('shoot'); }catch(e){}
      }
      // Mortar/rocket drop from above target
      if (best && (!t._ai.mortarAt || now >= t._ai.mortarAt)) {
        t._ai.mortarAt = now + Phaser.Math.Between(1400, 2200);
        const dropX = best.x;
        const dropY = Math.max(20, best.y - 9*TILE);
        const r = this.bullets.create(dropX, dropY, 'tex_rocket');
        r.setData('isRocket', true);
        r.setData('noBlockDamage', true);
        r.setVelocity(0, 360);
        r.setRotation(Math.PI/2);
        const lifeMs = ((14 * TILE) / 360) * 1000;
        this.time.delayedCall(lifeMs, ()=>{ if (r && r.active) { this.explodeAt(r.x, r.y); r.destroy(); } });
      }
    });
  }
  }

  // --- Ninja Mode ---
  toggleNinjaMode(){
    this.ninja.active = !this.ninja.active;
    if (this.ninja.active) {
      this.showToast('Ninja-tila päällä (Vasen: miekka, Oikea: heittoveitsi, K: hyppyisku)');
    } else {
      this.ninja.striking = false; this.ninjaStrikeOff(); this.showToast('Ninja-tila pois');
    }
    this.updateInventoryUI(); this.saveState();
  }

  // --- Item bag abilities ---
  toggleInvisibility(){
    this.itemBag.invis = !this.itemBag.invis;
    // Visual alpha
    this.player.setAlpha(this.itemBag.invis ? 0.55 : 1);
    this.showToast(this.itemBag.invis ? 'Näkymättömyys: päällä' : 'Näkymättömyys: pois');
    this._refreshItemBagUI?.();
    this.saveState();
  }
  activateSpeedBoost(){
    const now = this.time.now;
    if ((this.itemBag.speedUntil||0) > now) { this.showToast('Nopeus jo aktiivinen'); return; }
    const dur = 6000; // 6s
    this.itemBag.speedUntil = now + dur;
    this._refreshItemBagUI?.();
    this.showToast('Nopeus: +50%');
    try{ window.playSfx?.('powerup'); }catch(_){}
    this.saveState();
  }
  activateShield(){
    const now = this.time.now;
    if ((this.itemBag.shieldUntil||0) > now) { this.showToast('Suoja jo aktiivinen'); return; }
    const dur = 5000; // 5s
    this.itemBag.shieldUntil = now + dur;
    this._refreshItemBagUI?.();
    this.showToast('Suoja: päällä');
    try{ window.playSfx?.('powerup'); }catch(_){}
    this.saveState();
  }
  deployDecoy(){
    const now = this.time.now;
    if ((this.itemBag.decoyUntil||0) > now) { this.showToast('Houkutin jo aktiivinen'); return; }
    const dur = 7000; // 7s
    this.itemBag.decoyUntil = now + dur;
    // Spawn or move decoy marker near player
    const x = this.player.x + (this.player.flipX ? -20 : 20);
    const y = this.player.y;
    if (!this._decoySprite) {
      // simple glowing circle
      const g = this.add.graphics();
      g.fillStyle(0xffdd66, 0.9); g.fillCircle(0,0,8);
      const rt = this.add.renderTexture(0,0,18,18); rt.draw(g,9,9); g.destroy();
      const key='tex_decoy_dot'; rt.saveTexture(key); rt.destroy();
      this._decoySprite = this.add.image(x,y,key).setDepth(6).setAlpha(0.9);
    }
    this._decoySprite.setVisible(true).setPosition(x,y);
    this._decoyPos = { x, y };
    // Taunt nearby enemies to target decoy
    const taunt = (e)=>{ if(!e||!e.active) return; e._tauntUntil = now + dur; e._tauntPos = { x, y }; };
    this.enemySoldiers?.children?.iterate?.(taunt);
    this.wolves?.children?.iterate?.(taunt);
    this.oppos?.children?.iterate?.(taunt);
    // Hide sprite when expires
    this.time.delayedCall(dur+50, ()=>{ if (this._decoySprite) this._decoySprite.setVisible(false); this._decoyPos = null; });
    this._refreshItemBagUI?.();
    this.showToast('Houkutin: viholliset hämääntyivät');
    try{ window.playSfx?.('powerup'); }catch(_){}
    this.saveState();
  }
  ninjaSwordSlash(pointer){
    if (this._ninjaSlashCd && this._ninjaSlashCd > this.time.now) return; this._ninjaSlashCd = this.time.now + 220;
    const tiles = Math.max(1, this.ninja.swordRange || Math.ceil(1.6 + 0.2*(this.ninja.swordLevel-1)));
    const reach = tiles * TILE;
    const px = this.player.x, py = this.player.y;
    const dirRight = !this.player.flipX;
    // Find nearest enemy IN FRONT within reach
    const groups = [this.slimes, this.birds, this.zombies, this.oppos, this.enemySoldiers];
    let target = null; let bestD2 = Infinity;
    for (const gr of groups){ gr?.children?.iterate?.((e)=>{ if (!e||!e.active) return; const dx=e.x-px, dy=e.y-py; const forward = dirRight ? dx>=0 : dx<=0; if (!forward) return; const d2=dx*dx+dy*dy; if (d2 <= reach*reach && d2 < bestD2){ bestD2 = d2; target = e; } }); }
    // Visual swipe (straight slash in facing dir)
    const g = this.add.graphics().setDepth(800);
    g.lineStyle(6, 0xffffff, 0.6);
    const sx = px, sy = py; const ex = px + (dirRight ? reach : -reach), ey = py;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.strokePath(); this.time.delayedCall(100, ()=> g.destroy());
    if (target) this.destroyEnemyWithCoinReward(target,2);
  }

  // --- House Builder ---
  buildHouseNearPlayer(opts={}){
    // Enforce stone + wood aesthetic only
    const size = opts.size || this._houseSize || 'small';
    this._houseSize = size; // remember last size
    // Dimensions
    const W = size==='medium' ? 10 : 8; // inner width in tiles
    const H = size==='medium' ? 7 : 6;  // inner height in tiles
    // Materials: stone foundation and corners; wood walls fill and roof; wood floor
    const WALL_STONE = 'stone';
    const WALL_WOOD = 'wood';
    const ROOF_WOOD = 'wood';
    const FLOOR_WOOD = 'wood';
    // Find a flat-ish spot to the right of player
    const startX = Math.floor((this.player.x + 3*TILE)/TILE);
    let baseY = Math.floor(this.player.y / TILE) + 2;
    // Sample a few tiles downward to find solid ground
    for (let dy=0; dy<14; dy++){
      if (this.hasSolidBlockAt(startX, baseY+dy)) { baseY = baseY+dy-1; break; }
    }
    const x0 = startX, y0 = baseY; // bottom-left interior corner reference
    // Clear a rectangular area (with margin)
    const totalW = W+2, totalH = H+3; // include walls and roof space
    for (let tx=-1; tx<totalW+1; tx++){
      for (let ty=-totalH; ty<=1; ty++){
        const gx = x0+tx, gy = y0+ty;
        if (gy>=0) this.removeBlock?.(gx, gy);
      }
    }
    // Place floor (wood planks)
    for (let i=0; i<W; i++){
      this.addBlock?.(x0+i, y0, 'tex_plank', 'plank', true);
    }
    // Optional stone foundation below
    for (let i=-1; i<=W; i++){
      this.addBlock?.(x0+i, y0+1, 'tex_stone', 'stone', true);
    }
    // Build side walls as stone pillars
    for (let h=1; h<=H; h++){
      this.addBlock?.(x0-1, y0-h, 'tex_stone', 'stone', true);
      this.addBlock?.(x0+W, y0-h, 'tex_stone', 'stone', true);
    }
    // Door opening (2 tiles tall) centered
    const doorX = x0 + Math.floor(W/2);
    this.removeBlock?.(doorX, y0-1);
    this.removeBlock?.(doorX, y0-2);
    // Windows (simple holes)
    const winY = y0 - Math.floor(H/2);
    this.removeBlock?.(x0+2, winY);
    this.removeBlock?.(x0+W-3, winY);
    // Roof: simple flat-ish wood cap
    for (let i=-1; i<=W; i++){
      const rx = x0 + i;
      this.addBlock?.(rx, y0-H-1, 'tex_plank', 'plank', true);
    }
    // Stone corner accents on top
    this.addBlock?.(x0-1, y0-H-1, 'tex_stone', 'stone', true);
    this.addBlock?.(x0+W, y0-H-1, 'tex_stone', 'stone', true);
    // Door frame accents with stone sides, wood lintel
    this.addBlock?.(doorX-1, y0-1, 'tex_stone', 'stone', true);
    this.addBlock?.(doorX+1, y0-1, 'tex_stone', 'stone', true);
  this.addBlock?.(doorX, y0-3, 'tex_plank', 'plank', true);
    // Interior light (torch) if function exists
    const torchX = x0 + Math.floor(W/2) + (Math.random()<0.5?-2:2);
    const torchY = y0 - Math.floor(H*0.7);
    try { this.placeTorchAt?.(torchX, torchY); } catch(e) {}
    // Welcome message and small particles
    this.showToast?.('Talo rakennettu!');
    try {
      const px = (x0 + W/2)*TILE, py = (y0 - H/2)*TILE;
      const pm = this.add.particles('__white');
      const em = pm.createEmitter({ x:px, y:py, speed:{min:30,max:120}, angle:{min:0,max:360}, gravityY:400, lifespan:700, quantity:0, scale:{start:0.8,end:0}, alpha:{start:0.8,end:0}, tint:0xfff4c1, blendMode:'ADD' });
      em.explode(18, px, py); this.time.delayedCall(1200, ()=>pm.destroy());
    } catch(e) {}
    // Save world changes
    this.saveState?.();
  }
  ninjaThrowKnife(pointer){
    if (this._ninjaKnifeCd && this._ninjaKnifeCd > this.time.now) return; this._ninjaKnifeCd = this.time.now + Math.max(100, 260 - this.ninja.knifeLevel*20);
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const b = this.spawnBulletFrom(this.player.x, this.player.y, wp.x, wp.y, { speed: 900, lifeTiles: 18, spread: 0, noBlockDamage: true, projectileKey: 'tex_projectile_caran_bitti' });
    // Make it pass through tiles
    b.body.checkCollision.none = true;
    b.setTint(0xffeeee);
  }
  ninjaJumpStrike(){
    if (this.ninja.striking) return;
    // small hop up (1 block), then dash
    this.player.setVelocityY(-TILE * 7/10);
    const duration = 500 + this.ninja.strikeLevel*40; // ms
    this.ninja.striking = true; this.ninja.strikeEndAt = this.time.now + duration;
  }
  ninjaStrikeOff(){
    if (this.col_player_platforms) this.col_player_platforms.active = true;
    this.player.body.checkCollision.none = false;
  }

  unlockSpecialBattleAnimal(key) {
    const spec = SPECIAL_MOUNT_SPECS[key];
    if (!spec) return;
    if (!this.battle.collection[spec.battleId]) {
      this.battle.collection[spec.battleId] = 1;
      this.addBattleAnimalToTeam(spec.battleId);
      this.updateBattleUI?.();
      this.saveState();
    }
  }

  summonSpecialAnimal(key) {
    const spec = SPECIAL_MOUNT_SPECS[key];
    if (!spec || !this.player) return;
    const x = this.player.x + (key === 'dragon' ? 130 : 90);
    const y = spec.ground ? this.player.y + 12 : this.player.y - (key === 'dragon' ? 80 : 60);
    let animal = this.specialAnimals[key];
    if (!animal?.sprite) {
      const sprite = this.physics.add.sprite(x, y, spec.textures[0]).setDepth(5);
      sprite.body.setAllowGravity(!!spec.ground);
      sprite.setCollideWorldBounds(false);
      sprite.body.setSize(spec.body.width, spec.body.height).setOffset(spec.body.offsetX, spec.body.offsetY);
      sprite.setData('specialAnimalKey', key);
      sprite.setInteractive({ useHandCursor: true });
      sprite.on('pointerdown', () => {
        if (!this.started || this.isPaused) return;
        this.toggleSpecialAnimalMount(key);
      });
      const prompt = this.add.text(0, 0, spec.prompt, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#fff',
        backgroundColor: '#0008'
      }).setPadding(4, 2).setDepth(1000).setVisible(false);
      const collider = this.physics.add.collider(sprite, this.platforms);
      animal = { ...spec, sprite, prompt, collider, mounted: false, target: { x, y }, flapFrame: 0, nextFlapAt: 0 };
      this.specialAnimals[key] = animal;
    } else {
      animal.sprite.setActive(true).setVisible(true).setPosition(x, y).setVelocity(0, 0);
      animal.sprite.setTexture(spec.textures[0]);
      animal.sprite.body.setAllowGravity(!!spec.ground);
      animal.sprite.body.setSize(spec.body.width, spec.body.height).setOffset(spec.body.offsetX, spec.body.offsetY);
      if (animal.collider) animal.collider.active = true;
      animal.target = { x, y };
    }
    this.unlockSpecialBattleAnimal(key);
    this.showToast(`${spec.name} kutsuttu`);
  }

  setSpecialAnimalTargetFromPointer(pointer, wheelDeltaY = 0) {
    const animal = this.specialAnimals[this.mountedSpecialAnimal];
    if (!animal) return;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const wheelLift = wheelDeltaY ? Phaser.Math.Clamp(wheelDeltaY, -240, 240) * 0.8 : 0;
    animal.target = { x: wp.x, y: wp.y + wheelLift };
    if (animal.ground && wp.y < animal.sprite.y - 20) animal.jumpQueued = true;
  }

  setupMobHealth(enemy, type = 'slime', maxHp = null) {
    if (!enemy) return enemy;
    const spec = MOB_HP_DEFS[type] || MOB_HP_DEFS.boss;
    enemy._mobType = type;
    enemy._maxHp = Math.max(1, Number(maxHp || spec.hp));
    if (typeof enemy._hp !== 'number') enemy._hp = enemy._maxHp;
    if (!enemy._hpBar) {
      enemy._hpBar = this.add.graphics().setDepth(20);
      enemy._hpLabel = this.add.text(0, 0, '', {
        fontFamily: 'monospace', fontSize: type === 'boss' ? '12px' : '9px',
        color: '#ffffff', stroke: '#111827', strokeThickness: 3
      }).setOrigin(0.5, 1).setDepth(21);
      enemy.once('destroy', () => {
        enemy._hpBar?.destroy();
        enemy._hpLabel?.destroy();
        enemy._hpBar = null;
        enemy._hpLabel = null;
      });
    }
    enemy._hpBarColor = spec.barColor;
    enemy._hpBarWidth = type === 'boss' ? TILE * 2.8 : Math.max(30, Math.min(58, (enemy.displayWidth || 28) * 0.9));
    this.updateMobHealthUI(enemy);
    return enemy;
  }

  updateMobHealthUI(enemy) {
    if (!enemy?.active || !enemy._hpBar || !enemy._hpLabel) return;
    const maxHp = Math.max(1, enemy._maxHp || 1);
    const hp = Math.max(0, Math.min(maxHp, enemy._hp ?? maxHp));
    const width = enemy._hpBarWidth || 42;
    const height = enemy._mobType === 'boss' ? 6 : 4;
    const top = enemy.y - Math.max(18, (enemy.displayHeight || 24) * 0.5) - (enemy._mobType === 'boss' ? 14 : 9);
    const bar = enemy._hpBar;
    bar.clear();
    bar.fillStyle(0x111827, 0.9);
    bar.fillRect(enemy.x - width / 2, top, width, height);
    bar.fillStyle(enemy._hpBarColor || 0x7cff8a, 1);
    bar.fillRect(enemy.x - width / 2, top, width * (hp / maxHp), height);
    enemy._hpLabel.setPosition(enemy.x, top - 1).setText(`${Math.ceil(hp)}/${Math.ceil(maxHp)}`);
  }

  updateAllMobHealthUI() {
    this.bosses?.children?.iterate?.((enemy) => this.updateMobHealthUI(enemy));
  }

  updateBossAchievementsUI() {
    const list = document.getElementById('bossAchievements');
    if (!list) return;
    list.innerHTML = '';
    BOSS_DEFS.forEach((boss) => {
      const done = !!this.achievements?.[boss.id];
      const weaponName = BOOST_WEAPON_MAP[boss.rewardWeapon]?.name || boss.rewardWeapon;
      const armorName = BOOST_ARMOR_MAP[boss.rewardArmor]?.name || boss.rewardArmor;
      const row = document.createElement('div');
      row.className = done ? 'achievement-done' : 'achievement-locked';
      row.textContent = `${done ? '✅' : '🔒'} ${boss.achievement} — ${weaponName}, ${armorName}, +${boss.rewardCoins} kolikkoa`;
      row.title = boss.name;
      list.appendChild(row);
    });
  }

  getMobBulletDamage(bullet) {
    if (typeof bullet?.getData === 'function') {
      const direct = bullet.getData('damage');
      if (typeof direct === 'number' && direct > 0) return direct;
      if (bullet.getData('isBoomerang')) return 2;
      if (bullet.getData('isCopper')) return 2;
      if (bullet.getData('isMinigun')) return 2;
    }
    const eq = this.tools?.equipped || '';
    if (eq === 'dakkerssit') return 3;
    if (eq === 'caran_bitti') return 4;
    if (eq === 'minigun' || eq === 'ak47') return 2;
    return 1;
  }

  defeatMob(enemy, normalCoins = 0) {
    if (!enemy || !enemy.active) return;
    const x = enemy.x, y = enemy.y;
    const type = enemy._mobType;
    enemy.destroy();
    if (normalCoins > 0) this.dropCoins(x, y, normalCoins);
    if (type === 'oppo' && Math.random() < 0.22 && !this.state.bounceShoes) {
      this.spawnPickup(x, y, 'tex_boots');
    }
  }

  damageMob(enemy, amount = 1, normalCoins = 1) {
    if (!enemy || !enemy.active) return false;
    if (this.bosses?.contains?.(enemy)) {
      this.damageBoss(enemy, amount);
      return true;
    }
    // Tavallisilla mobeilla ei ole HP: yksi osuma riittää kuten peruspelissä.
    this.defeatMob(enemy, normalCoins);
    return true;
  }

  forEachHostile(callback) {
    const groups = [this.slimes, this.birds, this.zombies, this.oppos, this.enemySoldiers, this.wolves, this.bosses];
    groups.forEach((group)=> group?.children?.iterate?.((enemy)=>{
      if (enemy && enemy.active) callback(enemy, group);
    }));
  }

  findNearestHostile(x, y, radius) {
    let best = null;
    let bestD2 = radius * radius;
    this.forEachHostile((enemy)=>{
      const dx = enemy.x - x, dy = enemy.y - y;
      const d2 = dx*dx + dy*dy;
      if (d2 < bestD2) { best = enemy; bestD2 = d2; }
    });
    return best;
  }

  damageOrDestroyHostile(enemy, coins=2, damage=2) {
    if (!enemy || !enemy.active) return;
    if (this.bosses?.contains?.(enemy)) this.damageBoss(enemy, damage);
    else this.damageMob(enemy, damage, coins);
  }

  tickMegaAnimalPower(key, animal) {
    if (!animal?.mega || !animal.sprite?.active) return;
    const now = this.time.now;
    const x = animal.sprite.x, y = animal.sprite.y;
    const speed = Math.hypot(animal.sprite.body?.velocity?.x || 0, animal.sprite.body?.velocity?.y || 0);
    if (animal.megaPower === 'storm' && now >= (animal._powerNextAt || 0)) {
      animal._powerNextAt = now + 650;
      const target = this.findNearestHostile(x, y, 8*TILE);
      if (target) {
        const bolt = this.add.graphics().setDepth(850);
        bolt.lineStyle(4, 0xfff27a, 0.9); bolt.beginPath(); bolt.moveTo(x, y-30); bolt.lineTo(target.x, target.y); bolt.strokePath();
        this.time.delayedCall(90, ()=> bolt.destroy());
        this.damageOrDestroyHostile(target, 3);
      }
    } else if (animal.megaPower === 'death' && now >= (animal._powerNextAt || 0)) {
      animal._powerNextAt = now + 520;
      const target = this.findNearestHostile(x, y, 9*TILE);
      if (target) {
        const beam = this.add.graphics().setDepth(880);
        beam.lineStyle(7, 0xff2f5f, 0.88);
        beam.beginPath(); beam.moveTo(x, y - 28); beam.lineTo(target.x, target.y); beam.strokePath();
        beam.fillStyle(0x16121c, 0.6); beam.fillCircle(target.x, target.y, 24);
        this.time.delayedCall(120, ()=> beam.destroy());
        this.damageOrDestroyHostile(target, 5, 100);
      }
    } else if (animal.megaPower === 'fire' && now >= (animal._powerNextAt || 0)) {
      animal._powerNextAt = now + 320;
      const flame = this.add.image(x, y+12, 'tex_flame').setDepth(5).setScale(1.4).setAlpha(0.85);
      this.time.delayedCall(260, ()=> flame.destroy());
      this.forEachHostile((enemy)=>{
        const dx=enemy.x-x, dy=enemy.y-y;
        if (dx*dx+dy*dy <= (2*TILE)*(2*TILE)) this.damageOrDestroyHostile(enemy, 2);
      });
    } else if (animal.megaPower === 'ice' && now >= (animal._powerNextAt || 0)) {
      animal._powerNextAt = now + 700;
      this.forEachHostile((enemy)=>{
        const dx=enemy.x-x, dy=enemy.y-y;
        if (dx*dx+dy*dy > (4*TILE)*(4*TILE)) return;
        enemy.setTint?.(0x99ddff);
        enemy.setVelocity?.((enemy.body?.velocity?.x || 0) * 0.25, (enemy.body?.velocity?.y || 0) * 0.25);
        if (enemy.body) enemy.body.allowGravity = false;
        this.time.delayedCall(900, ()=>{
          enemy.clearTint?.();
          if (enemy.body) enemy.body.allowGravity = true;
        });
      });
    } else if (animal.megaPower === 'shadow') {
      this.player?.setAlpha?.(0.58);
      if (now >= (animal._powerNextAt || 0)) {
        animal._powerNextAt = now + 420;
        this.forEachHostile((enemy)=>{
          const dx=enemy.x-x, dy=enemy.y-y;
          if (dx*dx+dy*dy <= (1.7*TILE)*(1.7*TILE)) this.damageOrDestroyHostile(enemy, 3);
        });
      }
    } else if (animal.megaPower === 'stone' && speed > 80 && now >= (animal._powerNextAt || 0)) {
      animal._powerNextAt = now + 220;
      const dir = animal.sprite.flipX ? -1 : 1;
      const tx = Math.floor((x + dir * 70) / TILE);
      const ty = Math.floor(y / TILE);
      for (let oy=-1; oy<=1; oy++) {
        const key2 = `${tx},${ty+oy}`;
        const block = this.blocks.get(key2);
        if (!block || block.getData('type') === 'iron') continue;
        const type = block.getData('type');
        if (type === 'trunk' || type === 'tammi' || type === 'koivu') this.dropWood(block.x, block.y);
        else if (this.isStoneBlockType(type)) this.dropStone(block.x, block.y);
        block.destroy(); this.blocks.delete(key2);
        if (type === 'cactus') this.cactusTiles.delete(key2);
        this.markBlockDestroyedInDiff(tx, ty+oy, type);
      }
      this.forEachHostile((enemy)=>{
        const dx=enemy.x-x, dy=enemy.y-y;
        if (dx*dx+dy*dy <= (2.2*TILE)*(2.2*TILE)) this.damageOrDestroyHostile(enemy, 2);
      });
    } else if (animal.megaPower === 'heal' && now >= (animal._powerNextAt || 0)) {
      animal._powerNextAt = now + 1800;
      if (this.state.health < MAX_HEALTH) {
        this.state.health += 1;
        this.updateUI();
        this.showToast?.('Taivasvalas paransi sinua');
      }
      if (!animal._healFx) animal._healFx = this.add.graphics().setDepth(840);
      animal._healFx.clear();
      animal._healFx.lineStyle(3, 0xd8f5ff, 0.55); animal._healFx.strokeCircle(x, y, 74);
      this.time.delayedCall(260, ()=> animal._healFx?.clear());
    }
  }

  toggleSpecialAnimalMount(key) {
    const animal = this.specialAnimals[key];
    if (!animal?.sprite) return;
    if (this.mountedSpecialAnimal === key) {
      animal.mounted = false;
      this.mountedSpecialAnimal = null;
      animal.sprite.setVelocity(0, 0);
      animal.target = { x: animal.sprite.x, y: animal.sprite.y };
      animal.sprite.setTexture(animal.textures[0]);
      if (this.col_player_platforms) this.col_player_platforms.active = true;
      this.player.body.checkCollision.none = false;
      this.player.body.setAllowGravity(true);
      this.player.setGravityY(900);
      if (!this.itemBag?.invis) this.player.setAlpha(1);
      this.player.setPosition(animal.sprite.x, animal.sprite.y + 20);
      this.showToast(`${animal.name}: poistuit kyydistä`);
      return;
    }

    Object.keys(this.specialAnimals).forEach((entryKey) => {
      if (this.specialAnimals[entryKey]) this.specialAnimals[entryKey].mounted = false;
    });
    if (this.moped?.mounted) this.toggleMoped();
    if (this.car?.mounted) this.toggleCar();
    if (this.tank?.mounted) this.toggleTank();
    if (this.plane?.mounted) this.togglePlane();
    if (this.airship?.mounted) this.toggleAirship();

    animal.mounted = true;
    this.mountedSpecialAnimal = key;
    animal.target = { x: animal.sprite.x, y: animal.sprite.y };
    if (this.col_player_platforms) this.col_player_platforms.active = false;
    this.player.body.checkCollision.none = true;
    this.player.body.setAllowGravity(false);
    this.player.setGravityY(0);
    this.player.setVelocity(0, 0);
    this.player.setDepth(6);
    animal.sprite.setDepth(5);
    animal.prompt?.setVisible(false);
    this.showToast(`${animal.name}: kyytiin`);
  }

  updateSpecialAnimals() {
    this.nearSpecialAnimal = null;
    let riding = false;
    let shadowMounted = false;
    Object.entries(this.specialAnimals).forEach(([key, animal]) => {
      if (!animal?.sprite?.active) return;
      if (animal.mounted) {
        riding = true;
        if (animal.megaPower === 'shadow') shadowMounted = true;
        if (this.input.activePointer?.isDown) this.setSpecialAnimalTargetFromPointer(this.input.activePointer);
        const target = animal.target || { x: animal.sprite.x, y: animal.sprite.y };
        const dx = target.x - animal.sprite.x;
        const dy = target.y - animal.sprite.y;
        const dist = Math.hypot(dx, dy);
        if (animal.ground) {
          const absDx = Math.abs(dx);
          const onGround = !!(animal.sprite.body?.blocked?.down || animal.sprite.body?.touching?.down);
          if (absDx > animal.arrive) {
            const dir = Math.sign(dx) || 1;
            animal.sprite.setVelocityX(dir * animal.speed);
            animal.sprite.setFlipX(dir < 0);
            if (onGround && (animal.jumpQueued || dy < -20 || animal.sprite.body?.blocked?.left || animal.sprite.body?.blocked?.right)) {
              animal.sprite.setVelocityY(animal.jumpVelocity);
              animal.jumpQueued = false;
            }
            if (this.time.now >= (animal.nextFlapAt || 0)) {
              animal.flapFrame = 1 - (animal.flapFrame || 0);
              animal.nextFlapAt = this.time.now + 150;
              animal.sprite.setTexture(animal.textures[animal.flapFrame]);
            }
          } else {
            animal.sprite.setVelocityX(0);
            if (onGround) animal.sprite.setTexture(animal.textures[0]);
          }
          this.player.setVelocity(animal.sprite.body.velocity.x, animal.sprite.body.velocity.y);
        } else if (dist > animal.arrive) {
          const waterKey = `${Math.floor(animal.sprite.x / TILE)},${Math.floor(animal.sprite.y / TILE)}`;
          const swimming = !!animal.swimSpeed && this.waterTiles?.has?.(waterKey);
          const moveSpeed = swimming ? animal.swimSpeed : animal.speed;
          const ease = Math.min(moveSpeed, dist * 2.6);
          const vx = (dx / dist) * ease;
          const vy = (dy / dist) * ease;
          animal.sprite.setVelocity(vx, vy);
          this.player.setVelocity(vx, vy);
          animal.sprite.setFlipX(dx < 0);
          if (this.time.now >= (animal.nextFlapAt || 0)) {
            animal.flapFrame = 1 - (animal.flapFrame || 0);
            animal.nextFlapAt = this.time.now + (swimming ? 130 : (animal.flapMs || (key === 'dragon' ? 380 : 220)));
            animal.sprite.setTexture(animal.textures[animal.flapFrame]);
          }
        } else {
          animal.sprite.setVelocity(0, 0);
          this.player.setVelocity(0, 0);
          animal.sprite.setTexture(animal.textures[0]);
        }
        if (animal.sprite.body?.blocked?.none === false || animal.sprite.body?.touching?.none === false) {
          animal.target = { x: animal.sprite.x, y: animal.sprite.y };
        }
        this.player.setPosition(animal.sprite.x, animal.sprite.y + animal.riderOffsetY);
        this.player.setGravityY(0);
        this.tickMegaAnimalPower(key, animal);
        if (this.col_player_platforms) this.col_player_platforms.active = false;
        this.player.body.checkCollision.none = true;
        animal.prompt?.setVisible(false);
      } else {
        const dx = this.player.x - animal.sprite.x;
        const dy = this.player.y - animal.sprite.y;
        const near = Math.abs(dx) < 100 && Math.abs(dy) < 90;
        if (near && !this.nearSpecialAnimal) this.nearSpecialAnimal = key;
        animal.prompt?.setPosition(animal.sprite.x, animal.sprite.y - 42).setVisible(near);
        animal.sprite.setVelocity(0, 0);
      }
    });
    if (!shadowMounted && !this.itemBag?.invis) this.player?.setAlpha?.(1);
    return riding;
  }

  // Car helpers
  createCar(){
    const tx = 18, ty = SURFACE_Y - 1;
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const car = this.add.image(x, y, 'tex_moped_base').setDepth(4).setScale(2.1,1.4);
    const turretL = this.add.image(x-28, y-12, 'tex_cannon_barrel').setOrigin(0.1,0.5).setScale(1.0).setDepth(5);
    const turretR = this.add.image(x+28, y-12, 'tex_cannon_barrel').setOrigin(0.1,0.5).setScale(1.0).setDepth(5);
    const zone = this.add.zone(x, y, 120, 60);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    this.physics.add.overlap(this.player, zone, ()=>{
      this.nearCar = true;
  if (!this.car.prompt) this.car.prompt = this.add.text(0,0,'F/Alas: Auto', { fontFamily:'monospace', fontSize:'14px', color:'#fff', backgroundColor:'#0008' }).setPadding(4,2).setDepth(1000);
      this.car.prompt.setPosition(car.x, car.y - 38).setVisible(!this.car.mounted);
    }, null, this);
    this.car = { sprite: car, turrets: [turretL, turretR], mounted: false, zone, prompt: this.car.prompt||null };
  }

  // Plane helpers
  createPlane(){
    const tx = 22, ty = SURFACE_Y - 2;
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const plane = this.add.image(x, y, 'tex_moped_base').setDepth(4).setScale(2.4,1.2).setTint(0x99ccff);
    const turretL = this.add.image(x-28, y-14, 'tex_cannon_barrel').setOrigin(0.1,0.5).setScale(1.0).setDepth(5);
    const turretR = this.add.image(x+28, y-14, 'tex_cannon_barrel').setOrigin(0.1,0.5).setScale(1.0).setDepth(5);
    const zone = this.add.zone(x, y, 120, 60);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    this.physics.add.overlap(this.player, zone, ()=>{
      this.nearPlane = true;
      if (!this.plane.prompt) this.plane.prompt = this.add.text(0,0,'F/Alas: Lentokone', { fontFamily:'monospace', fontSize:'14px', color:'#fff', backgroundColor:'#0008' }).setPadding(4,2).setDepth(1000);
      this.plane.prompt.setPosition(plane.x, plane.y - 42).setVisible(!this.plane.mounted);
    }, null, this);
    this.plane = { sprite: plane, turrets: [turretL, turretR], mounted: false, zone, prompt: this.plane.prompt||null, speedMult: this.plane.speedMult||2.2 };
  }

  createMapGateway(){
    if (this.mapGateway) return;
    const inRedstoneWorld = this.mapType === 'redstone';
    const targetMap = inRedstoneWorld ? 'adventure' : 'redstone';
    const tx = 52;
    const ty = SURFACE_Y - 1;
    const x = tx * TILE + TILE / 2;
    const y = ty * TILE + TILE / 2;
    const art = this.add.graphics().setDepth(2);
    art.fillStyle(0x24070d, 0.95);
    art.fillRoundedRect(x - 54, y - 78, 108, 118, 18);
    art.lineStyle(5, 0xff3030, 0.95);
    art.strokeRoundedRect(x - 54, y - 78, 108, 118, 18);
    art.lineStyle(2, 0xffa0a0, 0.7);
    art.strokeRoundedRect(x - 44, y - 68, 88, 98, 14);
    const portal = this.add.image(x, y - 22, 'tex_portal_red').setScale(2.05).setDepth(7);
    const label = this.add.text(x, y - 112, inRedstoneWorld ? 'PORTAALI → SEIKKAILU' : 'PORTAALI → PUNAKIVI', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffe4e4',
      backgroundColor: '#260b12ee', padding: { x: 8, y: 5 }
    }).setOrigin(0.5).setDepth(10);
    const prompt = this.add.text(x, y + 70, inRedstoneWorld ? 'F / E: PALAA' : 'F / E: PUNAKIVI-MAAILMA', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
      backgroundColor: '#111827ee', padding: { x: 8, y: 5 }
    }).setOrigin(0.5).setDepth(10).setVisible(false);
    const zone = this.add.zone(x, y - 18, 112, 118);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zone.setData('type', 'map-gateway');
    this.physics.add.overlap(this.player, zone, ()=>{
      this.nearMapGateway = true;
      if (this.started && !this.isPaused) this.enterMapGateway();
    }, null, this);
    this.mapGateway = { tx, ty, x, y, art, portal, label, prompt, zone, targetMap };
  }

  enterMapGateway(){
    const gateway = this.mapGateway;
    if (!gateway || this._mapGatewayTraveling) return;
    this._mapGatewayTraveling = true;
    const spawn = { tx: 45, ty: SURFACE_Y - 2 };
    try {
      localStorage.setItem('UAG_mapType', gateway.targetMap);
      localStorage.setItem('UAG_mapSpawn', JSON.stringify(spawn));
    } catch(e) {}
    this.showToast(gateway.targetMap === 'redstone' ? 'Punakiviportaali avautuu…' : 'Palataan seikkailumaailmaan…');
    this.saveState();
    this.time.delayedCall(220, ()=> location.reload());
  }

  // A large walkable airship: the hull is decorative, while the cabin has
  // real static floor, walls, ceiling, windows, and a two-tile entrance.
  createAirship(){
    const leftTx = 10, rightTx = 44;
    // Keep the deck just above the surface so the player can reach the door
    // on foot; the balloon still rises high enough to look enormous.
    const balloonTopTy = SURFACE_Y - 16, cabinTopTy = SURFACE_Y - 11, floorTy = SURFACE_Y - 1;
    const centerX = ((leftTx + rightTx) / 2) * TILE + TILE / 2;
    const cabinLeft = leftTx * TILE;
    const cabinWidth = (rightTx - leftTx + 1) * TILE;
    const floorY = floorTy * TILE + TILE / 2;
    const solids = [];
    const art = this.add.graphics().setDepth(1);

    // Giant balloon envelope.
    art.fillStyle(0x5d2b79, 0.96);
    const balloonY = (balloonTopTy + 3.5) * TILE;
    art.fillEllipse(centerX, balloonY, cabinWidth * 0.96, TILE * 6.8);
    art.fillStyle(0xa9589b, 0.4);
    art.fillEllipse(centerX - 130, (balloonTopTy + 2.4) * TILE, cabinWidth * 0.52, TILE * 2.2);
    art.fillStyle(0xe7a6db, 0.28);
    art.fillEllipse(centerX - 285, balloonY - 18, cabinWidth * 0.22, TILE * 1.15);
    art.lineStyle(7, 0x281535, 0.95);
    art.strokeEllipse(centerX, balloonY, cabinWidth * 0.96, TILE * 6.8);
    art.lineStyle(2, 0xe6a7db, 0.52);
    for (let i = -4; i <= 4; i++) {
      const x = centerX + i * 118;
      art.lineBetween(x, (balloonTopTy + 0.8) * TILE, x + i * 8, (balloonTopTy + 6.2) * TILE);
    }
    // Balloon tail fins and a wide center band make the envelope read as a
    // real Zeppelin balloon instead of a flat decoration.
    art.fillStyle(0x402052, 0.96);
    art.fillTriangle(centerX + cabinWidth * 0.43, balloonY - 10, centerX + cabinWidth * 0.53, balloonY - 58, centerX + cabinWidth * 0.54, balloonY + 38);
    art.fillTriangle(centerX - cabinWidth * 0.43, balloonY - 10, centerX - cabinWidth * 0.53, balloonY - 58, centerX - cabinWidth * 0.54, balloonY + 38);
    art.fillStyle(0xd78ac8, 0.36);
    art.fillRect(centerX - 9, balloonY - 118, 18, 236);

    // Ropes and the large cabin below the balloon.
    art.lineStyle(4, 0xe7c27d, 0.9);
    art.lineBetween(leftTx * TILE + 100, (balloonTopTy + 6.2) * TILE, leftTx * TILE + 150, cabinTopTy * TILE);
    art.lineBetween(rightTx * TILE - 100, (balloonTopTy + 6.2) * TILE, rightTx * TILE - 150, cabinTopTy * TILE);
    art.fillStyle(0x152638, 0.98);
    art.fillRoundedRect(cabinLeft, (cabinTopTy - 0.35) * TILE, cabinWidth, (floorTy - cabinTopTy + 1.3) * TILE, 22);
    art.lineStyle(6, 0xe4b765, 0.95);
    art.strokeRoundedRect(cabinLeft, (cabinTopTy - 0.35) * TILE, cabinWidth, (floorTy - cabinTopTy + 1.3) * TILE, 22);
    // Boat-shaped lower hull, keel and two engine pods.
    art.fillStyle(0x0a1422, 0.98);
    art.beginPath();
    art.moveTo(cabinLeft + 24, floorY - 3);
    art.lineTo(cabinLeft + cabinWidth - 24, floorY - 3);
    art.lineTo(cabinLeft + cabinWidth - 92, floorY + 50);
    art.lineTo(cabinLeft + 92, floorY + 50);
    art.closePath();
    art.fillPath();
    art.lineStyle(4, 0xe4b765, 0.9);
    art.lineBetween(cabinLeft + 92, floorY + 50, cabinLeft + cabinWidth - 92, floorY + 50);
    for (const engineX of [cabinLeft + 170, cabinLeft + cabinWidth - 170]) {
      art.fillStyle(0x374b61, 1);
      art.fillRoundedRect(engineX - 42, floorY + 26, 84, 28, 10);
      art.fillStyle(0x67e8f9, 0.9);
      art.fillCircle(engineX - 22, floorY + 40, 6);
      art.fillCircle(engineX + 22, floorY + 40, 6);
      art.lineStyle(3, 0xa5f3fc, 0.85);
      art.lineBetween(engineX - 50, floorY + 62, engineX + 50, floorY + 62);
    }

    // Long rows of windows make the scale of the ship readable.
    for (let tx = leftTx + 2; tx <= rightTx - 2; tx += 3) {
      const wx = tx * TILE + TILE / 2;
      const wy = (cabinTopTy + 2) * TILE + TILE / 2;
      art.fillStyle(0x7dd3fc, 0.78); art.fillCircle(wx, wy, 13);
      art.lineStyle(2, 0xe0f2fe, 0.85); art.strokeCircle(wx, wy, 15);
    }

    // Interior deck, ceiling, side walls, and a two-tile door on the left.
    const addSolid = (tx, ty, textureKey) => {
      const tile = this.platforms.create(tx * TILE + TILE / 2, ty * TILE + TILE / 2, textureKey);
      tile.refreshBody(); tile.setDepth(3); tile.setData('airshipInterior', true);
      solids.push(tile);
      return tile;
    };
    for (let tx = leftTx + 1; tx < rightTx; tx++) addSolid(tx, floorTy, 'tex_airship_floor');
    for (let tx = leftTx + 1; tx < rightTx; tx++) addSolid(tx, cabinTopTy, 'tex_airship_wall');
    for (let ty = cabinTopTy + 1; ty < floorTy; ty++) {
      if (ty !== floorTy - 1 && ty !== floorTy - 2) addSolid(leftTx, ty, 'tex_airship_wall');
      addSolid(rightTx, ty, 'tex_airship_wall');
    }

    // Docking walkway leading to the large entrance.
    for (let tx = leftTx - 6; tx <= leftTx; tx++) addSolid(tx, floorTy, 'tex_airship_floor');
    for (let i = 0; i < 4; i++) addSolid(leftTx - 7 + i, floorTy + 1 + Math.floor((3 - i) / 2), 'tex_airship_wall');

    // Interior decorations: cockpit, cargo crates, and a clear walking aisle.
    art.fillStyle(0x0b1624, 0.92);
    art.fillRoundedRect((rightTx - 8) * TILE, (cabinTopTy + 3) * TILE, 6 * TILE, 3 * TILE, 12);
    art.lineStyle(3, 0x67e8f9, 0.8);
    art.strokeRoundedRect((rightTx - 8) * TILE, (cabinTopTy + 3) * TILE, 6 * TILE, 3 * TILE, 12);
    art.fillStyle(0x67e8f9, 0.7);
    for (let i = 0; i < 5; i++) art.fillRect((rightTx - 7) * TILE + i * 34, (cabinTopTy + 4) * TILE, 18, 8);
    for (const tx of [leftTx + 4, leftTx + 7, leftTx + 10]) {
      art.fillStyle(0x9a5b35, 1); art.fillRect(tx * TILE, (floorTy - 3) * TILE, TILE * 1.2, TILE * 1.2);
      art.lineStyle(2, 0xf0b477, 0.8); art.strokeRect(tx * TILE, (floorTy - 3) * TILE, TILE * 1.2, TILE * 1.2);
    }
    art.fillStyle(0xffd34e, 0.85); art.fillCircle((leftTx + 2) * TILE + 20, (floorTy - 0.6) * TILE, 5);
    art.fillStyle(0x67e8f9, 0.85); art.fillCircle((rightTx - 3) * TILE + 20, (floorTy - 0.6) * TILE, 5);

    const titleText = this.add.text(centerX, (cabinTopTy + 0.25) * TILE, 'SUURI ILMALAIVA · PALLO + LAIVAHYTTI', {
      fontFamily: 'monospace', fontSize: '18px', color: '#fff3c4', backgroundColor: '#172033dd', padding: { x: 10, y: 6 }
    }).setOrigin(0.5, 0).setDepth(10);
    const cargoText = this.add.text((leftTx + 5) * TILE, (floorTy - 4.7) * TILE, 'RAHTI', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f0b477', backgroundColor: '#111827cc', padding: { x: 6, y: 4 }
    }).setDepth(10);
    const cockpitText = this.add.text((rightTx - 5) * TILE, (cabinTopTy + 3.25) * TILE, 'OHJAAMO', {
      fontFamily: 'monospace', fontSize: '14px', color: '#a5f3fc', backgroundColor: '#111827cc', padding: { x: 6, y: 4 }
    }).setDepth(10);

    const entranceZone = this.add.zone((leftTx + 0.65) * TILE, (floorTy - 0.6) * TILE, TILE * 1.5, TILE * 2.2);
    this.physics.world.enable(entranceZone, Phaser.Physics.Arcade.STATIC_BODY);
    const prompt = this.add.text((leftTx - 1.2) * TILE, (floorTy - 3.2) * TILE, 'F: HYTTIIN →', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', backgroundColor: '#111827cc', padding: { x: 6, y: 4 }
    }).setDepth(10).setVisible(false);
    const controlZone = this.add.zone((rightTx - 4) * TILE, (cabinTopTy + 4.5) * TILE, TILE * 5, TILE * 3);
    this.physics.world.enable(controlZone, Phaser.Physics.Arcade.STATIC_BODY);
    const controlPrompt = this.add.text((rightTx - 7) * TILE, (cabinTopTy + 2.2) * TILE, 'F/E: OHJAA ILMALAIVAA', {
      fontFamily: 'monospace', fontSize: '13px', color: '#a5f3fc', backgroundColor: '#0f172eee', padding: { x: 6, y: 4 }
    }).setDepth(10).setVisible(false);
    const controlHint = this.add.text(14, 52, 'ILMALAIVA OHJATTAVANA\nA/D tai ←/→ = liiku\nW/S tai ↑/↓ = ylös/alas\nF = poistu kyydistä', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffffff', backgroundColor: '#0f172eee',
      padding: { x: 10, y: 8 }, lineSpacing: 4
    }).setScrollFactor(0).setDepth(1100).setVisible(false);
    this.physics.add.overlap(this.player, entranceZone, () => prompt.setAlpha(1), null, this);
    this.airship = {
      art, solids, entranceZone, controlZone, prompt, controlPrompt, leftTx, rightTx, floorTy,
      controlHint,
      parts: [art, titleText, cargoText, cockpitText, entranceZone, controlZone, prompt, controlPrompt, ...solids],
      mounted: false, inside: false, offsetX: 0, offsetY: 0
    };
    this.landmarks.push({
      id: 'airship',
      name: 'Ilmalaiva',
      description: 'Oikea suuri ilmalaiva: pallo, laivahytti, ohjaamo ja sisäänkäynti',
      x: (leftTx + 2) * TILE + TILE / 2,
      y: floorTy * TILE - 30
    });
  }

  // Five more oversized landmarks. Every one has a real floor, ceiling,
  // side walls and an open entrance so the player can walk through it.
  createFiveBigLandmarks(){
    const specs = [
      { id: 'castle', name: 'Kuninkaan linna', description: 'Valtava linna torneineen', centerTx: 74, kind: 'castle' },
      { id: 'pyramid', name: 'Aavikon pyramidi', description: 'Iso kultainen pyramidisali', centerTx: 115, kind: 'pyramid' },
      { id: 'treehouse', name: 'Jättipuun kylä', description: 'Suuri puukylä ja latvahuone', centerTx: 156, kind: 'treehouse' },
      { id: 'crystal', name: 'Kristallitemppeli', description: 'Loistava temppeli ja kristallihalli', centerTx: 197, kind: 'crystal' },
      { id: 'station', name: 'Avaruusasema', description: 'Iso neonasema ja ohjaamo', centerTx: 238, kind: 'station' }
    ];
    specs.forEach((spec) => this.createBigLandmark(spec));
  }

  createBigLandmark(spec){
    const floorTy = SURFACE_Y - 1;
    const width = 24;
    const height = 8;
    const leftTx = spec.centerTx - Math.floor(width / 2);
    const rightTx = leftTx + width - 1;
    const topTy = floorTy - height;
    const centerX = ((leftTx + rightTx) / 2) * TILE + TILE / 2;
    const art = this.add.graphics().setDepth(1);
    const solids = [];

    const addSolid = (tx, ty, textureKey) => {
      const tile = this.platforms.create(tx * TILE + TILE / 2, ty * TILE + TILE / 2, textureKey);
      tile.refreshBody();
      tile.setDepth(3);
      tile.setData('bigLandmark', spec.id);
      solids.push(tile);
      return tile;
    };

    // Room geometry: leave a three-tile doorway in the left wall.
    for (let tx = leftTx + 1; tx < rightTx; tx++) {
      addSolid(tx, floorTy, 'tex_airship_floor');
      addSolid(tx, topTy, 'tex_airship_wall');
    }
    for (let ty = topTy + 1; ty < floorTy; ty++) {
      if (ty < floorTy - 2) addSolid(leftTx, ty, 'tex_airship_wall');
      addSolid(rightTx, ty, 'tex_airship_wall');
    }
    // Big steps rise from the terrain to the doorway.
    for (let i = 0; i < 5; i++) {
      addSolid(leftTx - 5 + i, floorTy + (i < 2 ? 1 : i === 2 ? 0 : -1), 'tex_airship_floor');
    }

    const x = leftTx * TILE;
    const y = topTy * TILE;
    const w = width * TILE;
    const h = (height + 1) * TILE;
    const palette = {
      castle: { body: 0x243b64, edge: 0xf4c95d, glow: 0xffe7a1 },
      pyramid: { body: 0x9a641d, edge: 0xffd166, glow: 0xfff0a8 },
      treehouse: { body: 0x3c6e47, edge: 0x9ed36a, glow: 0xd9f99d },
      crystal: { body: 0x3c286b, edge: 0xd8b4fe, glow: 0x67e8f9 },
      station: { body: 0x164e63, edge: 0x67e8f9, glow: 0xf0abfc }
    }[spec.kind];

    art.fillStyle(palette.body, 0.97);
    art.fillRoundedRect(x + 8, y + 12, w - 16, h - 8, 22);
    art.lineStyle(6, palette.edge, 0.95);
    art.strokeRoundedRect(x + 8, y + 12, w - 16, h - 8, 22);
    art.lineStyle(2, palette.glow, 0.5);
    for (let i = 1; i < 5; i++) art.lineBetween(x + i * w / 5, y + 28, x + i * w / 5, y + h - 18);

    if (spec.kind === 'castle') {
      art.fillStyle(0x1e3155, 1);
      for (const towerTx of [leftTx - 1, rightTx - 4]) {
        art.fillRect(towerTx * TILE, (topTy - 2) * TILE, TILE * 5, TILE * 3);
        for (let i = 0; i < 3; i++) art.fillRect((towerTx + i * 2) * TILE, (topTy - 3) * TILE, TILE, TILE);
      }
      art.fillStyle(0xf97316, 0.95);
      art.fillTriangle(centerX, (topTy - 4) * TILE, centerX, (topTy - 1) * TILE, centerX + 64, (topTy - 2.5) * TILE);
      art.fillStyle(0x111827, 0.95);
      art.fillRoundedRect(centerX - 26, (floorTy - 4) * TILE, 52, 92, 20);
    } else if (spec.kind === 'pyramid') {
      art.fillStyle(0xe6a83f, 0.95);
      art.fillTriangle(centerX, (topTy - 5) * TILE, x + 16, (floorTy + 0.5) * TILE, x + w - 16, (floorTy + 0.5) * TILE);
      art.lineStyle(5, 0xffe08a, 0.8);
      for (let i = 1; i < 5; i++) art.lineBetween(centerX, (topTy - 5) * TILE, x + i * w / 5, (floorTy + 0.5) * TILE);
      art.fillStyle(0x2b1a09, 0.9);
      art.fillRoundedRect(centerX - 30, (floorTy - 4) * TILE, 60, 94, 18);
    } else if (spec.kind === 'treehouse') {
      art.fillStyle(0x6b4226, 1);
      art.fillRoundedRect(centerX - 36, (floorTy - 7) * TILE, 72, 8 * TILE, 28);
      art.fillStyle(0x65a30d, 0.98);
      art.fillEllipse(centerX - 130, (topTy - 1.2) * TILE, 230, 150);
      art.fillEllipse(centerX + 20, (topTy - 2) * TILE, 300, 180);
      art.fillEllipse(centerX + 170, (topTy - 1.2) * TILE, 230, 150);
      art.fillStyle(0xd9f99d, 0.8);
      art.fillCircle(centerX - 90, (topTy - 2.5) * TILE, 14);
      art.fillCircle(centerX + 95, (topTy - 1.8) * TILE, 12);
    } else if (spec.kind === 'crystal') {
      art.fillStyle(0x8b5cf6, 0.9);
      for (let i = 0; i < 7; i++) {
        const cx = x + 40 + i * (w - 80) / 6;
        const base = (floorTy + 0.2) * TILE;
        const peak = (topTy - 1 - (i % 3)) * TILE;
        art.fillTriangle(cx, peak, cx - 30, base, cx + 30, base);
      }
      art.fillStyle(0x67e8f9, 0.82);
      art.fillCircle(centerX, (topTy + 1.8) * TILE, 26);
    } else if (spec.kind === 'station') {
      art.fillStyle(0x0f172a, 0.96);
      art.fillEllipse(centerX, (topTy - 2.2) * TILE, w * 0.92, 100);
      art.lineStyle(9, 0x67e8f9, 0.86);
      art.strokeEllipse(centerX, (topTy - 2.2) * TILE, w * 0.92, 100);
      art.lineStyle(4, 0xf0abfc, 0.8);
      art.lineBetween(centerX - w / 2, (topTy - 2.2) * TILE, centerX + w / 2, (topTy - 2.2) * TILE);
      art.fillStyle(0xf0abfc, 0.9);
      for (let i = 0; i < 6; i++) art.fillCircle(x + 50 + i * 82, (topTy + 2.2) * TILE, 7);
    }

    // A bright inner aisle makes the walkable area obvious from outside.
    art.fillStyle(palette.glow, 0.7);
    art.fillRect(x + TILE * 4, (floorTy - 0.35) * TILE, w - TILE * 8, 7);
    this.add.text(centerX, (topTy - 0.9) * TILE, spec.name.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '17px', color: '#ffffff', backgroundColor: '#111827dd',
      padding: { x: 9, y: 5 }
    }).setOrigin(0.5, 1).setDepth(10);

    this.landmarks.push({
      id: spec.id,
      name: spec.name,
      description: spec.description,
      x: (leftTx + 2) * TILE + TILE / 2,
      y: floorTy * TILE - 30
    });
  }

  setupLandmarkListUI(){
    const list = document.getElementById('landmarkList');
    if (!list) return;
    list.innerHTML = '';
    this.landmarks.forEach((landmark, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${index + 1}. ${landmark.name}`;
      button.title = landmark.description;
      button.addEventListener('click', () => this.goToLandmark(index));
      list.appendChild(button);
    });
  }

  goToLandmark(index){
    const landmark = this.landmarks[index];
    if (!landmark || !this.player) return;
    this.player.setPosition(landmark.x, landmark.y);
    this.player.body?.setVelocity(0, 0);
    document.getElementById('settingsMenu')?.classList.add('hidden');
    this.showToast?.(`${landmark.name}: olet sisäänkäynnillä`);
  }

  getAdventureQuestDefs(){
    return [
      { id: 'wood', event: 'wood', name: 'Puunkerääjä', target: 5, reward: 40, rewardCoins: 5 },
      { id: 'mine', event: 'mine', name: 'Kaivostyöläinen', target: 8, reward: 55, rewardCoins: 7 },
      { id: 'build', event: 'build', name: 'Rakentaja', target: 3, reward: 45, rewardCoins: 6 },
      { id: 'chest', event: 'chest', name: 'Aarrejahti', target: 2, reward: 70, rewardCoins: 12 },
      { id: 'checkpoint', event: 'checkpoint', name: 'Turvapaikat', target: 2, reward: 65, rewardCoins: 10 },
      { id: 'crystal', event: 'crystal', name: 'Voimankerääjä', target: 3, reward: 80, rewardCoins: 14 },
      { id: 'airship', event: 'airship', name: 'Ilmalaivakapteeni', target: 500, reward: 100, rewardCoins: 20 }
    ];
  }

  createAdventureFeatures(){
    this.adventureChests = [];
    this.adventureCrystals = [];
    this.adventureCheckpoints = [];
    const chestPositions = [6, 51, 97, 140, 181, 220, 280];
    chestPositions.forEach((tx, index) => this.createAdventureChest(`chest-${index + 1}`, tx, index % 3));
    const crystalPositions = [16, 56, 108, 169, 211, 264];
    crystalPositions.forEach((tx, index) => this.createPowerCrystal(`crystal-${index + 1}`, tx, index % 3));
    const checkpointPositions = [4, 76, 158, 240];
    checkpointPositions.forEach((tx, index) => this.createAdventureCheckpoint(`checkpoint-${index + 1}`, tx, index === 0 ? 'Aloitusleiri' : `Checkpoint ${index}`));
    this.setupAdventureUI();
    this.updateAdventureUI();
  }

  createAdventureChest(id, tx, styleIndex = 0){
    if (this.adventureProgress.openedChests.includes(id)) return;
    const x = tx * TILE + TILE / 2;
    const y = (SURFACE_Y - 1) * TILE + TILE / 2 - 20;
    const colors = [0xc084fc, 0xf59e0b, 0x38bdf8];
    const art = this.add.graphics().setDepth(8);
    art.fillStyle(0x713f12, 1); art.fillRoundedRect(x - 20, y - 10, 40, 25, 5);
    art.fillStyle(colors[styleIndex], 1); art.fillRect(x - 22, y - 13, 44, 8);
    art.fillStyle(0xfde68a, 1); art.fillRect(x - 3, y - 13, 6, 28);
    art.lineStyle(2, 0x2b1607, 1); art.strokeRoundedRect(x - 20, y - 10, 40, 25, 5);
    const label = this.add.text(x, y - 25, 'AARRE', {
      fontFamily: 'monospace', fontSize: '11px', color: '#fff7cc', stroke: '#111827', strokeThickness: 3
    }).setOrigin(0.5, 1).setDepth(12);
    this.adventureChests.push({ id, x, y, art, label, opened: false });
  }

  createAdventureCheckpoint(id, tx, name){
    const x = tx * TILE + TILE / 2;
    const y = (SURFACE_Y - 1) * TILE + TILE / 2;
    const art = this.add.graphics().setDepth(7);
    art.fillStyle(0x334155, 1); art.fillRect(x - 3, y - 70, 6, 70);
    art.fillStyle(0x22d3ee, 0.95); art.fillTriangle(x, y - 70, x + 42, y - 55, x, y - 40);
    art.fillStyle(0xf8fafc, 0.8); art.fillCircle(x, y - 76, 7);
    const active = this.adventureProgress.activatedCheckpoints.includes(id);
    const label = this.add.text(x, y - 92, active ? `${name} ✓` : name, {
      fontFamily: 'monospace', fontSize: '11px', color: active ? '#bbf7d0' : '#cffafe',
      backgroundColor: '#0f172dcc', padding: { x: 5, y: 3 }
    }).setOrigin(0.5, 1).setDepth(12);
    this.adventureCheckpoints.push({ id, name, x, y, art, label, active });
  }

  createPowerCrystal(id, tx, styleIndex = 0){
    if (this.adventureProgress.collectedCrystals.includes(id)) return;
    const x = tx * TILE + TILE / 2;
    const y = (SURFACE_Y - 2) * TILE + TILE / 2;
    const colors = [0x67e8f9, 0xf0abfc, 0xa3e635];
    const art = this.add.graphics().setDepth(8);
    art.fillStyle(colors[styleIndex], 0.95);
    art.fillTriangle(x, y - 25, x - 16, y + 18, x + 16, y + 18);
    art.fillStyle(0xffffff, 0.6); art.fillTriangle(x, y - 17, x - 3, y + 9, x + 7, y + 7);
    art.lineStyle(2, 0xffffff, 0.75); art.strokeTriangle(x, y - 25, x - 16, y + 18, x + 16, y + 18);
    const label = this.add.text(x, y - 32, 'VOIMA', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff', stroke: '#111827', strokeThickness: 3
    }).setOrigin(0.5, 1).setDepth(12);
    this.adventureCrystals.push({ id, x, y, art, label, styleIndex, collected: false });
  }

  setupAdventureUI(){
    const questBtn = document.getElementById('questBtn');
    const mapBtn = document.getElementById('mapBtn');
    const dailyBtn = document.getElementById('dailyRewardBtn');
    const questPanel = document.getElementById('questPanel');
    const mapPanel = document.getElementById('mapPanel');
    questBtn && (questBtn.onclick = () => {
      questPanel?.classList.toggle('hidden'); mapPanel?.classList.add('hidden'); this.updateAdventureUI();
    });
    mapBtn && (mapBtn.onclick = () => {
      mapPanel?.classList.toggle('hidden'); questPanel?.classList.add('hidden'); this.updateAdventureUI();
    });
    dailyBtn && (dailyBtn.onclick = () => this.claimDailyReward());
    const list = document.getElementById('mapLandmarks');
    if (list) {
      list.innerHTML = '';
      this.landmarks.forEach((landmark, index) => {
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = `📍 ${landmark.name}`;
        button.title = landmark.description;
        button.onclick = () => { this.goToLandmark(index); document.getElementById('mapPanel')?.classList.add('hidden'); };
        list.appendChild(button);
      });
    }
  }

  updateAdventureUI(){
    const progress = this.adventureProgress;
    const currentLevel = Math.max(1, progress.level || 1);
    const needed = 100 + (currentLevel - 1) * 50;
    const levelHud = document.getElementById('levelHud');
    if (levelHud) levelHud.textContent = `Taso ${currentLevel} · XP ${Math.floor(progress.xp || 0)}/${needed}`;
    const questList = document.getElementById('questList');
    if (questList) {
      questList.innerHTML = '';
      this.getAdventureQuestDefs().forEach((quest) => {
        const value = Math.min(quest.target, progress.quests[quest.id] || 0);
        const done = progress.completedQuests.includes(quest.id);
        const row = document.createElement('div');
        row.className = `quest-row${done ? ' done' : ''}`;
        row.innerHTML = `<strong>${done ? '✓ ' : ''}${quest.name}</strong><span>${value}/${quest.target} · +${quest.reward} XP · +${quest.rewardCoins} kolikkoa</span>`;
        questList.appendChild(row);
      });
    }
    const dailyBtn = document.getElementById('dailyRewardBtn');
    if (dailyBtn) dailyBtn.textContent = progress.dailyClaimed === this.getAdventureDate() ? '🎁 Palkinto saatu' : '🎁 Päiväpalkinto';
    const mapStatus = document.getElementById('mapStatus');
    if (mapStatus && this.player) {
      const nearest = this.landmarks.reduce((best, landmark) => {
        const distance = Math.round(Math.hypot(this.player.x - landmark.x, this.player.y - landmark.y) / TILE);
        return !best || distance < best.distance ? { landmark, distance } : best;
      }, null);
      mapStatus.textContent = nearest ? `Lähin kohde: ${nearest.landmark.name} (${nearest.distance} blokkia)` : 'Sijainti: aloitus';
    }
  }

  getAdventureDate(){
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  claimDailyReward(){
    if (this.adventureProgress.dailyClaimed === this.getAdventureDate()) {
      this.showToast('Päiväpalkinto on jo haettu tänään'); return;
    }
    this.adventureProgress.dailyClaimed = this.getAdventureDate();
    this.state.coins += 25;
    this.inv.wood += 8; this.inv.stone += 5;
    this.addAdventureXp(60);
    this.showToast('Päiväpalkinto: +25 kolikkoa, puuta ja kiveä!');
    this.updateUI(); this.saveState();
  }

  addAdventureXp(amount = 0){
    const progress = this.adventureProgress;
    progress.xp = Math.max(0, (progress.xp || 0) + Math.max(0, amount));
    let needed = 100 + ((progress.level || 1) - 1) * 50;
    while (progress.xp >= needed) {
      progress.xp -= needed;
      progress.level = Math.max(1, (progress.level || 1) + 1);
      this.state.coins += progress.level * 3;
      this.state.health = MAX_HEALTH;
      this.showToast(`TASO ${progress.level}! +${progress.level * 3} kolikkoa`);
      needed = 100 + (progress.level - 1) * 50;
    }
    this.updateAdventureUI();
  }

  recordAdventureEvent(event, amount = 1){
    if (!(amount > 0)) return;
    const progress = this.adventureProgress;
    progress.stats[event] = (progress.stats[event] || 0) + Math.max(0, amount);
    this.getAdventureQuestDefs().forEach((quest) => {
      if (quest.event !== event || progress.completedQuests.includes(quest.id)) return;
      const value = Math.min(quest.target, progress.stats[event]);
      progress.quests[quest.id] = value;
      if (value >= quest.target) {
        progress.completedQuests.push(quest.id);
        this.state.coins += quest.rewardCoins;
        this.addAdventureXp(quest.reward);
        this.showToast(`Tehtävä valmis: ${quest.name}!`);
      }
    });
    this.updateAdventureUI();
  }

  openAdventureChest(chest){
    if (!chest || chest.opened) return;
    chest.opened = true;
    if (!this.adventureProgress.openedChests.includes(chest.id)) this.adventureProgress.openedChests.push(chest.id);
    chest.art?.destroy(); chest.label?.destroy();
    const coins = 12 + Phaser.Math.Between(0, 18);
    this.state.coins += coins; this.inv.wood += 3; this.inv.stone += 2;
    this.recordAdventureEvent('chest'); this.addAdventureXp(20);
    this.showToast(`Aarrearkku avattu! +${coins} kolikkoa, puuta ja kiveä`);
    this.nearTreasureChest = null;
    this.updateUI(); this.saveState(); window.playSfx?.('pickup');
  }

  activateAdventureCheckpoint(checkpoint){
    if (!checkpoint) return;
    const firstActivation = !checkpoint.active;
    checkpoint.active = true;
    checkpoint.label?.setText(`${checkpoint.name} ✓`).setColor('#bbf7d0');
    this.respawnPoint = { x: checkpoint.x, y: checkpoint.y - 44 };
    this.adventureProgress.respawn = { ...this.respawnPoint };
    if (firstActivation) {
      this.adventureProgress.activatedCheckpoints.push(checkpoint.id);
      this.recordAdventureEvent('checkpoint'); this.addAdventureXp(25);
      this.showToast(`${checkpoint.name} aktivoitu — uusi paluu-paikka`);
    } else this.showToast(`${checkpoint.name} on jo aktiivinen`);
    this.state.health = MAX_HEALTH;
    this.nearCheckpoint = null;
    this.updateUI(); this.saveState();
  }

  collectPowerCrystal(crystal){
    if (!crystal || crystal.collected) return;
    crystal.collected = true;
    if (!this.adventureProgress.collectedCrystals.includes(crystal.id)) this.adventureProgress.collectedCrystals.push(crystal.id);
    crystal.art?.destroy(); crystal.label?.destroy();
    const power = crystal.styleIndex === 0 ? 'speed' : crystal.styleIndex === 1 ? 'shield' : 'flight';
    if (power === 'speed') this.itemBag.speedUntil = this.time.now + 12000;
    else if (power === 'shield') this.itemBag.shieldUntil = this.time.now + 10000;
    else this.state.canFly = true;
    this.recordAdventureEvent('crystal'); this.addAdventureXp(15);
    this.showToast(power === 'flight' ? 'Voimakristalli: LENTO AVATTU!' : `Voimakristalli: ${power === 'speed' ? 'nopeus' : 'suoja'} 12 sekuntia`);
    this.updateUI(); this.saveState();
  }

  updateAdventureFeatures(){
    if (!this.player) return;
    if (this.time.now < this._nextAdventureFeatureAt) return;
    this._nextAdventureFeatureAt = this.time.now + (this.performanceMode ? 120 : 55);
    this.nearTreasureChest = this.adventureChests.find((chest) => !chest.opened && Math.abs(this.player.x - chest.x) < 82 && Math.abs(this.player.y - chest.y) < 95) || null;
    this.adventureChests.forEach((chest) => chest.label?.setText(this.nearTreasureChest === chest ? 'F: AARRE' : 'AARRE').setVisible(!chest.opened && this.nearTreasureChest === chest));
    this.nearCheckpoint = this.adventureCheckpoints.find((checkpoint) => Math.abs(this.player.x - checkpoint.x) < 95 && Math.abs(this.player.y - checkpoint.y) < 105) || null;
    this.adventureCheckpoints.forEach((checkpoint) => {
      checkpoint.label?.setText(this.nearCheckpoint === checkpoint ? `F: ${checkpoint.name}` : `${checkpoint.name}${checkpoint.active ? ' ✓' : ''}`);
      checkpoint.label?.setAlpha(this.nearCheckpoint === checkpoint ? 1 : 0.82);
    });
    this.adventureCrystals.forEach((crystal) => {
      if (!crystal.collected && Math.hypot(this.player.x - crystal.x, this.player.y - crystal.y) < 46) this.collectPowerCrystal(crystal);
      if (!crystal.collected) crystal.art?.setAlpha(0.82 + Math.sin(this.time.now * 0.005 + crystal.x) * 0.15);
    });
    if (this.time.now >= this._adventureUiNextAt) {
      this._adventureUiNextAt = this.time.now + (this.performanceMode ? 900 : 700);
      const minimap = document.getElementById('minimapStatus');
      if (minimap) {
        const chest = this.adventureChests.filter((item) => !item.opened).sort((a, b) => Math.hypot(this.player.x - a.x, this.player.y - a.y) - Math.hypot(this.player.x - b.x, this.player.y - b.y))[0];
        const checkpoint = this.adventureCheckpoints.filter((item) => !item.active).sort((a, b) => Math.hypot(this.player.x - a.x, this.player.y - a.y) - Math.hypot(this.player.x - b.x, this.player.y - b.y))[0];
        const lines = [`X: ${Math.round(this.player.x / TILE)}  Y: ${Math.round(this.player.y / TILE)}`];
        if (chest) lines.push(`Arkku: ${Math.round(Math.hypot(this.player.x - chest.x, this.player.y - chest.y) / TILE)} blk`);
        if (checkpoint) lines.push(`Checkpoint: ${Math.round(Math.hypot(this.player.x - checkpoint.x, this.player.y - checkpoint.y) / TILE)} blk`);
        minimap.textContent = lines.join('\n');
      }
      this.updateAdventureUI();
    }
  }

  respawnAtCheckpoint(){
    const point = this.respawnPoint || this.adventureProgress.respawn || { x: 100, y: 100 };
    this.player.setPosition(point.x, point.y);
    this.player.setVelocity(0, 0);
    this.state.health = Math.max(1, this.state.health);
    this.showToast('Palasit checkpointille');
  }

  setPerformanceMode(enabled, persist = false){
    const next = !!enabled;
    const changed = this.performanceMode !== next;
    this.performanceMode = next;
    this._nextMobHealthUiAt = 0;
    this._nextGiftBoxUpdateAt = 0;
    this._nextAdventureFeatureAt = 0;
    const checkbox = document.getElementById('lowPerformanceMode');
    if (checkbox) checkbox.checked = next;
    if (this.player && changed) this.ensureChunksAround(this.player.x);
    if (changed) this.showToast(next ? 'Kevyt tila päällä — peli on kevyempi' : 'Kevyt tila pois päältä');
    if (persist) this.saveState();
  }

  // Tank helpers
  createTank(){
    const tx = 26, ty = SURFACE_Y - 1;
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const base = this.add.image(x, y, 'tex_tank_base').setDepth(4);
    const turret = this.add.image(x, y-12, 'tex_tank_turret').setDepth(5).setOrigin(0.18,0.5);
    const zone = this.add.zone(x, y, 120, 60);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    this.physics.add.overlap(this.player, zone, ()=>{
      this.nearTank = true;
      if (!this.tankPrompt) this.tankPrompt = this.add.text(0,0,'F/Alas: Tankki', { fontFamily:'monospace', fontSize:'14px', color:'#fff', backgroundColor:'#0008' }).setPadding(4,2).setDepth(1000);
      this.tankPrompt.setPosition(base.x, base.y - 40).setVisible(!this.tank?.mounted);
    }, null, this);
    this.tank = { sprite: base, turret, mounted: false, zone, prompt: this.tankPrompt||null };
  }
  toggleTank(){
    if (!this.tank) return;
    this.tank.mounted = !this.tank.mounted;
    const t = this.tank;
    if (t.mounted) {
      t.prompt?.setVisible(false);
      t.sprite.setPosition(this.player.x, this.player.y+10);
      t.turret.setPosition(t.sprite.x, t.sprite.y-12).setVisible(true);
      // keep player visible above
      this.player.setVisible(true).setDepth(6);
      t.sprite.setDepth(4); t.turret.setDepth(5);
      this.showToast('Tankki: Kyytiin');
    } else {
      t.sprite.setPosition(this.player.x, this.player.y+10);
      t.turret.setPosition(t.sprite.x, t.sprite.y-12).setVisible(true);
      this.player.setVisible(true).setDepth(6);
      this.showToast('Tankki: Poistuit');
    }
  }

  moveAirshipBy(dx, dy){
    const airship = this.airship;
    if (!airship?.mounted) return;
    const worldH = WORLD_TILES_Y * TILE;
    const nextOffsetY = Phaser.Math.Clamp((airship.offsetY || 0) + dy, -900, worldH - 2600);
    const actualDy = nextOffsetY - (airship.offsetY || 0);
    airship.offsetX = (airship.offsetX || 0) + dx;
    airship.offsetY = nextOffsetY;
    if (Math.abs(dx) < 0.001 && Math.abs(actualDy) < 0.001) return;

    for (const part of airship.parts || []) {
      if (!part?.active) continue;
      part.setPosition(part.x + dx, part.y + actualDy);
      if (part.body?.updateFromGameObject) part.body.updateFromGameObject();
    }
    this.player.setPosition(this.player.x + dx, this.player.y + actualDy);
    this.player.body?.updateFromGameObject?.();
  }

  updateAirshipControl(left, right, up, down){
    if (!this.airship?.mounted) return;
    const dt = Math.max(1, this.game.loop.delta || 16.67) / 1000;
    const speed = 300;
    const verticalSpeed = 230;
    // Read the keys again here as a fallback: some browsers can briefly lose
    // the Phaser key state while the cabin UI has focus.
    const leftNow = !!(left || this.cursors?.left?.isDown || this.keys?.A?.isDown || this.touchState?.left);
    const rightNow = !!(right || this.cursors?.right?.isDown || this.keys?.D?.isDown || this.touchState?.right);
    const upNow = !!(up || this.cursors?.up?.isDown || this.keys?.W?.isDown || this.touchState?.jump);
    const downNow = !!(down || this.cursors?.down?.isDown || this.keys?.S?.isDown);
    const dx = (rightNow ? speed : 0) * dt - (leftNow ? speed : 0) * dt;
    const dy = (downNow ? verticalSpeed : 0) * dt - (upNow ? verticalSpeed : 0) * dt;
    this.moveAirshipBy(dx, dy);
    this.recordAdventureEvent('airship', Math.round(Math.hypot(dx, dy)));
  }

  enterAirshipCabin(){
    const airship = this.airship;
    if (!airship || airship.mounted || airship.inside || !this.nearAirship) return;
    if (this.moped?.mounted) this.toggleMoped();
    if (this.car?.mounted) this.toggleCar();
    if (this.tank?.mounted) this.toggleTank();
    if (this.plane?.mounted) this.togglePlane();
    airship.inside = true;
    this.nearAirship = false;
    this.nearAirshipEntrance = false;
    this.player.body.checkCollision.none = false;
    this.player.body.setAllowGravity(true);
    this.player.setGravityY(900);
    this.player.setVelocity(0, 0);
    this.player.setPosition(airship.entranceZone.x + TILE * 2.2, airship.floorTy * TILE - 20);
    this.player.setDepth(6);
    airship.prompt?.setVisible(false);
    this.showToast('Meni ilmalaivan hyttiin — kävele OHJAAMOON ja paina F tai E');
  }

  exitAirshipCabin(){
    const airship = this.airship;
    if (!airship?.inside) return;
    airship.inside = false;
    airship.controlPrompt?.setVisible(false);
    this.nearAirshipEntrance = false;
    this.nearAirshipControl = false;
    this.player.body.checkCollision.none = false;
    this.player.body.setAllowGravity(true);
    this.player.setGravityY(900);
    this.player.setVelocity(0, 0);
    this.player.setPosition(airship.entranceZone.x - TILE, airship.floorTy * TILE - 20);
    this.showToast('Poistuit ilmalaivan hytistä');
  }

  toggleAirship(){
    const airship = this.airship;
    if (!airship) return;
    if (airship.mounted) {
      airship.mounted = false;
      airship.inside = false;
      this.nearAirshipEntrance = false;
      airship.prompt?.setVisible(false);
      airship.controlPrompt?.setVisible(false);
      airship.controlHint?.setVisible(false);
      if (this.col_player_platforms) this.col_player_platforms.active = true;
      this.player.body.checkCollision.none = false;
      this.player.body.setAllowGravity(true);
      this.player.setGravityY(900);
      this.player.setVelocity(0, 0);
      this.player.setPosition(airship.entranceZone.x - TILE, airship.entranceZone.y - 24);
      this.showToast('Ilmalaiva: poistuit kyydistä');
      return;
    }

    if (airship.inside) {
      // F starts flight from anywhere inside the cabin. Only the entrance
      // acts as the exit, so the small cockpit trigger cannot block flight.
      if (this.nearAirshipEntrance) {
        this.exitAirshipCabin();
        return;
      }
      airship.inside = false;
    } else {
      if (!this.nearAirship) return;
      this.enterAirshipCabin();
      return;
    }

    airship.mounted = true;
    this.nearAirship = false;
    this.nearAirshipControl = false;
    airship.prompt?.setVisible(false);
    airship.controlPrompt?.setVisible(false);
    airship.controlHint?.setVisible(true);
    if (this.col_player_platforms) this.col_player_platforms.active = false;
    this.player.body.checkCollision.none = true;
    this.player.body.setAllowGravity(false);
    this.player.setGravityY(0);
    this.player.setVelocity(0, 0);
    this.player.setDepth(6);
    this.showToast('Ilmalaiva ohjattavana: A/D + nuolet, W/S ylös/alas — F poistuu');
  }

  togglePlane(){
    this.plane.mounted = !this.plane.mounted;
    if (this.plane.mounted) {
      this.plane.prompt?.setVisible(false);
      this.plane.sprite.setPosition(this.player.x, this.player.y+8);
      for (const t of this.plane.turrets) t.setPosition(this.plane.sprite.x + (t===this.plane.turrets[0]?-28:28), this.plane.sprite.y-14).setVisible(true).setDepth(5);
      this.player.setVisible(true); this.player.setDepth(6);
      this.plane.sprite.setDepth(4);
      this.showToast('Lentokone: Kyytiin');
    } else {
      this.plane.sprite.setPosition(this.player.x, this.player.y+8);
      for (const t of this.plane.turrets) t.setPosition(this.plane.sprite.x + (t===this.plane.turrets[0]?-28:28), this.plane.sprite.y-14).setVisible(true);
      this.player.setVisible(true); this.player.setDepth(6);
      this.showToast('Lentokone: Poistuit');
    }
  }
  toggleCar(){
    this.car.mounted = !this.car.mounted;
    if (this.car.mounted) {
      this.car.prompt?.setVisible(false);
      // snap car to player
      this.car.sprite.setPosition(this.player.x, this.player.y+10);
  for (const t of this.car.turrets) t.setPosition(this.car.sprite.x + (t===this.car.turrets[0]?-28:28), this.car.sprite.y-12).setVisible(true);
  // keep player visible while in car; adjust depth so player shows on top
  this.player.setVisible(true);
  this.player.setDepth(6);
  this.car.sprite.setDepth(4);
  this.car.turrets.forEach(t=>t.setDepth(5));
  this.showToast('Auto: Kyytiin');
    } else {
      // drop car at feet
      this.car.sprite.setPosition(this.player.x, this.player.y+10);
  for (const t of this.car.turrets) t.setPosition(this.car.sprite.x + (t===this.car.turrets[0]?-28:28), this.car.sprite.y-12).setVisible(true);
  // restore depth
  this.player.setVisible(true);
  this.player.setDepth(6);
  this.showToast('Auto: Poistuit');
    }
  }

  getTutorialSteps(){
    return [
      {
        icon: '🌲', title: 'Tervetuloa seikkailuun!',
        text: 'Tutki suurta maailmaa, kerää materiaaleja, löydä erikoiskohteita ja rakenna oma tukikohtasi.',
        keys: ['Tutki', 'Kerää', 'Rakenna']
      },
      {
        icon: '🏃', title: 'Liikkuminen',
        text: 'Liiku vasemmalle ja oikealle. Hyppää esteiden yli ja käytä nuolinäppäimiä myös ilmalaivan ohjaamiseen.',
        keys: ['A / D', '← / →', 'W / ↑ / Space = hyppy']
      },
      {
        icon: '⛏️', title: 'Louhi ja kerää',
        text: 'Vasen klikkaus louhii blokkeja tai ampuu valitulla aseella. Kerää puuta ja kiveä rakentamista varten.',
        keys: ['Vasen klikkaus', 'Kerää puuta', 'Kerää kiveä']
      },
      {
        icon: '🧱', title: 'Rakenna',
        text: 'Oikea klikkaus asettaa valitun rakennusblokin. Paina R vaihtaaksesi blokin. C craftaa lankun ja T craftaa kaikki puut.',
        keys: ['Oikea klikkaus = aseta', 'R = blokki', 'C / T = craftaa']
      },
      {
        icon: '🔫', title: 'Työkalut ja voimat',
        text: 'Vaihda työkaluja numeroilla 1–9, Q-näppäimellä tai hiiren rullalla. Asetuksista löydät aseet, voimat ja rakennusblokit.',
        keys: ['1–9', 'Q', 'Hiiren rulla', '⚙️ Asetukset']
      },
      {
        icon: '🚗', title: 'Ajoneuvot ja ilmalaiva',
        text: 'Mene ajoneuvon lähelle ja paina F. Ilmalaivassa A/D liikuttaa sivuille ja W/S nostaa tai laskee. F poistuu kyydistä.',
        keys: ['F = kyytiin', 'A/D = sivuille', 'W/S = ylös/alas']
      },
      {
        icon: '🗺️', title: 'Olet valmis!',
        text: 'Asetusten yläosassa on Suurkohteet-lista. Kerää aarrearkkuja, aktivoi checkpointteja, etsi voimakristalleja ja hae päiväpalkinto.',
        keys: ['📜 Tehtävät', '🗺️ Kartta', '🎁 Päiväpalkinto']
      }
    ];
  }

  setupTutorialUI(){
    if (this.tutorial.bound) return;
    const overlay = document.getElementById('tutorialOverlay');
    const next = document.getElementById('tutorialNext');
    const skip = document.getElementById('tutorialSkip');
    const manual = document.getElementById('btnTutorial');
    if (!overlay || !next || !skip) return;
    next.addEventListener('click', () => this.nextTutorialStep());
    skip.addEventListener('click', () => this.closeTutorial());
    manual?.addEventListener('click', () => this.openTutorial(true));
    this.tutorial.bound = true;
  }

  renderTutorial(){
    const steps = this.getTutorialSteps();
    const step = steps[this.tutorial.step] || steps[0];
    const progress = document.getElementById('tutorialProgress');
    const icon = document.getElementById('tutorialIcon');
    const title = document.getElementById('tutorialTitle');
    const text = document.getElementById('tutorialText');
    const keys = document.getElementById('tutorialKeys');
    const next = document.getElementById('tutorialNext');
    if (!step || !progress || !icon || !title || !text || !keys || !next) return;
    progress.textContent = `Vaihe ${this.tutorial.step + 1} / ${steps.length}`;
    icon.textContent = step.icon;
    title.textContent = step.title;
    text.textContent = step.text;
    keys.innerHTML = '';
    step.keys.forEach((label) => {
      const badge = document.createElement('span');
      badge.textContent = label;
      keys.appendChild(badge);
    });
    next.textContent = this.tutorial.step === steps.length - 1 ? 'Aloita peli' : 'Seuraava';
  }

  openTutorial(force = false){
    const overlay = document.getElementById('tutorialOverlay');
    if (!overlay) return;
    if (!force) {
      try {
        if (localStorage.getItem('UAG_tutorialSeen') === '1') return;
      } catch (e) {}
    }
    this.tutorial.wasRunning = !!(this.started && !this.isPaused);
    if (this.tutorial.wasRunning) this.pauseGame(true);
    this.tutorial.step = 0;
    this.tutorial.active = true;
    this.renderTutorial();
    overlay.classList.remove('hidden');
  }

  nextTutorialStep(){
    if (!this.tutorial.active) return;
    const lastStep = this.tutorial.step >= this.getTutorialSteps().length - 1;
    if (lastStep) this.closeTutorial();
    else {
      this.tutorial.step += 1;
      this.renderTutorial();
    }
  }

  closeTutorial(){
    const overlay = document.getElementById('tutorialOverlay');
    if (!this.tutorial.active) return;
    this.tutorial.active = false;
    overlay?.classList.add('hidden');
    try { localStorage.setItem('UAG_tutorialSeen', '1'); } catch (e) {}
    if (this.tutorial.wasRunning) this.resumeGame();
    this.tutorial.wasRunning = false;
  }

  setupCommandAndChatUI(){
    const commandBtn = document.getElementById('commandBtn');
    const aiChatBtn = document.getElementById('aiChatBtn');
    const commandInput = document.getElementById('commandInput');
    const commandSend = document.getElementById('commandSend');
    const aiChatInput = document.getElementById('aiChatInput');
    const aiChatSend = document.getElementById('aiChatSend');
    const aiGameInfoBtn = document.getElementById('aiGameInfoBtn');
    if (!commandBtn || !aiChatBtn || !commandInput || !commandSend || !aiChatInput || !aiChatSend) return;

    commandBtn.onclick = () => this.toggleCommandConsole();
    aiChatBtn.onclick = () => this.toggleAiChat();
    commandSend.onclick = () => this.submitCommandInput();
    commandInput.onkeydown = (event) => {
      // Phaser listens globally for keyboard keys; do not let it eat text input.
      event.stopPropagation();
      if (event.key === 'Enter') { event.preventDefault(); this.submitCommandInput(); }
      if (event.key === 'Escape') { event.preventDefault(); this.closeCommandConsole(); }
    };
    aiChatSend.onclick = () => this.submitAiChat();
    if (aiGameInfoBtn) aiGameInfoBtn.onclick = () => this.appendAiMessage('ai', this.getGameInfo());
    aiChatInput.onkeydown = (event) => {
      // Keep A/D/W/S and the other game keys usable as normal text here.
      event.stopPropagation();
      if (event.key === 'Enter') { event.preventDefault(); this.submitAiChat(); }
      if (event.key === 'Escape') { event.preventDefault(); this.closeAiChat(); }
    };

    if (window.__uagCommandKeyListener) window.removeEventListener('keydown', window.__uagCommandKeyListener);
    this._commandKeyListener = (event) => {
      const active = document.activeElement;
      const typing = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
      if (event.key === 'Escape') {
        if (this.commandUi.open) { event.preventDefault(); this.closeCommandConsole(); }
        else if (this.aiChat.open) { event.preventDefault(); this.closeAiChat(); }
        return;
      }
      if (!typing && (event.key === '/' || event.key === '`' || event.key === '~')) {
        event.preventDefault(); this.toggleCommandConsole();
      }
    };
    window.__uagCommandKeyListener = this._commandKeyListener;
    window.addEventListener('keydown', this._commandKeyListener);
    this.commandUi.bound = true;
  }

  toggleCommandConsole(){
    if (this.commandUi.open) this.closeCommandConsole();
    else this.openCommandConsole();
  }

  openCommandConsole(){
    const panel = document.getElementById('commandPanel');
    const input = document.getElementById('commandInput');
    if (!panel) return;
    document.getElementById('questPanel')?.classList.add('hidden');
    document.getElementById('mapPanel')?.classList.add('hidden');
    if (this.aiChat.open) this.closeAiChat();
    else document.getElementById('aiChatPanel')?.classList.add('hidden');
    this.commandUi.wasRunning = !!(this.started && !this.isPaused);
    if (this.commandUi.wasRunning) this.pauseGame(true);
    this.commandUi.open = true;
    this.commandUi.keyboardWasEnabled = this.input?.keyboard?.enabled !== false;
    if (this.input?.keyboard) this.input.keyboard.enabled = false;
    panel.classList.remove('hidden');
    if (!document.getElementById('commandOutput')?.children.length) this.commandPrint('Kirjoita /help nähdäksesi komennot.');
    window.setTimeout(() => input?.focus(), 0);
  }

  closeCommandConsole(){
    document.getElementById('commandPanel')?.classList.add('hidden');
    if (!this.commandUi.open) return;
    this.commandUi.open = false;
    if (this.input?.keyboard) this.input.keyboard.enabled = this.commandUi.keyboardWasEnabled;
    if (this.commandUi.wasRunning) this.resumeGame();
    this.commandUi.wasRunning = false;
  }

  commandPrint(message, error = false){
    const output = document.getElementById('commandOutput');
    if (!output) return;
    const line = document.createElement('div');
    line.className = `command-line${error ? ' error' : ''}`;
    line.textContent = message;
    output.appendChild(line);
    while (output.children.length > 40) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
  }

  submitCommandInput(){
    const input = document.getElementById('commandInput');
    const raw = input?.value?.trim();
    if (!raw) return;
    input.value = '';
    this.executeGameCommand(raw);
    window.setTimeout(() => input?.focus(), 0);
  }

  executeGameCommand(raw){
    const source = String(raw || '').trim();
    const clean = source.replace(/^[/~]+/, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    const command = (parts.shift() || '').toLocaleLowerCase('fi-FI');
    const args = parts;
    this.commandPrint(`> ${source}`);
    if (!command) return;
    const aliases = {
      ohje: 'help', komennot: 'help', tila: 'status', lento: 'fly', anna: 'give',
      teleport: 'tp', siirry: 'tp', paranna: 'heal', tehtavat: 'quest', tehtävät: 'quest',
      kartta: 'map', palkinto: 'daily', sää: 'weather', yo: 'time', yö: 'time'
    };
    const cmd = aliases[command] || command;
    const number = (value, fallback = 1) => Math.max(0, Number.isFinite(Number(value)) ? Math.floor(Number(value)) : fallback);
    const help = '/help, /status, /fly on|off, /give wood|stone|coin|xp|weapon, /heal, /tp nimi, /checkpoint, /weather storm|clear, /time day|night, /speed, /shield, /quest, /map, /daily';

    if (cmd === 'help') this.commandPrint(help);
    else if (cmd === 'status') {
      const level = this.adventureProgress?.level || 1;
      this.commandPrint(`HP ${this.state.health}/${MAX_HEALTH} · Kolikot ${this.state.coins} · Taso ${level} · Lento ${this.state.canFly ? 'ON' : 'OFF'}`);
    } else if (cmd === 'fly') {
      const mode = (args[0] || 'toggle').toLocaleLowerCase('fi-FI');
      this.state.canFly = mode === 'on' ? true : mode === 'off' ? false : !this.state.canFly;
      this.player?.setVelocityY(0); this.updateUI(); this.saveState();
      this.commandPrint(`Lento: ${this.state.canFly ? 'ON — W/↑ ylös, S/↓ alas' : 'OFF'}`);
    } else if (cmd === 'give') {
      const item = (args[0] || '').toLocaleLowerCase('fi-FI');
      const weaponMode = item === 'weapon' || item === 'ase';
      const requestedItem = weaponMode ? (args[1] || '').toLocaleLowerCase('fi-FI') : item;
      const amount = number(weaponMode ? args[2] : args[1], 1);
      const normalized = { coin: 'coins', coins: 'coins', kolikko: 'coins', kolikot: 'coins', wood: 'wood', puu: 'wood', stone: 'stone', kivi: 'stone', plank: 'plank', lankku: 'plank', meat: 'meat', liha: 'meat', xp: 'xp' }[requestedItem] || requestedItem;
      if (normalized === 'coins') this.state.coins += amount;
      else if (normalized === 'wood') this.inv.wood += amount;
      else if (normalized === 'stone') this.inv.stone += amount;
      else if (normalized === 'plank') this.inv.plank += amount;
      else if (normalized === 'meat') this.food.meat += amount;
      else if (normalized === 'xp') this.addAdventureXp(amount);
      else if (this.tools.owned && Object.prototype.hasOwnProperty.call(this.tools.owned, normalized)) this.tools.owned[normalized] = true;
      else { this.commandPrint('Tuntematon annettava. Kokeile: /give wood 10, /give coin 25 tai /give xp 100.', true); return; }
      this.updateUI(); this.updateToolSelect?.(); this.saveState();
      this.commandPrint(`Annettu: ${requestedItem} ×${amount}`);
    } else if (cmd === 'heal') {
      this.state.health = MAX_HEALTH; this.updateUI(); this.saveState(); this.commandPrint('Elämät palautettu täyteen.');
    } else if (cmd === 'tp') {
      const target = args.join(' ').toLocaleLowerCase('fi-FI') || 'airship';
      if (target === 'spawn' || target === 'aloitus') {
        this.player?.setPosition(100, 100); this.player?.setVelocity(0, 0); this.commandPrint('Siirretty aloitukseen.');
      } else {
        const index = this.landmarks.findIndex((landmark) => landmark.name.toLocaleLowerCase('fi-FI').includes(target) || landmark.id === target);
        if (index < 0) this.commandPrint('Kohdetta ei löytynyt. Käytä /map.', true);
        else { this.goToLandmark(index); this.commandPrint(`Siirretty: ${this.landmarks[index].name}`); }
      }
    } else if (cmd === 'checkpoint') {
      if (this.nearCheckpoint) this.activateAdventureCheckpoint(this.nearCheckpoint);
      else this.respawnAtCheckpoint();
      this.commandPrint('Checkpoint-komento suoritettu.');
    } else if (cmd === 'weather') {
      const mode = (args[0] || 'storm').toLocaleLowerCase('fi-FI');
      if (mode === 'clear' || mode === 'selkeä') { this.weather.isStorm = false; this.weather.stormEndsAt = 0; this.commandPrint('Sää: selkeä.'); }
      else { this.weather.isStorm = true; this.weather.stormEndsAt = this.time.now + 30000; this.commandPrint('Sää: ukkosmyrsky 30 sekunniksi.'); }
      this.saveState();
    } else if (cmd === 'time') {
      const night = ['night', 'yö', 'yo'].includes((args[0] || '').toLocaleLowerCase('fi-FI'));
      this.day.start = this.time.now - this.day.period * (night ? 0.1 : 0.5);
      this.commandPrint(`Aika: ${night ? 'yö' : 'päivä'}.`);
    } else if (cmd === 'speed') {
      this.activateSpeedBoost(); this.commandPrint('Nopeusvoima aktivoitu.');
    } else if (cmd === 'shield') {
      this.activateShield(); this.commandPrint('Suojavoima aktivoitu.');
    } else if (cmd === 'quest') {
      document.getElementById('questPanel')?.classList.remove('hidden'); this.updateAdventureUI(); this.commandPrint('Tehtäväpaneeli avattu.');
    } else if (cmd === 'map') {
      document.getElementById('mapPanel')?.classList.remove('hidden'); this.updateAdventureUI(); this.commandPrint('Kartta avattu.');
    } else if (cmd === 'daily') {
      this.claimDailyReward(); this.commandPrint('Päiväpalkinto tarkistettu.');
    } else if (cmd === 'unlock') {
      this.state.canFly = true; this.builderMode = true; Object.keys(this.tools.owned).forEach((key) => { this.tools.owned[key] = true; });
      this.setBuilderMode?.(true, false); this.updateUI(); this.updateToolSelect?.(); this.saveState(); this.commandPrint('Kaikki perusvoimat ja työkalut avattu.');
    } else if (cmd === 'clear') {
      const output = document.getElementById('commandOutput'); if (output) output.innerHTML = '';
    } else this.commandPrint(`Tuntematon komento: ${command}. Käytä /help.`, true);
  }

  toggleAiChat(){
    if (this.aiChat.open) this.closeAiChat();
    else this.openAiChat();
  }

  openAiChat(){
    const panel = document.getElementById('aiChatPanel');
    const input = document.getElementById('aiChatInput');
    if (!panel) return;
    this.closeCommandConsole();
    this.aiChat.wasRunning = !!(this.started && !this.isPaused);
    if (this.aiChat.wasRunning) this.pauseGame(true);
    this.aiChat.open = true;
    this.aiChat.keyboardWasEnabled = this.input?.keyboard?.enabled !== false;
    if (this.input?.keyboard) this.input.keyboard.enabled = false;
    panel.classList.remove('hidden');
    if (!this.aiChat.messages.length) this.appendAiMessage('ai', 'Hei! Olen pelin AI-apuri. Kysy esimerkiksi “kerro pelistä”, “miten lennän?”, “missä ilmalaiva on?” tai “mitkä ovat komennot?”.');
    window.setTimeout(() => input?.focus(), 0);
  }

  closeAiChat(){
    document.getElementById('aiChatPanel')?.classList.add('hidden');
    if (!this.aiChat.open) return;
    this.aiChat.open = false;
    if (this.input?.keyboard) this.input.keyboard.enabled = this.aiChat.keyboardWasEnabled;
    if (this.aiChat.wasRunning) this.resumeGame();
    this.aiChat.wasRunning = false;
  }

  appendAiMessage(role, text){
    const filtered = this.filterChatText(text);
    const safeText = filtered.text;
    this.aiChat.messages.push({ role, text: safeText, blocked: filtered.blocked });
    const log = document.getElementById('aiChatLog');
    if (!log) return;
    const message = document.createElement('div');
    message.className = `ai-message${role === 'user' ? ' user' : ''}`;
    message.textContent = `${role === 'user' ? 'Sinä' : 'AI'}: ${safeText}`;
    log.appendChild(message);
    while (log.children.length > 30) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }

  submitAiChat(){
    const input = document.getElementById('aiChatInput');
    const text = input?.value?.trim();
    if (!text) return;
    input.value = '';
    const filtered = this.filterChatText(text);
    this.appendAiMessage('user', filtered.text);
    if (filtered.blocked) {
      this.time.delayedCall(120, () => this.appendAiMessage('ai', 'Pidetään keskustelu asiallisena. Voin auttaa pelin ohjeissa ja komennoissa.'));
      input.focus();
      return;
    }
    this.time.delayedCall(120, () => this.appendAiMessage('ai', this.getAiReply(filtered.text)));
    input.focus();
  }

  filterChatText(value){
    const raw = String(value ?? '');
    let blocked = false;
    const wordPattern = /[\p{L}\p{N}@*$]+(?:[._'’/-]+[\p{L}\p{N}@*$]+)*/gu;
    const filtered = raw.replace(wordPattern, (part) => {
      if (!chatTokenIsProfane(part)) return part;
      blocked = true;
      return '█'.repeat(Math.max(3, Array.from(part).length));
    });

    // Catch a short word split with spaces, such as “f u c k”, without
    // accidentally matching normal words across a long sentence.
    const compact = normalizeChatFilterText(raw).replace(/[^\p{L}\p{N}]+/gu, '');
    if (!blocked && compact.length <= 18 && chatTokenIsProfane(compact)) {
      blocked = true;
      return { text: '[Viesti suodatettu]', blocked };
    }
    return { text: filtered, blocked };
  }

  getGameInfo(){
    return [
      'Ultimate Adventure on tutkimis-, rakentamis- ja taistelupeli.',
      'Liiku A/D- tai nuolinäppäimillä. Hyppää W/ylös/Space-näppäimellä.',
      'Kun lento on avattu, W/ylös liikuttaa ylös ja S/alas alas.',
      'F avaa ilmalaivan, eläimet, aarrearkut ja checkpointit lähellä.',
      'Vasen hiiren painike louhii tai ampuu, oikea painike asettaa valitun blokin ja R vaihtaa blokkia.',
      'E avaa kauppiaan, C craftaa yhden esineen, T craftaa puusta lankkuja ja Q kierrättää työkaluja.',
      'Pelissä on tehtäviä, XP-tasoja, päiväpalkintoja, aarrearkkuja, voimakristalleja, checkpointteja, paljon aseita, eläimiä, rakennusblokkeja ja suurkohteita.',
      'Kartasta voi siirtyä ilmalaivalle, linnaan, pyramidiin, puumajaan, kristallitemppeliin ja avaruusasemalle.',
      'Komennot löytyvät Komennot-paneelista. Kirjoita esimerkiksi /help, /status, /fly on, /tp ilmalaiva tai /give coin 25.',
      'Jos peli lagaa, avaa Asetukset ja laita Kevyt tila päälle.'
    ].join(' ');
  }

  getAiReply(message){
    const text = String(message || '').toLocaleLowerCase('fi-FI');
    const level = this.adventureProgress?.level || 1;
    if (text.includes('kerro pel') || text.includes('pelin tiet') || text.includes('mikä peli') || text.includes('mitä pelissä') || text.includes('ominaisu')) return this.getGameInfo();
    if (text.includes('lag') || text.includes('hidas') || text.includes('nykii')) return 'Avaa Asetukset ja laita Kevyt tila päälle. Se vähentää ladattavaa maailmaa, efektejä ja turhia päivityksiä.';
    if (text.includes('komenn') || text.includes('ohje')) return 'Komennot löytyvät ⌨️ Komennot -paneelista. Kokeile /help, /fly on, /tp ilmalaiva tai /give coin 25.';
    if (text.includes('lent') || text.includes('fly')) return `Lento on ${this.state.canFly ? 'päällä' : 'pois päältä'}. Paina W/↑ ylös ja S/↓ alas. Voit myös kirjoittaa /fly on.`;
    if (text.includes('ilmalaiv')) return 'Avaa 🗺️ Kartta ja valitse Ilmalaiva. Mene oven luo, paina F ja ohjaa A/D- tai nuolinäppäimillä. W/S liikuttaa ylös ja alas.';
    if (text.includes('teht') || text.includes('quest')) {
      const quest = this.getAdventureQuestDefs().find((item) => !this.adventureProgress.completedQuests.includes(item.id));
      return quest ? `Seuraava tehtävä on “${quest.name}”: ${this.adventureProgress.quests[quest.id] || 0}/${quest.target}. Palkinto ${quest.reward} XP ja ${quest.rewardCoins} kolikkoa.` : 'Kaikki tehtävät on suoritettu!';
    }
    if (text.includes('ark') || text.includes('aarre') || text.includes('chest')) {
      const chest = this.adventureChests?.filter((item) => !item.opened).sort((a, b) => Math.hypot(this.player.x - a.x, this.player.y - a.y) - Math.hypot(this.player.x - b.x, this.player.y - b.y))[0];
      return chest ? `Lähin aarrearkku on noin ${Math.round(Math.hypot(this.player.x - chest.x, this.player.y - chest.y) / TILE)} blokin päässä. Mene lähelle ja paina F.` : 'Kaikki aarrearkut on avattu.';
    }
    if (text.includes('checkpoint') || text.includes('paluu')) return 'Checkpoint tallentaa paluupaikan. Mene sinisen lipun luo ja paina F.';
    if (text.includes('tila') || text.includes('status') || text.includes('mitä')) return `Tilanne: HP ${this.state.health}/${MAX_HEALTH}, ${this.state.coins} kolikkoa, taso ${level}.`;
    return 'Ymmärsin kysymyksesi. Kysy lentämisestä, ilmalaivasta, tehtävistä, aarteista, checkpointeista tai komennoista.';
  }

  // Pause/Start helpers
  startGame(){
    if (this.isDead) return;
    try {
      this.startGameMode = localStorage.getItem('UAG_startGameMode') || 'adventure';
    } catch (e) { this.startGameMode = 'adventure'; }
    this.started = true;
    if (this.startGameMode === 'multiplayer') this.showToast('Moninpeli käynnissä');
    if (this.startGameMode === 'rivals') this.showToast('Rivals-kisa käynnissä');
    try { window.Sfx?.resume(); } catch(e) {}
    this.resumeGame();
    document.getElementById('startScreen')?.classList.add('hidden');
    document.getElementById('deathScreen')?.classList.add('hidden');
    this.openTutorial();
  }
  pauseGame(initial=false){
    this.isPaused = true;
    this.physics.world.isPaused = true;
    if (!initial) document.getElementById('pauseScreen')?.classList.remove('hidden');
    // If build minigame active, pause its timer display (keep state)
    if (this.buildMiniGame.active && this.buildTimerEl) this.buildTimerEl.textContent += ' (tauko)';
  }
  resumeGame(){
    this.isPaused = false;
    this.physics.world.isPaused = false;
    try { window.Sfx?.resume(); } catch(e) {}
    document.getElementById('pauseScreen')?.classList.add('hidden');
    // Restore build minigame timer label without (tauko)
    if (this.buildMiniGame.active && this.buildTimerEl) this.buildTimerEl.textContent = `Rakennus: ${this.buildMiniGame.timeLeft.toFixed(1)}s`;
  }
  restartGame(){
    try { window.Sfx?.resume(); } catch(e) {}
    document.getElementById('deathScreen')?.classList.add('hidden');
    document.getElementById('pauseScreen')?.classList.add('hidden');
    document.getElementById('oxygen')?.classList.add('hidden');
    this.isDead = false;
    if (this.oxygen) this.oxygen.value = this.oxygen.max;
    // Reset save and reload scene
    try {
      const wid = localStorage.getItem('UAG_worldCurrent');
      if (wid) localStorage.removeItem(`UAG_save_${wid}`);
      // Also clear legacy key if present
      localStorage.removeItem('UAG_save');
    } catch(e) {}
    this.scene.restart();
    // After restart, started should be false so start screen shows again (handled in create)
    const startEl = document.getElementById('startScreen');
    startEl?.classList.remove('hidden');
    // Clear build minigame UI references (scene recreated anyway)
  }

  // --- Minigames ---
  startMinigame(type){
    // Hide pause overlay while minigame runs
    try { document.getElementById('pauseScreen')?.classList.add('hidden'); } catch(e) {}
    // Pause this scene and launch minigame
    this.isPaused = true;
    if (this.physics?.world) this.physics.world.isPaused = true;
    if (this.input) { this.input.enabled = false; try{ this.input.keyboard.enabled = false; }catch(e){} }
    this.scene.pause();
    this.scene.launch('MinigameScene', { type });
  }
  onReturnFromMinigame(result){
    // Keep main game paused and show the pause overlay again
    try { document.getElementById('pauseScreen')?.classList.remove('hidden'); } catch(e) {}
    if (this.input) { this.input.enabled = true; try{ this.input.keyboard.enabled = true; }catch(e){} }
  }

  isTouchingCactus(){
    if (!this.player?.body) return false;
    const b = this.player.body;
    // sample a few points around the player's body
    const samples = [
      { x: b.x + b.width/2, y: b.y + b.height/2 },
      { x: b.x + 4, y: b.y + b.height/2 },
      { x: b.x + b.width - 4, y: b.y + b.height/2 },
      { x: b.x + b.width/2, y: b.y + b.height - 2 }
    ];
    for (const p of samples){
      const tx = Math.floor(p.x / TILE), ty = Math.floor(p.y / TILE);
      const key = `${tx},${ty}`;
      const spr = this.blocks.get(key);
      if (spr && spr.getData('type') === 'cactus') return true;
    }
    return false;
  }

  setupTouchControls(){
    // DOM buttons
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnJump = document.getElementById('btnJump');
    const btnPlaceToggle = document.getElementById('btnPlaceToggle');
    const badge = document.getElementById('placeModeBadge');

    const press = (key)=>{ this.touchState[key] = true; };
    const release = (key)=>{ this.touchState[key] = false; };
    const bindHold = (el, key)=>{
      if (!el) return;
      const onDown = (e)=>{ e.preventDefault(); press(key); };
      const onUp = (e)=>{ e.preventDefault(); release(key); };
      el.addEventListener('touchstart', onDown, { passive:false });
      el.addEventListener('mousedown', onDown);
      el.addEventListener('touchend', onUp);
      el.addEventListener('touchcancel', onUp);
      el.addEventListener('mouseup', onUp);
      el.addEventListener('mouseleave', onUp);
    };

    bindHold(btnLeft, 'left');
    bindHold(btnRight, 'right');
    bindHold(btnJump, 'jump');

    // Toggle place mode
    if (btnPlaceToggle) {
      let lastToggle = 0;
      const toggle = (e)=>{
        e.preventDefault();
        const now = Date.now();
        if (now - lastToggle < 250) return; // guard against double (touch+click)
        lastToggle = now;
        this.touchState.placeMode = !this.touchState.placeMode;
        btnPlaceToggle.classList.toggle('primary', this.touchState.placeMode);
        if (badge) badge.style.display = this.touchState.placeMode ? 'block' : 'none';
      };
      btnPlaceToggle.addEventListener('click', toggle);
      btnPlaceToggle.addEventListener('touchend', toggle, { passive:false });
    }
  }

  // Mining logic (supports digging down by clicking lower tiles within reach)
  attemptMine(pointer) {
    if (this.tools.equipped === 'hook') {
      // Left click toggles grapple
      if (this.hook.active) this.cancelGrapple(); else this.tryGrapple(pointer);
      return;
    }
    if (BOOST_WEAPON_MAP[this.tools.equipped]) {
      this.fireBoostWeapon(pointer, this.tools.equipped);
      return;
    }
    if (NORMAL_WEAPON_MAP[this.tools.equipped]) {
      this.fireNormalWeapon(pointer, this.tools.equipped);
      return;
    }
    if (this.tools.equipped === 'mop') {
      this.fireMop(pointer);
      return;
    }
    if (this.tools.equipped === 'roller_skates') {
      this.fireRollerSkates(pointer);
      return;
    }
    if (this.tools.equipped === 'trident') {
      this.fireTrident(pointer);
      return;
    }
  if (this.tools.equipped === 'pistol' || this.tools.equipped === 'pistol_copper' || this.tools.equipped === 'bow' || this.tools.equipped === 'bow_copper' || this.tools.equipped === 'crossbow' || this.tools.equipped === 'crossbow_copper' || this.tools.equipped === 'boomerang' || this.tools.equipped === 'minigun' || this.tools.equipped === 'minigun_copper' || this.tools.equipped === 'dakkerssit' || this.tools.equipped === 'caran_bitti' || this.tools.equipped === 'sniper' || this.tools.equipped === 'sniper_copper' || this.tools.equipped === 'rifle' || this.tools.equipped === 'cannon' || this.tools.equipped === 'bazooka' || this.tools.equipped === 'bazooka_copper' || this.tools.equipped === 'tnt' || this.tools.equipped === 'grenade' || this.tools.equipped === 'grenade_copper' || this.tools.equipped === 'nuke' || this.tools.equipped === 'nuke_copper' || this.tools.equipped === 'plane' || this.tools.equipped === 'plane_copper') {
      if (this.tools.equipped === 'pistol') {
        this.shootBullet(pointer);
      } else if (this.tools.equipped === 'pistol_copper') {
        this.shootBullet(pointer, { copper: true });
      } else if (this.tools.equipped === 'bow') {
        this.fireBow(pointer);
      } else if (this.tools.equipped === 'bow_copper') {
        this.fireBow(pointer, { copper: true });
      } else if (this.tools.equipped === 'crossbow') {
        this.fireCrossbow(pointer);
      } else if (this.tools.equipped === 'crossbow_copper') {
        this.fireCrossbow(pointer, { copper: true });
      } else if (this.tools.equipped === 'boomerang') {
        this.throwBoomerang(pointer);
      } else if (this.tools.equipped === 'minigun') {
        this.shootMinigunBurst(pointer);
      } else if (this.tools.equipped === 'minigun_copper') {
        this.shootMinigunBurst(pointer, { copper: true });
      } else if (this.tools.equipped === 'dakkerssit') {
        this.fireDakkerssit(pointer);
      } else if (this.tools.equipped === 'caran_bitti') {
        this.fireCaranBitti(pointer);
      } else if (this.tools.equipped === 'cannon') {
        this.fireCannon(pointer);
      } else if (this.tools.equipped === 'bazooka') {
        this.fireBazooka(pointer);
      } else if (this.tools.equipped === 'bazooka_copper') {
        this.fireBazooka(pointer, { copper: true });
      } else if (this.tools.equipped === 'tnt') {
        this.fireTnt(pointer);
      } else if (this.tools.equipped === 'grenade') {
        this.throwGrenade(pointer);
      } else if (this.tools.equipped === 'grenade_copper') {
        this.throwGrenade(pointer, { copper: true });
      } else if (this.tools.equipped === 'nuke') {
        this.fireNuke(pointer);
      } else if (this.tools.equipped === 'nuke_copper') {
        this.fireNuke(pointer, { copper: true });
      } else if (this.tools.equipped === 'plane') {
        this.firePlaneGun(pointer);
      } else if (this.tools.equipped === 'plane_copper') {
        this.firePlaneGun(pointer, { copper: true });
      } else if (this.tools.equipped === 'rifle') {
        this.shootRifle(pointer);
      } else { // sniper or sniper_copper fallback
        this.shootSniper(pointer, { copper: this.tools.equipped === 'sniper_copper' });
      }
      return;
    }
    if (this.tools.equipped === 'knife') {
      this.knifeStrike(pointer);
      return;
    }
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(worldPoint.x / TILE);
    const ty = Math.floor(worldPoint.y / TILE);
    const key = `${tx},${ty}`;
    const sprite = this.blocks.get(key);
    if (!sprite) return;
    const dx = sprite.x - this.player.x, dy = sprite.y - this.player.y;
    if (dx*dx + dy*dy > 120*120) return; // reach limit

  const type = sprite.getData('type');

    // Deeper layers require better pickaxes and multiple hits.
    if (this.isStoneBlockType(type)) {
      const rank = this.getPickaxeRank();
      const requiredRank = type === 'deepstone' ? 2 : ((type === 'obsidian' || type === 'bedrock') ? 3 : 1);
      if (rank < requiredRank) {
        const toolName = requiredRank >= 3 ? 'rautahakun' : 'kivihakun';
        this.showToast(`Tarvitset ${toolName} tähän kiveen!`);
        return;
      }
      const hardness = this.getBlockHardness(type);
      const miningPower = Math.max(1, rank - 1);
      const damage = (this.blockDamage.get(key) || 0) + miningPower;
      if (damage < hardness) {
        this.blockDamage.set(key, damage);
        this.showToast(`${type === 'deepstone' ? 'Syväkivi' : type === 'obsidian' ? 'Obsidiaani' : 'Peruskallio'}: ${damage}/${hardness}`);
        return;
      }
      this.blockDamage.delete(key);
    }

  if (type === 'trunk' || type === 'tammi' || type === 'koivu') this.dropWood(sprite.x, sprite.y);
    else if (type === 'ground') { if (Math.random() < 0.30) this.dropCoin(sprite.x, sprite.y); }
    else if (this.isStoneBlockType(type)) { if (Math.random() < 0.85) this.dropStone(sprite.x, sprite.y); }

    // Update persistence diff
    this.markBlockDestroyedInDiff(tx, ty, type);

  sprite.destroy();
  this.blocks.delete(key);
  this.recordAdventureEvent('mine');
  if (type === 'cactus') this.cactusTiles.delete(key);
  // If a trunk block breaks, remove its attached branches and related perches
  if (type === 'trunk' || type === 'tammi' || type === 'koivu') {
    const anchorKey = `${tx},${ty}`;
    const list = this.branches.get(anchorKey);
    if (list && list.length) {
      for (const br of list) {
        for (const seg of (br.segments||[])) { try { seg.img?.destroy?.(); } catch(e){} }
      }
      this.branches.delete(anchorKey);
      // Remove perch spots that sit on destroyed branch segments
      const segSet = new Set(list.flatMap(br=> br.segments?.map(s=>`${s.tx},${s.ty}`) || []));
      this.perchSpots = this.perchSpots.filter(p=> !segSet.has(`${p.tx},${p.ty}`));
    }
  }
  // If there is water above this tile, let it flow down
  this.tryFlowWaterFrom(tx, ty-1);
    this.saveState();
  }

  // === Build Minigame Helpers ===
  startBuildMiniGame(){
  const palette = ['wood','stone','plank','sand','cactus','tammi','koivu'];
    this.buildMiniGame.active = true;
    this.buildMiniGame.timeLeft = 30;
    this.buildMiniGame.palette = palette;
    this.buildMiniGame.selectedBlock = palette[0];
    this.buildMiniGame.originTileX = Math.floor(this.player.x / TILE);
    this.buildMiniGame.originTileY = Math.floor(this.player.y / TILE);
    this.buildMiniGame.placed.clear();
    this.buildMiniGame.blueprint = null;
    if (this.buildTimerEl) { this.buildTimerEl.style.display='block'; this.buildTimerEl.textContent='Rakennus: 30.0s'; }
    if (this.buildPaletteEl) {
      this.buildPaletteEl.style.display='flex'; this.buildPaletteEl.innerHTML='';
      palette.forEach(bt=>{ const b=document.createElement('button'); b.textContent=bt; b.style.padding='4px 6px'; b.style.cursor='pointer'; b.style.background='#333'; b.style.color='#fff'; b.style.border='1px solid #777'; b.style.borderRadius='4px'; b.onclick=()=>{ this.buildMiniGame.selectedBlock=bt; [...this.buildPaletteEl.children].forEach(c=>c.style.outline='none'); b.style.outline='2px solid #fff';}; this.buildPaletteEl.appendChild(b); if(bt===this.buildMiniGame.selectedBlock) b.style.outline='2px solid #fff'; });
    }
    this.showToast('Rakennus alkoi (30s)!');
  }

  finalizeBuildMiniGame(){
    if (!this.buildMiniGame.active) return;
    this.buildMiniGame.active = false;
    if (this.buildTimerEl) this.buildTimerEl.style.display='none';
    if (this.buildPaletteEl) this.buildPaletteEl.style.display='none';
    const entries=[...this.buildMiniGame.placed.entries()].map(([k,v])=>{const [dx,dy]=k.split(',').map(Number);return {dx,dy,type:v};});
    if (entries.length===0){ this.showToast('Ei yhtään blokkia'); return; }
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity; entries.forEach(e=>{ if(e.dx<minX)minX=e.dx; if(e.dy<minY)minY=e.dy; if(e.dx>maxX)maxX=e.dx; if(e.dy>maxY)maxY=e.dy; });
    const blocks=entries.map(e=>({dx:e.dx-minX,dy:e.dy-minY,type:e.type}));
    this.buildMiniGame.blueprint={blocks,w:maxX-minX+1,h:maxY-minY+1};
    this.buildMiniGame.awaitingPlacement=true;
    this.showToast('Oikea klikkaus: sijoita talo');
  }

  cancelBuildMiniGame(){
    if (!this.buildMiniGame.active) return;
    this.buildMiniGame.active = false;
    this.buildMiniGame.placed.clear();
    if (this.buildTimerEl) this.buildTimerEl.style.display='none';
    if (this.buildPaletteEl) this.buildPaletteEl.style.display='none';
    this.showToast('Rakennus peruttu');
  }

  placeBlueprintAtTiles(tx,ty){
    const bp=this.buildMiniGame.blueprint; if(!bp)return;
    bp.blocks.forEach(b=>{ const gx=tx+b.dx, gy=ty+b.dy; const key=`${gx},${gy}`; if(!this.blocks.has(key)) this.placeBlock(gx,gy,b.type); });
    // teleport
    const px=(tx+Math.floor(bp.w/2))*TILE+TILE/2; const py=(ty+bp.h)*TILE - TILE/2;
    this.player.setPosition(px,py-40);
    this.buildMiniGame.awaitingPlacement=false; this.buildMiniGame.blueprint=null;
    this.startWolfNight();
  }

  startWolfNight(){
    this.showToast('Yö & sudet!');
    const duration=20000; const endAt=this.time.now+duration;
    const spawn=()=>{ if(this.time.now>endAt)return; const side=Math.random()<0.5?-1:1; const sx=this.player.x+side*(10+Math.random()*8)*TILE; const sy=this.player.y-5*TILE; const w=this.wolves.create(sx,sy,'tex_wolf'); w.setDepth(5); w.body.setSize(24,16).setOffset(0,4); this.time.delayedCall(1400+Math.random()*1200,spawn); };
    spawn();
  }

  // --- Teleport (portal) placement and logic ---
  // --- Torch placement (prevents zombie spawns nearby) ---
  placeTorch(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.get(key)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitset lattian alle'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
  const img = this.add.image(x,y,'tex_torch').setDepth(4);
  this.decor.add(img);
  const cx = Math.floor(tx / CHUNK_W);
  this.chunks.get(cx)?.decor.push(img);
  const flicker = { seed: Math.random()*Math.PI*2, speed: 2 + Math.random()*1.2, ampR: 0.05, ampA: 0.15 };
  this.torches.set(key, { image: img, flicker });
    this.torchPositions.push({ tx, ty });
    this.saveState();
  }

  // --- Campfire placement (removes night locally, zombies avoid area) ---
  placeCampfire(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.get(key)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitset lattian alle'); return; }
    if (this.campfires.has(key)) { this.showToast('Nuotio jo tässä'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const img = this.add.image(x,y,'tex_campfire').setDepth(4);
    this.decor.add(img);
    const cx = Math.floor(tx / CHUNK_W);
    this.chunks.get(cx)?.decor.push(img);
    const flicker = { seed: Math.random()*Math.PI*2, speed: 2.2 + Math.random()*1.3, ampR: 0.08, ampA: 0.22 };
    this.campfires.set(key, { image: img, flicker });
    this.campfirePositions.push({ tx, ty });
    this.saveState();
  }

  placeNightbreaker(pointer){
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(wp.x / TILE), ty = Math.floor(wp.y / TILE);
    const key = `${tx},${ty}`;
    if (this.nightbreakers.has(key)) { this.showToast('Yönpoistaja jo tässä'); return; }
    if (this.hasSolidBlockAt(tx, ty) || !this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitsee lattian'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const img = this.add.image(x, y, 'tex_nightbreaker').setDepth(4);
    // subtle flicker data (reuse like torch/campfire)
    const flick = { seed: Math.random()*Math.PI*2, speed: 2.0 + Math.random()*1.2, ampR: 0.06, ampA: 0.10 };
    this.nightbreakers.set(key, { image: img, flicker: flick });
    this.nightbreakerPositions.push({ tx, ty });
    this.showToast('Yönpoistaja asetettu');
    this.saveState();
  }

  removeNightbreakerAtPointer(pointer){
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(wp.x / TILE), ty = Math.floor(wp.y / TILE);
    const key = `${tx},${ty}`;
    const e = this.nightbreakers.get(key); if (!e) { this.showToast('Ei yönpoistajaa'); return; }
    e.image?.destroy();
    this.nightbreakers.delete(key);
    this.nightbreakerPositions = this.nightbreakerPositions.filter(p=> !(p.tx===tx && p.ty===ty));
    this.saveState();
  }

  // --- Furniture placement (decor only) ---
  placeLamp(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.get(key)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitset lattian alle'); return; }
    if (this.lamps.has(key)) { this.showToast('Lamppu jo tässä'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const img = this.add.image(x,y,'tex_lamp').setDepth(4);
    this.decor.add(img);
    const cx = Math.floor(tx / CHUNK_W);
    this.chunks.get(cx)?.decor.push(img);
    this.lamps.set(key, { image: img });
    this.lampPositions.push({ tx, ty });
    this.saveState();
  }
  removeLampAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    const e = this.lamps.get(key); if (!e) { this.showToast('Ei lamppua'); return; }
    e.image?.destroy(); this.lamps.delete(key);
    this.lampPositions = this.lampPositions.filter(p=> !(p.tx===tx && p.ty===ty));
    this.saveState();
  }

  placeSofa(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.get(key)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitset lattian alle'); return; }
    if (this.sofas.has(key)) { this.showToast('Sohva jo tässä'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const img = this.add.image(x,y,'tex_sofa').setDepth(4);
    this.decor.add(img);
    const cx = Math.floor(tx / CHUNK_W);
    this.chunks.get(cx)?.decor.push(img);
    this.sofas.set(key, { image: img });
    this.sofaPositions.push({ tx, ty });
    this.saveState();
  }
  removeSofaAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    const e = this.sofas.get(key); if (!e) { this.showToast('Ei sohvaa'); return; }
    e.image?.destroy(); this.sofas.delete(key);
    this.sofaPositions = this.sofaPositions.filter(p=> !(p.tx===tx && p.ty===ty));
    this.saveState();
  }

  placeTable(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.get(key)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitset lattian alle'); return; }
    if (this.tables.has(key)) { this.showToast('Pöytä jo tässä'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const img = this.add.image(x,y,'tex_table').setDepth(4);
    this.decor.add(img);
    const cx = Math.floor(tx / CHUNK_W);
    this.chunks.get(cx)?.decor.push(img);
    this.tables.set(key, { image: img });
    this.tablePositions.push({ tx, ty });
    this.saveState();
  }
  removeTableAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    const e = this.tables.get(key); if (!e) { this.showToast('Ei pöytää'); return; }
    e.image?.destroy(); this.tables.delete(key);
    this.tablePositions = this.tablePositions.filter(p=> !(p.tx===tx && p.ty===ty));
    this.saveState();
  }

  spawnWorkstationAt(tx, ty, type = 'workbench'){
    const spec = WORKSTATION_MAP[type] || WORKSTATION_MAP.workbench;
    const key = `${tx},${ty}`;
    const existing = this.workstations.get(key);
    if (existing?.image?.active) return existing;
    const x = tx * TILE + TILE / 2;
    const y = ty * TILE + TILE / 2;
    const image = this.add.image(x, y, spec.textureKey).setDepth(4);
    const zone = this.add.zone(x, y, TILE * 1.15, TILE * 1.1);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zone.setData('type', 'workstation');
    zone.setData('station', spec.id);
    zone.setData('tx', tx);
    zone.setData('ty', ty);
    const cx = Math.floor(tx / CHUNK_W);
    this.decor.add(image);
    this.chunks.get(cx)?.decor.push(image, zone);
    const station = { image, zone, type: spec.id, label: spec.label };
    this.workstations.set(key, station);
    return station;
  }

  placeWorkstation(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE);
    const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    const spec = WORKSTATION_MAP[this.tools.equipped];
    if (!spec) return;
    if (this.blocks.get(key) || this.workstations.has(key)) { this.showToast('Paikka on jo varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty + 1)) { this.showToast('Tarvitset lattian alle'); return; }
    this.spawnWorkstationAt(tx, ty, spec.id);
    this.workstationPositions.push({ tx, ty, type: spec.id });
    this.showToast(`${spec.label} asetettu`);
    this.saveState();
  }

  removeWorkstationAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE);
    const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    const station = this.workstations.get(key);
    if (!station) { this.showToast('Ei työasemaa'); return; }
    station.image?.destroy();
    station.zone?.destroy?.();
    this.workstations.delete(key);
    this.workstationPositions = this.workstationPositions.filter((position) => !(position.tx === tx && position.ty === ty));
    this.showToast(`${station.label} poistettu`);
    this.saveState();
  }

  useWorkstation(station){
    if (!station) return;
    const spec = WORKSTATION_MAP[station.type];
    if (!spec) return;
    if (station.type === 'workbench') {
      this.craftPlank();
      return;
    }
    if (station.type === 'grill') {
      if (this.food.meat > 0) {
        this.food.meat -= 1;
        this.hunger.value = Math.min(this.hunger.max, this.hunger.value + 35);
        this.showToast('Grilli: ruoka valmistui (+35 nälkä)');
        this.updateUI(); this.saveState();
      } else this.showToast('Grilli: tarvitset lihaa');
      return;
    }
    this.showToast(`${spec.label}: ${spec.hint}`);
  }

  removeTorchAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    this.removeTorchAt(tx, ty);
    this.saveState();
  }
  removeTorchAt(tx, ty){
    const key = `${tx},${ty}`;
    const t = this.torches.get(key);
    t?.image?.destroy();
    this.torches.delete(key);
    this.torchPositions = this.torchPositions.filter(p=> !(p.tx===tx && p.ty===ty));
  }

  // --- Slime Cloner (device) ---
  placeSlimeCloner(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.get(key)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitset lattian alle'); return; }
    // Limit per chunk or total to avoid runaway
    const MAX_TOTAL = 10;
    if (this.slimeClonerPositions.length >= MAX_TOTAL) { this.showToast('Liikaa kloonauslaitteita'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const img = this.add.image(x,y,'tex_slimecloner').setDepth(4);
    this.decor.add(img);
    // Make a tiny overlap zone so bullets can destroy the device
    const zone = this.add.zone(x, y, TILE*0.9, TILE*0.9);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zone.setData('tx', tx); zone.setData('ty', ty); zone.setData('type','slimecloner');
    this.physics.add.overlap(this.bullets, zone, (bullet, z)=>{ bullet.destroy(); this.removeSlimeClonerAt(z.getData('tx'), z.getData('ty')); this.saveState(); }, null, this);
    if (this.currentChunk!=null) { this.chunks.get(this.currentChunk)?.decor.push(img); this.chunks.get(this.currentChunk)?.decor.push(zone); }
    const entry = { tx, ty, image: img, zone, nextAt: this.time.now + 2500, count: 0 };
    this.slimeCloners.set(key, entry);
    this.slimeClonerPositions.push({ tx, ty });
    this.saveState();
  }

  // --- Landmine (Miina) ---
  placeMine(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.get(key)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitset lattian alle'); return; }
    if (this.mines.has(key)) { this.showToast('Miina jo tässä'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const img = this.add.image(x,y,'tex_mine').setDepth(5);
    const zone = this.add.zone(x, y, TILE*0.9, TILE*0.9);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zone.setData('type','mine'); zone.setData('tx',tx); zone.setData('ty',ty);
    const trigger = (e)=>{
      if (!zone.active) return;
      // explode small (reuse bazooka small explodeAt)
      this.explodeAt(x,y);
      img.destroy(); zone.destroy();
      this.mines.delete(key);
      this.minePositions = this.minePositions.filter(p=> !(p.tx===tx && p.ty===ty));
      this.saveState();
    };
    // Trigger from any enemy group contact
    this.physics.add.overlap(zone, this.slimes, (z, e)=> trigger(e), null, this);
    this.physics.add.overlap(zone, this.birds, (z, e)=> trigger(e), null, this);
    this.physics.add.overlap(zone, this.zombies, (z, e)=> trigger(e), null, this);
    this.physics.add.overlap(zone, this.oppos, (z, e)=> trigger(e), null, this);
    this.physics.add.overlap(zone, this.enemySoldiers, (z, e)=> trigger(e), null, this);
    this.physics.add.overlap(zone, this.bosses, (z, e)=> trigger(e), null, this);
    if (this.currentChunk!=null) { this.chunks.get(this.currentChunk)?.decor.push(img); this.chunks.get(this.currentChunk)?.decor.push(zone); }
    this.mines.set(key, { image: img, zone });
    this.minePositions.push({ tx, ty });
    this.saveState();
  }

  removeMineAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    const m = this.mines.get(key);
    if (!m) { this.showToast('Ei miinaa'); return; }
    m.image?.destroy(); m.zone?.destroy?.();
    this.mines.delete(key);
    this.minePositions = this.minePositions.filter(p=> !(p.tx===tx && p.ty===ty));
    this.saveState();
  }

  removeSlimeClonerAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
  this.removeSlimeClonerAt(tx, ty);
  this.saveState();
  this.showToast('Limaklooni poistettu');
  }

  // --- Sniper Tower (Ampumatorni) ---
  placeTower(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    if (this.towers.has(key)) { this.showToast('Torni jo tässä'); return; }
    // Validate: 3-tile column must be free and solid ground under base
    for (let oy=0; oy<3; oy++) if (this.hasSolidBlockAt(tx, ty-oy)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitsee alustan'); return; }
    // Prevent overlapping player
    const x = tx*TILE + TILE/2, yBase = ty*TILE + TILE/2;
    const rects = [
      new Phaser.Geom.Rectangle(x - TILE/2, yBase - TILE/2, TILE, TILE),
      new Phaser.Geom.Rectangle(x - TILE/2, yBase - TILE*3/2, TILE, TILE),
      new Phaser.Geom.Rectangle(x - TILE/2, yBase - TILE*5/2, TILE, TILE)
    ];
    const pb = new Phaser.Geom.Rectangle(this.player.body.x, this.player.body.y, this.player.body.width, this.player.body.height);
    if (rects.some(r=> Phaser.Geom.Intersects.RectangleToRectangle(r, pb))) { this.showToast('Liian lähellä'); return; }
  // Build visuals: unified body (3 tiles tall) and rotating gun at top
  const body = this.add.image(x, yBase + TILE/2, 'tex_tower_body').setDepth(4);
  body.setOrigin(0.5, 1.0); // body bottom aligns to base tile top
  const head = this.add.image(x, yBase - TILE*2, 'tex_tower_gun').setDepth(5);
  head.setOrigin(0.4, 0.5);
  // Visible soldier on the platform (slightly behind the gun)
  const soldier = this.add.image(x, yBase - TILE*2 - 2, 'tex_soldier').setDepth(5).setOrigin(0.5, 1.0);
    // Invisible zone to detect bullet hits if we later want destructibility (for now, removal by player)
    const zone = this.add.zone(x, yBase - TILE, TILE, TILE*3);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zone.setData('type','tower'); zone.setData('tx',tx); zone.setData('ty',ty);
    // Track in chunk decor
  if (this.currentChunk!=null) { const ch = this.chunks.get(this.currentChunk); ch?.decor.push(body); ch?.decor.push(head); ch?.decor.push(soldier); ch?.decor.push(zone); }
  this.towers.set(key, { body, head, soldier, zone, nextAt: 0 });
    this.towerPositions.push({ tx, ty });
    this.saveState();
  }
  // --- Soldier Cloner (Sotilasklooni) ---
  placeSoldierCloner(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.get(key)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitset lattian alle'); return; }
    if (this.soldierCloners.has(key)) { this.showToast('Laite jo tässä'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const img = this.add.image(x,y,'tex_soldiercloner').setDepth(4);
    const zone = this.add.zone(x, y, TILE*0.9, TILE*0.9);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zone.setData('type','soldiercloner'); zone.setData('tx',tx); zone.setData('ty',ty);
    if (this.currentChunk!=null) { this.chunks.get(this.currentChunk)?.decor.push(img); this.chunks.get(this.currentChunk)?.decor.push(zone); }
    this.soldierCloners.set(key, { image: img, zone, nextAt: this.time.now + 2500, count: 0 });
    this.soldierClonerPositions.push({ tx, ty });
    this.saveState();
  }
  removeSoldierClonerAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    const e = this.soldierCloners.get(key);
    if (!e) { this.showToast('Ei laitetta'); return; }
    e.image?.destroy(); e.zone?.destroy?.();
    this.soldierCloners.delete(key);
    this.soldierClonerPositions = this.soldierClonerPositions.filter(p=> !(p.tx===tx && p.ty===ty));
    this.saveState();
  }

  // --- Tank Spawner (Tankki klooni) ---
  placeTankCloner(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.get(key)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitset lattian alle'); return; }
    if (this.tankCloners.has(key)) { this.showToast('Laite jo tässä'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const img = this.add.image(x,y,'tex_soldiercloner').setDepth(4).setTint(0x88bbff);
    const zone = this.add.zone(x, y, TILE*0.9, TILE*0.9);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zone.setData('type','tankcloner'); zone.setData('tx',tx); zone.setData('ty',ty);
    if (this.currentChunk!=null) { this.chunks.get(this.currentChunk)?.decor.push(img); this.chunks.get(this.currentChunk)?.decor.push(zone); }
    this.tankCloners.set(key, { image: img, zone, nextAt: this.time.now + 3000, count: 0 });
    this.tankClonerPositions.push({ tx, ty });
    this.saveState();
  }
  removeTankClonerAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    this.removeTankClonerAt(tx, ty);
  }
  removeTankClonerAt(tx, ty){
    const key = `${tx},${ty}`;
    const e = this.tankCloners.get(key);
    if (!e) { this.showToast('Ei laitetta'); return; }
    e.image?.destroy(); e.zone?.destroy?.();
    this.tankCloners.delete(key);
    this.tankClonerPositions = this.tankClonerPositions.filter(p=> !(p.tx===tx && p.ty===ty));
    this.saveState();
  }
  maybeRunTankCloners(){
    if (!this.tankClonerPositions?.length) return;
    const CAP_PER = 2;
    for (const pos of this.tankClonerPositions){
      const key = `${pos.tx},${pos.ty}`;
      const e = this.tankCloners.get(key);
      if (!e || !e.image || !e.image.active) continue;
      if (!e.nextAt) e.nextAt = this.time.now + 3000;
      if (this.time.now < e.nextAt) continue;
      if (e.count >= CAP_PER) continue;
      e.nextAt = this.time.now + Phaser.Math.Between(6000, 9000);
      const tx = pos.tx, ty = pos.ty - 1;
      const t = this.spawnTankAt(tx, ty);
      if (t) { e.count++; t.on('destroy', ()=>{ e.count = Math.max(0, e.count-1); }); }
    }
  }

  // --- Traps system ---
  getTrapTextureKey(type = 'spike') {
    return ({
      spike: 'tex_trap_spike', bear: 'tex_trap_bear', tripwire: 'tex_trap_tripwire',
      fire: 'tex_trap_fire', poison: 'tex_trap_poison', spring: 'tex_trap_spring',
      freeze: 'tex_trap_freeze', alarm: 'tex_trap_alarm', trampoline: 'tex_trap_trampoline'
    })[type] || 'tex_trap_spike';
  }

  armTrapAt(tx, ty, type) {
    if (type === 'tripwire') this._armTripwireAt(tx, ty);
    else if (type === 'bear') this._armBearAt(tx, ty);
    else if (type === 'spike') this._armSpikeAt(tx, ty);
    else if (type === 'fire') this._armFireAt(tx, ty);
    else if (type === 'poison') this._armPoisonAt(tx, ty);
    else if (type === 'spring') this._armSpringAt(tx, ty);
    else if (type === 'freeze') this._armFreezeAt(tx, ty);
    else if (type === 'alarm') this._armAlarmAt(tx, ty);
    else if (type === 'trampoline') this._armTrampolineAt(tx, ty);
  }

  placeTrapAtTile(tx, ty, type = 'spike', textureKey = null, dir = 'right', save = true){
    const key = `${tx},${ty}`;
    if (this.blocks.get(key)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitset lattian alle'); return; }
    if (this.traps.has(key)) { this.showToast('Ansa jo tässä'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const t = type || 'spike';
    const imgKey = textureKey || this.getTrapTextureKey(t);
    const img = this.add.image(x,y,imgKey).setDepth(4);
    // detection zone slightly smaller than tile to avoid edge hits
    const zone = this.add.zone(x,y,TILE*0.9,TILE*0.9);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zone.setData('type','trap'); zone.setData('tx',tx); zone.setData('ty',ty);
    // Store
    this.traps.set(key, { image: img, zone, type: t, dir, nextAt: 0 });
    this.trapPositions.push({ tx, ty, type: t, textureKey: imgKey, dir });
    // Hook behavior
    this.armTrapAt(tx, ty, t);
    if (save) this.saveState();
    return true;
  }

  placeTrap(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const t = this.trap?.type || 'spike';
    const dir = this.trap?.dir || (pointer.worldX >= this.player.x ? 'right' : 'left');
    this.placeTrapAtTile(tx, ty, t, this.getTrapTextureKey(t), dir, true);
  }
  removeTrapAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    this.removeTrapAt(tx, ty);
  }
  removeTrapAt(tx, ty){
    const key = `${tx},${ty}`;
    const t = this.traps.get(key);
    if (!t) { this.showToast('Ei ansaa'); return; }
    t.image?.destroy(); t.zone?.destroy?.(); t.dartZone?.destroy?.();
    this.traps.delete(key);
    this.trapPositions = this.trapPositions.filter(p=> !(p.tx===tx && p.ty===ty));
    this.saveState();
  }
  cycleTrapType(){
    const order = ['spike','bear','tripwire','fire','poison','spring','freeze','alarm','trampoline'];
    const i = order.indexOf(this.trap.type);
    const next = order[(i+1)%order.length];
    this.trap.type = next;
    const name = { spike:'Piikki', bear:'Karhu', tripwire:'Lankaviritin', fire:'Tuli', poison:'Myrkky', spring:'Jousi', freeze:'Jää', alarm:'Hälytin', trampoline:'Trampoliini' }[next] || next;
    this.showToast(`Ansa: ${name}`);
  }
  // Public helper: set trap type programmatically (supports Finnish aliases)
  setTrapType(type){
    const alias = { piikki:'spike', karhu:'bear', lankaviritin:'tripwire', tuli:'fire', myrkky:'poison', jousi:'spring', jää:'freeze', jaa:'freeze', halytin:'alarm', hälytin:'alarm', trampoliini:'trampoline', tramppa:'trampoline' };
    const t = alias[type] || type;
    const valid = new Set(['spike','bear','tripwire','fire','poison','spring','freeze','alarm','trampoline']);
    if (valid.has(t)) { this.trap.type = t; const name = { spike:'Piikki', bear:'Karhu', tripwire:'Lankaviritin', fire:'Tuli', poison:'Myrkky', spring:'Jousi', freeze:'Jää', alarm:'Hälytin', trampoline:'Trampoliini' }[t]; this.showToast(`Ansa: ${name}`); this.saveState(); }
  }
  _armSpikeAt(tx, ty){
    const key = `${tx},${ty}`; const rec = this.traps.get(key); if (!rec) return;
    const zone = rec.zone;
    // Spike: overlapping enemies take damage or die
    this.physics.add.overlap(zone, [this.slimes, this.zombies, this.oppos, this.birds, this.enemySoldiers], (z, enemy)=>{
      this.destroyEnemyWithCoinReward(enemy,2);
    }, null, this);
    // player and allies safe
  }
  _armBearAt(tx, ty){
    const key = `${tx},${ty}`; const rec = this.traps.get(key); if (!rec) return;
    const zone = rec.zone;
    this.physics.add.overlap(zone, [this.slimes, this.zombies, this.oppos, this.enemySoldiers], (z, enemy)=>{
      if (enemy.getData && enemy.getData('snared')) return;
      enemy.setVelocity(0,0); enemy.body.allowGravity = false; enemy.setData('snared', true);
      // jaws snap effect and destroy trap after a short while
      this.time.delayedCall(600, ()=>{ try{ this.destroyEnemyWithCoinReward(enemy,2); }catch(e){} this.removeTrapAt(tx,ty); });
    }, null, this);
  }
  _armTripwireAt(tx, ty){
    const key = `${tx},${ty}`; const rec = this.traps.get(key); if (!rec) return;
    rec.nextAt = 0;
    const zone = rec.zone;
    this.physics.add.overlap(zone, [this.slimes, this.zombies, this.oppos, this.enemySoldiers, this.birds], (z, enemy)=>{
      if (this.time.now < (rec.nextAt||0)) return;
      rec.nextAt = this.time.now + 1200;
      // Fire a dart horizontally in rec.dir
      const x = zone.x + (rec.dir==='right'? TILE*0.5 : -TILE*0.5);
      const y = zone.y - TILE*0.2;
      const dart = this.physics.add.image(x,y,'tex_dart');
      dart.setDepth(5); dart.body.allowGravity = false; dart.setVelocityX((rec.dir==='right'? 300: -300));
      dart.setData('isDart', true);
      // Overlaps: kills enemies, not player/allies
      this.physics.add.overlap(dart, [this.slimes, this.zombies, this.oppos, this.enemySoldiers, this.birds], (d,e)=>{ this.destroyEnemyWithCoinReward(e,1); d.destroy(); }, null, this);
  // Optional: make darts harmless to player; comment next line to enable damage
  // this.physics.add.overlap(dart, this.player, (d,p)=>{ d.destroy(); this.damage(1); }, null, this);
      this.physics.add.overlap(dart, this.soldiers, (d,s)=>{ d.destroy(); }, null, this);
      this.physics.add.overlap(dart, this.clones, (d,c)=>{ d.destroy(); }, null, this);
      // auto-destroy after travel
      this.time.delayedCall(1800, ()=>{ try{ dart.destroy(); }catch(e){} });
    }, null, this);
  }
  _armFireAt(tx, ty){
    const key=`${tx},${ty}`; const rec=this.traps.get(key); if (!rec) return; rec.nextAt=0;
    const zone=rec.zone; // use overlap to emit short flames in facing dir
    this.physics.add.overlap(zone, [this.slimes,this.zombies,this.oppos,this.enemySoldiers,this.birds], ()=>{
      if (this.time.now < (rec.nextAt||0)) return; rec.nextAt = this.time.now + 900;
      const dir = rec.dir==='left'?-1:1; const x=zone.x + dir*TILE*0.3; const y=zone.y - TILE*0.2;
      // 3 small flame puffs in a cone
      for (let i=0;i<3;i++){
        const f = this.physics.add.image(x, y - i*4, 'tex_flame'); f.setDepth(5); f.body.allowGravity=false; f.setVelocity(dir*(180+40*i), -10*i);
        this.physics.add.overlap(f, [this.slimes,this.zombies,this.oppos,this.enemySoldiers,this.birds], (ff,e)=>{ this.destroyEnemyWithCoinReward(e,1); ff.destroy(); }, null, this);
        this.time.delayedCall(500, ()=>{ try{ f.destroy(); }catch(e){} });
      }
    }, null, this);
  }
  _armPoisonAt(tx, ty){
    const key=`${tx},${ty}`; const rec=this.traps.get(key); if (!rec) return; rec.nextAt=0;
    const zone=rec.zone;
    // On enemy contact, spawn a lingering gas cloud that damages over time
    this.physics.add.overlap(zone, [this.slimes,this.zombies,this.oppos,this.enemySoldiers,this.birds], ()=>{
      if (this.time.now < (rec.nextAt||0)) return; rec.nextAt = this.time.now + 2000;
      const cloud = this.add.image(zone.x, zone.y-6, 'tex_gas').setDepth(5); cloud.setAlpha(0.9);
      const kill = (e)=>{ this.destroyEnemyWithCoinReward(e,1); };
      const dover = this.physics.add.overlap(cloud, [this.slimes,this.zombies,this.oppos,this.enemySoldiers,this.birds], (c,e)=>{ kill(e); }, null, this);
      this.time.delayedCall(1600, ()=>{ try{ dover.destroy(); cloud.destroy(); }catch(e){} });
    }, null, this);
  }
  _armSpringAt(tx, ty){
    const key=`${tx},${ty}`; const rec=this.traps.get(key); if (!rec) return; const zone=rec.zone; const dir = rec.dir==='left'?-1:1;
    this.physics.add.overlap(zone, [this.slimes,this.zombies,this.oppos,this.enemySoldiers,this.birds], (z,e)=>{
      e.setVelocityX( dir * 300 ); e.setVelocityY( -150 );
    }, null, this);
  }
  _armTrampolineAt(tx, ty){
    const key=`${tx},${ty}`; const rec=this.traps.get(key); if (!rec) return;
    rec.nextAt = 0;
    this.physics.add.overlap(rec.zone, this.player, ()=>{
      if (this.time.now < rec.nextAt) return;
      const body = this.player?.body;
      if (!body) return;
      // Bounce only from the top. Passing through the trampoline from below
      // or touching its side should not unexpectedly launch the player.
      if (body.velocity.y < -40 || body.bottom > rec.zone.y + TILE * 0.55) return;
      rec.nextAt = this.time.now + 450;
      this.player.setVelocityY(-980);
      this.tweens.add({ targets: rec.image, scaleY: 0.72, duration: 70, yoyo: true, ease: 'Quad.easeOut' });
      try { window.playSfx?.('jump'); } catch (e) {}
    }, null, this);
  }
  _armFreezeAt(tx, ty){
    const key=`${tx},${ty}`; const rec=this.traps.get(key); if (!rec) return; const zone=rec.zone;
    this.physics.add.overlap(zone, [this.slimes,this.zombies,this.oppos,this.enemySoldiers,this.birds], (z,e)=>{
      if (e.getData && e.getData('frozenUntil') && this.time.now < e.getData('frozenUntil')) return;
      const until = this.time.now + 1500; e.setData('frozenUntil', until);
      // slow: halve velocity and disable gravity briefly
      e.setVelocity(e.body.velocity.x*0.4, e.body.velocity.y*0.2); e.body.allowGravity=false;
      this.time.delayedCall(1500, ()=>{ if (e && e.body) e.body.allowGravity=true; });
    }, null, this);
  }
  _armAlarmAt(tx, ty){
    const key=`${tx},${ty}`; const rec=this.traps.get(key); if (!rec) return; rec.nextAt=0; const zone=rec.zone;
    this.physics.add.overlap(zone, [this.slimes,this.zombies,this.oppos,this.zombies], ()=>{
      if (this.time.now < (rec.nextAt||0)) return; rec.nextAt = this.time.now + 5000;
      // Spawn one allied soldier to help
      const s = this.physics.add.image(zone.x, zone.y-12, 'tex_soldier').setDepth(5);
      s.setData('type','ally'); s.setData('weapon','ak47'); s.body.allowGravity=true; s.setCollideWorldBounds(true); if (s.body?.setSize) s.body.setSize(20,34).setOffset(4,2);
      this.soldiers.add(s);
    }, null, this);
  }
  spawnTankAt(tx, ty){
    if (this.hasSolidBlockAt(tx, ty)) return null;
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const base = this.physics.add.image(x, y, 'tex_tank_base').setDepth(5);
    base.body.allowGravity = true;
    base.setCollideWorldBounds(true);
    base.body.setSize(36, 20).setOffset(4, 6);
    // appearance
    const col = Phaser.Display.Color.HexStringToColor(this.tankAppearance.color).color;
    base.setTint(col);
    // turret sprite follows base
    const turret = this.add.image(x, y-12, 'tex_tank_turret').setDepth(6);
    turret.setOrigin(0.2, 0.5);
    const tt = Phaser.Display.Color.HexStringToColor(this.tankAppearance.turretTint).color;
    turret.setTint(tt);
    base._turret = turret;
    base.on('destroy', ()=> turret.destroy());
    this.tanks.add(base);
    return base;
  }

  // Spawn a single allied jetpack soldier at given tile or near player
  spawnJetpackSoldier(opts={}){
    const tx = (typeof opts.tx === 'number') ? opts.tx : Math.floor(this.player.x / TILE);
    const ty = (typeof opts.ty === 'number') ? opts.ty : Math.floor(this.player.y / TILE) - 1;
    if (this.hasSolidBlockAt(tx, ty)) return false;
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const s = this.physics.add.image(x, y, 'tex_soldier_jetpack').setDepth(5);
    s.setData('type','ally'); s.setData('weapon','rifle_jet'); s.setData('nextAt', 0);
    s.body.allowGravity = true; s.setCollideWorldBounds(true);
    if (s.body?.setSize) s.body.setSize(20, 34).setOffset(4, 2);
    s._ai = { nextAt: 0 };
    this.soldiers?.add?.(s);
    return true;
  }

  maybeRunSoldierCloners(){
    if (!this.soldierClonerPositions?.length) return;
    const CAP_PER = 3; // per device
    for (const pos of this.soldierClonerPositions){
      const key = `${pos.tx},${pos.ty}`;
      let e = this.soldierCloners.get(key);
      if (!e || !e.image || !e.image.active) continue;
      if (!e.nextAt) e.nextAt = this.time.now + 2500;
      if (this.time.now < e.nextAt) continue;
      if (e.count >= CAP_PER) continue;
      e.nextAt = this.time.now + Phaser.Math.Between(4000, 7000);
      // spawn soldier one tile above
      const tx = pos.tx, ty = pos.ty - 1;
      if (this.hasSolidBlockAt(tx, ty)) continue;
      const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
  const s = this.physics.add.image(x, y, 'tex_soldier').setDepth(5);
  s.setData('type','ally'); s.setData('weapon','ak47'); s.setData('nextAt', 0);
  // Enable gravity so they land on platforms; set body size similar to player
  s.body.allowGravity = true;
  s.setCollideWorldBounds(true);
  if (s.body?.setSize) s.body.setSize(20, 34).setOffset(4, 2);
      s._ai = { nextAt: 0 };
      this.soldiers.add(s);
      e.count++;
      s.on('destroy', ()=>{ e.count = Math.max(0, e.count-1); });
    }
  }
  removeTowerAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    const t = this.towers.get(key);
    if (!t) { this.showToast('Ei tornia'); return; }
   t.body?.destroy(); t.head?.destroy(); t.soldier?.destroy(); t.zone?.destroy?.(); t._gfx?.destroy?.();
    this.towers.delete(key);
    this.towerPositions = this.towerPositions.filter(p=> !(p.tx===tx && p.ty===ty));
    this.saveState();
  }

  removeSlimeClonerAt(tx, ty){
    const key = `${tx},${ty}`; const e = this.slimeCloners.get(key);
    if (!e) return;
    e.image?.destroy(); e.zone?.destroy?.();
    this.slimeCloners.delete(key);
    this.slimeClonerPositions = this.slimeClonerPositions.filter(p=> !(p.tx===tx && p.ty===ty));
  }

  // --- Lightning Rod (Ukonjohdatin) ---
  placeRod(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.get(key)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitset lattian alle'); return; }
    if (this.rods.has(key)) { this.showToast('Ukonjohdatin jo tässä'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const img = this.add.image(x,y,'tex_rod').setDepth(4);
    this.decor.add(img);
    if (this.currentChunk!=null) this.chunks.get(this.currentChunk)?.decor.push(img);
    const hp = 3;
    this.rods.set(key, { image: img, hp });
    this.rodPositions.push({ tx, ty, hp });
    this.saveState();
  }
  removeRodAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    const r = this.rods.get(key);
    if (!r) { this.showToast('Ei ukkosenjohdatinta'); return; }
    r.image?.destroy();
    this.rods.delete(key);
    this.rodPositions = this.rodPositions.filter(p=> !(p.tx===tx && p.ty===ty));
    this.saveState();
  }

  // --- Fishing (Onki) ---
  castFishing(pointer){
    if ((this.fishing?.cooldownUntil||0) > this.time.now) { this.showToast('Odotetaan...'); return; }
    // If already active, treat as reel
    if (this.fishing?.active) { this.reelFishing(); return; }
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(wp.x / TILE), ty = Math.floor(wp.y / TILE);
    const key = `${tx},${ty}`;
    if (!this.waterTiles.has(key)) { this.showToast('Tarvitsee vettä'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    try { this.fishing.bobber?.destroy(); } catch(e) {}
    const bob = this.add.image(x, y, 'tex_bobber').setDepth(6);
    this.fishing = this.fishing || {};
    this.fishing.active = true;
    this.fishing.bobber = bob;
    this.fishing.baseY = y;
    // Bite between ~0.9s and 1.8s
    this.fishing.nextNibbleAt = this.time.now + Phaser.Math.Between(900, 1800);
    this.showToast('Heitit ongen');
  }
  reelFishing(){
    if (!this.fishing?.active) { this.showToast('Ei siimaa vedettävänä'); return; }
    // Early reel: small chance to get something; otherwise nothing
    if (Math.random() < 0.3) {
      const bx = this.fishing.bobber?.x||this.player.x, by = this.fishing.bobber?.y||this.player.y;
      this.dropMeat(bx, by);
      this.showToast('Nappasi!');
    } else {
      this.showToast('Ei kalaa');
    }
    try { this.fishing.bobber?.destroy(); } catch(e) {}
    this.fishing.active = false;
    this.fishing.bobber = null;
    this.fishingGfx?.clear();
    this.fishing.cooldownUntil = this.time.now + 800;
  }
  _doFishingCatch(){
    if (!this.fishing?.active) return;
    // Prefer catching a nearby fish entity; else drop meat as generic fish
    let caught = false;
    const bx = this.fishing.bobber?.x||this.player.x, by = this.fishing.bobber?.y||this.player.y;
    const R2 = (80*80);
    try {
      this.fishes?.children?.iterate?.((f)=>{
        if (caught || !f || !f.active) return;
        const dx=f.x-bx, dy=f.y-by; if (dx*dx+dy*dy <= R2) { f.destroy(); caught = true; }
      });
    } catch(e) {}
    if (caught) { this.dropMeat(bx, by); this.showToast('Sait kalan!'); }
    else if (Math.random()<0.5) { this.dropMeat(bx, by); this.showToast('Sait kalan!'); }
    else { this.showToast('Ei kalaa'); }
    try { this.fishing.bobber?.destroy(); } catch(e) {}
    this.fishing.active = false;
    this.fishing.bobber = null;
    this.fishingGfx?.clear();
    this.fishing.cooldownUntil = this.time.now + 800;
  }

  // Storm tick: start/stop storms and schedule lightning while active
  maybeRunStorm(){
    const w = this.weather;
    const now = this.time.now;
    if (now >= (w.nextStormCheckAt||0)) {
      w.nextStormCheckAt = now + 5000;
      if (!w.isStorm) {
        // small chance to start a storm, more likely at night
        const base = 0.04; // 4% every 5s
        const bonus = this.day.isNight ? 0.05 : 0;
        if (Math.random() < base + bonus) {
          w.isStorm = true;
          const dur = Phaser.Math.Between(12000, 22000);
          w.stormEndsAt = now + dur;
          w.nextLightningAt = now + Phaser.Math.Between(600, 1600);
          this.showToast('Ukkosmyrsky alkaa!');
        }
      } else {
        if (now >= w.stormEndsAt) {
          w.isStorm = false; w.stormEndsAt = 0; w.nextLightningAt = 0;
          this.showToast('Myrsky ohi');
        }
      }
    }
    if (!w.isStorm) return;
    if (now >= (w.nextLightningAt||0)) {
      w.nextLightningAt = now + Phaser.Math.Between(800, 2400);
      this.triggerLightningStrike();
    }
  }

  // Choose a strike target near player or a placed rod; apply protection and damage
  triggerLightningStrike(){
    // Prefer a rod near the player (within 12 tiles horizontally)
    const ptx = Math.floor(this.player.x / TILE);
    let target = null; let onRod = false;
    for (const rp of this.rodPositions) {
      if (Math.abs(rp.tx - ptx) <= 12 && Math.abs((rp.ty*TILE + TILE/2) - this.player.y) <= 22*TILE) {
        target = { x: rp.tx*TILE + TILE/2, y: rp.ty*TILE + TILE/2, tx: rp.tx, ty: rp.ty };
        onRod = true; break;
      }
    }
    if (!target) {
      const tx = ptx + Phaser.Math.Between(-8, 8);
      const ty = Math.max(2, SURFACE_Y - Phaser.Math.Between(0, 6));
      target = { x: tx*TILE + TILE/2, y: ty*TILE + TILE/2, tx, ty };
    }
    this.drawLightning(target.x, target.y);
    // Damage logic: if no rod in 4-tile radius horizontally, and player is near strike, hurt
    const protectR = 4;
    let protectedByRod = false;
    for (const rp of this.rodPositions) {
      if (Math.abs(rp.tx - target.tx) <= protectR && Math.abs(rp.ty - target.ty) <= 6) { protectedByRod = true; break; }
    }
    const dx = Math.abs(this.player.x - target.x);
    const dy = Math.abs(this.player.y - target.y);
    if (dx < 120 && dy < 120) {
      if (!protectedByRod) this.damage(2);
    }
    // If hit a rod directly, degrade it; break when hp <= 0
    if (onRod) {
      const key = `${target.tx},${target.ty}`; const r = this.rods.get(key);
      if (r) {
        r.hp = (r.hp||3) - 1;
        // small zap effect on the rod
        this.time.delayedCall(80, ()=>{ if (r.image?.setTint) r.image.setTint(0xffffaa); });
        this.time.delayedCall(280, ()=>{ if (r.image?.clearTint) r.image.clearTint(); });
        // persist
        for (const rp of this.rodPositions){ if (rp.tx===target.tx && rp.ty===target.ty){ rp.hp = r.hp; break; } }
        if (r.hp <= 0) {
          r.image?.destroy(); this.rods.delete(key);
          this.rodPositions = this.rodPositions.filter(p=> !(p.tx===target.tx && p.ty===target.ty));
          this.showToast('Ukonjohdatin hajosi');
        }
        this.saveState();
      }
    }
  }

  drawLightning(x, y){
    // vertical bolt from top of screen to y
    const cam = this.cameras.main;
    const sx = x - cam.scrollX, sy = y - cam.scrollY;
    // flash overlay
    const gfx = this.add.graphics().setScrollFactor(0).setDepth(880);
    gfx.fillStyle(0xffffff, 0.18); gfx.fillRect(0,0,cam.width,cam.height);
    this.time.delayedCall(80, ()=> gfx.destroy());
    // bolt images
    const h = sy + 10; const seg = this.add.image(sx, h/2, 'tex_lightning').setScrollFactor(0).setDepth(881);
    seg.setOrigin(0.5, 0); seg.setScale(1, h / TILE);
    // add a few side flickers
    for (let i=0;i<2;i++){
      const ex = sx + Phaser.Math.Between(-10,10);
      const eh = (h*0.6) + Phaser.Math.Between(-20,20);
      const s2 = this.add.image(ex, eh/2, 'tex_lightning').setScrollFactor(0).setDepth(881);
      s2.setOrigin(0.5, 0); s2.setScale(0.6, eh / TILE);
      this.time.delayedCall(120 + i*20, ()=> s2.destroy());
    }
    this.time.delayedCall(120, ()=> seg.destroy());
  }

  maybeRunSlimeCloners(){
    if (!this.slimeClonerPositions?.length) return;
    const CAP_PER = 4; // per device
    for (const pos of this.slimeClonerPositions){
      const key = `${pos.tx},${pos.ty}`;
      let e = this.slimeCloners.get(key);
      if (!e || !e.image || !e.image.active) continue; // offloaded chunk or not spawned yet
      if (!e.nextAt) e.nextAt = this.time.now + 2500;
      if (this.time.now < e.nextAt) continue;
      e.nextAt = this.time.now + Phaser.Math.Between(3000, 5500);
      if (e.count >= CAP_PER) continue;
      // spawn slime atop the device if free
      const tx = pos.tx, ty = pos.ty - 1;
      if (this.hasSolidBlockAt(tx, ty)) continue;
      const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
      const sl = this.slimes.create(x, y, 'tex_slime');
      sl.setBounce(0.1,0.0); sl.setCollideWorldBounds(true); sl.setVelocityX(Math.random()<0.5?-80:80); sl.body.setSize(24,16).setOffset(2,4);
      this.physics.add.collider(sl, this.platforms);
      // decrement counter when destroyed
      sl.on('destroy', ()=>{ e.count = Math.max(0, e.count-1); });
      e.count++;
    }
  }

  // --- Teleport (portal) placement and logic ---
  placePortal(pointer){
    if (this.inv.wood < 8) { this.showToast('Tarvitset 8 puuta teleporttiin'); return; }
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.get(key)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitset lattian alle'); return; }
  // Spawn static image; we'll detect overlap in update()
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const color = this.portal.placeColor;
  const tex = this.textureForPortal(color);
  const img = this.add.image(x,y,tex).setDepth(4);
  const zone = this.physics.add.staticImage(x,y,tex).setVisible(false);
  zone.setData('type','portal'); zone.setData('tx',tx); zone.setData('ty',ty); zone.setData('color',color);
  this.portalsGroup.add(zone);
  this.decor.add(img);
  if (this.currentChunk!=null) { this.chunks.get(this.currentChunk)?.decor.push(img); this.chunks.get(this.currentChunk)?.decor.push(zone); }
  this.portals.set(key, { color, image: img, zone });
    this.portalPositions.push({ tx, ty, color });
    this.inv.wood -= 8; this.updateInventoryUI();
    this.saveState();
  }

  textureForPortal(color){
    switch(color){
      case 'red': return 'tex_portal_red';
      case 'green': return 'tex_portal_green';
      case 'yellow': return 'tex_portal_yellow';
      default: return 'tex_portal_blue';
    }
  }

  cyclePortalColor(){
    const order=['blue','red','green','yellow'];
    const i = order.indexOf(this.portal.placeColor);
    this.portal.placeColor = order[(i+1)%order.length];
    this.showToast('Teleportin väri: ' + this.portal.placeColor);
  }

  removePortalAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    const p = this.portals.get(key);
    if (!p) return;
    p.image?.destroy();
    this.portals.delete(key);
    this.portalPositions = this.portalPositions.filter(pp=>!(pp.tx===tx && pp.ty===ty));
    this.saveState();
  }

  removePortalAt(tx, ty){
    const key = `${tx},${ty}`;
    const p = this.portals.get(key);
    if (!p) return;
    p.image?.destroy();
    p.zone?.destroy?.();
    this.portals.delete(key);
    this.portalPositions = this.portalPositions.filter(pp=>!(pp.tx===tx && pp.ty===ty));
    this.saveState();
  }

  onEnterPortal(tx,ty,color){
    if (this.time.now < (this.portal.cooldownUntil||0)) return; // brief cooldown to avoid loops
    const key = `${tx},${ty}`;
    // Find other portal with same color; pick nearest to current to make pairs work naturally
    let target=null, bestD2=Infinity;
    for (const p of this.portalPositions){
      if (p.color!==color) continue;
      if (p.tx===tx && p.ty===ty) continue;
      const dx = (p.tx - tx), dy = (p.ty - ty);
      const d2 = dx*dx + dy*dy;
      if (d2 < bestD2) { bestD2=d2; target=p; }
    }
    if (!target) return; // no pair yet
    // Start countdown 1,2,3 then teleport
    if (this.portal.countdownKey === key) return; // already counting for this one
    this.portal.countdownKey = key;
    const centerX = tx*TILE + TILE/2, centerY = ty*TILE + TILE/2;
    if (!this.portal.countdownText) this.portal.countdownText = this.add.text(centerX, centerY-28, '', { fontFamily:'monospace', fontSize:'18px', color:'#fff', backgroundColor:'#0008' }).setOrigin(0.5).setDepth(1000);
    const txt = this.portal.countdownText; txt.setPosition(centerX, centerY-28).setVisible(true);
    const seq=['1','2','3'];
    seq.forEach((t,i)=>{
      this.time.delayedCall(i*1000, ()=>{ txt.setText(t); });
    });
    this.time.delayedCall(seq.length*1000, ()=>{
      txt.setVisible(false); this.portal.countdownKey=null;
      // Teleport player to target tile center, slightly above
      this.player.x = target.tx*TILE + TILE/2;
      this.player.y = target.ty*TILE + TILE/2 - 4;
      this.player.body.stop();
      // Cooldown to prevent instant back-teleport
      this.portal.cooldownUntil = this.time.now + 800;
      this.ensureChunksAround(this.player.x);
    });
  }

  knifeStrike(pointer){
    // 2-tile reach melee strike against slimes
    if (this._knifeCd && this._knifeCd > this.time.now) return;
    this._knifeCd = this.time.now + 220; // cooldown
    const isCopper = this.tools.equipped === 'knife_copper';
    const reach = (2 + (isCopper ? 17 : 0)) * TILE;
    const px = this.player.x, py = this.player.y;
    // face towards pointer
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.player.setFlipX(worldPoint.x < px);
    // Kill slimes
    this.slimes.children.iterate((sl)=>{
      if (!sl || !sl.active) return;
      const dx = sl.x - px, dy = sl.y - py;
      if (dx*dx + dy*dy <= reach*reach) {
        const x = sl.x, y = sl.y;
        sl.destroy();
        // Drop 3 coins on slime kill with knife
        this.dropCoins(x, y, 3);
      }
    });
    // Kill clones too (friendly-fire to allow removal)
    this.clones?.children?.iterate?.((cl)=>{
      if (!cl || !cl.active) return;
      const dx = cl.x - px, dy = cl.y - py;
      if (dx*dx + dy*dy <= reach*reach) this.removeClone(cl);
    });
  }

  pamppuAttack(pointer){
    // 5-tile reach melee swipe in facing direction toward pointer
    if (this._pamppuAtkCd && this._pamppuAtkCd > this.time.now) return;
    this._pamppuAtkCd = this.time.now + 220;
    const isCopper = this.tools.equipped === 'pamppu_copper';
    const reach = (5 + (isCopper ? 17 : 0)) * TILE;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const px = this.player.x, py = this.player.y;
    const dirRight = (wp.x >= px);
    this.player.setFlipX(!dirRight);
    // Visual swipe
    const g = this.add.graphics().setDepth(800);
    const sx = px, sy = py; const ex = px + (dirRight? reach : -reach), ey = py;
    g.lineStyle(6, 0xffffff, 0.6); g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.strokePath();
    this.time.delayedCall(80, ()=> g.destroy());
    // Helper to hit a group
    const hitEnemy = (e, coins=0)=>{
      if (!e || !e.active) return;
      const dx = e.x - px, dy = e.y - py; const forward = dirRight ? dx>=0 : dx<=0; const d2 = dx*dx + dy*dy;
      if (forward && d2 <= reach*reach) this.destroyEnemyWithCoinReward(e, coins);
    };
    this.slimes?.children?.iterate?.(e=>hitEnemy(e,3));
    this.birds?.children?.iterate?.(e=>hitEnemy(e,0));
    this.zombies?.children?.iterate?.(e=>hitEnemy(e,2));
    this.oppos?.children?.iterate?.(e=>hitEnemy(e,2));
    this.enemySoldiers?.children?.iterate?.(e=>hitEnemy(e,3));
    // Boss minor damage + knockback
    this.bosses?.children?.iterate?.((b)=>{
      if (!b || !b.active) return; const dx=b.x-px, dy=b.y-py; const forward = dirRight ? dx>=0 : dx<=0; const d2=dx*dx+dy*dy;
      if (forward && d2 <= reach*reach) { this.damageBoss(b, isCopper ? 2 : 1); try{ b.setVelocity((dirRight?1:-1)*160, -60); }catch(e){} }
    });
  }

  spearThrust(pointer){
    // 6-tile precise thrust in a narrow line; pierces multiple targets
    if (this._spearCd && this._spearCd > this.time.now) return;
    this._spearCd = this.time.now + 220;
    const reach = 6 * TILE;
    const px = this.player.x, py = this.player.y;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dirRight = (wp.x >= px);
    this.player.setFlipX(!dirRight);
    // Visual thin line
    const g = this.add.graphics().setDepth(800);
    const sx = px, sy = py; const ex = px + (dirRight? reach : -reach), ey = py;
    g.lineStyle(3, 0xffffff, 0.9); g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.strokePath();
    this.time.delayedCall(60, ()=> g.destroy());
    // Helper: hit if within small width around line and in front
    const hitLine = (e, coins=0)=>{
      if (!e || !e.active) return;
      const dx = e.x - px, dy = e.y - py;
      const forward = dirRight ? dx>=0 : dx<=0;
      if (!forward) return;
      // project onto horizontal line: require |dy| <= 14 px and |dx| <= reach
      if (Math.abs(dy) <= 14 && Math.abs(dx) <= reach) this.destroyEnemyWithCoinReward(e, coins);
    };
    this.slimes?.children?.iterate?.(e=>hitLine(e,3));
    this.birds?.children?.iterate?.(e=>hitLine(e,0));
    this.zombies?.children?.iterate?.(e=>hitLine(e,2));
    this.oppos?.children?.iterate?.(e=>hitLine(e,2));
    this.enemySoldiers?.children?.iterate?.(e=>hitLine(e,3));
    // bosses take small damage and slight knock
    this.bosses?.children?.iterate?.((b)=>{
      if (!b || !b.active) return;
      const dx = b.x - px, dy = b.y - py; const forward = dirRight ? dx>=0 : dx<=0;
      if (forward && Math.abs(dy) <= 14 && Math.abs(dx) <= reach) {
        this.damageBoss(b, 1); try{ b.setVelocity((dirRight?1:-1)*120, -40); }catch(e){}
      }
    });
  }

  spearThrow(pointer){
    // Throw a spear ~8 tiles ahead; piercing projectile that despawns at range
    if (this._spearThrowCd && this._spearThrowCd > this.time.now) return;
    this._spearThrowCd = this.time.now + 400; // slightly longer cd than thrust
    const px = this.player.x, py = this.player.y;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const ang = Math.atan2(wp.y - py, wp.x - px);
    const nx = Math.cos(ang), ny = Math.sin(ang);
    // projectile
    const sx = px + nx*16, sy = py + ny*8;
    const sp = this.bullets.create(sx, sy, 'tex_weapon_spear');
    sp.setDepth(6);
    sp.setRotation(ang);
    sp.body.allowGravity = false;
    // speed tuned to travel ~8 tiles before life ends
    const speed = 900;
    sp.setVelocity(nx*speed, ny*speed);
    sp.setData('isSpear', true);
    sp.setData('fromPlayer', true);
    // lifetime ~8 tiles
    const lifeMs = (8 * TILE) / speed * 1000;
    this.time.delayedCall(lifeMs, ()=>{ try{ sp.destroy(); }catch(e){} });
    // On overlap with enemies: destroy them, keep spear flying (piercing)
    const hit = (e, coins=0)=>{
      if (!e || !e.active) return; this.destroyEnemyWithCoinReward(e, coins);
    };
    this.physics.add.overlap(sp, this.slimes, (p,e)=>hit(e,3));
    this.physics.add.overlap(sp, this.birds, (p,e)=>hit(e,0));
    this.physics.add.overlap(sp, this.zombies, (p,e)=>hit(e,2));
    this.physics.add.overlap(sp, this.oppos, (p,e)=>hit(e,2));
    this.physics.add.overlap(sp, this.enemySoldiers, (p,e)=>hit(e,3));
    // Boss small damage and continue
    this.physics.add.overlap(sp, this.bosses, (p,b)=>{ if (!b||!b.active) return; this.damageBoss(b,1); });
  }

  shootMinigunBurst(pointer, opts = {}){
    // Fire 5 bullets with slight spread and short interval
    const shots = 5;
    for (let i=0;i<shots;i++){
      this.time.delayedCall(i*60, ()=>{
  this.shootBullet(pointer, { spread: 0.06, markMinigun: true, copper: !!opts.copper });
      });
    }
  }

  fireDakkerssit(pointer){
    if (this._dakkerssitCd && this._dakkerssitCd > this.time.now) return;
    this._dakkerssitCd = this.time.now + 260;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const projectileKey = this.getWeaponSkinTexture('dakkerssit', 'tex_projectile_dakkerssit')
      .replace('tex_weapon_dakkerssit_cards', 'tex_projectile_dakkerssit_cards');
    const opts = { speed: 1100, lifeTiles: 16, spread: 0.08, isMinigun: true, noBlockDamage: true, projectileKey };
    this.spawnBulletFrom(this.player.x, this.player.y, wp.x, wp.y, opts);
    this.time.delayedCall(55, ()=> this.spawnBulletFrom(this.player.x, this.player.y, wp.x, wp.y, opts));
    this.time.delayedCall(110, ()=> this.spawnBulletFrom(this.player.x, this.player.y, wp.x, wp.y, opts));
    // Dakkerssit also have a short dash boost when the knives are thrown.
    if (!this._dakkerssitBoostCd || this._dakkerssitBoostCd <= this.time.now) {
      const dx = wp.x - this.player.x, dy = wp.y - this.player.y;
      const distance = Math.hypot(dx, dy) || 1;
      const nx = dx / distance, ny = dy / distance;
      const boostSpec = this.getBoostWeaponStats({
        cooldown: 700, boostX: 900, boostY: 420, projectileSpeed: 1100,
        trailColor: 0x8b5cf6, trailCount: 10
      });
      this._dakkerssitBoostCd = this.time.now + boostSpec.cooldown;
      this.player.setVelocityX(nx * boostSpec.boostX);
      this.player.setVelocityY(ny * boostSpec.boostX - boostSpec.boostY);
      this.emitBoostSpeedLines(nx, ny, boostSpec);
      this.emitBoostArmorPower(nx, ny, boostSpec);
      this.showToast?.('Dakkerssit-boost!');
    }
    window.playSfx?.('shoot');
  }

  fireRollerSkates(pointer){
    if (!this.player?.active) return;
    if (this._rollerSkatesCd && this._rollerSkatesCd > this.time.now) return;
    this._rollerSkatesCd = this.time.now + 850;

    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dx = wp.x - this.player.x, dy = wp.y - this.player.y;
    const distance = Math.hypot(dx, dy) || 1;
    const nx = dx / distance, ny = dy / distance;
    const px = this.player.x, py = this.player.y;
    this.player.setFlipX(nx < 0);

    const boostSpec = this.getBoostWeaponStats({
      cooldown: 850, boostX: 660, boostY: 0, projectileSpeed: 900,
      trailColor: 0x5cf5ff, trailCount: 18
    });
    const gravity = Math.max(500, Math.abs(this.player.body?.gravity?.y || this.physics.world.gravity.y || 900));
    const jumpHeight = 9 * TILE;
    const jumpVelocity = -Math.sqrt(2 * gravity * jumpHeight);
    this.player.setVelocityX(nx * boostSpec.boostX);
    this.player.setVelocityY(jumpVelocity);

    // Stop the forward dash after roughly nine blocks; the jump continues naturally.
    this.time.delayedCall(560, () => {
      if (this.player?.active) this.player.setVelocityX(0);
    });

    // Hit enemies in the nine-block skating lane and knock them away.
    const laneLength = 9 * TILE;
    const laneWidth = 1.6 * TILE;
    this.forEachHostile((enemy)=>{
      const ex = enemy.x - px, ey = enemy.y - py;
      const along = ex * nx + ey * ny;
      const side = Math.abs(ex * (-ny) + ey * nx);
      if (along >= -TILE && along <= laneLength && side <= laneWidth) {
        enemy.setVelocity?.(nx * 920, -520);
        this.damageOrDestroyHostile(enemy, 8, 12);
      }
    });

    // Temporary shield: damage() already respects this existing shield timer.
    this.itemBag.shieldUntil = Math.max(this.itemBag.shieldUntil || 0, this.time.now + 2200);
    const shield = this.add.graphics().setDepth(854);
    shield.lineStyle(5, 0x5cf5ff, 0.95); shield.strokeCircle(px, py, 34);
    shield.lineStyle(2, 0xffffff, 0.8); shield.strokeCircle(px, py, 42);
    this.tweens.add({ targets: shield, scale: 1.3, alpha: 0, duration: 2200, ease: 'Quad.easeOut', onComplete: () => shield.destroy() });

    this.emitBoostSpeedLines(nx, ny, boostSpec);
    const neonTrail = this.add.graphics().setDepth(850);
    const trailColors = [0x5cf5ff, 0xff63e6, 0x8cff4a, 0xfff27a];
    for (let i = 0; i < 8; i++) {
      const behind = 26 + i * 12;
      neonTrail.lineStyle(3, trailColors[i % trailColors.length], 0.9);
      neonTrail.beginPath();
      neonTrail.moveTo(px - nx * behind, py - ny * behind);
      neonTrail.lineTo(px - nx * (behind + 26), py - ny * (behind + 26));
      neonTrail.strokePath();
    }
    this.tweens.add({ targets: neonTrail, alpha: 0, duration: 520, onComplete: () => neonTrail.destroy() });
    this.showToast?.('Rullaluistimet: sikanopea 9 palikan hyppy + suoja!');
    window.playSfx?.('laser');
  }

  fireCaranBitti(pointer){
    if (this._caranBittiCd && this._caranBittiCd > this.time.now) return;
    this._caranBittiCd = this.time.now + 420;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const opts = { speed: 900, lifeTiles: 14, spread: 0, isMinigun: true, noBlockDamage: true, projectileKey: 'tex_projectile_caran_bitti' };
    this.spawnBulletFrom(this.player.x, this.player.y, wp.x, wp.y, opts);
    window.playSfx?.('shoot');
  }

  shootSniper(pointer, opts = {}){
    // Long range 17 tiles, faster projectile
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    // Mild aim assist: snap to nearest enemy near cursor
    {
      const r = 72; let best=null, bestD2=r*r;
      const consider = (grp)=> grp?.children?.iterate?.(e=>{ if(!e||!e.active) return; const dx=e.x-worldPoint.x, dy=e.y-worldPoint.y; const d2=dx*dx+dy*dy; if(d2<bestD2){bestD2=d2; best=e;} });
      consider(this.enemySoldiers); consider(this.zombies); consider(this.slimes); consider(this.oppos); consider(this.birds); consider(this.wolves); consider(this.bosses);
      if (best) { worldPoint.x = best.x; worldPoint.y = best.y; }
    }
    const dirX = worldPoint.x - this.player.x;
    const dirY = worldPoint.y - this.player.y;
    const dist = Math.sqrt(dirX*dirX + dirY*dirY);
    if (dist === 0) return;
    const normX = dirX / dist;
    const normY = dirY / dist;
  const bullet = this.bullets.create(this.player.x, this.player.y, 'tex_bullet');
  const speed = 980; // a bit faster for tarkka
    bullet.setVelocity(normX * speed, normY * speed);
    bullet.setRotation(Math.atan2(normY, normX));
  const extraTiles = opts.copper ? 17 : 0;
  const lifeMs = ((19 + extraTiles) * TILE / speed) * 1000; // longer reach (+17 if copper)
  if (opts.copper) bullet.setData('isCopper', true);
  this.time.delayedCall(lifeMs, () => { if (bullet.active) bullet.destroy(); });
    // Cannon hit check (shared approach)
    bullet._lastCheck = 0;
    bullet.preUpdate = (t, dt)=>{
      Phaser.Physics.Arcade.Sprite.prototype.preUpdate.call(bullet, t, dt);
      bullet._lastCheck += dt; if (bullet._lastCheck < 30) return; bullet._lastCheck = 0;
      const tx = Math.floor(bullet.x / TILE), ty = Math.floor(bullet.y / TILE);
      const key = `${tx},${ty}`;
      if (this.cannonTiles.has(key)) {
        this.removeCannonAt(tx, ty);
        bullet.destroy();
        this.saveState();
      }
    };
  }

  shootRifle(pointer){
    // Rifle: medium range + cluster 6 bullets appearing 9 tiles ahead
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    // Mild aim assist: snap to nearest enemy near cursor
    {
      const r = 72; let best=null, bestD2=r*r;
      const consider = (grp)=> grp?.children?.iterate?.(e=>{ if(!e||!e.active) return; const dx=e.x-wp.x, dy=e.y-wp.y; const d2=dx*dx+dy*dy; if(d2<bestD2){bestD2=d2; best=e;} });
      consider(this.enemySoldiers); consider(this.zombies); consider(this.slimes); consider(this.oppos); consider(this.birds); consider(this.wolves); consider(this.bosses);
      if (best) { wp.x = best.x; wp.y = best.y; }
    }
    const dx = wp.x - this.player.x;
    const dy = wp.y - this.player.y;
    const dist = Math.sqrt(dx*dx + dy*dy); if (!dist) return;
    const nx = dx / dist, ny = dy / dist;
    // primary bullet (slightly slower than sniper)
    const speed = 820;
    const main = this.bullets.create(this.player.x, this.player.y, 'tex_bullet');
    main.setVelocity(nx*speed, ny*speed); main.setRotation(Math.atan2(ny,nx));
    const lifeMs = (15 * TILE / speed) * 1000; this.time.delayedCall(lifeMs, ()=>{ if (main.active) main.destroy(); });
    // cluster ahead
    const ahead = 9 * TILE;
    const baseX = this.player.x + nx * ahead;
    const baseY = this.player.y + ny * ahead;
    const extraCount = 6;
    for (let i=0;i<extraCount;i++){
      const offAngle = (i - (extraCount-1)/2) * 0.02;
      const ca=Math.cos(offAngle), sa=Math.sin(offAngle);
      const vx = nx*ca - ny*sa;
      const vy = nx*sa + ny*ca;
      const b = this.bullets.create(baseX + (i%2), baseY + ((i%3)-1), 'tex_bullet');
      b.setVelocity(vx*speed, vy*speed);
      b.setRotation(Math.atan2(vy,vx));
      const life2 = (9 * TILE / speed) * 1000; this.time.delayedCall(life2, ()=>{ if (b.active) b.destroy(); });
      b._lastCheck = 0; b.preUpdate = (t,dt)=>{ Phaser.Physics.Arcade.Sprite.prototype.preUpdate.call(b,t,dt); b._lastCheck+=dt; if (b._lastCheck<30) return; b._lastCheck=0; const tx=Math.floor(b.x/TILE), ty=Math.floor(b.y/TILE); const key=`${tx},${ty}`; if (this.cannonTiles.has(key)) { this.removeCannonAt(tx,ty); b.destroy(); this.saveState(); } };
    }
  }

  // Bazooka: fires a slow rocket that explodes on impact without breaking blocks, damaging enemies in radius
  fireBazooka(pointer, opts = {}){
    if (this._bazookaCd && this._bazookaCd > this.time.now) return; // small cooldown
    this._bazookaCd = this.time.now + 600;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const sx = this.player.x, sy = this.player.y;
  const rocket = this.spawnBulletFrom(sx, sy, wp.x, wp.y, { speed: 420, lifeTiles: 10, spread: 0 });
  window.playSfx?.('bazooka');
    rocket.setTexture('tex_rocket');
    rocket.setData('isRocket', true);
  rocket.setData('noBlockDamage', true);
  if (opts.copper) rocket.setData('copper', true);
    // override tile-scan to not remove cannons and to explode on platform hit (handled in onBulletHit already)
    rocket._lastCheck = 0;
    const origPreUpdate = Phaser.Physics.Arcade.Sprite.prototype.preUpdate;
    const scene = this;
    rocket.preUpdate = function(t, dt){ origPreUpdate.call(this, t, dt); };
  }

  // TNT: a short-fuse explosive that also launches the player away/upward.
  fireTnt(pointer){
    if (this._tntCd && this._tntCd > this.time.now) return;
    this._tntCd = this.time.now + 700;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dx = wp.x - this.player.x, dy = wp.y - this.player.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist, ny = dy / dist;
    const tntTexture = this.getWeaponSkinTexture('tnt', 'tex_tnt');
    const tnt = this.physics.add.image(this.player.x, this.player.y - 10, tntTexture);
    tnt.setDepth(6).setBounce(0.2).setCollideWorldBounds(true);
    this.physics.add.collider(tnt, this.platforms);
    tnt.setVelocity(nx * 430, ny * 430 - 230);
    tnt.setDrag(20, 0);
    const scene = this;
    // Use a scene timer so the fuse works reliably even when TNT is resting
    // against a block or the projectile has stopped moving.
    this.time.delayedCall(1000, () => {
      if (!tnt.active) return;
      const tx = tnt.x, ty = tnt.y;
      tnt.destroy();
      scene.explodeTntAt(tx, ty);
    });
    window.playSfx?.('explosion_small');
  }

  // Mop: ultimate weapon. It fires every boost weapon and combines the main
  // special powers, but can only be used once every five seconds.
  fireMop(pointer){
    if (!this.player?.active) return;
    const now = this.time.now;
    if (this._mopCooldownUntil && this._mopCooldownUntil > now) {
      const seconds = Math.ceil((this._mopCooldownUntil - now) / 1000);
      this.showToast?.(`Moppi latautuu: ${seconds} s`);
      return;
    }
    this._mopCooldownUntil = now + 5000;
    const mopCoinReward = 400000000000000;
      this.state.health = MAX_HEALTH;
    this.state.coins = Math.min(Number.MAX_SAFE_INTEGER, this.state.coins + mopCoinReward);
    this.updateUI();
    this.saveState();
    this.spawnMopCoinShower(this.player.x, this.player.y);

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const smartTarget = this.findNearestHostile(worldPoint.x, worldPoint.y, 14 * TILE)
      || this.findNearestHostile(this.player.x, this.player.y, 16 * TILE);
    const targetX = smartTarget?.x ?? worldPoint.x;
    const targetY = smartTarget?.y ?? worldPoint.y;
    const dx = targetX - this.player.x, dy = targetY - this.player.y;
    const distance = Math.hypot(dx, dy) || 1;
    const nx = dx / distance, ny = dy / distance;
    const angleBase = Math.atan2(ny, nx);
    const fan = Math.min(1.15, Math.PI * 0.38);

    // Fire every boost weapon in the same frame, including homing, explosive,
    // scatter, vortex, gravity, boomerang and the other weapon behaviors.
    BOOST_WEAPON_SPECS.forEach((baseSpec, index) => {
      const spec = this.getBoostWeaponStats(baseSpec);
      const angle = angleBase + (index - (BOOST_WEAPON_SPECS.length - 1) / 2) * (fan / Math.max(1, BOOST_WEAPON_SPECS.length - 1));
      const behavior = spec.behavior || 'rapid';
      const aimDistance = behavior === 'hammer' ? 2 * TILE : Math.max(distance, 16 * TILE);
      this.spawnBoostProjectile(
        spec,
        baseSpec.id,
        behavior,
        this.player.x + Math.cos(angle) * 22,
        this.player.y + Math.sin(angle) * 10,
        this.player.x + Math.cos(angle) * aimDistance,
        this.player.y + Math.sin(angle) * aimDistance
      );
    });

    const ultimateSpec = { trailColor: 0xfff36b };
    // Stack the central powers immediately: explosion, shockwave, vortex,
    // hammer smash and the currently equipped armor power.
    this.emitBoostShockwave(targetX, targetY, ultimateSpec);
    this.emitBoostVortex(this.player.x, this.player.y, ultimateSpec);
    this.emitBoostHammerSmash(this.player.x + nx * 2 * TILE, this.player.y, ultimateSpec);
    this.emitBoostArmorPower(nx, ny, ultimateSpec);
    this.tickFlame?.(pointer);
    this.emitMopLightningInferno(smartTarget, targetX, targetY);
    // Mop uses the much larger nuke blast instead of the normal 6x6 explosion.
    this.explodeNukeAt(targetX, targetY, { copper: true });
    const annihilationRadius = 12 * TILE;
    this.forEachHostile((enemy)=>{
      const nearPlayer = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) <= annihilationRadius;
      const nearTarget = Math.hypot(enemy.x - targetX, enemy.y - targetY) <= annihilationRadius;
      if (nearPlayer || nearTarget) this.damageOrDestroyHostile(enemy, 20, 1000);
    });
    const destruction = this.add.graphics().setDepth(855);
    destruction.fillStyle(0xff5722, 0.18); destruction.fillCircle(targetX, targetY, annihilationRadius);
    destruction.lineStyle(8, 0xfff36b, 0.9); destruction.strokeCircle(targetX, targetY, annihilationRadius);
    this.tweens.add({ targets: destruction, scale: 1.25, alpha: 0, duration: 700, ease: 'Cubic.easeOut', onComplete: () => destruction.destroy() });

    // Combine dash, jump and TNT-style launch without teleporting.
    this.player.setVelocityX(nx * 1800);
    this.player.setVelocityY(ny * 850 - 1150);
    if (this.inWater || this.weather?.isStorm) this.emitRiptideCrossWave?.();

    const gfx = this.add.graphics().setDepth(860);
    gfx.lineStyle(7, 0xffffff, 0.95);
    gfx.strokeCircle(this.player.x, this.player.y, 36);
    gfx.lineStyle(3, 0x5cf5ff, 0.9);
    gfx.strokeCircle(this.player.x, this.player.y, 64);
    this.tweens.add({ targets: gfx, scale: 2.4, alpha: 0, duration: 720, ease: 'Cubic.easeOut', onComplete: () => gfx.destroy() });
    this.showToast?.('MOPPI: HP TÄYTEEN +400 000 000 000 000 KOLIKKOA! Lataus 5 s');
    window.playSfx?.('laser');
  }

  spawnMopCoinShower(x, y){
    // The huge reward is added directly to the balance; these are the visible
    // physical coins that rain down from the air around the player.
    for (let i = 0; i < 48; i++) {
      const airX = x + Phaser.Math.Between(-150, 150);
      const airY = y - Phaser.Math.Between(120, 320);
      this.dropCoin(airX, airY);
    }
    const label = this.add.text(x, y - 110, 'KOLIKKOSADE!', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffe066',
      stroke: '#7c2d12', strokeThickness: 4
    }).setOrigin(0.5).setDepth(880);
    this.tweens.add({ targets: label, y: label.y - 30, alpha: 0, duration: 1300, onComplete: () => label.destroy() });
  }

  emitMopLightningInferno(primaryTarget, x, y){
    const target = primaryTarget?.active ? primaryTarget : this.findNearestHostile(x, y, 14 * TILE);
    const tx = target?.x ?? x;
    const ty = target?.y ?? y;
    const strikeCount = 4000;

    // 4000 is the real lightning hit count/damage. Only a representative set
    // of bolts is drawn so the effect stays smooth instead of freezing Phaser.
    if (target?.active) {
      target._mopLightningHits = (target._mopLightningHits || 0) + strikeCount;
      target._mopOnFireUntil = this.time.now + 5000;
      target.setTint?.(0xff6b22);
      this.damageOrDestroyHostile(target, 40, strikeCount);
    }

    const visibleBolts = 72;
    for (let i = 0; i < visibleBolts; i++) {
      const startX = tx + Phaser.Math.Between(-190, 190);
      const startY = ty - 190 - Phaser.Math.Between(0, 130);
      const bolt = this.add.graphics().setDepth(875);
      bolt.lineStyle(i % 5 === 0 ? 4 : 2, i % 3 === 0 ? 0xffffff : 0xfff36b, 0.95);
      bolt.beginPath();
      bolt.moveTo(startX, startY);
      let px = startX, py = startY;
      const segments = 5;
      for (let part = 1; part <= segments; part++) {
        px = startX + (tx - startX) * (part / segments) + Phaser.Math.Between(-22, 22);
        py = startY + (ty - startY) * (part / segments);
        bolt.lineTo(px, py);
      }
      bolt.strokePath();
      this.time.delayedCall(90 + (i % 12) * 24, () => bolt.destroy());
    }

    const flames = [];
    for (let i = 0; i < 9; i++) {
      const flame = this.add.image(
        tx + Phaser.Math.Between(-28, 28),
        ty + Phaser.Math.Between(-12, 24),
        'tex_flame'
      ).setDepth(876).setTint(i % 2 ? 0xffb52e : 0xff4f1f).setScale(1.1 + (i % 3) * 0.25).setAlpha(0.9);
      flames.push(flame);
      this.tweens.add({ targets: flame, y: flame.y - Phaser.Math.Between(30, 65), alpha: 0, duration: 650 + i * 35, onComplete: () => flame.destroy() });
    }

    const label = this.add.text(tx, ty - 76, '4000× SALAMA\nTULIPALO', {
      fontFamily: 'monospace', fontSize: '16px', color: '#fff36b', align: 'center',
      stroke: '#7f1d1d', strokeThickness: 4
    }).setOrigin(0.5).setDepth(880);
    this.tweens.add({ targets: label, y: label.y - 35, alpha: 0, duration: 1200, onComplete: () => label.destroy() });
    window.playSfx?.('laser');
  }

  explodeTntAt(x, y){
    this.boostPlayerFromTnt(x, y);
    this.explodeAt(x, y, { tnt: true });
    this.showToast?.('TNT-boosti!');
  }

  boostPlayerFromTnt(x, y){
    if (!this.player?.active) return;
    const dx = this.player.x - x, dy = this.player.y - y;
    const distance = Math.hypot(dx, dy);
    const range = 7 * TILE;
    if (distance > range) return;
    const strength = 1 - (distance / range);
    const awayX = distance > 0.01 ? dx / distance : (this.player.flipX ? -1 : 1);
    this.player.setVelocityX(awayX * (360 + 460 * strength));
    this.player.setVelocityY(-(520 + 420 * strength));
  }

  fireNormalWeapon(pointer, weaponId){
    const spec = NORMAL_WEAPON_MAP[weaponId];
    if (!spec || !this.player?.active) return;
    if (!this._normalWeaponCooldowns) this._normalWeaponCooldowns = {};
    if ((this._normalWeaponCooldowns[weaponId] || 0) > this.time.now) return;
    this._normalWeaponCooldowns[weaponId] = this.time.now + spec.cooldown;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dx = worldPoint.x - this.player.x;
    const dy = worldPoint.y - this.player.y;
    const distance = Math.hypot(dx, dy) || 1;
    const nx = dx / distance;
    const ny = dy / distance;

    if (spec.kind === 'melee') {
      const aim = Math.atan2(dy, dx);
      const reach = spec.reach || 70;
      const halfArc = 0.72;
      this.forEachHostile((enemy) => {
        const ex = enemy.x - this.player.x;
        const ey = enemy.y - this.player.y;
        const enemyDistance = Math.hypot(ex, ey);
        if (enemyDistance > reach) return;
        const enemyAngle = Math.atan2(ey, ex);
        const difference = Math.atan2(Math.sin(enemyAngle - aim), Math.cos(enemyAngle - aim));
        if (Math.abs(difference) <= halfArc) this.damageOrDestroyHostile(enemy, 1, spec.damage);
      });
      const slash = this.add.graphics().setDepth(850);
      slash.lineStyle(5, 0xcbd5e1, 0.85);
      slash.beginPath();
      slash.moveTo(this.player.x + nx * 18, this.player.y + ny * 10);
      slash.lineTo(this.player.x + nx * reach, this.player.y + ny * reach);
      slash.strokePath();
      slash.lineStyle(2, 0x4b5563, 0.9);
      slash.strokeCircle(this.player.x + nx * reach, this.player.y + ny * reach, 5);
      this.tweens.add({ targets: slash, alpha: 0, duration: 110, onComplete: () => slash.destroy() });
      window.playSfx?.('woodpecker');
      return;
    }

    const shots = spec.shots || 1;
    const spread = shots > 1 ? 0.12 : 0;
    for (let i = 0; i < shots; i++) {
      const offset = shots === 1 ? 0 : (i - (shots - 1) / 2) * spread;
      const angle = Math.atan2(ny, nx) + offset;
      const targetX = this.player.x + Math.cos(angle) * spec.lifeTiles * TILE;
      const targetY = this.player.y + Math.sin(angle) * spec.lifeTiles * TILE;
      const bullet = this.spawnBulletFrom(
        this.player.x + Math.cos(angle) * 18,
        this.player.y + Math.sin(angle) * 8,
        targetX,
        targetY,
        {
          speed: spec.projectileSpeed,
          lifeTiles: spec.lifeTiles,
          spread: 0,
          projectileKey: spec.projectile,
          noBlockDamage: true,
          aimAssist: false
        }
      );
      bullet?.setData?.('damage', spec.damage);
      bullet?.setData?.('normalWeapon', weaponId);
    }
    window.playSfx?.('shoot');
  }

  fireBoostWeapon(pointer, weaponId){
    const baseSpec = BOOST_WEAPON_MAP[weaponId];
    if (!baseSpec || !this.player?.active) return;
    const spec = this.getBoostWeaponStats(baseSpec);
    if (!this._boostWeaponCooldowns) this._boostWeaponCooldowns = {};
    if ((this._boostWeaponCooldowns[weaponId] || 0) > this.time.now) return;
    this._boostWeaponCooldowns[weaponId] = this.time.now + spec.cooldown;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const smartTarget = this.findNearestHostile(worldPoint.x, worldPoint.y, 10 * TILE)
      || this.findNearestHostile(this.player.x, this.player.y, 12 * TILE);
    const targetX = smartTarget?.x ?? worldPoint.x;
    const targetY = smartTarget?.y ?? worldPoint.y;
    const dx = targetX - this.player.x, dy = targetY - this.player.y;
    const distance = Math.hypot(dx, dy) || 1;
    const nx = dx / distance, ny = dy / distance;
    const behavior = spec.behavior || 'rapid';
    const shotCount = behavior === 'burst' ? 3 : (behavior === 'scatter' ? 5 : 1);
    const spread = behavior === 'burst' ? 0.055 : (behavior === 'scatter' ? 0.18 : 0);
    const aimDistance = behavior === 'hammer' ? 2 * TILE : Math.max(distance, 12 * TILE);
    for (let i = 0; i < shotCount; i++) {
      const offset = shotCount === 1 ? 0 : (i - (shotCount - 1) / 2) * spread;
      const angle = Math.atan2(ny, nx) + offset;
      const shotX = this.player.x + Math.cos(angle) * aimDistance;
      const shotY = this.player.y + Math.sin(angle) * aimDistance;
      this.spawnBoostProjectile(
        spec,
        weaponId,
        behavior,
        this.player.x + Math.cos(angle) * 18,
        this.player.y + Math.sin(angle) * 8,
        shotX,
        shotY
      );
    }

    if (behavior === 'shockwave') this.emitBoostShockwave(targetX, targetY, spec);
    if (behavior === 'vortex') this.emitBoostVortex(targetX, targetY, spec);
    if (behavior === 'hammer') this.emitBoostHammerSmash(this.player.x + nx * 2 * TILE, this.player.y, spec);

    // Each behavior moves differently: dash/hyper are fast, jump/gravity go up,
    // and the other weapons keep their own directional boost values.
    let boostX = spec.boostX;
    let boostY = spec.boostY;
    if (behavior === 'dash') boostX *= 1.35;
    if (behavior === 'hyper') { boostX *= 1.25; boostY *= 1.15; }
    if (behavior === 'jump') boostX *= 0.55;
    if (behavior === 'gravity') boostY *= 1.18;
    this.player.setVelocityX(nx * boostX);
    this.player.setVelocityY(behavior === 'jump' ? -Math.max(760, boostY) : (ny * boostX - boostY));
    this.emitBoostSpeedLines(nx, ny, spec);
    this.emitBoostArmorPower(nx, ny, spec);
    this.emitSpecialWeaponPower(spec, targetX, targetY, nx, ny);
    window.playSfx?.('laser');
  }

  emitSpecialWeaponPower(spec, targetX, targetY, nx, ny){
    const power = spec?.specialPower;
    if (!power || !this.player?.active) return;
    const level = spec.powerLevel || 1;
    const radius = (1.5 + level * 0.2) * TILE;
    const hit = (enemy, damage = 1 + level) => {
      if (enemy?.active) this.damageOrDestroyHostile(enemy, 2 + level, damage);
    };
    const burst = (color, size = radius) => {
      const gfx = this.add.graphics().setDepth(852);
      gfx.fillStyle(color, 0.16); gfx.fillCircle(targetX, targetY, size);
      gfx.lineStyle(3, color, 0.9); gfx.strokeCircle(targetX, targetY, size);
      this.tweens.add({ targets: gfx, scale: 1.28, alpha: 0, duration: 360, onComplete: () => gfx.destroy() });
    };

    if (power === 'thunder') {
      this.forEachHostile((enemy) => {
        if (Math.hypot(enemy.x - targetX, enemy.y - targetY) <= radius) hit(enemy, 2 + level * 2);
      });
      const bolt = this.add.graphics().setDepth(853);
      bolt.lineStyle(4, 0xfff27a, 0.95);
      bolt.beginPath(); bolt.moveTo(this.player.x, this.player.y - 26); bolt.lineTo(targetX - 10, targetY - 34); bolt.lineTo(targetX, targetY); bolt.strokePath();
      this.tweens.add({ targets: bolt, alpha: 0, duration: 180, onComplete: () => bolt.destroy() });
    } else if (power === 'frost') {
      this.forEachHostile((enemy) => {
        if (Math.hypot(enemy.x - targetX, enemy.y - targetY) > radius) return;
        hit(enemy, 1 + level);
        enemy.setTint?.(0x9cecff);
        enemy.setVelocity?.((enemy.body?.velocity?.x || 0) * 0.18, (enemy.body?.velocity?.y || 0) * 0.18);
        if (enemy.body) enemy.body.allowGravity = false;
        this.time.delayedCall(900 + level * 70, () => { enemy.clearTint?.(); if (enemy.body) enemy.body.allowGravity = true; });
      });
      burst(0x9cecff);
    } else if (power === 'solar') {
      this.forEachHostile((enemy) => {
        if (Math.hypot(enemy.x - targetX, enemy.y - targetY) <= radius) hit(enemy, 3 + level * 2);
      });
      burst(0xffdf5c, radius * 1.15);
    } else if (power === 'void') {
      this.emitBoostVortex(targetX, targetY, spec);
      this.forEachHostile((enemy) => {
        if (Math.hypot(enemy.x - targetX, enemy.y - targetY) <= radius) hit(enemy, 2 + level);
      });
    } else if (power === 'healing') {
      this.state.health = Math.min(MAX_HEALTH, this.state.health + Math.max(1, Math.ceil(level / 2)));
      this.updateUI();
      this.showToast(`Parannusvoima +${Math.max(1, Math.ceil(level / 2))}`);
      burst(0x7cff8a, 28 + level * 4);
    } else if (power === 'shield') {
      this.itemBag.shieldUntil = Math.max(this.itemBag.shieldUntil || 0, this.time.now + 1800 + level * 420);
      this._refreshItemBagUI?.();
      burst(0xb8f7ff, 30 + level * 4);
    } else if (power === 'blink') {
      this.player.setVelocityX(nx * (spec.boostX + level * 80));
      this.player.setVelocityY(ny * 220 - 180);
      const trail = this.add.image(this.player.x - nx * 26, this.player.y - ny * 10, 'tex_player_dyn').setDepth(4).setTint(0xf18cff).setAlpha(0.58);
      this.tweens.add({ targets: trail, x: trail.x - nx * 80, alpha: 0, duration: 300, onComplete: () => trail.destroy() });
    } else if (power === 'meteor') {
      this.emitBoostHammerSmash(targetX, targetY, spec);
      this.cameras.main.shake(70 + level * 12, 0.0015 + level * 0.0003);
      burst(0xff7046, radius * 0.9);
    } else if (power === 'wind') {
      this.forEachHostile((enemy) => {
        const dx = enemy.x - targetX, dy = enemy.y - targetY;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance <= radius) enemy.setVelocity?.(dx / distance * (360 + level * 55), -Math.abs(dy / distance) * 220);
      });
      burst(0x8affdb, radius);
    } else if (power === 'clone') {
      const tx = Math.floor((this.player.x + nx * 2 * TILE) / TILE);
      const ty = Math.floor((this.player.y - TILE) / TILE);
      this.spawnJetpackSoldier?.({ tx, ty });
      burst(0xd8a4ff, 28 + level * 3);
      this.showToast('Kloonivoima kutsui apurin');
    }
  }

  spawnBoostProjectile(spec, weaponId, behavior, sx, sy, tx, ty){
    const projectile = this.spawnBulletFrom(
      sx,
      sy,
      tx,
      ty,
      {
        speed: spec.projectileSpeed,
        lifeTiles: behavior === 'longshot' ? Math.max(80, spec.projectileLifeTiles || 16) : (spec.projectileLifeTiles || 16),
        projectileKey: spec.projectile,
        noBlockDamage: behavior !== 'explosive',
        aimAssist: false
      }
    );
    projectile?.setTint?.(spec.projectileTint);
    projectile?.setData?.('boostWeapon', weaponId);
    projectile?.setData?.('boostBehavior', behavior);
    projectile?.setData?.('windBall', !!spec.windBall);
    if (behavior === 'explosive') projectile?.setData?.('isRocket', true);
    if (behavior === 'homing' || behavior === 'boomerang') this.attachBoostProjectileBehavior(projectile, behavior, spec);
    return projectile;
  }

  attachBoostProjectileBehavior(projectile, behavior, spec){
    if (!projectile) return;
    const scene = this;
    const basePreUpdate = projectile.preUpdate;
    const bornAt = this.time.now;
    projectile.preUpdate = function(time, delta){
      basePreUpdate.call(this, time, delta);
      if (!this.active || !scene.player?.active) return;
      if (behavior === 'boomerang' && time - bornAt > 420) {
        const dx = scene.player.x - this.x, dy = scene.player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 26) { this.destroy(); return; }
        this.setVelocity(dx / dist * spec.projectileSpeed, dy / dist * spec.projectileSpeed);
        this.setRotation(Math.atan2(dy, dx));
        return;
      }
      if (behavior === 'homing' && (!this._nextBoostAimAt || time >= this._nextBoostAimAt)) {
        this._nextBoostAimAt = time + 90;
        const target = scene.findNearestHostile(this.x, this.y, 16 * TILE);
        if (target) {
          const dx = target.x - this.x, dy = target.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          this.setVelocity(dx / dist * spec.projectileSpeed, dy / dist * spec.projectileSpeed);
          this.setRotation(Math.atan2(dy, dx));
        }
      }
    };
  }

  emitBoostShockwave(x, y, spec){
    const radius = 3 * TILE;
    this.forEachHostile((enemy)=>{
      const dx = enemy.x - x, dy = enemy.y - y;
      if (dx * dx + dy * dy <= radius * radius) {
        enemy.setVelocity?.(dx * 2.5, -Math.abs(dy) * 1.5 - 180);
        this.damageOrDestroyHostile(enemy, 3, 3);
      }
    });
    const gfx = this.add.graphics().setDepth(850);
    gfx.lineStyle(5, spec.trailColor, 0.9); gfx.strokeCircle(x, y, radius);
    gfx.lineStyle(2, 0xffffff, 0.75); gfx.strokeCircle(x, y, radius * 0.55);
    this.tweens.add({ targets: gfx, scale: 1.3, alpha: 0, duration: 360, ease: 'Quad.easeOut', onComplete: () => gfx.destroy() });
  }

  emitBoostHammerSmash(x, y, spec){
    const radius = 2.2 * TILE;
    this.forEachHostile((enemy)=>{
      const dx = enemy.x - x, dy = enemy.y - y;
      if (dx * dx + dy * dy <= radius * radius) {
        enemy.setVelocity?.(Math.sign(dx || 1) * 460, -620);
        this.damageOrDestroyHostile(enemy, 4, 4);
      }
    });
    const gfx = this.add.graphics().setDepth(850);
    gfx.fillStyle(spec.trailColor, 0.28); gfx.fillCircle(x, y, radius);
    gfx.lineStyle(5, 0xffffff, 0.92); gfx.strokeCircle(x, y, radius);
    gfx.lineStyle(3, spec.trailColor, 0.95);
    gfx.beginPath(); gfx.moveTo(x - radius, y); gfx.lineTo(x + radius, y); gfx.strokePath();
    this.tweens.add({ targets: gfx, scale: 1.35, alpha: 0, duration: 300, ease: 'Quad.easeOut', onComplete: () => gfx.destroy() });
    window.playSfx?.('explosion_small');
  }

  emitBoostVortex(x, y, spec){
    const radius = 5 * TILE;
    this.forEachHostile((enemy)=>{
      const dx = x - enemy.x, dy = y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance <= radius) enemy.setVelocity?.(dx / distance * 520, dy / distance * 520);
    });
    const gfx = this.add.graphics().setDepth(850);
    gfx.lineStyle(4, spec.trailColor, 0.85);
    gfx.strokeCircle(x, y, TILE); gfx.strokeCircle(x, y, 2 * TILE); gfx.strokeCircle(x, y, 3 * TILE);
    this.tweens.add({ targets: gfx, angle: 180, scale: 1.25, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => gfx.destroy() });
  }

  emitBoostArmorPower(nx, ny, spec){
    const armor = this.getBoostArmorSpec();
    if (!armor || armor.id === 'none' || !this.player?.active) return;
    const x = this.player.x, y = this.player.y;
    const color = armor.chameleon ? this.getChameleonArmorColor() : (armor.trailColor || spec.trailColor);
    const gfx = this.add.graphics().setDepth(852);
    gfx.lineStyle(3, color, 0.9);

    if (armor.id === 'storm_armor') {
      // The storm armor calls down a small lightning strike on a nearby hostile.
      const target = this.findNearestHostile(x, y, 6 * TILE);
      const tx = target?.x ?? x + nx * 48;
      const ty = target?.y ?? y + ny * 48;
      gfx.beginPath(); gfx.moveTo(x, y - 34); gfx.lineTo(x + 8, y - 8); gfx.lineTo(tx - 8, ty - 22); gfx.lineTo(tx, ty); gfx.strokePath();
      if (target) this.damageOrDestroyHostile(target, 2, 2);
    } else if (armor.id === 'rocket_harness') {
      // Extra rocket kick and flame cones under the armor.
      this.player.setVelocityY(this.player.body.velocity.y - 140);
      gfx.lineStyle(4, 0xff7046, 0.9);
      gfx.beginPath(); gfx.moveTo(x - 9, y + 22); gfx.lineTo(x - 2, y + 46); gfx.lineTo(x + 2, y + 22); gfx.strokePath();
      gfx.beginPath(); gfx.moveTo(x + 9, y + 22); gfx.lineTo(x + 16, y + 46); gfx.lineTo(x + 20, y + 22); gfx.strokePath();
    } else if (armor.id === 'wind_suit') {
      // Air rings show that the suit is reducing drag.
      gfx.strokeCircle(x, y, 22); gfx.strokeCircle(x, y, 34);
      gfx.beginPath(); gfx.arc(x, y, 42, -2.2, 0.4); gfx.strokePath();
    } else if (armor.id === 'gravity_plate') {
      // Gravity plates point upward and add a small lift to every weapon boost.
      this.player.setVelocityY(Math.min(this.player.body.velocity.y, -260));
      gfx.strokeCircle(x, y + 14, 24);
      gfx.beginPath(); gfx.moveTo(x - 12, y + 12); gfx.lineTo(x, y - 26); gfx.lineTo(x + 12, y + 12); gfx.strokePath();
    } else if (armor.id === 'neon_runner') {
      // Neon afterimages make the extra horizontal speed visible.
      const ghost = this.add.image(x - nx * 20, y, 'tex_player_dyn').setDepth(4).setTint(color).setAlpha(0.6);
      this.tweens.add({ targets: ghost, x: ghost.x - nx * 54, alpha: 0, duration: 300, onComplete: () => ghost.destroy() });
      gfx.strokeCircle(x, y, 28);
    } else if (armor.id === 'vortex_core') {
      this.emitBoostVortex(x, y, spec);
      gfx.strokeCircle(x, y, 24); gfx.strokeCircle(x, y, 38);
      gfx.beginPath(); gfx.arc(x, y, 32, -2.6, 1.2); gfx.strokePath();
    } else if (armor.id === 'meteor_shell') {
      // Heavy armor slams a short shockwave into the ground on boost.
      this.emitBoostHammerSmash(x + nx * TILE, y + 8, spec);
      this.cameras.main.shake(100, 0.003);
      gfx.fillStyle(color, 0.24); gfx.fillCircle(x, y + 18, 28);
      gfx.strokeCircle(x, y + 18, 28);
    } else if (armor.id === 'chameleon_armor') {
      // The chameleon armor briefly hides the player from distant enemies.
      this.chameleonHiddenUntil = this.time.now + 650;
      this.player.setAlpha(0.58);
      this.armorSprite?.setTint(color).setAlpha(0.5);
      const ghost = this.add.image(x - nx * 20, y, 'tex_player_dyn').setDepth(4).setTint(color).setAlpha(0.58);
      this.tweens.add({ targets: ghost, x: ghost.x - nx * 70, alpha: 0, duration: 420, onComplete: () => ghost.destroy() });
      gfx.strokeCircle(x, y, 26); gfx.strokeCircle(x, y, 40);
      gfx.beginPath(); gfx.arc(x, y, 34, -2.8, 1.1); gfx.strokePath();
      this.time.delayedCall(680, () => {
        if (this.player?.active && !this.itemBag?.invis) this.player.setAlpha(1);
        if (this.armorSprite?.active && this.getBoostArmorSpec().chameleon) this.armorSprite.setAlpha(0.92);
      });
    } else {
      this.emitGeneratedArmorPower(armor, x, y, nx, ny, spec, gfx, color);
    }

    this.tweens.add({ targets: gfx, alpha: 0, scale: 1.35, duration: 360, ease: 'Quad.easeOut', onComplete: () => gfx.destroy() });
  }

  emitGeneratedArmorPower(armor, x, y, nx, ny, spec, gfx, color){
    const level = armor.powerLevel || 1;
    const target = this.findNearestHostile(x + nx * 3 * TILE, y + ny * 3 * TILE, 5 * TILE);
    const hit = (enemy, damage = 2 + level) => {
      if (enemy?.active) this.damageOrDestroyHostile(enemy, 2 + level, damage);
    };

    if (armor.armorPower === 'arc') {
      const tx = target?.x ?? x + nx * 80, ty = target?.y ?? y + ny * 80;
      gfx.beginPath(); gfx.moveTo(x, y - 32); gfx.lineTo(x + 12, y - 6); gfx.lineTo(tx - 12, ty - 20); gfx.lineTo(tx, ty); gfx.strokePath();
      hit(target, 5 + level * 2);
    } else if (armor.armorPower === 'rocket') {
      this.player.setVelocityY((this.player.body?.velocity?.y || 0) - 120 * level);
      gfx.lineStyle(4, 0xff7046, 0.9);
      gfx.beginPath(); gfx.moveTo(x - 10, y + 20); gfx.lineTo(x - 4, y + 42 + level * 4); gfx.lineTo(x + 2, y + 20); gfx.strokePath();
      gfx.beginPath(); gfx.moveTo(x + 8, y + 20); gfx.lineTo(x + 14, y + 42 + level * 4); gfx.lineTo(x + 20, y + 20); gfx.strokePath();
    } else if (armor.armorPower === 'wind') {
      gfx.strokeCircle(x, y, 18 + level * 5); gfx.strokeCircle(x, y, 32 + level * 7);
      gfx.beginPath(); gfx.arc(x, y, 42 + level * 6, -2.4, 0.6); gfx.strokePath();
    } else if (armor.armorPower === 'gravity') {
      this.player.setVelocityY(Math.min(this.player.body?.velocity?.y || 0, -180 - level * 90));
      gfx.beginPath(); gfx.moveTo(x - 14, y + 14); gfx.lineTo(x, y - 30 - level * 4); gfx.lineTo(x + 14, y + 14); gfx.strokePath();
      gfx.strokeCircle(x, y + 14, 20 + level * 4);
    } else if (armor.armorPower === 'afterimage') {
      const ghost = this.add.image(x - nx * (18 + level * 8), y, 'tex_player_dyn').setDepth(4).setTint(color).setAlpha(0.65);
      this.tweens.add({ targets: ghost, x: ghost.x - nx * (44 + level * 12), alpha: 0, duration: 320 + level * 35, onComplete: () => ghost.destroy() });
      gfx.strokeCircle(x, y, 24 + level * 5);
    } else if (armor.armorPower === 'vortex') {
      this.emitBoostVortex(x, y, spec);
      gfx.strokeCircle(x, y, 24 + level * 4); gfx.strokeCircle(x, y, 38 + level * 6);
    } else if (armor.armorPower === 'meteor') {
      this.emitBoostHammerSmash(x + nx * TILE, y + 8, spec);
      this.cameras.main.shake(60 + level * 20, 0.0015 + level * 0.0004);
      gfx.fillStyle(color, 0.22); gfx.fillCircle(x, y + 16, 24 + level * 5);
      gfx.strokeCircle(x, y + 16, 24 + level * 5);
    } else if (armor.armorPower === 'cloak') {
      this.chameleonHiddenUntil = this.time.now + 450 + level * 100;
      this.player.setAlpha(0.62);
      gfx.strokeCircle(x, y, 22 + level * 5); gfx.strokeCircle(x, y, 34 + level * 7);
      this.time.delayedCall(520 + level * 100, () => {
        if (this.player?.active && !this.itemBag?.invis) this.player.setAlpha(1);
      });
    } else if (armor.armorPower === 'pulse') {
      this.emitBoostShockwave(x, y, spec);
      gfx.strokeCircle(x, y, 20 + level * 7);
    } else if (armor.armorPower === 'nova') {
      const radius = (2.5 + level * 0.7) * TILE;
      this.forEachHostile((enemy)=>{
        if (Math.hypot(enemy.x - x, enemy.y - y) <= radius) hit(enemy, 4 + level * 2);
      });
      gfx.fillStyle(color, 0.2); gfx.fillCircle(x, y, radius);
      gfx.strokeCircle(x, y, radius);
    } else if (armor.armorPower === 'heal') {
      this.state.health = Math.min(MAX_HEALTH, this.state.health + level);
      this.updateUI();
      gfx.lineStyle(4, 0x9dff76, 0.9); gfx.strokeCircle(x, y, 22 + level * 5);
      gfx.beginPath(); gfx.moveTo(x - 16, y); gfx.lineTo(x + 16, y); gfx.moveTo(x, y - 16); gfx.lineTo(x, y + 16); gfx.strokePath();
    } else if (armor.armorPower === 'flame') {
      const radius = (2 + level * 0.45) * TILE;
      this.forEachHostile((enemy)=>{
        if (Math.hypot(enemy.x - x, enemy.y - y) <= radius) hit(enemy, 3 + level * 2);
      });
      const flame = this.add.image(x, y + 10, 'tex_flame').setDepth(7).setTint(0xff5a1f).setScale(1.5 + level * 0.2).setAlpha(0.9);
      this.tweens.add({ targets: flame, y: flame.y - 28, alpha: 0, duration: 420, onComplete: () => flame.destroy() });
      gfx.strokeCircle(x, y, radius);
    } else if (armor.armorPower === 'magnet') {
      const radius = (4 + level) * TILE;
      this.forEachHostile((enemy)=>{
        const dx = x - enemy.x, dy = y - enemy.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance <= radius) enemy.setVelocity?.(dx / distance * (260 + level * 80), dy / distance * (260 + level * 80));
      });
      gfx.strokeCircle(x, y, radius * 0.55); gfx.strokeCircle(x, y, radius);
    } else if (armor.armorPower === 'orbit') {
      for (let i = 0; i < 3; i++) {
        const orb = this.add.graphics().setDepth(853);
        orb.fillStyle(color, 0.9); orb.fillCircle(x, y, 5 + level);
        orb.x = x; orb.y = y;
        this.tweens.add({ targets: orb, angle: 360, duration: 520 + i * 80, onComplete: () => orb.destroy() });
      }
      gfx.strokeCircle(x, y, 30 + level * 6);
    } else if (armor.armorPower === 'mirror') {
      const ghost = this.add.image(x - nx * 28, y - 8, 'tex_player_dyn').setDepth(4).setTint(color).setAlpha(0.5);
      this.tweens.add({ targets: ghost, x: ghost.x + nx * 56, alpha: 0, duration: 440, onComplete: () => ghost.destroy() });
      gfx.strokeCircle(x, y, 26 + level * 5);
    } else if (armor.armorPower === 'quake') {
      this.emitBoostHammerSmash(x + nx * TILE, y + 8, spec);
      this.cameras.main.shake(90 + level * 25, 0.002 + level * 0.0005);
      gfx.beginPath(); gfx.moveTo(x - 42, y + 18); gfx.lineTo(x - 12, y + 4); gfx.lineTo(x + 8, y + 20); gfx.lineTo(x + 42, y + 2); gfx.strokePath();
    }
  }

  emitBoostSpeedLines(nx, ny, spec){
    if (!this.player?.active) return;
    const gfx = this.add.graphics().setDepth(850);
    const px = -ny, py = nx;
    const count = spec.trailCount || 8;
    for (let i = 0; i < count; i++) {
      const side = (i - (count - 1) / 2) * 7;
      const behind = 18 + (i % 4) * 10;
      const length = 22 + (i % 5) * 7;
      const sx = this.player.x - nx * behind + px * side;
      const sy = this.player.y - ny * behind + py * side;
      gfx.lineStyle(2 + (i % 2), spec.trailColor, 0.82);
      gfx.beginPath();
      gfx.moveTo(sx, sy);
      gfx.lineTo(sx - nx * length, sy - ny * length);
      gfx.strokePath();
    }
    this.tweens.add({ targets: gfx, alpha: 0, duration: 260, ease: 'Quad.easeOut', onComplete: () => gfx.destroy() });
  }

  fireTrident(pointer){
    if (this._tridentCd && this._tridentCd > this.time.now) return;
    this._tridentCd = this.time.now + 700;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dx = wp.x - this.player.x, dy = wp.y - this.player.y;
    const distance = Math.hypot(dx, dy) || 1;
    const nx = dx / distance, ny = dy / distance;
    const trident = this.spawnBulletFrom(
      this.player.x + nx * 18,
      this.player.y + ny * 8,
      wp.x,
      wp.y,
      { speed: 920, lifeTiles: 14, projectileKey: 'tex_trident', noBlockDamage: true, aimAssist: false }
    );
    trident?.setTint?.(0x7dd3fc);
    trident?.setData?.('isTrident', true);
    window.playSfx?.('laser');

    // Ristiaalokko/Riptide: water or storm rain launches the player.
    if (this.inWater || this.weather?.isStorm) {
      this.player.setVelocityX(nx * 900);
      this.player.setVelocityY(ny * 900 - 320);
      this.emitRiptideCrossWave();
      this.showToast?.('Ristiaalokko! Atrain lennättää sinua.');
    }
  }

  emitRiptideCrossWave(){
    const gfx = this.add.graphics().setDepth(850);
    const x = this.player.x, y = this.player.y;
    gfx.lineStyle(4, 0x7dd3fc, 0.95);
    gfx.beginPath(); gfx.moveTo(x - 58, y); gfx.lineTo(x + 58, y); gfx.strokePath();
    gfx.beginPath(); gfx.moveTo(x, y - 58); gfx.lineTo(x, y + 58); gfx.strokePath();
    gfx.lineStyle(2, 0xe0f2fe, 0.9); gfx.strokeCircle(x, y, 18); gfx.strokeCircle(x, y, 34);
    this.tweens.add({ targets: gfx, alpha: 0, duration: 360, ease: 'Quad.easeOut', onComplete: () => gfx.destroy() });
  }

  // (Hemuli spawn removed)

  // Oppo spawn logic: near player, sometimes with bounce shoes
  trySpawnOppoNearPlayer(){
    const px = this.player.x, py = this.player.y;
    const side = Math.random()<0.5?-1:1;
    const x = px + side * (8 + Math.random()*8) * TILE;
    const y = py - (0.5 + Math.random()*1) * TILE;
    const o = this.oppos.create(x, y, 'tex_oppo');
    o.setDepth(5); o.setBounce(0.12);
    o.body.setSize(20, 24).setOffset(4,2);
    // 40% chance to have bounce shoes
    const hasShoes = Math.random() < 0.4;
    o.setData('bounceShoes', hasShoes);
    if (hasShoes) o.setTint(0x77ff77);
    return o;
  }

  // Grenade: throw, then explode after ~4.4s; destroys exactly 123 tiles (diamond R=7 + 10 cells from R=8 ring)
  throwGrenade(pointer, opts = {}){
    if (this._grenadeCd && this._grenadeCd > this.time.now) return;
    this._grenadeCd = this.time.now + 500; // small throw cadence
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dx = wp.x - this.player.x, dy = wp.y - this.player.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist, ny = dy / dist;
    const speed = 360;
    const gr = this.physics.add.image(this.player.x, this.player.y-8, 'tex_grenade');
    gr.setDepth(6); gr.setBounce(0.35); gr.setCollideWorldBounds(true);
    this.physics.add.collider(gr, this.platforms);
    gr.setVelocity(nx*speed, ny*speed - 260); // give some arc up
    gr.setDrag(22, 0);
  gr._explodeAt = this.time.now + 4400; // ~4.4s
    gr._t = this.time.now;
    const scene = this;
    gr.preUpdate = function(t, dt){
      Phaser.Physics.Arcade.Image.prototype.preUpdate.call(this, t, dt);
      if (t >= this._explodeAt) {
        const gx = this.x, gy = this.y; this.destroy();
        scene.explodeGrenadeAt(gx, gy, opts);
      }
    };
  }

  explodeGrenadeAt(x, y, opts = {}){
    const cx = Math.floor(x / TILE);
    const cy = Math.floor(y / TILE);
    // Build diamond radius R=7 (113 tiles), then add 10 cells from the R=8 ring to reach 123 tiles
    const toClear = new Set();
    const add = (tx,ty)=> toClear.add(`${tx},${ty}`);
    const R = 7;
    for (let dx=-R; dx<=R; dx++){
      const rem = R - Math.abs(dx);
      for (let dy=-rem; dy<=rem; dy++) add(cx+dx, cy+dy);
    }
    // Collect R=8 ring cells and add 10 evenly spaced ones
    const ring8 = [];
    for (let dx=-8; dx<=8; dx++){
      const dy = 8 - Math.abs(dx);
      if (dy === 0) ring8.push([dx,0]); else { ring8.push([dx,dy]); ring8.push([dx,-dy]); }
    }
    const step = 3; // ~32/10 ≈ 3
    let added = 0;
    for (let i=0; i<ring8.length && added<10; i+=step){
      const [dx,dy] = ring8[i];
      const k = `${cx+dx},${cy+dy}`;
      if (!toClear.has(k)) { toClear.add(k); added++; }
    }

  // Flash FX over approximate bounding box (17x17 tiles)
  const gfx = this.add.graphics().setDepth(800);
  window.playSfx?.('explosion_small');
    gfx.fillStyle(0xffee66, 0.30);
    gfx.fillRect((cx-8)*TILE, (cy-8)*TILE, 17*TILE, 17*TILE);
    this.time.delayedCall(120, ()=> gfx.destroy());

    // Clear blocks and apply drops
    for (const key of Array.from(toClear)){
      const [sx,sy] = key.split(',');
      const tx = Number(sx), ty = Number(sy);
      const spr = this.blocks.get(key);
      if (!spr) continue;
      const type = spr.getData('type');
  if (type === 'trunk' || type==='tammi' || type==='koivu') this.dropWood(spr.x, spr.y);
      else if (type === 'ground') { if (Math.random() < 0.30) this.dropCoin(spr.x, spr.y); }
      else if (this.isStoneBlockType(type)) { if (Math.random() < 0.85) this.dropStone(spr.x, spr.y); }
      this.markBlockDestroyedInDiff(tx, ty, type);
      spr.destroy();
      this.blocks.delete(key);
      if (type === 'cactus') this.cactusTiles.delete(key);
      this.tryFlowWaterFrom(tx, ty-1);
    }

  // Damage enemies within AABB of the diamond (R≈8)
  const xMin=(cx-8)*TILE, xMax=(cx+9)*TILE, yMin=(cy-8)*TILE, yMax=(cy+9)*TILE;
    const inBox=(e)=> e && e.active && e.x>=xMin && e.x< xMax && e.y>=yMin && e.y< yMax;
  this.birds?.children?.iterate?.(b=>{ if (inBox(b)) b.destroy(); });
    this.slimes?.children?.iterate?.(s=>{ if (inBox(s)) { const ex=s.x, ey=s.y; s.destroy(); this.dropCoins(ex,ey,3); } });
    this.zombies?.children?.iterate?.(z=>{ if (inBox(z)) { const ex=z.x, ey=z.y; z.destroy(); this.dropCoins(ex,ey,2); } });
    this.clones?.children?.iterate?.(c=>{ if (inBox(c)) c.destroy(); });
  const bossDmg = opts.copper ? 3 : 2;
  this.bosses?.children?.iterate?.(bs=>{ if (inBox(bs)) this.damageBoss(bs, bossDmg); });

    this.saveState();
  }

  // Nuke: instant detonation at cursor, destroys exactly 111 blocks
  fireNuke(pointer, opts = {}){
    if (this._nukeCd && this._nukeCd > this.time.now) return;
    this._nukeCd = this.time.now + 2000;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.explodeNukeAt(wp.x, wp.y, opts);
  }

  explodeNukeAt(x, y, opts = {}){
    const cx = Math.floor(x / TILE);
    const cy = Math.floor(y / TILE);
    const toClear = new Set();
    const add=(tx,ty)=> toClear.add(`${tx},${ty}`);
    // Diamond radius R=7 (|dx|+|dy|<=R) yields 113 tiles; remove 2 to make 111
    const R=7;
    for (let dx=-R; dx<=R; dx++){
      const rem = R - Math.abs(dx);
      for (let dy=-rem; dy<=rem; dy++) add(cx+dx, cy+dy);
    }
    // Trim two symmetric edge tiles deterministically
    toClear.delete(`${cx+R},${cy}`);
    toClear.delete(`${cx-R},${cy}`);

  // FX
  const gfx = this.add.graphics().setDepth(800);
  window.playSfx?.('nuke');
    gfx.fillStyle(0xffef6e, 0.30);
    gfx.fillCircle(cx*TILE+TILE/2, cy*TILE+TILE/2, (R+0.6)*TILE);
    this.time.delayedCall(160, ()=> gfx.destroy());

    // Clear blocks with drops and persistence
    for (const key of Array.from(toClear)){
      const [sx,sy] = key.split(',');
      const tx = Number(sx), ty = Number(sy);
      const spr = this.blocks.get(key);
      if (!spr) continue;
      const type = spr.getData('type');
  if (type === 'trunk' || type==='tammi' || type==='koivu') this.dropWood(spr.x, spr.y);
      else if (type === 'ground') { if (Math.random() < 0.35) this.dropCoin(spr.x, spr.y); }
      else if (this.isStoneBlockType(type)) { if (Math.random() < 0.9) this.dropStone(spr.x, spr.y); }
      this.markBlockDestroyedInDiff(tx, ty, type);
      spr.destroy();
      this.blocks.delete(key);
      if (type === 'cactus') this.cactusTiles.delete(key);
      this.tryFlowWaterFrom(tx, ty-1);
    }

    // Damage enemies within AABB of diamond
    const xMin=(cx-7)*TILE, xMax=(cx+8)*TILE, yMin=(cy-7)*TILE, yMax=(cy+8)*TILE;
    const inBox=(e)=> e && e.active && e.x>=xMin && e.x< xMax && e.y>=yMin && e.y< yMax;
  this.birds?.children?.iterate?.(b=>{ if (inBox(b)) b.destroy(); });
  this.oppos?.children?.iterate?.(o=>{ if (inBox(o)) { const ex=o.x, ey=o.y; o.destroy(); this.dropCoins(ex,ey,2); if (Math.random()<0.18 && !this.state.bounceShoes) this.spawnPickup(ex, ey, 'tex_boots'); } });
    this.slimes?.children?.iterate?.(s=>{ if (inBox(s)) { const ex=s.x, ey=s.y; s.destroy(); this.dropCoins(ex,ey,5); } });
    this.zombies?.children?.iterate?.(z=>{ if (inBox(z)) { const ex=z.x, ey=z.y; z.destroy(); this.dropCoins(ex,ey,4); } });
    this.clones?.children?.iterate?.(c=>{ if (inBox(c)) c.destroy(); });
  const bossDmg = opts.copper ? 10 : 8;
  this.bosses?.children?.iterate?.(bs=>{ if (inBox(bs)) this.damageBoss(bs, bossDmg); });

    this.saveState();
    this.showToast?.('Ydinase: 111 plokkia tuhottu');
  }

  // Plane gun: shoots a very long-range bullet (1111 tiles), no block damage
  firePlaneGun(pointer, opts = {}){
    if (this._planeCd && this._planeCd > this.time.now) return;
    this._planeCd = this.time.now + 150;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const sx = this.player.x, sy = this.player.y;
    const dx = wp.x - sx, dy = wp.y - sy;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx/d, ny = dy/d;
  const bullet = this.bullets.create(sx, sy, 'tex_bullet');
  window.playSfx?.('plane');
    const speed = 1200;
    bullet.setVelocity(nx*speed, ny*speed);
    bullet.setRotation(Math.atan2(ny, nx));
    bullet.setData('noBlockDamage', true);
    // lifetime for 1111 tiles
  const extraTiles = opts.copper ? 17 : 0;
  const lifeMs = ((1111 + extraTiles) * TILE / speed) * 1000;
  if (opts.copper) bullet.setData('isCopper', true);
  this.time.delayedCall(lifeMs, ()=>{ if (bullet.active) bullet.destroy(); });
    // do not remove cannons
    bullet._lastCheck = 0;
    const origPreUpdate = Phaser.Physics.Arcade.Sprite.prototype.preUpdate;
    bullet.preUpdate = function(t, dt){ origPreUpdate.call(this, t, dt); };
  }

  explodeAt(x, y, opts = {}){
    // 6x6 tile area centered around impact (even size -> skew one tile to negative side)
    const cx = Math.floor(x / TILE);
    const cy = Math.floor(y / TILE);
    const txMin = cx - 3, txMax = cx + 2; // 6 tiles wide
    const tyMin = cy - 3, tyMax = cy + 2; // 6 tiles tall

    // FX: flash rectangle
  const gfx = this.add.graphics().setDepth(800);
  window.playSfx?.('explosion_small');
    gfx.fillStyle(0xffaa33, 0.35);
    gfx.fillRect(txMin*TILE, tyMin*TILE, (txMax-txMin+1)*TILE, (tyMax-tyMin+1)*TILE);
    this.time.delayedCall(120, ()=> gfx.destroy());

    // Destroy blocks within the 6x6 tile area (includes cactus, stone, ground, planks, etc.)
    for (let tx = txMin; tx <= txMax; tx++){
      for (let ty = tyMin; ty <= tyMax; ty++){
        const key = `${tx},${ty}`;
        const spr = this.blocks.get(key);
        if (!spr) continue;
        const type = spr.getData('type');
        // drops similar to mining/shooting
  if (type === 'trunk' || type==='tammi' || type==='koivu') this.dropWood(spr.x, spr.y);
        else if (type === 'ground') { if (Math.random() < 0.30) this.dropCoin(spr.x, spr.y); }
        else if (this.isStoneBlockType(type)) { if (Math.random() < 0.85) this.dropStone(spr.x, spr.y); }
        this.markBlockDestroyedInDiff(tx, ty, type);
        spr.destroy();
        this.blocks.delete(key);
        if (type === 'cactus') this.cactusTiles.delete(key);
        this.tryFlowWaterFrom(tx, ty-1);
      }
    }

    // Damage/kill enemies within the same 6x6 area (AABB check)
    const inBox = (e)=> e && e.active && e.x >= txMin*TILE && e.x < (txMax+1)*TILE && e.y >= tyMin*TILE && e.y < (tyMax+1)*TILE;
  this.birds?.children?.iterate?.(b=>{ if (inBox(b)) b.destroy(); });
  this.oppos?.children?.iterate?.(o=>{ if (inBox(o)) { const ex=o.x, ey=o.y; o.destroy(); this.dropCoins(ex,ey,2); } });
    this.slimes?.children?.iterate?.(s=>{ if (inBox(s)) { const ex=s.x, ey=s.y; s.destroy(); this.dropCoins(ex,ey,3); } });
    this.zombies?.children?.iterate?.(z=>{ if (inBox(z)) { const ex=z.x, ey=z.y; z.destroy(); this.dropCoins(ex,ey,2); } });
  const bossDmg = opts.copper ? 3 : 2;
  this.bosses?.children?.iterate?.(bs=>{ if (inBox(bs)) { this.damageBoss(bs, bossDmg); } });
    this.clones?.children?.iterate?.(c=>{ if (inBox(c)) c.destroy(); });

    this.saveState();
  }

  // --- Vine (liaani) ---
  onSpaceVine(pointer){
    // Toggle: shoot -> reel -> cancel
    if (this.vine.active) {
      if (!this.vine.reeling) this.vine.reeling = true; else this.cancelVine();
      return;
    }
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    let dx = worldPoint.x - this.player.x;
    let dy = worldPoint.y - this.player.y;
    if (dy >= -4) { dx = 0; dy = -1; }
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist, ny = dy / dist;
    const maxRange = 14 * TILE;
    const step = TILE / 3;
    let anchor = null;
    for (let d = TILE; d <= maxRange; d += step) {
      const x = this.player.x + nx * d;
      const y = this.player.y + ny * d;
      const tx = Math.floor(x / TILE);
      const ty = Math.floor(y / TILE);
      if (this.hasSolidBlockAt(tx, ty)) { anchor = { x: tx*TILE + TILE/2, y: ty*TILE + TILE/2 }; break; }
    }
    if (anchor) {
      this.vine.active = true;
      this.vine.reeling = false;
      this.vine.anchor = anchor;
      this.vine.length = 0;
    } else {
      this.showToast('Ei tarttumapintaa');
    }
  }
  cancelVine(){
    this.vine.active = false;
    this.vine.reeling = false;
    this.vine.anchor = null;
    this.vine.length = 0;
    this.vineGfx?.clear();
  }

  // Grappling hook: attach to first solid tile along a ray towards pointer (bias upwards)
  tryGrapple(pointer){
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    let dx = worldPoint.x - this.player.x;
    let dy = worldPoint.y - this.player.y;
    // If aiming level/below, force straight up
    if (dy >= -4) { dx = 0; dy = -1; }
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist, ny = dy / dist;
    const maxRange = 12 * TILE;
    const step = TILE / 3;
    let anchor = null;
    for (let d = TILE; d <= maxRange; d += step) {
      const x = this.player.x + nx * d;
      const y = this.player.y + ny * d;
      const tx = Math.floor(x / TILE);
      const ty = Math.floor(y / TILE);
      if (this.hasSolidBlockAt(tx, ty)) {
        anchor = { x: tx*TILE + TILE/2, y: ty*TILE + TILE/2 };
        break;
      }
    }
    if (anchor) {
      this.hook.active = true;
      this.hook.anchor = anchor;
    } else {
      this.showToast('Ei tarttumapintaa');
    }
  }

  cancelGrapple(){
    this.hook.active = false;
    this.hook.anchor = null;
    this.hookGfx?.clear();
  }

  // --- Clone tool ---
  cycleCloneTarget(){
  const order = ['none','ground','stone','sand','cactus','trunk','tammi','koivu'];
    const idx = order.indexOf(this.cloneSettings.target);
    this.cloneSettings.target = order[(idx+1) % order.length];
    this.showToast(`Kloonaus kohde: ${this.cloneSettings.target}`);
  }
  spawnClone(pointer){
    const limit = 3;
    if (this.cloneList.length >= limit) { this.showToast('Klooneja täynnä'); return; }
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  const c = this.clones.create(worldPoint.x, worldPoint.y, 'tex_player_dyn');
    c.setScale(0.95);
    c.body.setSize(20, 34).setOffset(4, 2);
    c.setData('isClone', true);
    c.setCollideWorldBounds(true);
  this.physics.add.collider(c, this.platforms);
    this.cloneList.push(c);
    // simple AI update hook per clone
    c._nextMineAt = 0;
    return c;
  }

  removeClone(clone){
    if (!clone) return;
    // remove from list and destroy sprite
    this.cloneList = this.cloneList.filter(c=> c !== clone);
    clone.destroy();
    this.showToast('Klooni poistettu');
  }

  // Enemy collision handlers
  onBirdHit(player, bird){ this._hitByEnemy(bird); }
  onSlimeHit(player, slime){ this._hitByEnemy(slime); }
  isValidEnemyHit(enemy){
    if (!this.player?.active || !enemy || enemy.active === false) return false;
    if (enemy.visible === false || typeof enemy.alpha === 'number' && enemy.alpha <= 0) return false;
    if (enemy.body && enemy.body.enable === false) return false;
    const dx = (Number(enemy.x) || 0) - this.player.x;
    const dy = (Number(enemy.y) || 0) - this.player.y;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return false;
    // Arcade overlap can finish one frame after an object was destroyed or
    // hidden. Only accept a contact that is also physically close now.
    const eb = enemy.body;
    const pb = this.player.body;
    const enemyRadius = Math.max(24, (eb?.width || enemy.displayWidth || 0) * 0.55, (eb?.height || enemy.displayHeight || 0) * 0.45);
    const playerRadius = Math.max(20, (pb?.width || 20) * 0.55, (pb?.height || 34) * 0.45);
    const maxDistance = Math.max(TILE*2, enemyRadius + playerRadius);
    if (dx*dx + dy*dy > maxDistance*maxDistance) return false;
    // Do not let a stale overlap or an enemy on the other side of a block
    // hurt the player. The end tiles contain the two bodies, so skip them.
    const steps = Math.ceil(Math.hypot(dx, dy) / Math.max(1, TILE/3));
    for (let i=1; i<steps; i++) {
      const tx = Math.floor((this.player.x + dx*i/steps) / TILE);
      const ty = Math.floor((this.player.y + dy*i/steps) / TILE);
      if (this.hasSolidBlockAt(tx, ty)) return false;
    }
    return true;
  }
  _hitByEnemy(enemy){
    if (this.builderMode) return; // Nikkarointitilassa viholliset eivät voi osua.
    if (!this.isValidEnemyHit(enemy)) return;
    // Pamppu block: negate hit if blocking and enemy is in front within 5 tiles
    if (this.tools?.equipped === 'pamppu' && this.pamppu?.mode === 'block') {
      const R = 5 * TILE;
      const dx = (enemy?.x||this.player.x) - this.player.x;
      const dy = (enemy?.y||this.player.y) - this.player.y;
      const forward = this.player.flipX ? (dx <= 0) : (dx >= 0);
      const d2 = dx*dx + dy*dy;
      if (forward && d2 <= R*R) {
        // brief block cooldown to avoid stunlock
        if (!this._pamppuBlockCd || this.time.now >= this._pamppuBlockCd) {
          this._pamppuBlockCd = this.time.now + 150;
          // knock enemy back slightly
          try { const dir = Math.sign(dx) || (this.player.flipX?-1:1); enemy.setVelocity(dir*220, -80); } catch(e){}
          // FX: short highlight line
          const g = this.add.graphics().setDepth(800);
          const sx = this.player.x, sy = this.player.y;
          const ex = sx + (this.player.flipX?-1:1) * (5*TILE);
          g.lineStyle(6, 0xffee88, 0.35); g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, sy); g.strokePath();
          this.time.delayedCall(80, ()=> g.destroy());
          return; // cancel damage
        }
      }
    }
    if (this.time.now < this.invulnUntil) return;
    this.invulnUntil = this.time.now + 1000;
    this.damage(1);
    const dir = Math.sign(this.player.x - (enemy?.x ?? this.player.x)) || 1;
    this.player.setVelocityX(dir * 260);
    this.player.setVelocityY(-200);
    this.player.setTint(0xff4444);
    this.time.delayedCall(180, () => this.player.clearTint());
  }

  // Find a leaves block near (x,y) and return a perch position (top center)
  findLeavesSpotNear(x, y, rx=10, ry=8){
    const tx0=Math.floor(x/TILE), ty0=Math.floor(y/TILE);
    for (let r=0;r<=Math.max(rx,ry);r++){
      for (let ox=-r; ox<=r; ox++) for (let oy=-r; oy<=r; oy++){
        if (Math.abs(ox)>rx || Math.abs(oy)>ry) continue;
        const tx=tx0+ox, ty=ty0+oy; const key=`${tx},${ty}`; const spr=this.blocks.get(key);
        if (!spr) continue; if (spr.getData('type')!=='leaves') continue;
        // ensure space above is empty for sprite
        if (this.hasSolidBlockAt(tx, ty-1)) continue;
        return { x: tx*TILE + TILE/2, y: (ty-1)*TILE + TILE/2 };
      }
    }
    return null;
  }

  trySpawnEnemySoldierNearPlayer(){
    // choose a leaves spot near the player; if none, bail
    const spot=this.findLeavesSpotNear(this.player.x, this.player.y, 16, 10);
    if (!spot) return false;
    const e=this.enemySoldiers.create(spot.x, spot.y, 'tex_enemy_soldier');
    e.setDepth(5); e.body.setSize(20,34).setOffset(4,2); e.body.setAllowGravity(false);
    e.setData('mode','perch'); e._ai={};
    return true;
  }

  getDroneTextureKey(typeId = this.droneType, skinId = this.droneSkin) {
    const drone = DRONE_MAP[typeId] || DRONE_MAP.scout;
    const skin = DRONE_SKIN_DEFS[skinId] || DRONE_SKIN_DEFS.neon;
    return skin.texture || drone.texture;
  }

  applyDroneSkin(drone, typeId, skinId) {
    if (!drone?.active) return;
    const skin = DRONE_SKIN_DEFS[skinId] || DRONE_SKIN_DEFS.neon;
    drone.setTexture(this.getDroneTextureKey(typeId, skinId));
    if (skin.tint) drone.setTint(skin.tint); else drone.clearTint();
  }

  updateDroneSelects() {
    const typeSelect = document.getElementById('droneTypeSelect');
    const skinSelect = document.getElementById('droneSkinSelect');
    if (typeSelect) {
      typeSelect.innerHTML = '';
      DRONE_DEFS.forEach((drone) => {
        const option = document.createElement('option');
        option.value = drone.id;
        option.textContent = drone.name;
        typeSelect.appendChild(option);
      });
      typeSelect.value = DRONE_MAP[this.droneType] ? this.droneType : 'scout';
      if (!typeSelect.dataset.bound) {
        typeSelect.addEventListener('change', () => this.setDroneType(typeSelect.value));
        typeSelect.dataset.bound = '1';
      }
    }
    if (skinSelect) {
      skinSelect.innerHTML = '';
      Object.entries(DRONE_SKIN_DEFS).forEach(([id, skin]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = skin.name;
        skinSelect.appendChild(option);
      });
      skinSelect.value = DRONE_SKIN_DEFS[this.droneSkin] ? this.droneSkin : 'neon';
      if (!skinSelect.dataset.bound) {
        skinSelect.addEventListener('change', () => this.setDroneSkin(skinSelect.value));
        skinSelect.dataset.bound = '1';
      }
    }
    const description = document.getElementById('droneDescription');
    const selected = DRONE_MAP[this.droneType] || DRONE_MAP.scout;
    if (description) description.textContent = `${selected.name}: ${selected.heals ? 'parantaa' : selected.lightning ? 'salamoi' : selected.explosive ? 'ampuu raketteja' : selected.guardian ? 'antaa suojakilven' : 'ampuu nopeasti'}.`;
  }

  setDroneType(typeId) {
    if (!DRONE_MAP[typeId]) return;
    this.droneType = typeId;
    this.updateDroneSelects();
    this.saveState();
    this.showToast(`${DRONE_MAP[typeId].name} valittu`);
  }

  setDroneSkin(skinId) {
    if (!DRONE_SKIN_DEFS[skinId]) return;
    this.droneSkin = skinId;
    this.drones?.children?.iterate?.((drone) => {
      if (!drone?.active) return;
      drone._ai = drone._ai || {};
      drone._ai.skinId = skinId;
      this.applyDroneSkin(drone, drone._ai.typeId || this.droneType, skinId);
    });
    this.updateDroneSelects();
    this.saveState();
    this.showToast(`Dronen skini: ${DRONE_SKIN_DEFS[skinId].name}`);
  }

  // Spawn a friendly hovering drone near player. Four drones can work together.
  spawnAllyDrone(typeId = this.droneType, skinId = this.droneSkin) {
    if (!this.player?.active || !this.drones) return null;
    if (this.drones.countActive(true) >= 4) {
      this.showToast('Dronien enimmäismäärä on 4');
      return null;
    }
    const drone = DRONE_MAP[typeId] || DRONE_MAP.scout;
    const skin = DRONE_SKIN_DEFS[skinId] ? skinId : 'neon';
    const x = this.player.x + (Math.random()<0.5?-60:60);
    const y = this.player.y - 80;
    const d = this.drones.create(x, y, this.getDroneTextureKey(drone.id, skin));
    d.setDepth(5);
    d._ai = {
      typeId: drone.id,
      skinId: skin,
      targetOffX: Phaser.Math.Between(-70, -50),
      targetOffY: Phaser.Math.Between(-100, -80),
      nextAt: 0,
      nextHealAt: 0,
      nextShieldAt: 0
    };
    this.applyDroneSkin(d, drone.id, skin);
    return d;
  }

  // Super Laser: strike 54 tiles ahead of player horizontally, 3 tiles wide, from top to bottom
  fireSuperLaser(){
    if (!this.started || this.isPaused) return;
    // determine direction using pointer vs player
    const p = this.input.activePointer; const wp = this.cameras.main.getWorldPoint(p.x, p.y);
    const dir = Math.sign(wp.x - this.player.x) || 1;
    const baseTx = Math.floor(this.player.x / TILE) + dir * 54;
    // Three columns centered at baseTx
    const cols = [baseTx-1, baseTx, baseTx+1];
    // Visual beam(s) in camera view
    const cam = this.cameras.main; const g = this.add.graphics().setDepth(800);
    g.fillStyle(0xff3b8a, 0.35);
    cols.forEach(tx=>{
      const x = tx*TILE;
      const viewTop = cam.worldView.y;
      const viewBottom = cam.worldView.y + cam.worldView.height;
      g.fillRect(x, viewTop, TILE, viewBottom - viewTop);
      g.lineStyle(3, 0xff84c4, 0.7); g.strokeRect(x+2, viewTop, TILE-4, viewBottom - viewTop);
    });
    this.time.delayedCall(220, ()=> g.destroy());
    // Destroy blocks in the stripe (except iron), update persistence and drops
    for (const tx of cols){
      for (let ty=0; ty<WORLD_TILES_Y; ty++){
        const key = `${tx},${ty}`; const spr = this.blocks.get(key);
        if (!spr) continue;
        const type = spr.getData('type');
        if (type === 'iron') continue; // unbreakable
        // Drops similar to onBulletHit/explode
  if (type === 'trunk' || type==='tammi' || type==='koivu') this.dropWood(spr.x, spr.y);
        else if (type === 'ground') { if (Math.random() < 0.30) this.dropCoin(spr.x, spr.y); }
        else if (this.isStoneBlockType(type)) { if (Math.random() < 0.85) this.dropStone(spr.x, spr.y); }
        // Persistence
        this.markBlockDestroyedInDiff(tx, ty, type);
        spr.destroy(); this.blocks.delete(key); if (type==='cactus') this.cactusTiles.delete(key);
        this.tryFlowWaterFrom(tx, ty-1);
      }
    }
    // Destroy enemies intersecting the stripe
    const inStripe = (e)=>{
      if (!e || !e.active) return false;
      const ex = e.x; const txf = Math.floor(ex / TILE);
      return cols.includes(txf);
    };
    // Birds (no coins)
    this.birds?.children?.iterate?.(b=>{ if (inStripe(b)) { b.destroy(); } });
    // Slimes
    this.slimes?.children?.iterate?.(s=>{ if (inStripe(s)) { const x=s.x,y=s.y; s.destroy(); this.dropCoins(x,y,3); } });
    // Zombies
    this.zombies?.children?.iterate?.(z=>{ if (inStripe(z)) { const x=z.x,y=z.y; z.destroy(); this.dropCoins(x,y,2); } });
    // Oppos (jumper) + rare boots
    this.oppos?.children?.iterate?.(o=>{ if (inStripe(o)) { const x=o.x,y=o.y; o.destroy(); this.dropCoins(x,y,2); if (Math.random()<0.18 && !this.state.bounceShoes) this.spawnPickup(x,y,'tex_boots'); } });
    // Wolves
    this.wolves?.children?.iterate?.(w=>{ if (inStripe(w)) { const x=w.x,y=w.y; w.destroy(); } });
    // Enemy soldiers
    this.enemySoldiers?.children?.iterate?.(e=>{ if (inStripe(e)) { const x=e.x,y=e.y; e.destroy(); this.dropCoins(x,y,3+Math.floor(Math.random()*2)); } });
    this.saveState();
    try{ window.playSfx?.('shoot'); }catch(e){}
  }

  getBuildBlockSpec(type = this.building?.block || 'plank') {
    const specs = {
      plank: { label: 'Lankku', inv: 'plank', cost: 1, textureKey: 'tex_plank', type: 'plank', emptyToast: 'Ei lankkuja! Craftaa C' },
      stone: { label: 'Kivi', inv: 'stone', cost: 1, textureKey: 'tex_stone', type: 'stone', emptyToast: 'Ei kiveä!' },
      hotstone: { label: 'Kuuma', inv: 'stone', cost: 3, textureKey: 'tex_hot_block', type: 'hotstone', emptyToast: 'Tarvitset 3 kiveä kuumaan blokkiin' }
    };
    NEW_BUILD_BLOCK_DEFS.forEach((block) => { specs[block.id] = block; });
    TRAP_BUILD_BLOCK_DEFS.forEach((block) => { specs[block.id] = block; });
    return specs[type] || specs.plank;
  }

  setBuilderMode(enabled, announce = true) {
    const next = !!enabled;
    if (this.builderMode === next) {
      this.updateBuilderModeUI();
      return;
    }
    this.builderMode = next;
    this.updateBuilderModeUI();
    this.updateUI();
    this.saveState();
    if (announce) this.showToast(next
      ? 'Nikkarointitila päällä: lennä ja rakenna loputtomasti!'
      : 'Nikkarointitila pois');
  }

  updateBuilderModeUI() {
    const toggle = document.getElementById('builderMode');
    if (toggle) toggle.checked = !!this.builderMode;
    const status = document.getElementById('builderStatus');
    if (status) status.classList.toggle('hidden', !this.builderMode);
  }

  cycleBuildBlock() {
    const order = BUILD_BLOCK_IDS;
    if (!this.building) this.building = { block: 'plank', hotHurtAt: 0 };
    const idx = order.indexOf(this.building.block);
    this.building.block = order[(idx + 1) % order.length];
    const spec = this.getBuildBlockSpec();
    this.updateInventoryUI();
    this.updateBlockPaletteUI();
    this.showToast(`Rakennusblokki: ${spec.label}`);
    this.saveState();
  }

  placeBuildBlock(pointer) {
    if (!this.building) this.building = { block: 'plank', hotHurtAt: 0 };
    const spec = this.getBuildBlockSpec();
    if (!this.builderMode && (this.inv[spec.inv] || 0) < spec.cost) { this.showToast(spec.emptyToast); return; }
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(worldPoint.x / TILE);
    const ty = Math.floor(worldPoint.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.has(key)) { this.showToast('Paikka varattu'); return; }

    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const newRect = new Phaser.Geom.Rectangle(x - TILE/2, y - TILE/2, TILE, TILE);
    const pb = new Phaser.Geom.Rectangle(this.player.body.x, this.player.body.y, this.player.body.width, this.player.body.height);
    if (Phaser.Geom.Intersects.RectangleToRectangle(newRect, pb)) { this.showToast('Liian lähellä'); return; }

    // Ansapalikat are real traps, not ordinary solid blocks. They use the
    // selected trap artwork but keep the familiar trap detection behavior.
    if (spec.trapType) {
      const dir = 'right';
      if (!this.placeTrapAtTile(tx, ty, spec.trapType, spec.textureKey, dir, false)) return;
      if (!this.builderMode) this.inv[spec.inv] -= spec.cost;
      this.updateInventoryUI();
      this.recordAdventureEvent('build');
      this.saveState();
      return;
    }

    this.addBlock(tx, ty, spec.textureKey, spec.type, true);
    if (!this.builderMode) this.inv[spec.inv] -= spec.cost;
    this.updateInventoryUI();

    // persist placement
    this.worldDiff.placed.push({ tx, ty, type: spec.type, textureKey: spec.textureKey });
    // If it was previously removed (same coordinate), clean up
    this.worldDiff.removed = this.worldDiff.removed.filter(k=>k!==key);
    this.saveState();
  }

  placePlank(pointer) {
    const prev = this.building?.block || 'plank';
    if (!this.building) this.building = { block: 'plank', hotHurtAt: 0 };
    this.building.block = 'plank';
    this.placeBuildBlock(pointer);
    this.building.block = prev;
  }

  // Place a cannon (tykki) at target tile
  placeCannon(pointer){
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(worldPoint.x / TILE);
    const ty = Math.floor(worldPoint.y / TILE);
    const key = `${tx},${ty}`;
  // Validate: tile must be empty and ground below solid and no existing cannon
  if (this.blocks.has(key) || this.cannonTiles.has(key)) { this.showToast('Paikka varattu'); return; }
    const belowKey = `${tx},${ty+1}`;
    if (!this.blocks.has(belowKey)) { this.showToast('Tarvitsee alustan'); return; }
    // Also prevent overlapping player
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const newRect = new Phaser.Geom.Rectangle(x - TILE/2, y - TILE/2, TILE, TILE);
    const pb = new Phaser.Geom.Rectangle(this.player.body.x, this.player.body.y, this.player.body.width, this.player.body.height);
    if (Phaser.Geom.Intersects.RectangleToRectangle(newRect, pb)) { this.showToast('Liian lähellä'); return; }

    const cannon = this.spawnCannonAt(tx, ty);
    if (cannon) {
      this.cannonTiles.add(key);
      this.cannonPositions.push({ tx, ty });
      this.saveState();
      this.showToast('Tykki asetettu');
    }
  }

  spawnCannonAt(tx, ty){
    const x = tx*TILE + TILE/2;
    const y = ty*TILE + TILE/2;
    const base = this.add.image(x, y, 'tex_cannon_base');
    const barrel = this.add.image(x+4, y-10, 'tex_cannon_barrel').setOrigin(0.1,0.5);
    const zone = this.add.zone(x, y, TILE, TILE);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zone.setData('tx', tx); zone.setData('ty', ty);
    // Overlap: any bullet touching the zone destroys the cannon
    this.physics.add.overlap(this.bullets, zone, (bullet, z)=>{
      const cx = z.getData('tx'), cy = z.getData('ty');
      this.removeCannonAt(cx, cy);
      bullet.destroy();
      this.saveState();
    }, null, this);
    // Track entity
    const c = { tx, ty, base, barrel, zone, mode: this.tools.cannonMode };
    this.cannons.push(c);
    // Ensure tile registry has this cannon
    this.cannonTiles.add(`${tx},${ty}`);
    // Optional: overlap for player proximity (not needed for firing)
    return c;
  }

  craftPlank() {
    if (this.inv.wood >= 3) {
      this.inv.wood -= 3; this.inv.plank += 1; this.updateInventoryUI(); this.saveState();
      this.showToast('Craftattu: 1 lankku');
    } else {
      this.showToast('Tarvitset 3 puuta');
    }
  }

  craftAllPlanks() {
    const amount = Math.floor((this.inv.wood || 0) / 3);
    if (amount <= 0) {
      this.showToast('Tarvitset vähintään 3 puuta');
      return;
    }
    this.inv.wood -= amount * 3;
    this.inv.plank += amount;
    this.updateInventoryUI();
    this.saveState();
    this.showToast(`Erikoiscraft: ${amount} lankkua`);
  }

  // Cannon helpers
  toggleCannonMode(){
    this.tools.cannonMode = this.tools.cannonMode === 'minigun' ? 'sniper' : 'minigun';
    this.updateInventoryUI();
    this.showToast(`Tykki: ${this.tools.cannonMode==='minigun'?'Minigun':'Tarkka'}`);
    this.saveState();
  }
  fireCannon(pointer){
    if (this.tools.cannonMode === 'minigun') this.shootMinigunBurst(pointer); else this.shootSniper(pointer);
  }

  shootBullet(pointer, opts = {}) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    // Mild aim assist: snap to nearest enemy near cursor (disabled if explicitly set)
    if (opts.aimAssist !== false) {
      const r = 72; let best=null, bestD2=r*r;
      const consider = (grp)=> grp?.children?.iterate?.(e=>{ if(!e||!e.active) return; const dx=e.x-worldPoint.x, dy=e.y-worldPoint.y; const d2=dx*dx+dy*dy; if(d2<bestD2){bestD2=d2; best=e;} });
      consider(this.enemySoldiers); consider(this.zombies); consider(this.slimes); consider(this.oppos); consider(this.birds); consider(this.wolves); consider(this.bosses);
      if (best) { worldPoint.x = best.x; worldPoint.y = best.y; }
    }
    const dirX = worldPoint.x - this.player.x;
    const dirY = worldPoint.y - this.player.y;
    const dist = Math.sqrt(dirX*dirX + dirY*dirY);
    if (dist === 0) return;
    let normX = dirX / dist;
    let normY = dirY / dist;
    // Apply angular spread (radians) if provided
    if (opts.spread) {
      const angle = Math.atan2(normY, normX);
      const jitter = (Math.random()*2 - 1) * opts.spread; // +/- spread
      const a = angle + jitter;
      normX = Math.cos(a);
      normY = Math.sin(a);
    }
  // Choose projectile sprite by mode
  let projKey = opts.projectileKey || 'tex_bullet';
  if (this.mode.current === 'galactic') projKey = 'tex_laser';
  if (this.mode.current === 'web') projKey = 'tex_web';
  const bullet = this.bullets.create(this.player.x, this.player.y, projKey);
  // Play 8-bit SFX depending on mode/weapon
  if (this.mode.current === 'galactic') { window.playSfx?.('laser'); }
  else if (this.mode.current === 'web') { window.playSfx?.('web'); }
  else if (this.tools.equipped === 'minigun' || opts.markMinigun) { window.playSfx?.('minigun'); }
  else if (this.tools.equipped === 'sniper') { window.playSfx?.('sniper'); }
  else { window.playSfx?.('shoot'); }
  if (this.tools.equipped === 'minigun' || opts.markMinigun) bullet.setData('isMinigun', true);
  if (this.mode.current === 'web') bullet.setData('isWeb', true);
  const speed = 750; // px per second (faster for easier hits)
  bullet.setVelocity(normX * speed, normY * speed);
    bullet.setRotation(Math.atan2(normY, normX));
  if (opts.copper) bullet.setData('isCopper', true);
  // Destroy after 6 tiles distance (time = distance / speed)
  const extraTiles = opts.copper ? 17 : 0;
  const lifeMs = ((6 + extraTiles) * TILE / speed) * 1000;
  this.time.delayedCall(lifeMs, () => { if (bullet.active) bullet.destroy(); });
    // On each step, check collision with cannons by tile sampling (lightweight)
    bullet._lastCheck = 0;
    bullet.preUpdate = (t, dt)=>{
      Phaser.Physics.Arcade.Sprite.prototype.preUpdate.call(bullet, t, dt);
      bullet._lastCheck += dt; if (bullet._lastCheck < 30) return; bullet._lastCheck = 0;
      const tx = Math.floor(bullet.x / TILE), ty = Math.floor(bullet.y / TILE);
      const key = `${tx},${ty}`;
      if (this.cannonTiles.has(key)) {
        // Remove cannon and bullet
        this.removeCannonAt(tx, ty);
        bullet.destroy();
        this.saveState();
      }
    };
  }

  // --- Wizard actions ---
  wizardTapFire(pointer){
    // Tap: default = 2 magic shots, range 13 tiles
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const sx = this.player.x, sy = this.player.y;
    // In Wizard mode: non-destructive arcane bolts, slightly longer range
    if (this.mode.current === 'wizard') {
      const opts = { speed: 700, lifeTiles: 16, spread: 0.04, noBlockDamage: true };
      this.spawnBulletFrom(sx, sy, wp.x, wp.y, opts);
      this.time.delayedCall(70, ()=>{ this.spawnBulletFrom(sx, sy, wp.x, wp.y, opts); });
      this.time.delayedCall(140, ()=>{ this.spawnBulletFrom(sx, sy, wp.x, wp.y, opts); });
    } else {
      // two shots with slight spread
      this.spawnBulletFrom(sx, sy, wp.x, wp.y, { speed: 700, lifeTiles: 13, spread: 0.05 });
      this.time.delayedCall(70, ()=>{
        this.spawnBulletFrom(sx, sy, wp.x, wp.y, { speed: 700, lifeTiles: 13, spread: 0.05 });
      });
    }
    window.playSfx?.('shoot');
  }
  wizardChargeRelease(pointer){
    // Hold+release: Wizard mode -> protective shield, otherwise bazooka
    if (this.mode.current === 'wizard') {
      this.itemBag.shieldUntil = this.time.now + 6000; // 6s shield
      this.showToast('Suojaus!');
    } else {
      this.fireBazooka(pointer);
    }
  }

  // --- Bow (Jousipyssy) ---
  fireBow(pointer, opts = {}){
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const sx = this.player.x, sy = this.player.y;
    const speed = 760; // fast arrow
  const lifeTiles = 19 + (opts.copper ? 17 : 0); // +17 tiles for copper
    const shoot = ()=>{
      const b = this.spawnBulletFrom(sx, sy, wp.x, wp.y, { speed, lifeTiles, spread: 0.02 });
      if (b && b.setTexture) b.setTexture('tex_arrow');
      window.playSfx?.('shoot');
    };
    shoot();
    this.time.delayedCall(80, shoot);
  }

  // --- Crossbow (Varsijousi) ---
  fireCrossbow(pointer, opts = {}){
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const sx = this.player.x, sy = this.player.y;
    // Crossbow: one precise, heavier bolt. Slightly slower than bow, more range, no double-tap.
    const speed = 700; // bolt speed
    const lifeTiles = 22 + (opts.copper ? 17 : 0); // longer base range, copper extends further
    const b = this.spawnBulletFrom(sx, sy, wp.x, wp.y, { speed, lifeTiles, spread: 0.005 });
    if (b && b.setTexture) b.setTexture('tex_bolt');
    window.playSfx?.('shoot');
  }

  throwBoomerang(pointer){
    if (this._boomerangCd && this._boomerangCd > this.time.now) return;
    this._boomerangCd = this.time.now + 360;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const sx = this.player.x, sy = this.player.y - 4;
    let target = this.findNearestHostile(wp.x, wp.y, 7 * TILE) || this.findNearestHostile(sx, sy, 14 * TILE);
    const fallbackDx = wp.x - sx, fallbackDy = wp.y - sy;
    const fallbackDist = Math.hypot(fallbackDx, fallbackDy) || 1;
    const startTx = target?.x ?? (sx + fallbackDx / fallbackDist * 8 * TILE);
    const startTy = target?.y ?? (sy + fallbackDy / fallbackDist * 8 * TILE);
    const b = this.bullets.create(sx, sy, 'tex_boomerang');
    b.setDepth(7);
    b.setData('isBoomerang', true);
    b.setData('noBlockDamage', true);
    b.body.setAllowGravity(false);
    b.body.setSize(22, 14).setOffset(3, 2);
    window.playSfx?.('shoot');

    const speed = 560;
    const lifeEnd = this.time.now + 2100;
    const scene = this;
    const origPreUpdate = Phaser.Physics.Arcade.Sprite.prototype.preUpdate;
    const steer = (tx, ty)=>{
      const dx = tx - b.x, dy = ty - b.y;
      const dist = Math.hypot(dx, dy) || 1;
      b.setVelocity(dx / dist * speed, dy / dist * speed);
    };
    steer(startTx, startTy);
    b.preUpdate = function(t, dt){
      origPreUpdate.call(this, t, dt);
      if (!this.active) return;
      this.rotation += (dt || 16) * 0.022;
      if (t > lifeEnd) { this.destroy(); return; }
      if (!target || !target.active || Math.hypot(target.x - this.x, target.y - this.y) > 10 * TILE) {
        target = scene.findNearestHostile(this.x, this.y, 8 * TILE);
      }
      if (target?.active) steer(target.x, target.y);
      else if (t > lifeEnd - 750) steer(scene.player.x, scene.player.y);
    };
    this.time.delayedCall(2200, ()=>{ if (b.active) b.destroy(); });
  }

  // --- Flamethrower ---
  tickFlame(pointer){
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const sx = this.player.x, sy = this.player.y;
    const dx = wp.x - sx, dy = wp.y - sy;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx/d, ny = dy/d;
    const L = 8 * TILE; // forward length
    const H = 3 * TILE; // thickness (height)
    // FX: flame blobs
    const blobs = 8;
    for (let i=1;i<=blobs;i++){
      const t = (i/blobs) * L;
      const jitter = (Math.random()-0.5) * (H*0.6);
      const px = -ny, py = nx;
      const x = sx + nx*t + px*jitter;
      const y = sy + ny*t + py*jitter;
      const img = this.add.image(x, y, 'tex_flame').setDepth(7);
      img.setScale(1 + Math.random()*0.3);
      img.setRotation(Math.atan2(ny, nx) + (Math.random()-0.5)*0.4);
      this.time.delayedCall(120, ()=> img.destroy());
    }
    // SFX (reuse)
    try { window.playSfx?.('minigun'); } catch(e){}
    // Damage enemies within oriented strip
    const alongHit = (e)=>{
      if (!e || !e.active) return;
      const ex=e.x - sx, ey=e.y - sy;
      const proj = ex*nx + ey*ny; // along
      const perp = Math.abs(ex*(-ny) + ey*(nx)); // distance to center line
      if (proj >= 0 && proj <= L && perp <= H*0.5) {
        if (!e._nextBurnAt || this.time.now >= e._nextBurnAt) {
          e._nextBurnAt = this.time.now + 160; // burn tick
          if (this.bosses && this.bosses.contains && this.bosses.contains(e)) this.damageBoss(e, 1);
          else {
            const exx=e.x, eyy=e.y; e.destroy();
            if (this.slimes && this.slimes.contains && this.slimes.contains(e)) this.dropCoins(exx, eyy, 3);
            if (this.oppos && this.oppos.contains && this.oppos.contains(e)) this.dropCoins(exx, eyy, 2);
            if (this.zombies && this.zombies.contains && this.zombies.contains(e)) this.dropCoins(exx, eyy, 2);
          }
        }
      }
    };
    this.slimes?.children?.iterate?.(alongHit);
    this.birds?.children?.iterate?.(alongHit);
    this.zombies?.children?.iterate?.(alongHit);
    this.oppos?.children?.iterate?.(alongHit);
    this.bosses?.children?.iterate?.(alongHit);
    // Burn blocks: trunk, leaves, cactus
    const step = TILE/2;
    for (let t=0; t<=L; t+=step){
      for (let off=-H/2; off<=H/2; off+=TILE){
        const px = -ny, py = nx;
        const x = sx + nx*t + px*off;
        const y = sy + ny*t + py*off;
        const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
        const key = `${tx},${ty}`;
        const spr = this.blocks.get(key);
        if (!spr) continue;
        const type = spr.getData('type');
  if (type==='trunk' || type==='tammi' || type==='koivu' || type==='leaves' || type==='cactus'){
          if (type==='trunk' || type==='tammi' || type==='koivu') this.dropWood(spr.x, spr.y);
          this.markBlockDestroyedInDiff(tx, ty, type);
          spr.destroy(); this.blocks.delete(key); if (type==='cactus') this.cactusTiles.delete(key);
        }
      }
    }
  }

  // Spawn a bullet from (sx,sy) to (tx,ty). opts: { speed, lifeTiles, spread, projectileKey, ignoreCannonKey }
  spawnBulletFrom(sx, sy, tx, ty, opts={}){
    // Mild aim assist (skips for enemy projectiles)
    if (!opts.fromEnemy && opts.aimAssist !== false) {
      const r = 72; let best=null, bestD2=r*r;
      const consider = (grp)=> grp?.children?.iterate?.(e=>{ if(!e||!e.active) return; const dx=e.x-tx, dy=e.y-ty; const d2=dx*dx+dy*dy; if(d2<bestD2){bestD2=d2; best=e;} });
      consider(this.enemySoldiers); consider(this.zombies); consider(this.slimes); consider(this.oppos); consider(this.birds); consider(this.wolves); consider(this.bosses);
      if (best) { tx = best.x; ty = best.y; }
    }
    const dirX = tx - sx, dirY = ty - sy;
    const dist = Math.hypot(dirX, dirY) || 1;
    let nx = dirX / dist, ny = dirY / dist;
    if (opts.spread && opts.spread > 0) {
      const base = Math.atan2(ny, nx);
      const jitter = (Math.random()*2 - 1) * opts.spread;
      const a = base + jitter;
      nx = Math.cos(a); ny = Math.sin(a);
    }
  // Custom thrown knives keep their knife texture in every game mode.
  let projKey = opts.projectileKey || 'tex_bullet';
  if (!opts.projectileKey && this.mode.current === 'galactic') projKey = 'tex_laser';
  if (!opts.projectileKey && this.mode.current === 'web') projKey = 'tex_web';
  const b = this.bullets.create(sx, sy, projKey);
  if (this.mode.current === 'web') b.setData('isWeb', true);
  if (opts.isMinigun) b.setData('isMinigun', true);
    const speed = opts.speed || 600;
    b.setVelocity(nx*speed, ny*speed);
    b.setRotation(Math.atan2(ny, nx));
  if (opts.ignoreCannonKey) b.setData('ignoreCannonKey', opts.ignoreCannonKey);
  if (opts.fromEnemy) b.setData('fromEnemy', true);
  if (opts.noBlockDamage) b.setData('noBlockDamage', true);
    const lifeMs = ((opts.lifeTiles || 8) * TILE / speed) * 1000;
    this.time.delayedCall(lifeMs, ()=>{ if (b.active) b.destroy(); });
    // Also guard against cannon removal via tile-scan hook if present
    b._lastCheck = 0;
    const scene = this;
    const origPreUpdate = Phaser.Physics.Arcade.Sprite.prototype.preUpdate;
    b.preUpdate = function(t, dt){
      origPreUpdate.call(this, t, dt);
      this._lastCheck += dt; if (this._lastCheck < 30) return; this._lastCheck = 0;
      const tx = Math.floor(this.x / TILE), ty = Math.floor(this.y / TILE);
      const key = `${tx},${ty}`;
      if (scene.cannonTiles.has(key) && this.getData('ignoreCannonKey') !== key) {
        scene.removeCannonAt(tx, ty);
        this.destroy();
        scene.saveState();
      }
    };
    return b;
  }

  onBulletHit(bullet, block) {
    // If rocket: explode and don't damage blocks
    if (bullet?.getData && bullet.getData('isRocket')) {
      const isCopper = !!bullet.getData('copper');
      this.explodeAt(bullet.x, bullet.y, { copper: isCopper });
      try { bullet.destroy(); } catch(e) {}
      return;
    }
  // Bullets flagged noBlockDamage (e.g., car turrets) simply disappear on hit
    if (bullet?.getData && bullet.getData('noBlockDamage')) { try { bullet.destroy(); } catch(e) {} return; }
    const tx = Math.floor(block.x / TILE);
    const ty = Math.floor(block.y / TILE);
    const key = `${tx},${ty}`;
    const type = block.getData('type');
  if (this.isStoneBlockType(type) && this.getBlockHardness(type) > 1) {
    const bulletPower = bullet?.getData?.('isMinigun') ? 1 : 2;
    const damage = (this.blockDamage.get(key) || 0) + bulletPower;
    if (damage < this.getBlockHardness(type)) {
      this.blockDamage.set(key, damage);
      bullet.destroy();
      return;
    }
    this.blockDamage.delete(key);
  }
  if (type === 'trunk' || type==='tammi' || type==='koivu') this.dropWood(block.x, block.y);
    else if (type === 'ground') { if (Math.random() < 0.30) this.dropCoin(block.x, block.y); }
    else if (this.isStoneBlockType(type)) { if (Math.random() < 0.85) this.dropStone(block.x, block.y); }
    // Update persistence
    this.markBlockDestroyedInDiff(tx, ty, type);
  block.destroy();
  this.blocks.delete(key);
  this.recordAdventureEvent('mine');
  if (type === 'cactus') this.cactusTiles.delete(key);
    // If there is water above this tile, let it flow down
    this.tryFlowWaterFrom(tx, ty-1);
    bullet.destroy();
    this.saveState();
  }

  cycleMode(){
    const order = ['classic','galactic','web','wizard'];
    const i = order.indexOf(this.mode.current);
    this.mode.current = order[(i+1)%order.length];
    this.showToast(`Tila: ${this.mode.current==='classic'?'Klassinen': this.mode.current==='galactic'?'Star': this.mode.current==='web'?'Spider':'Wizard'}`);
    this.updateUI();
    this.saveState();
  }

  // Remove a cannon at specific tile, if exists
  removeCannonAt(tx, ty){
    const key = `${tx},${ty}`;
    // remove from tiles set and positions
    this.cannonTiles.delete(key);
    this.cannonPositions = this.cannonPositions.filter(p=> !(p.tx===tx && p.ty===ty));
    // destroy entity
    const idx = this.cannons.findIndex(c=> c.tx===tx && c.ty===ty);
    if (idx>=0){
      const c = this.cannons[idx];
      c.base?.destroy(); c.barrel?.destroy(); c.zone?.destroy();
      this.cannons.splice(idx,1);
    }
  }

  tryFlowWaterFrom(tx, ty){
    // Only proceed if there is water at (tx,ty)
    const srcKey = `${tx},${ty}`;
    const src = this.waterTiles.get(srcKey);
    if (!src) return;
    let cy = ty;
    // Flow down until a solid block is found or bottom of world
    while (cy+1 < WORLD_TILES_Y && !this.hasSolidBlockAt(tx, cy+1)) {
      // place water below if not already
      const belowKey = `${tx},${cy+1}`;
      if (!this.waterTiles.has(belowKey)) this.addWater(tx, cy+1);
      cy++;
    }
  }

  onEnterWater(player, water) {
    this.inWater = true;
  }

  isPlayerInWater(){
    if (!this.player) return false;
    const points = [
      { x: this.player.x, y: this.player.y },
      { x: this.player.x, y: this.player.y + 12 },
      { x: this.player.x - 8, y: this.player.y + 8 },
      { x: this.player.x + 8, y: this.player.y + 8 }
    ];
    return points.some((p)=> this.waterTiles.has(`${Math.floor(p.x / TILE)},${Math.floor(p.y / TILE)}`));
  }

  updateDrowning(){
    if (!this.oxygen) this.oxygen = { value: 100, max: 100, nextDamageAt: 0 };
    const dt = Math.min(0.08, (this.game?.loop?.delta || 16) / 1000);
    if (this.inWater) {
      this.oxygen.value = Math.max(0, this.oxygen.value - dt * 12.5);
      if (this.oxygen.value <= 0 && this.time.now >= (this.oxygen.nextDamageAt || 0)) {
        this.oxygen.nextDamageAt = this.time.now + 900;
        this.showToast?.('Hukut!');
        this.damage(1, { ignoreShield: true, reason: 'drown' });
      }
    } else {
      this.oxygen.value = Math.min(this.oxygen.max, this.oxygen.value + dt * 35);
      if (this.oxygen.value >= this.oxygen.max) this.oxygen.nextDamageAt = 0;
    }
    this.updateOxygenUI();
  }

  updateHotBlockDamage(){
    if (!this.player || !this.blocks) return;
    if (this.time.now < (this.building?.hotHurtAt || 0)) return;
    const body = this.player.body;
    const points = [
      { x: this.player.x, y: body?.bottom ?? (this.player.y + 18) },
      { x: this.player.x - 8, y: this.player.y + 10 },
      { x: this.player.x + 8, y: this.player.y + 10 }
    ];
    const touchingHot = points.some((p) => {
      const spr = this.blocks.get(`${Math.floor(p.x / TILE)},${Math.floor(p.y / TILE)}`);
      return spr?.getData?.('type') === 'hotstone';
    });
    if (!touchingHot) return;
    if (!this.building) this.building = { block: 'plank', hotHurtAt: 0 };
    this.building.hotHurtAt = this.time.now + 900;
    this.showToast?.('Kuuma blokki polttaa!');
    this.damage(1, { reason: 'hotblock' });
  }

  updateOxygenUI(){
    const el = document.getElementById('oxygen');
    if (!el) return;
    const show = this.inWater || (this.oxygen?.value ?? 100) < 100;
    el.classList.toggle('hidden', !show);
    el.textContent = `Happi: ${Math.ceil(this.oxygen?.value ?? 100)}%`;
  }

  dropCoin(x,y){
    const coin = this.physics.add.sprite(x, y-10, 'tex_coin');
    coin.setVelocity(Phaser.Math.Between(-80,80), -220); coin.setBounce(0.4); coin.setCollideWorldBounds(true);
    this.physics.add.collider(coin, this.platforms);
  this.physics.add.overlap(this.player, coin, ()=>{ coin.destroy(); this.state.coins++; this.updateUI(); this.saveState(); window.playSfx?.('coin'); }, null, this);
    // Track in current chunk if generating
    if (this.currentChunk!=null) this.chunks.get(this.currentChunk)?.pickups.push(coin);
  }

  // Spawn multiple coins with slight spread
  dropCoins(x, y, n=1){
    for (let i=0;i<n;i++){
      const jitterX = Phaser.Math.Between(-8, 8);
      const jitterY = Phaser.Math.Between(-4, 4);
      this.dropCoin(x + jitterX, y + jitterY);
    }
  }

  destroyEnemyWithCoinReward(enemy, normalCoins=0){
    if (!enemy || !enemy.active) return;
    this.defeatMob(enemy, normalCoins);
  }

  pickGiftBoxTier(rng = Math.random) {
    const roll = rng();
    if (roll < 0.03) return 'ultra';
    if (roll < 0.13) return 'mythical';
    if (roll < 0.34) return 'legendary';
    return 'rare';
  }

  spawnNatureGiftBox(cx, biome, rng = Math.random) {
    if (biome === 'ocean' || rng() > 0.45) return null;
    const startTx = cx * CHUNK_W;
    const tx = startTx + 2 + Math.floor(rng() * Math.max(1, CHUNK_W - 4));
    const ty = SURFACE_Y - 1;
    const key = `${tx},${ty}`;
    // Pidä sijainti deterministisenä, jotta avattu laatikko ei muutu uudeksi
    // laatikoksi, kun pelaaja käy samassa chunkissa myöhemmin uudelleen.
    if (this.giftBoxOpenings?.includes(key)) return null;
    if (this.hasSolidBlockAt(tx, ty) || !this.hasSolidBlockAt(tx, SURFACE_Y)) return null;
    return this.spawnGiftBoxAt(cx, tx, ty, this.pickGiftBoxTier(rng));
  }

  spawnGiftBoxAt(cx, tx, ty, tierId = 'rare') {
    const gift = GIFT_BOX_MAP[tierId] || GIFT_BOX_MAP.rare;
    const key = `${tx},${ty}`;
    if (this.giftBoxOpenings?.includes(key) || !this.pickups?.create) return null;
    const x = tx * TILE + TILE / 2;
    const y = ty * TILE + TILE / 2 - 2;
    const box = this.pickups.create(x, y, gift.texture);
    box.setDepth(7).setData('giftTier', gift.id).setData('giftKey', key);
    box.body.setAllowGravity(false);
    box._giftBaseY = y;
    box._giftLabel = this.add.text(x, y - 25, gift.name, {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff',
      stroke: '#111827', strokeThickness: 3
    }).setOrigin(0.5, 1).setDepth(22);
    box.once('destroy', () => box._giftLabel?.destroy());
    this.chunks.get(cx)?.pickups.push(box);
    return box;
  }

  updateGiftBoxes() {
    this.pickups?.children?.iterate?.((box) => {
      const tier = box?.getData?.('giftTier');
      if (!box?.active || !tier) return;
      const bob = Math.sin(this.time.now * 0.004 + box.x * 0.01) * 3;
      box.y = box._giftBaseY + bob;
      box._giftLabel?.setPosition(box.x, box.y - 25);
      box.setAngle(Math.sin(this.time.now * 0.003 + box.x * 0.01) * 3);
    });
  }

  openGiftBox(box) {
    if (!box?.active || box.getData('_opened')) return;
    const tier = GIFT_BOX_MAP[box.getData('giftTier')] || GIFT_BOX_MAP.rare;
    const key = box.getData('giftKey');
    box.setData('_opened', true);
    if (key && !this.giftBoxOpenings.includes(key)) this.giftBoxOpenings.push(key);

    const received = [];
    const pool = tier.weapons.slice();
    const count = Math.min(tier.weaponCount || 1, pool.length);
    const rewardIds = [];
    if (tier.guaranteedWeapon && pool.includes(tier.guaranteedWeapon) && count > 0) {
      rewardIds.push(tier.guaranteedWeapon);
      pool.splice(pool.indexOf(tier.guaranteedWeapon), 1);
    }
    while (rewardIds.length < count && pool.length) {
      const index = Math.floor(Math.random() * pool.length);
      rewardIds.push(pool.splice(index, 1)[0]);
    }
    rewardIds.forEach((weaponId) => {
      if (weaponId && this.tools?.owned) {
        this.tools.owned[weaponId] = true;
        received.push(BOOST_WEAPON_MAP[weaponId]?.name || weaponId);
      }
    });

    this.state.coins += tier.coins || 0;
    this.state.health = MAX_HEALTH;
    if (tier.armor && BOOST_ARMOR_MAP[tier.armor]) {
      this.boostArmor = tier.armor;
      this.updateBoostArmorVisual?.();
    }
    if (tier.id === 'mythical' || tier.id === 'ultra') this.state.canFly = true;
    if (tier.id === 'ultra') {
      this.state.bounceShoes = true;
      this.inv.wood += 30; this.inv.plank += 20; this.inv.stone += 20;
      this.droneShieldUntil = this.time.now + 8000;
    }

    const burst = this.add.graphics().setDepth(850);
    burst.lineStyle(tier.id === 'ultra' ? 8 : 4, tier.color, 0.95);
    burst.strokeCircle(box.x, box.y, tier.id === 'ultra' ? 44 : 28);
    this.tweens.add({ targets: burst, scale: 2, alpha: 0, duration: 520, onComplete: () => burst.destroy() });
    this.dropCoins(box.x, box.y, tier.id === 'ultra' ? 12 : tier.id === 'mythical' ? 6 : 3);
    box.destroy();
    this.showToast(`${tier.name}-LAHJABOXI! ${received.join(', ')} +${tier.coins} kolikkoa`);
    this.updateToolSelect?.();
    this.updateBoostArmorSelect?.();
    this.updateUI();
    this.saveState();
    window.playSfx?.(tier.id === 'ultra' ? 'laser' : 'pickup');
  }

  spawnPickup(x, y, tex){
    const p = this.pickups.create(x, y - 10, tex);
    p.body.setAllowGravity(false);
    // track if during chunk gen
    if (this.currentChunk!=null) this.chunks.get(this.currentChunk)?.pickups.push(p);
  }

  dropWood(x,y){
    const w = this.items.create(x, y-6, 'tex_woodItem');
    w.setData('item','wood');
    w.setVelocity(Phaser.Math.Between(-60,60), -200); w.setBounce(0.3); w.setCollideWorldBounds(true);
    this.physics.add.collider(w, this.platforms);
  }

  dropStone(x,y){
    const s = this.items.create(x, y-6, 'tex_stoneItem');
    s.setData('item','stone');
    s.setVelocity(Phaser.Math.Between(-60,60), -200); s.setBounce(0.3); s.setCollideWorldBounds(true);
    this.physics.add.collider(s, this.platforms);
  }
  dropMeat(x,y){
    const m = this.items.create(x, y-6, 'tex_meat');
    m.setData('item','meat');
    m.setVelocity(Phaser.Math.Between(-60,60), -220); m.setBounce(0.25); m.setCollideWorldBounds(true);
    this.physics.add.collider(m, this.platforms);
  }

  onItemPickup(player, item){
    if (!item || !item.active) return;
    if (item.getData('_picked')) return; // re-entrancy guard
    // mark and disable immediately to avoid repeated overlaps in the same step
    try {
      item.setData('_picked', true);
      if (item.body) {
        item.body.enable = false;
        item.body.checkCollision.none = true;
        item.body.stop?.();
        item.body.setVelocity?.(0,0);
      }
      item.setVisible(false);
    } catch(e) {}
    const type = item.getData('item');
    if (type === 'wood' || type === 'stone') {
      if (type === 'wood') this.recordAdventureEvent('wood');
      if (!this.addToBackpack(type, 1)) {
        // fallback to main inv if backpack full
        if (type === 'wood') this.inv.wood++; else this.inv.stone++;
      }
  this.updateInventoryUI(); this.updateBackpackUI(); this.saveState();
    } else if (type === 'meat') {
      this.food.meat += 1;
      this.showToast('Liha +1');
      this.updateInventoryUI(); this.saveState();
    }
    // safe destroy after this tick
    this.time.delayedCall(0, ()=>{ try { item.destroy(); } catch(e) {} });
  }

  // Backpack helpers
  addToBackpack(item, qty){
    // Try to stack into existing slot
    for (let i=0;i<this.backpack.length;i++){
      const s = this.backpack[i];
      if (s && s.item === item) { s.qty += qty; return true; }
    }
    // Find empty slot
    for (let i=0;i<this.backpack.length;i++){
      if (!this.backpack[i]) { this.backpack[i] = { item, qty }; return true; }
    }
    return false;
  }
  dumpBackpackToInventory(){
    for (let i=0;i<this.backpack.length;i++){
      const s = this.backpack[i]; if (!s) continue;
      if (s.item === 'wood') this.inv.wood += s.qty;
      else if (s.item === 'stone') this.inv.stone += s.qty;
      // extendable for other items later
      this.backpack[i] = null;
    }
    this.updateInventoryUI(); this.updateBackpackUI(); this.saveState();
  }
  toggleBackpack(){
    const panel = document.getElementById('backpackPanel');
    if (!panel) return;
    const hidden = panel.classList.toggle('hidden');
    if (!hidden) this.updateBackpackUI();
  }
  updateBackpackUI(){
    const slots = document.querySelectorAll('#backpackPanel .bp-slot');
    if (!slots?.length) return;
    slots.forEach((el, i)=>{
      const s = this.backpack[i];
      const nameEl = el.querySelector('.bp-name');
      const countEl = el.querySelector('.bp-count');
      if (s) { nameEl.textContent = s.item; countEl.textContent = `×${s.qty}`; }
      else { nameEl.textContent = 'Tyhjä'; countEl.textContent = ''; }
    });
  }

  onPickup(player, gem) {
  if (gem.getData?.('giftTier')) {
    this.openGiftBox(gem);
    return;
  }
  if (gem.texture.key === 'tex_red') {
  this.state.canFly = true;
  this.showToast('LENTO AVATTU! Pidä Ylös/Space lentääksesi');
  window.playSfx?.('pickup');
    } else if (gem.texture.key === 'tex_boots') {
      this.state.bounceShoes = true;
      this.showToast('Pomppukengät saatu! Korkeampi hyppy käytössä');
      window.playSfx?.('pickup');
    } else {
  this.state.coins += 1;
  window.playSfx?.('coin');
    }
    this.updateUI(); this.saveState();
    gem.destroy();
  }

  updateUI(){
    const healthEl=document.getElementById('health'); const coinsEl=document.getElementById('coins');
    if (healthEl) healthEl.textContent = `Elämät: ${this.state.health}/${MAX_HEALTH}`;
    if (coinsEl) coinsEl.textContent = `Kolikot: ${this.state.coins}`;
    this.updateInventoryUI();
    this.updateAdventureUI?.();
    if (this.battleEls?.radarBtn) this.updateBattleUI();
  }

  updateInventoryUI(){
    const slots = document.querySelectorAll('#inventory .slot');
    if (!slots?.length) return;
    slots[0].textContent = `Puu: ${this.inv.wood}`;
    slots[1].textContent = `Lankku: ${this.inv.plank}`;
    slots[2].textContent = `Kivi: ${this.inv.stone}`;
    slots[3].textContent = `Kolikot: ${this.state.coins}`;
    slots[4].textContent = this.state.canFly ? 'Lento ✓' : '';
      // Show hunger in slot 4 suffix
      const hv = Math.max(0, Math.min(this.hunger.value|0, this.hunger.max));
      slots[4].textContent += (slots[4].textContent? ' | ' : '') + `Nälkä: ${hv}/${this.hunger.max} (Liha: ${this.food.meat})`;
    // Show equipped tool
  const toolNames = { hand:'Käsi', wooden:'Puuhakku', stone:'Kivihakku', iron:'Rautahakku', pistol:'Pistooli', bow:'Jousipyssy', crossbow:'Varsijousi', boomerang:'Bumerangi', cannon:'Tykki', minigun:'Minigun', dakkerssit:'Dakkerssit', caran_bitti:'Caran Bitti', ak47:'AK-47', knife:'Puukko', sniper:'Tarkka-ase', rifle:'Kivääri', bazooka:'Bazooka', tnt:'TNT', mop:'Moppi – kaikki voimat (5 s)', roller_skates:'Rullaluistimet – 9 palikan superhyppy', grenade:'Kranaatti', nuke:'Ydinase', plane:'Lentokone', hook:'Koukku', cloner:'Kloonaaja', teleport:'Teleportti', slimecloner:'Limaklooni', soldiercloner:'Sotilasklooni', torch:'Soihtu', campfire:'Nuotio', wizard:'Velho', flame:'Tulenheitin', pamppu:'Pamppu', mine:'Miina', rod:'Ukonjohdatin', fishingrod:'Onki', tower:'Ampumatorni', lamp:'Lamppu', sofa:'Sohva', table:'Pöytä',
    pistol_copper:'Pistooli (Kupari)', bow_copper:'Jousipyssy (Kupari)', crossbow_copper:'Varsijousi (Kupari)', minigun_copper:'Minigun (Kupari)', ak47_copper:'AK-47 (Kupari)', knife_copper:'Puukko (Kupari)', sniper_copper:'Tarkka-ase (Kupari)', bazooka_copper:'Bazooka (Kupari)', grenade_copper:'Kranaatti (Kupari)', nuke_copper:'Ydinase (Kupari)', pamppu_copper:'Pamppu (Kupari)', plane_copper:'Lentokone (Kupari)'
  };
  Object.assign(toolNames, Object.fromEntries(BOOST_WEAPON_SPECS.map((spec) => [spec.id, spec.powerName ? `${spec.name} · ${spec.powerName}` : spec.name])));
  Object.assign(toolNames, Object.fromEntries(NORMAL_WEAPON_SPECS.map((spec) => [spec.id, spec.name])));
  toolNames.trident = 'Atrain (Ristiaalokko)';
  Object.assign(toolNames, Object.fromEntries(WORKSTATION_DEFS.map((station) => [station.id, station.label])));
  const eq = this.tools.equipped;
  let suffix = '';
  if (eq === 'cannon') suffix = ` (${this.tools.cannonMode==='minigun'?'Minigun':'Tarkka'})`;
  if (eq === 'pamppu') suffix = ` (${this.pamppu.mode==='attack'?'Lyönti':'Suojaus'})`;
  const weaponBase = this.getWeaponBaseKey(eq);
  if (weaponBase) suffix += ` | Skini: ${WEAPON_SKIN_DEFS[this.getWeaponSkin(eq)]?.name || 'Klassinen'}`;
  const armor = this.getBoostArmorSpec?.();
  if (armor && armor.id !== 'none') suffix += ` | Boost-haarniska: ${armor.name}`;
  const modeLabel = this.mode?.current==='classic' ? 'Klassinen' : (this.mode.current==='galactic'?'Star': (this.mode.current==='web'?'Spider':'Wizard'));
  const buildLabel = this.getBuildBlockSpec?.().label || 'Lankku';
  slots[5].textContent = `Työkalu: ${toolNames[eq]}${suffix}  |  Blokki: ${buildLabel}  |  Tila: ${modeLabel}`;
  const powerDescription = document.getElementById('weaponPowerDescription');
  const powerSpec = BOOST_WEAPON_MAP[eq];
  if (powerDescription) powerDescription.textContent = powerSpec?.powerDescription
    ? `${powerSpec.powerName}: ${powerSpec.powerDescription}`
    : 'Tällä aseella ei ole erillistä erikoisvoimaa.';
  }

  setupBlockMenuUI(){
    const palette = document.getElementById('settingsBlockPalette');
    if (!palette || palette.dataset.bound) return;
    const baseBlocks = [
      { id: 'plank', label: 'Lankku', color: 0x8b5a2b },
      { id: 'stone', label: 'Kivi', color: 0x888888 },
      { id: 'hotstone', label: 'Kuuma', color: 0xff5a22 }
    ];
    const allBlocks = [...baseBlocks, ...NEW_BUILD_BLOCK_DEFS, ...TRAP_BUILD_BLOCK_DEFS];
    palette.innerHTML = '';
    const heading = document.createElement('div');
    heading.className = 'block-palette-title';
    heading.textContent = `PLOKIT · ${NEW_BUILD_BLOCK_DEFS.length} uutta + ${TRAP_BUILD_BLOCK_DEFS.length} ansaa`;
    palette.appendChild(heading);
    const filterRow = document.createElement('div');
    filterRow.className = 'block-filter-row';
    palette.appendChild(filterRow);
    const renderBlocks = (filter = 'all') => {
      palette.querySelectorAll('.block-choice').forEach((button) => button.remove());
      const visibleBlocks = filter === 'stairs'
        ? allBlocks.filter((block) => block.pattern === 'stair' || block.pattern === 'stair-corner')
        : filter === 'traps'
          ? allBlocks.filter((block) => block.pattern === 'trap')
          : allBlocks;
      visibleBlocks.forEach((block) => {
        const button = document.createElement('div');
        button.className = 'block-choice';
        button.dataset.block = block.id;
        button.setAttribute('role', 'button');
        button.title = `${block.label} — vaihda valinta R-näppäimellä`;
        const swatch = document.createElement('span');
        swatch.className = 'block-swatch';
        swatch.style.backgroundColor = `#${Number(block.color).toString(16).padStart(6, '0')}`;
        const name = document.createElement('span');
        name.className = 'block-name';
        name.textContent = block.label;
        button.append(swatch, name);
        button.addEventListener('click', () => {
          this.building.block = block.id;
          this.updateBlockPaletteUI();
          this.updateInventoryUI();
          this.showToast(`Rakennusblokki: ${block.label}`);
          this.saveState();
        });
        palette.appendChild(button);
      });
      this.updateBlockPaletteUI();
    };
    ['all', 'stairs', 'traps'].forEach((filter) => {
      const filterButton = document.createElement('button');
      filterButton.type = 'button';
      filterButton.className = `block-filter ${filter === 'all' ? 'active' : ''}`;
      filterButton.textContent = filter === 'all' ? 'Kaikki blokit' : filter === 'stairs' ? 'Portaat (6)' : 'Ansat (65)';
      filterButton.addEventListener('click', () => {
        filterRow.querySelectorAll('.block-filter').forEach((button) => button.classList.remove('active'));
        filterButton.classList.add('active');
        renderBlocks(filter);
      });
      filterRow.appendChild(filterButton);
    });
    renderBlocks('all');
    palette.dataset.bound = '1';
    this.updateBlockPaletteUI();
  }

  updateBlockPaletteUI(){
    const palette = document.getElementById('settingsBlockPalette');
    if (!palette) return;
    const current = this.building?.block || 'plank';
    palette.querySelectorAll('.block-choice').forEach((button) => {
      button.classList.toggle('selected', button.dataset.block === current);
    });
  }

  setupBattleUI(){
    if (this.battleEls.radarBtn) return;
    this.battleEls = {
      radarBtn: document.getElementById('battleRadarBtn'),
      radarStatus: document.getElementById('battleRadarStatus'),
      radarAnimals: document.getElementById('battleRadarAnimals'),
      overlay: document.getElementById('battleArena'),
      close: document.getElementById('battleClose'),
      wave: document.getElementById('battleWave'),
      record: document.getElementById('battleRecord'),
      collectionCount: document.getElementById('battleCollectionCount'),
      teamChips: document.getElementById('battleTeamChips'),
      collectionGrid: document.getElementById('battleCollectionGrid'),
      enemies: document.getElementById('battleEnemies'),
      allies: document.getElementById('battleAllies'),
      log: document.getElementById('battleLog'),
      start: document.getElementById('battleStart'),
      attack: document.getElementById('battleAttack'),
      skill: document.getElementById('battleSkill'),
      heal: document.getElementById('battleHeal')
    };
    this.battleEls.radarBtn?.addEventListener('click', ()=> this.openBattleArena());
    this.battleEls.close?.addEventListener('click', ()=> this.closeBattleArena());
    this.battleEls.start?.addEventListener('click', ()=> this.startBalloonBattle());
    this.battleEls.attack?.addEventListener('click', ()=> this.performBattleAction('attack'));
    this.battleEls.skill?.addEventListener('click', ()=> this.performBattleAction('skill'));
    this.battleEls.heal?.addEventListener('click', ()=> this.performBattleAction('heal'));
  }

  updateBattleUI(){
    if (!this.battleEls.radarBtn) return;
    const collected = this.getCollectedBattleAnimalCount();
    if (this.battleEls.radarStatus) {
      this.battleEls.radarStatus.textContent = this.battle.inFight
        ? `Taistelu käynnissä, aalto ${this.battle.wave}`
        : `Aalto ${this.battle.wave} odottaa`;
    }
    if (this.battleEls.radarAnimals) this.battleEls.radarAnimals.textContent = `Taistelueläimet ${collected}/30`;
    if (this.battleEls.wave) this.battleEls.wave.textContent = `Aalto ${this.battle.wave}`;
    if (this.battleEls.record) this.battleEls.record.textContent = `Voitot ${this.battle.wins} | Tappiot ${this.battle.losses}`;
    if (this.battleEls.collectionCount) this.battleEls.collectionCount.textContent = `Kerätty ${collected}/30`;
    this.renderBattleCollection();
    this.renderBattleArena();
  }

  openBattleArena(){
    if (!this.started || this.isPaused || !this.battleEls.overlay) return;
    this.battle.arenaOpen = true;
    this.isPaused = true;
    this.physics.world.isPaused = true;
    document.getElementById('pauseScreen')?.classList.add('hidden');
    this.battleEls.overlay.classList.remove('hidden');
    this.updateBattleUI();
  }

  closeBattleArena(){
    if (!this.battle.arenaOpen || !this.battleEls.overlay) return;
    if (this.battle.inFight && this.getAliveBattleUnits(this.battle.allies).length && this.getAliveBattleUnits(this.battle.enemies).length) {
      this.battle.losses += 1;
      this.battle.inFight = false;
      this.addBattleLog('Vetäydyit taistelusta. Ilmapallosotilaat juhlivat tätä erää.');
    }
    this.battle.arenaOpen = false;
    this.battleEls.overlay.classList.add('hidden');
    this.physics.world.isPaused = false;
    this.isPaused = false;
    this.updateBattleUI();
    this.saveState();
  }

  renderBattleCollection(){
    const chips = this.battleEls.teamChips;
    const grid = this.battleEls.collectionGrid;
    if (!chips || !grid) return;
    chips.innerHTML = '';
    if (!this.battle.team.length) {
      const empty = document.createElement('span');
      empty.className = 'battle-team-chip empty';
      empty.textContent = 'Valitse taistelijoita ilman ylärajaa';
      chips.appendChild(empty);
    } else {
      const seen = {};
      this.battle.team.forEach((id)=>{
        const spec = BATTLE_ANIMAL_MAP[id];
        if (!spec) return;
        seen[id] = (seen[id] || 0) + 1;
        const chip = document.createElement('button');
        chip.className = `battle-team-chip${this.battle.selectedAnimalId === id ? ' active' : ''}`;
        chip.textContent = this.getBattleTeamCopies(id) > 1 ? `${spec.name} ${seen[id]}` : spec.name;
        chip.addEventListener('click', ()=>{
          this.battle.selectedAnimalId = id;
          this.renderBattleCollection();
          this.renderBattleArena();
        });
        chips.appendChild(chip);
      });
    }

    grid.innerHTML = '';
    BATTLE_ANIMAL_SPECS.forEach((spec)=>{
      const count = this.getBattleAnimalCopies(spec.id);
      const inTeam = this.getBattleTeamCopies(spec.id);
      const card = document.createElement('button');
      const selected = inTeam > 0;
      card.className = `battle-collection-card${count ? '' : ' locked'}${selected ? ' selected' : ''}`;
      card.disabled = !count;
      const avatar = document.createElement('div');
      avatar.className = 'battle-avatar';
      avatar.style.setProperty('--battle-primary', toCssHex(spec.colors.primary));
      avatar.style.setProperty('--battle-secondary', toCssHex(spec.colors.secondary));
      const title = document.createElement('div');
      title.className = 'battle-card-title';
      title.textContent = count ? spec.name : 'Tuntematon';
      const meta = document.createElement('div');
      meta.className = 'battle-card-meta';
      meta.textContent = count ? `HP ${spec.hp} | ATK ${spec.attack}` : 'Kerää maailmasta';
      const copy = document.createElement('div');
      copy.className = 'battle-card-count';
      copy.textContent = count ? `Omistat ${count} | Joukkueessa ${inTeam}` : 'Ei vielä joukkueessa';
      card.appendChild(avatar);
      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(copy);
      if (count) card.addEventListener('click', ()=> this.toggleBattleTeamAnimal(spec.id));
      grid.appendChild(card);
    });
  }

  createBalloonEnemy(index){
    const archetype = BALLOON_SOLDIER_ARCHETYPES[index % BALLOON_SOLDIER_ARCHETYPES.length];
    const waveBoost = (this.battle.wave - 1) * 4;
    return {
      id: `${archetype.id}-${index}`,
      type: archetype.id,
      name: `${archetype.name} ${index + 1}`,
      maxHp: archetype.hp + waveBoost,
      hp: archetype.hp + waveBoost,
      attack: archetype.attack + Math.floor((this.battle.wave - 1) / 2),
      shield: 0,
      poison: 0,
      stun: 0,
      buffUsed: false
    };
  }

  startBalloonBattle(){
    if (!this.battle.team.length) { this.addBattleLog('Valitse ensin ainakin yksi taistelueläin.'); this.renderBattleArena(); return; }
    const seen = {};
    this.battle.allies = this.battle.team.map((id)=>{
      seen[id] = (seen[id] || 0) + 1;
      return this.getBattleAnimalCombatStats(id, seen[id]);
    }).filter(Boolean);
    if (!this.battle.allies.length) { this.addBattleLog('Sinulla ei ole vielä taistelukelpoisia eläimiä.'); this.renderBattleArena(); return; }
    const enemyCount = Math.min(4, 2 + Math.floor((this.battle.wave - 1) / 2));
    this.battle.enemies = Array.from({ length: enemyCount }, (_, index)=> this.createBalloonEnemy(index));
    this.battle.selectedAnimalId = this.battle.allies[0]?.id || null;
    this.battle.selectedTargetId = this.battle.enemies[0]?.id || null;
    this.battle.inFight = true;
    this.battle.rewardCoins = 0;
    this.battle.log = [`Aalto ${this.battle.wave} alkaa. Ilmapallosotilaat hyökkäävät oikeasti.`];
    this.saveState();
    this.updateBattleUI();
    this.renderBattleArena();
  }

  applyBattleDamage(target, amount){
    const incoming = Math.max(1, Math.floor(amount));
    const absorbed = Math.min(target.shield || 0, incoming);
    target.shield = Math.max(0, (target.shield || 0) - absorbed);
    const dealt = incoming - absorbed;
    target.hp = Math.max(0, target.hp - dealt);
    return { dealt, absorbed };
  }

  healBattleUnit(unit, amount){
    const before = unit.hp;
    unit.hp = Math.min(unit.maxHp, unit.hp + Math.max(1, Math.floor(amount)));
    return unit.hp - before;
  }

  performBattleAction(kind){
    if (!this.battle.inFight) {
      this.addBattleLog('Paina Aloita taistelu käynnistääksesi taistelun.');
      this.renderBattleArena();
      return;
    }
    this.ensureBattleSelection();
    const actor = this.battle.allies.find((unit)=> unit.id === this.battle.selectedAnimalId && unit.hp > 0);
    const target = this.battle.enemies.find((unit)=> unit.id === this.battle.selectedTargetId && unit.hp > 0);
    if (!actor || !target) {
      this.addBattleLog('Valitse elossa oleva taistelueläin ja kohde.');
      this.renderBattleArena();
      return;
    }

    if (kind === 'attack') {
      const baseDamage = actor.fixedBattleDamage || (actor.attack + Phaser.Math.Between(1, 4));
      const result = this.applyBattleDamage(target, baseDamage);
      this.addBattleLog(`${actor.name} iski ${target.name}: ${result.dealt} vahinkoa.`);
    } else if (kind === 'heal') {
      const healed = this.healBattleUnit(actor, 7 + Math.floor(actor.attack / 2));
      this.addBattleLog(`${actor.name} keräsi voimia ja paransi ${healed} elinvoimaa.`);
    } else if (kind === 'skill') {
      if (actor.skillUsed) {
        this.addBattleLog(`${actor.name} on jo käyttänyt erikoistaitonsa tässä taistelussa.`);
        this.renderBattleArena();
        return;
      }
      actor.skillUsed = true;
      switch (actor.ability) {
        case 'focus': {
          const result = this.applyBattleDamage(target, actor.attack + 8);
          this.addBattleLog(`${actor.name} käytti tarkkuusiskun: ${result.dealt} vahinkoa.`);
          break;
        }
        case 'pack': {
          const result = this.applyBattleDamage(target, actor.attack + 5);
          const other = this.getAliveBattleUnits(this.battle.enemies).find((unit)=> unit.id !== target.id);
          this.addBattleLog(`${actor.name} hyökkäsi lauman voimalla: ${result.dealt} vahinkoa.`);
          if (other) {
            const splash = this.applyBattleDamage(other, Math.max(3, actor.attack - 1));
            this.addBattleLog(`${other.name} sai sivuiskusta ${splash.dealt} vahinkoa.`);
          }
          break;
        }
        case 'guard':
        case 'shell': {
          actor.shield += 8;
          this.addBattleLog(`${actor.name} nosti suojan (+8 kilpi).`);
          break;
        }
        case 'charge':
        case 'crush': {
          const result = this.applyBattleDamage(target, actor.attack + 6);
          this.addBattleLog(`${actor.name} ryntäsi läpi: ${result.dealt} vahinkoa.`);
          break;
        }
        case 'heal':
        case 'endure': {
          const weakest = this.getAliveBattleUnits(this.battle.allies).sort((a,b)=> (a.hp / a.maxHp) - (b.hp / b.maxHp))[0] || actor;
          const healed = this.healBattleUnit(weakest, 10 + Math.floor(actor.attack / 2));
          this.addBattleLog(`${actor.name} vahvisti ${weakest.name}: +${healed} HP.`);
          break;
        }
        case 'poison': {
          const result = this.applyBattleDamage(target, actor.attack + 2);
          target.poison = Math.max(target.poison || 0, 3);
          this.addBattleLog(`${actor.name} myrkytti ${target.name}: ${result.dealt} vahinkoa + myrkky.`);
          break;
        }
        case 'freeze': {
          const result = this.applyBattleDamage(target, actor.attack + 3);
          target.stun = 1;
          this.addBattleLog(`${actor.name} tainnutti ${target.name}: ${result.dealt} vahinkoa.`);
          break;
        }
        case 'frenzy': {
          const first = this.applyBattleDamage(target, actor.attack + 4);
          this.addBattleLog(`${actor.name} repi ${target.name}: ${first.dealt} vahinkoa.`);
          if (target.hp > 0) {
            const second = this.applyBattleDamage(target, actor.attack + 2);
            this.addBattleLog(`${actor.name} jatkoi hurjistuneena: ${second.dealt} vahinkoa.`);
          }
          break;
        }
        case 'death': {
          const result = this.applyBattleDamage(target, actor.fixedBattleDamage || 100);
          this.addBattleLog(`${actor.name} teki kuolemaniskun: ${result.dealt} vahinkoa.`);
          break;
        }
        case 'splash': {
          this.getAliveBattleUnits(this.battle.enemies).forEach((enemy)=>{
            const result = this.applyBattleDamage(enemy, Math.max(3, actor.attack - 1));
            this.addBattleLog(`${actor.name} osui alueiskulla ${enemy.name}: ${result.dealt} vahinkoa.`);
          });
          break;
        }
        default: {
          const result = this.applyBattleDamage(target, actor.attack + 4);
          this.addBattleLog(`${actor.name} käytti erikoisiskun: ${result.dealt} vahinkoa.`);
        }
      }
    }

    if (this.resolveBattleState()) return;
    this.applyBattleStatusTicks(this.battle.enemies, 'Vihollinen');
    if (this.resolveBattleState()) return;
    this.processEnemyTurn();
    if (this.resolveBattleState()) return;
    this.applyBattleStatusTicks(this.battle.allies, 'Joukkue');
    this.resolveBattleState();
  }

  applyBattleStatusTicks(group, label){
    this.getAliveBattleUnits(group).forEach((unit)=>{
      if (unit.poison > 0) {
        unit.poison -= 1;
        const result = this.applyBattleDamage(unit, 3);
        this.addBattleLog(`${label}: ${unit.name} kärsi myrkystä ${result.dealt} vahinkoa.`);
      }
    });
  }

  processEnemyTurn(){
    const enemies = this.getAliveBattleUnits(this.battle.enemies);
    const allies = this.getAliveBattleUnits(this.battle.allies);
    for (const enemy of enemies) {
      if (!allies.length) break;
      if (enemy.stun > 0) {
        enemy.stun -= 1;
        this.addBattleLog(`${enemy.name} menetti vuoronsa tainnutuksen takia.`);
        continue;
      }
      if (enemy.type === 'captain' && !enemy.buffUsed && enemies.length > 1) {
        enemy.buffUsed = true;
        enemies.forEach((unit)=>{ if (unit.hp > 0) unit.shield += 2; });
        this.addBattleLog(`${enemy.name} jakoi käskyn: ilmapallosotilaat saivat +2 kilven.`);
        continue;
      }
      if (enemy.type === 'bomber') {
        this.getAliveBattleUnits(this.battle.allies).forEach((ally)=>{
          const result = this.applyBattleDamage(ally, Math.max(3, enemy.attack - 2));
          this.addBattleLog(`${enemy.name} pudotti pommin ${ally.name}n päälle: ${result.dealt} vahinkoa.`);
        });
      } else {
        const targets = this.getAliveBattleUnits(this.battle.allies);
        const target = targets[Math.floor(Math.random() * targets.length)];
        if (!target) continue;
        const result = this.applyBattleDamage(target, enemy.attack + Phaser.Math.Between(0, 3));
        this.addBattleLog(`${enemy.name} hyökkäsi ${target.name}n kimppuun: ${result.dealt} vahinkoa.`);
      }
      if (this.resolveBattleState(true)) return;
    }
  }

  resolveBattleState(skipRender = false){
    const aliveEnemies = this.getAliveBattleUnits(this.battle.enemies);
    const aliveAllies = this.getAliveBattleUnits(this.battle.allies);
    let finished = false;
    if (!aliveEnemies.length && this.battle.inFight) {
      const reward = 6 + this.battle.wave * 3;
      this.battle.rewardCoins = reward;
      this.battle.wins += 1;
      this.battle.wave += 1;
      this.battle.inFight = false;
      this.state.coins += reward;
      this.addBattleLog(`Voitto! Sait ${reward} kolikkoa ja seuraava aalto valmistautuu.`);
      this.showToast(`Voitto ilmapallosotilaista! +${reward} kolikkoa`);
      finished = true;
    } else if (!aliveAllies.length && this.battle.inFight) {
      this.battle.losses += 1;
      this.battle.inFight = false;
      this.addBattleLog('Taistelueläimet kaatuivat. Ilmapallosotilaat voittivat tämän aallon.');
      this.showToast('Taistelulava hävittiin');
      finished = true;
    }
    this.ensureBattleSelection();
    if (!skipRender) {
      this.renderBattleArena();
      this.updateBattleUI();
      this.updateUI();
      this.saveState();
    }
    return finished;
  }

  createBattleCard(unit, side){
    const button = document.createElement('button');
    const isEnemy = side === 'enemy';
    const selected = isEnemy ? this.battle.selectedTargetId === unit.id : this.battle.selectedAnimalId === unit.id;
    button.className = `battle-card${selected ? ' selected' : ''}${unit.hp <= 0 ? ' ko' : ''}`;
    button.disabled = unit.hp <= 0;
    const avatar = document.createElement('div');
    avatar.className = `battle-avatar${isEnemy ? ` balloon ${unit.type}` : ''}`;
    if (!isEnemy) {
      avatar.style.setProperty('--battle-primary', unit.primary);
      avatar.style.setProperty('--battle-secondary', unit.secondary);
    }
    const title = document.createElement('div');
    title.className = 'battle-card-title';
    title.textContent = unit.name;
    const subtitle = document.createElement('div');
    subtitle.className = 'battle-card-subtitle';
    const abilityNames = { death: 'Kuolemanisku' };
    subtitle.textContent = isEnemy ? 'Ilmapallosotilas' : `Taito: ${abilityNames[unit.ability] || unit.ability}`;
    const bar = document.createElement('div');
    bar.className = 'battle-bar';
    const fill = document.createElement('span');
    fill.style.width = `${Math.max(0, (unit.hp / unit.maxHp) * 100)}%`;
    bar.appendChild(fill);
    const meta = document.createElement('div');
    meta.className = 'battle-card-meta';
    meta.textContent = `HP ${unit.hp}/${unit.maxHp} | ATK ${unit.attack}${unit.shield ? ` | Kilpi ${unit.shield}` : ''}`;
    button.appendChild(avatar);
    button.appendChild(title);
    button.appendChild(subtitle);
    button.appendChild(bar);
    button.appendChild(meta);
    button.addEventListener('click', ()=>{
      if (isEnemy) this.battle.selectedTargetId = unit.id;
      else this.battle.selectedAnimalId = unit.id;
      this.renderBattleArena();
      this.renderBattleCollection();
    });
    return button;
  }

  renderBattleArena(){
    const enemiesEl = this.battleEls.enemies;
    const alliesEl = this.battleEls.allies;
    const logEl = this.battleEls.log;
    if (!enemiesEl || !alliesEl || !logEl) return;
    enemiesEl.innerHTML = '';
    alliesEl.innerHTML = '';
    if (!this.battle.enemies.length) {
      const emptyEnemy = document.createElement('div');
      emptyEnemy.className = 'battle-log-entry';
      emptyEnemy.textContent = 'Ilmapallosotilaat odottavat haastetta kulmapaneelissa.';
      enemiesEl.appendChild(emptyEnemy);
    } else {
      this.battle.enemies.forEach((enemy)=> enemiesEl.appendChild(this.createBattleCard(enemy, 'enemy')));
    }
    if (!this.battle.allies.length) {
      const emptyAlly = document.createElement('div');
      emptyAlly.className = 'battle-log-entry';
      emptyAlly.textContent = 'Valitse kerätyistä eläimistä joukkue vasemmalta.';
      alliesEl.appendChild(emptyAlly);
    } else {
      this.battle.allies.forEach((ally)=> alliesEl.appendChild(this.createBattleCard(ally, 'ally')));
    }
    logEl.innerHTML = '';
    this.battle.log.forEach((entry)=>{
      const row = document.createElement('div');
      row.className = 'battle-log-entry';
      row.textContent = entry;
      logEl.appendChild(row);
    });
    if (this.battleEls.start) this.battleEls.start.disabled = this.battle.inFight || !this.battle.team.length;
    if (this.battleEls.attack) this.battleEls.attack.disabled = !this.battle.inFight;
    if (this.battleEls.skill) this.battleEls.skill.disabled = !this.battle.inFight;
    if (this.battleEls.heal) this.battleEls.heal.disabled = !this.battle.inFight;
  }

  showToast(msg){
    if (!this.add || !this.cameras?.main) return;
    const x = this.cameras.main.scrollX + 10;
    const y = this.cameras.main.scrollY + 64;
    const t = this.add.text(x, y, msg, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#fff',
      backgroundColor: '#0009'
    }).setDepth(1000);
    this.time.delayedCall(1200, ()=> t.destroy());
  }

  getWeaponBaseKey(tool = this.tools?.equipped) {
    const base = String(tool || '').replace(/_copper$/, '');
    return WEAPON_SKIN_BASES.has(base) ? base : null;
  }

  isWeaponSkinAvailable(base, skin){
    const def = WEAPON_SKIN_DEFS[skin];
    return !!def && (!def.weapons || def.weapons.includes(base));
  }

  getWeaponSkin(tool = this.tools?.equipped) {
    const base = this.getWeaponBaseKey(tool);
    return base && this.isWeaponSkinAvailable(base, this.weaponSkins?.[base]) ? this.weaponSkins[base] : 'classic';
  }

  setWeaponSkin(skin) {
    const base = this.getWeaponBaseKey();
    if (!base || !this.isWeaponSkinAvailable(base, skin)) return;
    this.weaponSkins[base] = skin;
    this.updateWeaponSprite();
    this.updateWeaponSkinSelect();
    this.updateInventoryUI();
    this.saveState();
    this.showToast(`${base}: ${WEAPON_SKIN_DEFS[skin].name}`);
  }

  getWeaponSkinTexture(base, fallback){
    const skin = WEAPON_SKIN_DEFS[this.getWeaponSkin(base)];
    return skin?.textureByWeapon?.[base] || fallback;
  }

  updateWeaponSprite(){
    if (!this.weaponSprite) return;
    const eq = this.tools?.equipped;
    const baseEq = String(eq || '').replace(/_copper$/, '');
    const map = {
      pistol:'tex_weapon_pistol', minigun:'tex_weapon_minigun', sniper:'tex_weapon_sniper',
      rifle:'tex_weapon_rifle', bazooka:'tex_weapon_bazooka', knife:'tex_weapon_knife',
      spear:'tex_weapon_spear', trident:'tex_weapon_trident', tnt:'tex_tnt', grenade:'tex_grenade', nuke:'tex_nuke', wizard:'tex_weapon_wand',
      pamppu:'tex_weapon_baton', mop:'tex_weapon_mop', roller_skates:'tex_weapon_roller_skates', ak47:'tex_weapon_ak47', dakkerssit:'tex_weapon_dakkerssit',
      caran_bitti:'tex_weapon_caran_bitti', flame:'tex_weapon_flamer', bow:'tex_weapon_bow',
      crossbow:'tex_weapon_crossbow', boomerang:'tex_weapon_boomerang', cannon:'tex_cannon_base',
      ...Object.fromEntries(BOOST_WEAPON_SPECS.map((spec) => [spec.id, spec.texture])),
      ...Object.fromEntries(NORMAL_WEAPON_SPECS.map((spec) => [spec.id, spec.texture]))
    };
    const key = map[baseEq] || null;
    if (!key) {
      this.weaponSprite.setVisible(false);
      return;
    }
    if (baseEq === 'roller_skates') {
      this.weaponSprite.setVisible(false);
      return;
    }

    const skinId = this.getWeaponSkin(eq);
    const skinDef = WEAPON_SKIN_DEFS[skinId];
    const skinTexture = skinDef?.textureByWeapon?.[baseEq] || key;
    this.weaponSprite.setTexture(skinTexture).setVisible(true);
    const longWeapons = new Set(['tex_weapon_sniper','tex_weapon_bazooka']);
    const midWeapons = new Set(['tex_weapon_minigun','tex_weapon_ak47','tex_weapon_dakkerssit','tex_weapon_caran_bitti','tex_weapon_flamer']);
    if (baseEq === 'tnt' || baseEq === 'grenade' || baseEq === 'nuke') {
      this.weaponSprite.setOrigin(0.5, 0.5).setScale(0.9);
    } else if (longWeapons.has(key)) {
      this.weaponSprite.setOrigin(0.1, 0.55).setScale(1);
    } else if (midWeapons.has(key) || baseEq === 'dakkerssit') {
      this.weaponSprite.setOrigin(0.18, 0.55).setScale(1);
    } else if (baseEq === 'knife') {
      this.weaponSprite.setOrigin(0.25, 0.55).setScale(0.9);
    } else if (baseEq === 'pamppu' || baseEq === 'mop' || baseEq === 'roller_skates' || baseEq === 'wizard') {
      this.weaponSprite.setOrigin(0.15, 0.55).setScale(1);
    } else if (baseEq === 'bow') {
      this.weaponSprite.setOrigin(0.2, 0.55).setScale(1);
    } else if (baseEq === 'crossbow') {
      this.weaponSprite.setOrigin(0.15, 0.6).setScale(1);
    } else if (baseEq === 'boomerang') {
      this.weaponSprite.setOrigin(0.35, 0.55).setScale(0.9);
    } else if (baseEq === 'cannon') {
      this.weaponSprite.setOrigin(0.3, 0.5).setScale(0.8);
    } else if (baseEq === 'trident') {
      this.weaponSprite.setOrigin(0.08, 0.5).setScale(1);
    } else if (NORMAL_WEAPON_MAP[baseEq]) {
      this.weaponSprite.setOrigin(0.12, 0.55).setScale(1);
    } else if (BOOST_WEAPON_MAP[baseEq]) {
      this.weaponSprite.setOrigin(0.12, 0.55).setScale(1.05);
    } else {
      this.weaponSprite.setOrigin(0.2, 0.55).setScale(1);
    }

    const skin = skinDef;
    if (skin?.tint) this.weaponSprite.setTint(skin.tint);
    else if (/_copper$/.test(eq)) this.weaponSprite.setTint(0xffb25a);
    else this.weaponSprite.clearTint();
  }

  updateToolSelect(){
    const select = document.getElementById('toolSelect');
    if (!select) return;
    const search = document.getElementById('weaponSearch');
    select.innerHTML = '';
  const toolNames = { hand:'Käsi', wooden:'Puuhakku', stone:'Kivihakku', iron:'Rautahakku', pistol:'Pistooli', bow:'Jousipyssy', crossbow:'Varsijousi', boomerang:'Bumerangi', cannon:'Tykki', minigun:'Minigun', dakkerssit:'Dakkerssit', caran_bitti:'Caran Bitti', ak47:'AK-47', knife:'Puukko', spear:'Keihäs', sniper:'Tarkka-ase', rifle:'Kivääri', bazooka:'Bazooka', tnt:'TNT', mop:'Moppi – kaikki voimat (5 s)', roller_skates:'Rullaluistimet – 9 palikan superhyppy', grenade:'Kranaatti', nuke:'Ydinase', plane:'Lentokone', hook:'Koukku', cloner:'Kloonaaja', teleport:'Teleportti', slimecloner:'Limaklooni', soldiercloner:'Sotilasklooni', torch:'Soihtu', campfire:'Nuotio', wizard:'Velho', flame:'Tulenheitin', pamppu:'Pamppu', mine:'Miina', rod:'Ukonjohdatin', fishingrod:'Onki', tower:'Ampumatorni', trap:'Ansat + trampoliini', lamp:'Lamppu', sofa:'Sohva', table:'Pöytä',
  pistol_copper:'Pistooli (Kupari)', bow_copper:'Jousipyssy (Kupari)', crossbow_copper:'Varsijousi (Kupari)', minigun_copper:'Minigun (Kupari)', ak47_copper:'AK-47 (Kupari)', knife_copper:'Puukko (Kupari)', sniper_copper:'Tarkka-ase (Kupari)', bazooka_copper:'Bazooka (Kupari)', grenade_copper:'Kranaatti (Kupari)', nuke_copper:'Ydinase (Kupari)', pamppu_copper:'Pamppu (Kupari)', plane_copper:'Lentokone (Kupari)'
  };
  Object.assign(toolNames, Object.fromEntries(BOOST_WEAPON_SPECS.map((spec) => [spec.id, spec.powerName ? `${spec.name} · ${spec.powerName}` : spec.name])));
  Object.assign(toolNames, Object.fromEntries(NORMAL_WEAPON_SPECS.map((spec) => [spec.id, spec.name])));
  toolNames.trident = 'Atrain (Ristiaalokko)';
  Object.assign(toolNames, Object.fromEntries(WORKSTATION_DEFS.map((station) => [station.id, station.label])));
    const query = (search?.value || '').trim().toLocaleLowerCase('fi-FI');
    for (const tool in this.tools.owned) {
      const label = toolNames[tool] || tool;
      const searchable = `${label} ${tool}`.toLocaleLowerCase('fi-FI');
      if (this.tools.owned[tool] && (!query || searchable.includes(query))) {
        const option = document.createElement('option');
        option.value = tool;
        option.textContent = label;
        option.title = BOOST_WEAPON_MAP[tool]?.powerDescription || '';
        select.appendChild(option);
      }
    }
    if (!select.options.length) {
      const empty = document.createElement('option');
      empty.textContent = 'Ei hakutuloksia';
      empty.disabled = true;
      select.appendChild(empty);
    } else if (this.tools.owned[this.tools.equipped] && (!query || (toolNames[this.tools.equipped] || this.tools.equipped).toLocaleLowerCase('fi-FI').includes(query) || this.tools.equipped.toLocaleLowerCase('fi-FI').includes(query))) {
      select.value = this.tools.equipped;
    }
    if (search && !search.dataset.bound) {
      search.addEventListener('input', () => this.updateToolSelect());
      search.dataset.bound = '1';
    }
    if (!select.dataset.bound) select.addEventListener('change', () => {
      this.tools.equipped = select.value;
      this.updateInventoryUI();
      this.updateWeaponSprite?.();
      this.updateWeaponSkinSelect();
      this.saveState();
    });
    select.dataset.bound = '1';
    this.updateWeaponSkinSelect();
  }

  getBoostArmorSpec(){
    return BOOST_ARMOR_MAP[this.boostArmor] || BOOST_ARMOR_MAP.none;
  }

  getChameleonArmorColor(){
    const armor = this.getBoostArmorSpec();
    if (!armor.chameleon) return armor.trailColor || 0xffffff;
    if (this.inWater) return 0x43dfff;
    if (this.weather?.isStorm) return 0xffed62;
    if (this.day?.isNight) return 0x8b78ff;
    const colors = [0x75ff70, 0xff70be, 0x62eaff, 0xffe56b, 0xb27cff];
    const phase = Math.floor((this.time?.now || 0) / 620) + Math.floor((this.player?.x || 0) / 240);
    return colors[Math.abs(phase) % colors.length];
  }

  isPlayerCloaked(){
    return !!this.itemBag?.invis || (this.chameleonHiddenUntil || 0) > (this.time?.now || 0);
  }

  getBoostWeaponStats(spec){
    const armor = this.getBoostArmorSpec();
    return {
      ...spec,
      cooldown: Math.max(120, Math.round(spec.cooldown * armor.cooldownMultiplier)),
      boostX: Math.round(spec.boostX * armor.boostXMultiplier),
      boostY: Math.round(spec.boostY * armor.boostYMultiplier),
      projectileSpeed: Math.round(spec.projectileSpeed * armor.projectileSpeedMultiplier),
      trailColor: armor.chameleon ? this.getChameleonArmorColor() : (armor.trailColor || spec.trailColor),
      armorName: armor.name
    };
  }

  updateBoostArmorVisual(){
    if (!this.armorSprite) return;
    const armor = this.getBoostArmorSpec();
    if (!armor || armor.id === 'none') {
      this.armorSprite.setVisible(false);
      return;
    }
    this.armorSprite.setTexture(`tex_armor_${armor.id}`).setVisible(true).setAlpha(0.92);
    if (armor.chameleon) this.armorSprite.setTint(this.getChameleonArmorColor());
    else this.armorSprite.clearTint();
  }

  updateBoostArmorSelect(){
    const select = document.getElementById('boostArmorSelect');
    if (!select) return;
    if (!select.dataset.bound) {
      select.addEventListener('change', () => {
        if (!BOOST_ARMOR_MAP[select.value]) return;
        this.boostArmor = select.value;
        this.updateBoostArmorVisual();
        this.updateInventoryUI();
        this.saveState();
        this.showToast(`${this.getBoostArmorSpec().name}: ${this.getBoostArmorSpec().description}`);
      });
      select.dataset.bound = '1';
    }
    select.innerHTML = '';
    BOOST_ARMOR_SPECS.forEach((armor) => {
      const option = document.createElement('option');
      option.value = armor.id;
      option.textContent = armor.name;
      select.appendChild(option);
    });
    select.value = BOOST_ARMOR_MAP[this.boostArmor] ? this.boostArmor : 'none';
    const description = document.getElementById('boostArmorDescription');
    if (description) description.textContent = `${this.getBoostArmorSpec().description} Vaikuttaa vain boost-aseisiin.`;
  }

  updateWeaponSkinSelect(){
    const select = document.getElementById('weaponSkinSelect');
    if (!select) return;
    const base = this.getWeaponBaseKey();
    select.innerHTML = '';
    Object.entries(WEAPON_SKIN_DEFS).forEach(([id, skin]) => {
      if (!base && id !== 'classic') return;
      if (base && !this.isWeaponSkinAvailable(base, id)) return;
      const option = document.createElement('option');
      option.value = id;
      option.textContent = skin.name;
      select.appendChild(option);
    });
    if (!select.dataset.bound) {
      select.addEventListener('change', () => this.setWeaponSkin(select.value));
      select.dataset.bound = '1';
    }
    const isWeapon = !!base;
    select.disabled = !isWeapon;
    select.title = isWeapon ? 'Valitse käytössä olevan aseen skini' : 'Valitse ase nähdäksesi skinit';
    select.value = this.getWeaponSkin();
  }

  // --- World building helpers ---
  keyFromTile(tx, ty) { return `${tx},${ty}`; }

  isStoneBlockType(type) {
    return type === 'stone' || type === 'hotstone' || type === 'deepstone' || type === 'obsidian' || type === 'bedrock';
  }

  getUndergroundRock(depth, fallbackTexture='tex_stone', fallbackType='stone') {
    if (depth > 52) return { textureKey: 'tex_bedrock', type: 'bedrock' };
    if (depth > 36) return { textureKey: 'tex_obsidian', type: 'obsidian' };
    if (depth > 18) return { textureKey: 'tex_deep_stone', type: 'deepstone' };
    return { textureKey: fallbackTexture, type: fallbackType };
  }

  getBlockHardness(type) {
    return ({ stone: 1, hotstone: 1, deepstone: 3, obsidian: 7, bedrock: 12 })[type] || 1;
  }

  getPickaxeRank() {
    return ({ wooden: 1, stone: 2, iron: 3 })[this.tools.equipped] || 0;
  }

  // Portaat asetetaan käsin asetusten rakennuspaletista. Niitä ei luoda
  // maailmaan automaattisesti. Porraspalikka on visuaalisesti yksi tiili,
  // mutta sen käveltävä pinta lasketaan neljänä pienenä askelmana.
  isStairBlockType(type) {
    return /^custom_stair(?:_corner)?_(?:right|left|down_right|down_left)$/.test(String(type || ''));
  }

  getStairStepHeights(type) {
    const id = String(type || '').replace(/^custom_/, '');
    const risesToRight = (id.endsWith('_right') && !id.endsWith('down_right'))
      || id.endsWith('down_left');
    return risesToRight ? [1, 2, 3, 4] : [4, 3, 2, 1];
  }

  getStairSurfaceAtWorldX(worldX) {
    if (!Number.isFinite(worldX) || !this.blocks) return null;
    const tx = Math.floor(worldX / TILE);
    const localX = Phaser.Math.Clamp(worldX - tx * TILE, 0, TILE - 0.001);

    // A player can overlap the stair while standing just above or below the
    // tile, so inspect the nearby vertical rows instead of only player.y.
    const playerTy = Math.floor((this.player?.y || 0) / TILE);
    for (let ty = playerTy - 2; ty <= playerTy + 2; ty++) {
      const stair = this.blocks.get(this.keyFromTile(tx, ty));
      if (!stair || !this.isStairBlockType(stair.getData?.('type'))) continue;
      const stepWidth = TILE / 4;
      const stepIndex = Math.min(3, Math.floor(localX / stepWidth));
      const height = this.getStairStepHeights(stair.getData('type'))[stepIndex] * stepWidth;
      return {
        block: stair,
        tx,
        ty,
        topY: ty * TILE + TILE - height
      };
    }
    return null;
  }

  getPlayerStairSupport() {
    const body = this.player?.body;
    if (!body) return null;
    const samples = [body.left + 2, (body.left + body.right) / 2, body.right - 2];
    const supports = samples
      .map((x) => this.getStairSurfaceAtWorldX(x))
      .filter(Boolean);
    if (!supports.length) return null;
    const bottom = body.bottom;
    return supports.find((support) => Math.abs(bottom - support.topY) <= 9) || null;
  }

  resolvePlayerStairMovement() {
    const body = this.player?.body;
    if (!body || this.mountedSpecialAnimal || this.moped?.mounted || this.plane?.mounted || this.airship?.mounted) {
      this._stairGrounded = false;
      return false;
    }
    if (this.inWater || this.ninja?.striking) {
      this._stairGrounded = false;
      return false;
    }

    const currentSupport = this.getPlayerStairSupport();
    const movingX = body.velocity.x || 0;
    const frameSeconds = Math.max(1, this.game.loop.delta || 16.67) / 1000;
    const predictedX = this.player.x + movingX * frameSeconds;
    const predictedSupport = this.getStairSurfaceAtWorldX(predictedX);
    const support = predictedSupport || currentSupport;
    const fallingOrStanding = body.velocity.y >= -35;
    const wasOnStair = !!this._stairGrounded || !!currentSupport;

    // Only attach to a stair when the player is already on it or is falling
    // onto it. This keeps jumps through the stair opening working normally.
    if (!support || !fallingOrStanding || (!wasOnStair && body.bottom < support.topY - 8)) {
      this._stairGrounded = false;
      return false;
    }

    const bodyBottomOffset = body.bottom - this.player.y;
    const targetY = support.topY - bodyBottomOffset;
    const verticalDelta = targetY - this.player.y;
    if (Math.abs(verticalDelta) > TILE * 1.2) {
      this._stairGrounded = false;
      return false;
    }

    this.player.setY(targetY);
    this.player.setVelocityY(0);
    body.updateFromGameObject();
    this._stairGrounded = true;
    return true;
  }

  markBlockDestroyedInDiff(tx, ty, type) {
    const key = this.keyFromTile(tx, ty);
    const before = this.worldDiff.placed.length;
    this.worldDiff.placed = this.worldDiff.placed.filter(p=>!(p.tx===tx && p.ty===ty));
    const wasPlacedByPlayer = this.worldDiff.placed.length !== before;
    if (!wasPlacedByPlayer && type !== 'plank' && type !== 'hotstone' && !this.worldDiff.removed.includes(key)) {
      this.worldDiff.removed.push(key);
    }
  }

  addBlock(tx, ty, textureKey, type='ground', collides=true) {
    const x = tx * TILE + TILE/2;
    const y = ty * TILE + TILE/2;
    let sprite;
    const isStair = collides && this.isStairBlockType(type);
    if (isStair) {
      // Do not give the visual stair tile a full 40x40 collision body: that
      // would make every stair an impassable wall. The player movement loop
      // resolves the four walkable step surfaces instead.
      sprite = this.add.image(x, y, textureKey).setDepth(1);
      sprite.setData('type', type);
      const k = this.keyFromTile(tx, ty);
      this.blocks.set(k, sprite);
      if (this.currentChunk != null) this.chunks.get(this.currentChunk)?.blocks.add(k);
      return sprite;
    }
    if (collides) {
  // Auto-use surface variants (grass for ground, bright cap for snow) for tiles at the surface line
  let key = textureKey;
  if (ty === SURFACE_Y) {
    if (type === 'ground' && textureKey === 'tex_ground') key = 'tex_ground_grass';
    if (type === 'snow' && textureKey === 'tex_snow') key = 'tex_snow_top';
  }
      sprite = this.platforms.create(x, y, key);
      sprite.refreshBody();
      sprite.setData('type', type);
  const k = this.keyFromTile(tx, ty);
  this.blocks.set(k, sprite);
  if (type === 'cactus') this.cactusTiles.add(k);
      // Tiny per-tile tint variation to break repetition (±4%)
      const jitter = 0x08; // low jitter on each RGB channel
      const r = 0xf0 + Math.floor(Math.random()*jitter) - (jitter>>1);
      const g = 0xf0 + Math.floor(Math.random()*jitter) - (jitter>>1);
      const b = 0xf0 + Math.floor(Math.random()*jitter) - (jitter>>1);
      const tint = (Math.max(0,Math.min(255,r))<<16) | (Math.max(0,Math.min(255,g))<<8) | Math.max(0,Math.min(255,b));
      sprite.setTint(tint);
      if (this.currentChunk!=null) this.chunks.get(this.currentChunk)?.blocks.add(k);
    } else {
      sprite = this.add.image(x, y, textureKey);
      this.decor.add(sprite);
      if (this.currentChunk!=null) this.chunks.get(this.currentChunk)?.decor.push(sprite);
    }
    return sprite;
  }

  // Place a block by logical type, mapping to the right texture and collision; persists placement
  placeBlock(tx, ty, type) {
    // Map logical types to textures
    let t = type;
    if (t === 'wood') t = 'trunk'; // treat generic wood as regular trunk
    const texMap = {
      ground: 'tex_ground',
      stone: 'tex_stone',
      plank: 'tex_plank',
      hotstone: 'tex_hot_block',
      sand: 'tex_sand',
      cactus: 'tex_cactus',
      trunk: 'tex_trunk',
      tammi: 'tex_tammi',
      koivu: 'tex_koivu',
      snow: 'tex_snow',
      leaves: 'tex_leaves'
    };
    const textureKey = texMap[t] || 'tex_ground';
    // leaves are non-solid decor, others are solid by default
    const collides = (t !== 'leaves');
    // Avoid overwriting existing solids
    const key = `${tx},${ty}`;
    if (this.blocks.has(key) && collides) return null;
    const spr = this.addBlock(tx, ty, textureKey, t === 'plank' ? 'plank' : t, collides);
    // Persist placement for rebuild across loads
    // Use explicit textureKey so surface variants don't confuse diffs
    this.worldDiff.placed.push({ tx, ty, type: (t === 'plank' ? 'plank' : t), textureKey });
    this.worldDiff.removed = this.worldDiff.removed.filter(k => k !== key);
    this.recordAdventureEvent('build');
    return spr;
  }

  addWater(tx, ty) {
    const x = tx * TILE + TILE/2;
    const y = ty * TILE + TILE/2;
    const sprite = this.add.image(x, y, 'tex_water');
    this.waters.add(sprite);
    this.waterTiles.set(`${tx},${ty}`, sprite);
    if (this.currentChunk!=null) this.chunks.get(this.currentChunk)?.decor.push(sprite);
  }

  // Generated structures use the same tile map as the normal terrain. These
  // helpers keep their visuals and collision bodies in the chunk lifecycle.
  addChunkDecor(cx, object) {
    if (!object) return object;
    this.decor?.add?.(object);
    this.chunks.get(cx)?.decor.push(object);
    return object;
  }

  removeGeneratedBlockAt(tx, ty) {
    const key = this.keyFromTile(tx, ty);
    const block = this.blocks.get(key);
    if (block) {
      if (block.getData?.('type') === 'cactus') this.cactusTiles.delete(key);
      block.destroy();
      this.blocks.delete(key);
    }
    const water = this.waterTiles.get(key);
    if (water) {
      water.destroy();
      this.waterTiles.delete(key);
    }
  }

  addGeneratedBlockIfEmpty(tx, ty, textureKey, type='stone', collides=true) {
    if (tx < -1000000 || tx > 1000000 || ty < 1 || ty >= WORLD_TILES_Y) return null;
    if (collides && this.hasSolidBlockAt(tx, ty)) return null;
    const waterKey = this.keyFromTile(tx, ty);
    if (this.waterTiles.has(waterKey)) this.removeGeneratedBlockAt(tx, ty);
    return this.addBlock(tx, ty, textureKey, type, collides);
  }

  addGeneratedLabel(cx, text, tx, ty, color='#f5e6b3') {
    const label = this.add.text(tx*TILE + TILE/2, ty*TILE, text, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color,
      backgroundColor: '#111827dd',
      padding: { x: 7, y: 4 }
    }).setOrigin(0.5, 1).setDepth(8);
    return this.addChunkDecor(cx, label);
  }

  addGeneratedCrystal(cx, tx, ty, color, flip=false) {
    const x = tx*TILE + TILE/2;
    const y = ty*TILE + TILE;
    const crystal = this.add.graphics().setDepth(2);
    crystal.fillStyle(0x101827, 0.9);
    crystal.fillEllipse(x, y-4, 22, 8);
    crystal.fillStyle(color, 0.92);
    if (flip) crystal.fillTriangle(x-10, y-4, x+2, y-31, x+9, y-4);
    else crystal.fillTriangle(x-9, y-4, x-2, y-31, x+10, y-4);
    crystal.fillStyle(0xffffff, 0.7);
    crystal.fillTriangle(x-2, y-8, x-2, y-24, x+2, y-8);
    return this.addChunkDecor(cx, crystal);
  }

  addGeneratedTorch(cx, tx, ty, tint=null) {
    const torch = this.add.image(tx*TILE + TILE/2, ty*TILE + TILE/2, 'tex_torch').setDepth(4);
    if (tint) torch.setTint(tint);
    return this.addChunkDecor(cx, torch);
  }

  drawGeneratedCaveBackdrop(cx, left, top, width, height, color=0x080d18) {
    const bg = this.add.graphics().setDepth(-1);
    bg.fillStyle(color, 0.94);
    bg.fillRoundedRect(left*TILE, top*TILE, width*TILE, height*TILE, TILE*0.35);
    bg.lineStyle(4, 0x202b42, 0.9);
    bg.strokeRoundedRect(left*TILE, top*TILE, width*TILE, height*TILE, TILE*0.35);
    return this.addChunkDecor(cx, bg);
  }

  generateMountainFeature(cx, biome, rng) {
    const startTx = cx * CHUNK_W;
    const left = startTx + 5;
    const width = 22;
    const peakX = left + Math.floor(width * (0.38 + rng()*0.24));
    const peakHeight = 9 + Math.floor(rng()*6);
    for (let i=0; i<width; i++) {
      const tx = left + i;
      const distance = Math.abs(tx - peakX) / (width*0.52);
      const profile = Math.max(0, 1 - Math.pow(distance, 1.55));
      const height = Math.max(1, Math.floor(peakHeight*profile + rng()*2));
      const topTy = SURFACE_Y - height;
      for (let ty=SURFACE_Y-1; ty>=topTy; ty--) {
        if (ty < 2 || this.hasSolidBlockAt(tx, ty)) continue;
        const snowy = biome === 'snow' || (biome !== 'desert' && ty === topTy && rng() < 0.42);
        this.addBlock(tx, ty, snowy ? 'tex_snow' : 'tex_stone', snowy ? 'snow' : 'stone', true);
      }
    }
    // Small foothill rocks make the profile readable from a distance.
    for (let i=0; i<5; i++) {
      const tx = left + 1 + Math.floor(rng()*(width-2));
      const h = 1 + Math.floor(rng()*3);
      for (let ty=0; ty<h; ty++) {
        const y = SURFACE_Y-1-ty;
        if (!this.hasSolidBlockAt(tx, y)) this.addBlock(tx, y, 'tex_stone', 'stone', true);
      }
    }
    this.addGeneratedLabel(cx, 'VUORI', peakX, SURFACE_Y-peakHeight-1, biome === 'snow' ? '#dff6ff' : '#f5d08a');
  }

  generateCaveFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const width = 13 + Math.floor(rng()*5);
    const height = 8 + Math.floor(rng()*4);
    const left = startTx + 3 + Math.floor(rng() * Math.max(1, CHUNK_W-width-6));
    const top = SURFACE_Y + 4 + Math.floor(rng()*3);
    const bottom = Math.min(WORLD_TILES_Y-2, top + height);
    const entranceX = left + 2 + Math.floor(rng()*Math.max(1, width-4));

    // A real opening from the surface makes the cave reachable without teleporting.
    for (let ty=SURFACE_Y; ty>=top+1; ty--) {
      for (let tx=entranceX; tx<entranceX+2; tx++) this.removeGeneratedBlockAt(tx, ty);
    }
    for (let tx=left; tx<left+width; tx++) {
      for (let ty=top; ty<bottom; ty++) {
        const nx = (tx - (left + width/2)) / (width/2);
        const ny = (ty - (top + height/2)) / (height/2);
        if (nx*nx + ny*ny <= 1.08) this.removeGeneratedBlockAt(tx, ty);
      }
    }
    this.drawGeneratedCaveBackdrop(cx, left, top, width, height+1);
    this.addGeneratedTorch(cx, entranceX-1, top+1, 0xffc04d);
    this.addGeneratedTorch(cx, left+width-2, top+2, 0x66ccff);
    this.addGeneratedCrystal(cx, left+2, bottom-2, 0x67e8f9, false);
    this.addGeneratedCrystal(cx, left+width-3, top+3, 0xc084fc, true);
    this.addGeneratedCrystal(cx, left+Math.floor(width/2), bottom-2, 0x5eead4, false);
    this.addGeneratedLabel(cx, 'LUOLA', left+width/2, top-1, '#b8f7ff');

    // A few gems reward the player for finding the cave.
    for (let i=0; i<2; i++) {
      const tx = left + 3 + Math.floor(rng()*Math.max(1, width-6));
      const ty = top + 2 + Math.floor(rng()*Math.max(1, height-4));
      if (this.hasSolidBlockAt(tx, ty)) continue;
      const gem = this.pickups.create(tx*TILE + TILE/2, ty*TILE + TILE/2, i === 0 ? 'tex_diamond' : 'tex_red');
      gem.body.setAllowGravity(false);
      this.chunks.get(cx)?.pickups.push(gem);
    }
  }

  generateAbandonedMineFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const left = startTx + 2;
    const right = startTx + CHUNK_W - 3;
    const top = SURFACE_Y + 7;
    const floor = top + 5;
    const entranceX = left + 4 + Math.floor(rng()*4);

    // Dig a long, low corridor and a vertical access shaft.
    for (let tx=left; tx<=right; tx++) {
      for (let ty=top; ty<floor; ty++) this.removeGeneratedBlockAt(tx, ty);
    }
    for (let ty=SURFACE_Y; ty<=top+1; ty++) {
      for (let tx=entranceX; tx<entranceX+3; tx++) this.removeGeneratedBlockAt(tx, ty);
    }
    this.drawGeneratedCaveBackdrop(cx, left, top, right-left+1, floor-top+1, 0x17151a);

    // Timber supports are solid, so the abandoned shaft feels like a real tunnel.
    const placeSupport = (tx, ty) => {
      if (!this.hasSolidBlockAt(tx, ty)) this.addBlock(tx, ty, 'tex_plank', 'plank', true);
    };
    for (let tx=left; tx<=right; tx+=4) {
      for (let ty=top; ty<floor; ty++) {
        placeSupport(tx, ty);
        placeSupport(right === tx ? tx : tx+1, ty);
      }
      for (let tx2=Math.max(left, tx-1); tx2<=Math.min(right, tx+1); tx2++) {
        placeSupport(tx2, top);
      }
      if (tx+1 < right) this.addGeneratedTorch(cx, tx+1, top+1, 0xff9a4d);
    }

    // Rails and a little mine cart are visuals inside the walkable corridor.
    const rails = this.add.graphics().setDepth(3);
    const railY = floor*TILE - 9;
    rails.lineStyle(3, 0x8a8f99, 1);
    rails.lineBetween(left*TILE+4, railY-7, right*TILE+TILE-4, railY-7);
    rails.lineBetween(left*TILE+4, railY+7, right*TILE+TILE-4, railY+7);
    rails.lineStyle(2, 0x6d4c35, 1);
    for (let tx=left; tx<=right; tx+=2) rails.lineBetween(tx*TILE+4, railY-11, tx*TILE+TILE-4, railY+11);
    this.addChunkDecor(cx, rails);
    const cart = this.add.graphics().setDepth(4);
    const cartX = (left+right)*TILE/2;
    cart.fillStyle(0x5c6470, 1); cart.fillRoundedRect(cartX-22, railY-35, 44, 23, 4);
    cart.lineStyle(3, 0x252933, 1); cart.strokeRoundedRect(cartX-22, railY-35, 44, 23, 4);
    cart.fillStyle(0x252933, 1); cart.fillCircle(cartX-13, railY-8, 5); cart.fillCircle(cartX+13, railY-8, 5);
    this.addChunkDecor(cx, cart);
    this.addGeneratedLabel(cx, 'HYLÄTTY KAIVOS', (left+right)/2, top-1, '#ffd18a');
  }

  spawnDungeonZombieAt(cx, tx, floorTy, bounds=null) {
    if (!this.zombies?.create) return null;
    const x = tx*TILE + TILE/2;
    const y = floorTy*TILE - 42;
    const zombie = this.zombies.create(x, y, 'tex_zombie');
    zombie.body.setAllowGravity(true);
    zombie.setCollideWorldBounds(true);
    zombie.body.setSize(Math.floor(TILE*0.6), TILE*1.8).setOffset(2,2);
    zombie._hideoutZombie = true;
    zombie._hideoutChunk = cx;
    zombie._hideoutBounds = bounds;
    zombie._hideoutHomeX = x;
    this.physics.add.collider(zombie, this.platforms);
    this.chunks.get(cx)?.enemies.push(zombie);
    return zombie;
  }

  generateZombieHideoutFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const width = 18 + Math.floor(rng()*4);
    const left = startTx + 3 + Math.floor(rng()*Math.max(1, CHUNK_W-width-5));
    const top = SURFACE_Y + 11;
    const floor = top + 10;
    const entranceX = left + 2;

    // Rounded underground chamber with a narrow, dangerous entrance.
    for (let tx=left; tx<left+width; tx++) {
      for (let ty=top; ty<floor; ty++) {
        const edge = tx === left || tx === left+width-1 || ty === top || ty === floor-1;
        const nx = (tx - (left + width/2)) / (width/2);
        const ny = (ty - (top + (floor-top)/2)) / ((floor-top)/2);
        if (!edge && nx*nx + ny*ny <= 1.06) this.removeGeneratedBlockAt(tx, ty);
      }
    }
    for (let ty=SURFACE_Y; ty<=top+1; ty++) {
      for (let tx=entranceX; tx<entranceX+3; tx++) this.removeGeneratedBlockAt(tx, ty);
    }
    this.drawGeneratedCaveBackdrop(cx, left, top, width, floor-top+1, 0x120b19);

    // Red warning lamps and skull marks identify this as a zombie nest.
    for (const tx of [left+2, left+width-3]) this.addGeneratedTorch(cx, tx, top+2, 0xff3355);
    for (const tx of [left+4, left+Math.floor(width/2), left+width-5]) {
      const skull = this.add.image(tx*TILE+TILE/2, (top+3)*TILE, 'tex_decal_skull').setScale(2.2).setDepth(5);
      this.addChunkDecor(cx, skull);
    }
    this.addGeneratedLabel(cx, 'ZOMBIEN PESÄ', left+width/2, top-1, '#ff9ab3');

    const floorTy = floor-1;
    const roomBounds = { minX: (left+1)*TILE + TILE/2, maxX: (left+width-2)*TILE + TILE/2 };
    const zombieXs = [left+4, left+Math.floor(width/2), left+width-5];
    zombieXs.forEach((tx) => this.spawnDungeonZombieAt(cx, tx, floorTy, roomBounds));
    if (rng() < 0.7) this.spawnDungeonZombieAt(cx, left+7, floorTy, roomBounds);
    const loot = this.pickups.create((left+width/2)*TILE, (floorTy-2)*TILE, 'tex_red');
    loot.body.setAllowGravity(false);
    this.chunks.get(cx)?.pickups.push(loot);
  }

  generateSwampFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const left = startTx + 3;
    const right = startTx + CHUNK_W - 4;
    const waterY = SURFACE_Y - 1;
    const swamp = this.add.graphics().setDepth(1);
    swamp.fillStyle(0x183d3a, 0.28);
    swamp.fillRect(left*TILE, (SURFACE_Y-4)*TILE, (right-left+1)*TILE, TILE*4);
    swamp.lineStyle(2, 0x62b89b, 0.45);
    for (let i=0; i<8; i++) {
      const tx = left + 1 + Math.floor(rng()*(right-left-1));
      const x = tx*TILE + TILE/2;
      swamp.lineBetween(x-5, (waterY+1)*TILE, x, (waterY-1)*TILE);
      swamp.lineBetween(x+5, (waterY+1)*TILE, x+1, (waterY-1)*TILE);
    }
    this.addChunkDecor(cx, swamp);
    for (let tx=left; tx<=right; tx++) {
      if (tx % 3 !== 0 && rng() < 0.72) {
        const key = this.keyFromTile(tx, waterY);
        if (!this.waterTiles.has(key)) this.addWater(tx, waterY);
      }
    }
    // Reeds and a couple of crooked swamp trees.
    for (let i=0; i<4; i++) {
      const tx = left + 2 + Math.floor(rng()*Math.max(1, right-left-3));
      const reed = this.add.graphics().setDepth(4);
      const x = tx*TILE + TILE/2;
      reed.lineStyle(4, 0x3f8f54, 1);
      reed.lineBetween(x, SURFACE_Y*TILE, x-4, (SURFACE_Y-2-rng()*2)*TILE);
      reed.lineBetween(x+7, SURFACE_Y*TILE, x+11, (SURFACE_Y-1-rng()*2)*TILE);
      this.addChunkDecor(cx, reed);
    }
    this.addGeneratedLabel(cx, 'SUO', (left+right)/2, SURFACE_Y-4, '#a7f3d0');
    const gem = this.pickups.create((left+right)*TILE/2, (SURFACE_Y-3)*TILE, 'tex_diamond');
    gem.body.setAllowGravity(false);
    this.chunks.get(cx)?.pickups.push(gem);
  }

  generateTempleFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const left = startTx + 5;
    const right = startTx + CHUNK_W - 5;
    const floor = SURFACE_Y - 1;
    const roof = SURFACE_Y - 7;
    const door = Math.floor((left+right)/2);
    const columns = [left, left+3, right-3, right];
    columns.forEach((tx) => {
      for (let ty=floor; ty>=roof+1; ty--) this.addGeneratedBlockIfEmpty(tx, ty, 'tex_stone', 'stone', true);
    });
    for (let tx=left; tx<=right; tx++) {
      if (Math.abs(tx-door) > 2) this.addGeneratedBlockIfEmpty(tx, roof, 'tex_sandstone', 'stone', true);
    }
    for (let i=0; i<4; i++) {
      this.addGeneratedBlockIfEmpty(door-2-i, floor-i, 'tex_stone', 'stone', true);
      this.addGeneratedBlockIfEmpty(door+2+i, floor-i, 'tex_stone', 'stone', true);
    }
    this.addGeneratedTorch(cx, left+4, roof+2, 0xffd34e);
    this.addGeneratedTorch(cx, right-4, roof+2, 0xffd34e);
    const crest = this.add.graphics().setDepth(5);
    const cxp = door*TILE + TILE/2, cyp = (roof-1)*TILE;
    crest.fillStyle(0xffd34e, 0.95);
    crest.fillTriangle(cxp, cyp-20, cxp-13, cyp, cxp+13, cyp);
    crest.fillStyle(0xfff3a6, 0.8); crest.fillCircle(cxp, cyp-8, 4);
    this.addChunkDecor(cx, crest);
    this.addGeneratedLabel(cx, 'AAVIKKOTEMPPELI', door, roof-1, '#ffe7a3');
    const loot = this.pickups.create(cxp, (floor-2)*TILE, rng() < 0.35 ? 'tex_red' : 'tex_diamond');
    loot.body.setAllowGravity(false);
    this.chunks.get(cx)?.pickups.push(loot);
  }

  generateCrystalCavernFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const width = 19 + Math.floor(rng()*4);
    const height = 13;
    const left = startTx + 2 + Math.floor(rng()*Math.max(1, CHUNK_W-width-4));
    const top = SURFACE_Y + 5;
    const bottom = Math.min(WORLD_TILES_Y-2, top+height);
    const entranceX = left + 3;
    for (let ty=SURFACE_Y; ty>=top+1; ty--) {
      for (let tx=entranceX; tx<entranceX+2; tx++) this.removeGeneratedBlockAt(tx, ty);
    }
    for (let tx=left; tx<left+width; tx++) {
      for (let ty=top; ty<bottom; ty++) {
        const nx=(tx-(left+width/2))/(width/2);
        const ny=(ty-(top+height/2))/(height/2);
        if (nx*nx+ny*ny <= 1.06) this.removeGeneratedBlockAt(tx,ty);
      }
    }
    this.drawGeneratedCaveBackdrop(cx, left, top, width, height+1, 0x101329);
    const colors = [0x67e8f9, 0xc084fc, 0xf9a8d4, 0x5eead4, 0xffd34e, 0x93c5fd, 0xf0abfc];
    for (let i=0; i<7; i++) {
      const tx = left+2+Math.floor(rng()*Math.max(1,width-4));
      const ty = top+2+Math.floor(rng()*Math.max(1,height-4));
      if (!this.hasSolidBlockAt(tx,ty)) this.addGeneratedCrystal(cx,tx,ty,colors[i],i%2===1);
    }
    this.addGeneratedTorch(cx, entranceX-1, top+1, 0xc084fc);
    this.addGeneratedLabel(cx, 'KRISTALLILUOLA', left+width/2, top-1, '#e9d5ff');
    const loot = this.pickups.create((left+width/2)*TILE, (bottom-3)*TILE, 'tex_red');
    loot.body.setAllowGravity(false);
    this.chunks.get(cx)?.pickups.push(loot);
  }

  generateLavaForgeFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const left = startTx + 4;
    const width = 24;
    const top = SURFACE_Y + 7;
    const floor = top + 13;
    const entranceX = left + 2;
    for (let ty=SURFACE_Y; ty>=top+1; ty--) {
      for (let tx=entranceX; tx<entranceX+3; tx++) this.removeGeneratedBlockAt(tx,ty);
    }
    for (let tx=left; tx<left+width; tx++) {
      for (let ty=top; ty<floor-1; ty++) {
        const edge = tx===left || tx===left+width-1 || ty===top;
        if (!edge) this.removeGeneratedBlockAt(tx,ty);
      }
    }
    this.drawGeneratedCaveBackdrop(cx, left, top, width, floor-top, 0x210c0a);
    // Glowing lava channels are decorative; the stone floor remains walkable.
    const lava = this.add.graphics().setDepth(2);
    lava.fillStyle(0xff4d22, 0.86);
    lava.fillRect((left+3)*TILE, floor*TILE-10, 7*TILE, 9);
    lava.fillRect((left+14)*TILE, floor*TILE-10, 6*TILE, 9);
    lava.lineStyle(2, 0xffd34e, 0.9);
    lava.lineBetween((left+3)*TILE, floor*TILE-12, (left+10)*TILE, floor*TILE-12);
    lava.lineBetween((left+14)*TILE, floor*TILE-12, (left+20)*TILE, floor*TILE-12);
    this.addChunkDecor(cx, lava);
    for (const tx of [left+4,left+9,left+15,left+20]) {
      for (let ty=top+1; ty<top+4; ty++) this.addGeneratedBlockIfEmpty(tx,ty,'tex_hot_block','hotstone',true);
    }
    this.addGeneratedTorch(cx, left+width-3, top+2, 0xff5a36);
    this.addGeneratedLabel(cx, 'LAASESEPPÄ', left+width/2, top-1, '#ffb38a');
    const loot = this.pickups.create((left+width/2)*TILE, (floor-3)*TILE, rng()<0.5?'tex_red':'tex_diamond');
    loot.body.setAllowGravity(false);
    this.chunks.get(cx)?.pickups.push(loot);
  }

  generateSkyRuinsFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const islandY = SURFACE_Y - 6;
    const left = startTx + 8;
    const right = startTx + CHUNK_W - 4;
    const center = Math.floor((left+right)/2);
    // Stairway makes the floating ruin reachable with a normal jump.
    for (let i=0; i<6; i++) this.addGeneratedBlockIfEmpty(startTx+3+i, SURFACE_Y-1-i, 'tex_stone', 'stone', true);
    for (let tx=left; tx<=right; tx++) {
      const edge = Math.abs(tx-center) > 8;
      if (!edge || rng()<0.75) this.addGeneratedBlockIfEmpty(tx,islandY,'tex_stone','stone',true);
    }
    for (const tx of [left+2, left+5, right-3]) {
      for (let ty=islandY-1; ty>=islandY-4; ty--) this.addGeneratedBlockIfEmpty(tx,ty,'tex_stone','stone',true);
    }
    const cloud = this.add.graphics().setDepth(1);
    cloud.fillStyle(0xdbeafe,0.35);
    cloud.fillEllipse((left+5)*TILE, (islandY+2)*TILE, 220, 34);
    cloud.fillEllipse((right-3)*TILE, (islandY+2)*TILE, 170, 28);
    this.addChunkDecor(cx, cloud);
    const banner = this.add.graphics().setDepth(5);
    banner.lineStyle(3,0xffd34e,1); banner.lineBetween(center*TILE+TILE/2,(islandY-5)*TILE,center*TILE+TILE/2,(islandY-1)*TILE);
    banner.fillStyle(0xff63e6,0.9); banner.fillTriangle(center*TILE+TILE/2,(islandY-5)*TILE,center*TILE+TILE/2+28,(islandY-4)*TILE,center*TILE+TILE/2,(islandY-3)*TILE);
    this.addChunkDecor(cx,banner);
    this.addGeneratedLabel(cx, 'TAIVASRAUNIOT', center, islandY-5, '#dbeafe');
    const loot = this.pickups.create(center*TILE+TILE/2, (islandY-1)*TILE, 'tex_diamond');
    loot.body.setAllowGravity(false);
    this.chunks.get(cx)?.pickups.push(loot);
  }

  generateIcePalaceFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const left = startTx + 5;
    const right = startTx + CHUNK_W - 5;
    const floor = SURFACE_Y - 1;
    const roof = SURFACE_Y - 8;
    const door = Math.floor((left+right)/2);
    for (const tx of [left, left+4, right-4, right]) {
      for (let ty=floor; ty>=roof+1; ty--) this.addGeneratedBlockIfEmpty(tx,ty,'tex_snow','snow',true);
    }
    for (let tx=left; tx<=right; tx++) {
      if (Math.abs(tx-door)>2) this.addGeneratedBlockIfEmpty(tx,roof,'tex_snow','snow',true);
    }
    for (let i=0;i<4;i++) {
      this.addGeneratedBlockIfEmpty(door-2-i,floor-i,'tex_snow','snow',true);
      this.addGeneratedBlockIfEmpty(door+2+i,floor-i,'tex_snow','snow',true);
    }
    const windows = this.add.graphics().setDepth(5);
    windows.fillStyle(0x7dd3fc,0.95);
    for (const tx of [left+2,right-2]) windows.fillRect(tx*TILE+12,(roof+2)*TILE+10,16,25);
    windows.lineStyle(2,0xe0f2fe,0.9);
    windows.lineBetween((left+2)*TILE+20,(roof+2)*TILE+10,(left+2)*TILE+20,(roof+2)*TILE+35);
    windows.lineBetween((right-2)*TILE+20,(roof+2)*TILE+10,(right-2)*TILE+20,(roof+2)*TILE+35);
    this.addChunkDecor(cx,windows);
    this.spawnBossAt(door - 2, roof + 2, 'ice_titan');
    this.addGeneratedLabel(cx, 'JÄÄPALATSI', door, roof-1, '#e0f2fe');
    const loot = this.pickups.create(door*TILE+TILE/2,(floor-2)*TILE,rng()<0.4?'tex_red':'tex_diamond');
    loot.body.setAllowGravity(false);
    this.chunks.get(cx)?.pickups.push(loot);
  }

  generateBanditCampFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const left = startTx + 4;
    const right = startTx + CHUNK_W - 4;
    const baseY = SURFACE_Y - 1;
    const camp = this.add.graphics().setDepth(4);
    const tent = (x, color) => {
      camp.fillStyle(color,0.95);
      camp.fillTriangle(x*TILE, (baseY-1)*TILE, (x+4)*TILE, (baseY-6)*TILE, (x+8)*TILE, (baseY-1)*TILE);
      camp.fillStyle(0x171717,0.9);
      camp.fillTriangle((x+3)*TILE, (baseY-1)*TILE, (x+4)*TILE, (baseY-3)*TILE, (x+5)*TILE, (baseY-1)*TILE);
    };
    tent(left,0x8b5cf6); tent(right-8,0xef4444);
    camp.lineStyle(3,0xfacc15,0.9);
    camp.lineBetween((left+4)*TILE,(baseY-6)*TILE,(left+4)*TILE,(baseY-8)*TILE);
    camp.fillStyle(0xfacc15,0.95); camp.fillTriangle((left+4)*TILE,(baseY-8)*TILE,(left+6)*TILE,(baseY-7)*TILE,(left+4)*TILE,(baseY-6)*TILE);
    this.addChunkDecor(cx,camp);
    for (const tx of [left+1,left+10,right-2]) {
      this.addGeneratedBlockIfEmpty(tx,baseY,'tex_plank','plank',true);
      this.addGeneratedBlockIfEmpty(tx,baseY-1,'tex_plank','plank',true);
    }
    const fire = this.add.image((left+Math.floor((right-left)/2))*TILE+TILE/2, (baseY-1)*TILE+TILE/2, 'tex_campfire').setDepth(5);
    this.addChunkDecor(cx,fire);
    this.addGeneratedLabel(cx, 'ROSVOLEIRI', (left+right)/2, baseY-7, '#fef08a');
    const loot = this.pickups.create((left+right)*TILE/2,(baseY-3)*TILE,rng()<0.5?'tex_red':'tex_diamond');
    loot.body.setAllowGravity(false);
    this.chunks.get(cx)?.pickups.push(loot);
  }

  spawnRobberAt(cx, tx, floorTy, textureKey='tex_robber') {
    if (!this.enemySoldiers?.create) return null;
    const robber = this.enemySoldiers.create(tx*TILE + TILE/2, floorTy*TILE - 18, textureKey);
    robber.setDepth(5);
    robber.body.setSize(20, 34).setOffset(4, 2);
    robber.body.setAllowGravity(true);
    robber.setData('mode', 'ground');
    robber.setData('isRobber', true);
    robber._ai = { nextShotAt: 0, nextJumpAt: 0 };
    this.chunks.get(cx)?.enemies.push(robber);
    return robber;
  }

  generatePalaceFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const left = startTx + 3;
    const right = startTx + CHUNK_W - 3;
    const floor = SURFACE_Y - 1;
    const roof = SURFACE_Y - 10;
    const door = Math.floor((left + right) / 2);
    const towers = [left, left + 3, right - 3, right];
    for (const tx of towers) {
      for (let ty=floor; ty>=roof+1; ty--) this.addGeneratedBlockIfEmpty(tx, ty, 'tex_sandstone', 'stone', true);
    }
    for (let tx=left; tx<=right; tx++) {
      if (Math.abs(tx-door) > 2) this.addGeneratedBlockIfEmpty(tx, roof, 'tex_sandstone', 'stone', true);
      this.addGeneratedBlockIfEmpty(tx, floor, 'tex_sandstone', 'stone', true);
    }
    for (let ty=floor; ty>=floor-2; ty--) this.removeGeneratedBlockAt(door, ty);
    const palace = this.add.graphics().setDepth(5);
    palace.fillStyle(0xffd34e, 0.95);
    palace.fillTriangle((left+3)*TILE, (roof-1)*TILE, (left+3)*TILE-10, roof*TILE, (left+3)*TILE+10, roof*TILE);
    palace.fillTriangle((right-3)*TILE, (roof-1)*TILE, (right-3)*TILE-10, roof*TILE, (right-3)*TILE+10, roof*TILE);
    palace.lineStyle(3, 0xffd34e, 0.9);
    palace.lineBetween((left+3)*TILE+TILE/2, (roof-1)*TILE, (left+3)*TILE+TILE/2, (roof-4)*TILE);
    palace.lineBetween((right-3)*TILE+TILE/2, (roof-1)*TILE, (right-3)*TILE+TILE/2, (roof-4)*TILE);
    palace.fillStyle(0xef4444, 0.9);
    palace.fillTriangle((left+3)*TILE+TILE/2, (roof-4)*TILE, (left+3)*TILE+TILE/2+25, (roof-3)*TILE, (left+3)*TILE+TILE/2, (roof-2)*TILE);
    palace.fillTriangle((right-3)*TILE+TILE/2, (roof-4)*TILE, (right-3)*TILE+TILE/2+25, (roof-3)*TILE, (right-3)*TILE+TILE/2, (roof-2)*TILE);
    this.addChunkDecor(cx, palace);

    const king = this.add.image(door*TILE + TILE/2, floor*TILE - 18, 'tex_king').setDepth(6);
    this.addChunkDecor(cx, king);
    this.kingNpcs.set(`${cx}:${door}`, { cx, image: king, name: 'Kuningas' });
    this.spawnRobberAt(cx, left + 6, floor);
    this.spawnRobberAt(cx, right - 6, floor);
    if (rng() < 0.8) this.spawnRobberAt(cx, door - 5, floor);
    this.addGeneratedLabel(cx, 'KUNINKAAN PALATSI', door, roof-1, '#ffe7a3');
    const loot = this.pickups.create(door*TILE + TILE/2, (floor-3)*TILE, 'tex_red');
    loot.body.setAllowGravity(false);
    this.chunks.get(cx)?.pickups.push(loot);
  }

  generatePirateCoveFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const left = startTx + 3;
    const right = startTx + CHUNK_W - 4;
    const baseY = SURFACE_Y - 1;
    const cove = this.add.graphics().setDepth(2);
    cove.fillStyle(0x1769aa, 0.72); cove.fillRect(left*TILE, (baseY-3)*TILE, (right-left+1)*TILE, TILE*3);
    cove.lineStyle(3, 0x7dd3fc, 0.8);
    for (let tx=left; tx<=right; tx+=3) cove.lineBetween(tx*TILE, (baseY-2)*TILE, (tx+1)*TILE, (baseY-2)*TILE);
    cove.fillStyle(0x6b3f24, 1); cove.fillRect((left+3)*TILE, (baseY-1)*TILE, 17*TILE, 8);
    cove.fillStyle(0x451a03, 1); cove.fillTriangle((left+7)*TILE, (baseY-1)*TILE, (left+14)*TILE, (baseY-5)*TILE, (left+21)*TILE, (baseY-1)*TILE);
    cove.lineStyle(3, 0x1f2937, 1); cove.lineBetween((left+14)*TILE, (baseY-5)*TILE, (left+14)*TILE, (baseY-9)*TILE);
    cove.fillStyle(0x111827, 1); cove.fillTriangle((left+14)*TILE, (baseY-9)*TILE, (left+18)*TILE, (baseY-8)*TILE, (left+14)*TILE, (baseY-7)*TILE);
    this.addChunkDecor(cx, cove);
    const pirateA = this.spawnRobberAt(cx, left+7, baseY);
    const pirateB = this.spawnRobberAt(cx, right-5, baseY);
    pirateA?.setTint?.(0x9f1239); pirateB?.setTint?.(0x1d4ed8);
    this.addGeneratedLabel(cx, 'MERIROSVOLAHTI', (left+right)/2, baseY-9, '#7dd3fc');
    const loot = this.pickups.create((left+right)*TILE/2, (baseY-4)*TILE, rng()<0.5 ? 'tex_red' : 'tex_diamond');
    loot.body.setAllowGravity(false);
    this.chunks.get(cx)?.pickups.push(loot);
  }

  generateRobotFactoryFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const left = startTx + 4;
    const right = startTx + CHUNK_W - 4;
    const floor = SURFACE_Y - 1;
    const roof = SURFACE_Y - 8;
    for (let tx=left; tx<=right; tx++) {
      this.addGeneratedBlockIfEmpty(tx, floor, 'tex_stone', 'stone', true);
      if (tx===left || tx===right) for (let ty=floor; ty>=roof; ty--) this.addGeneratedBlockIfEmpty(tx, ty, 'tex_stone', 'stone', true);
    }
    for (let tx=left; tx<=right; tx++) this.addGeneratedBlockIfEmpty(tx, roof, 'tex_stone', 'stone', true);
    const door = Math.floor((left + right) / 2);
    this.removeGeneratedBlockAt(door, floor);
    this.removeGeneratedBlockAt(door, floor-1);
    const lab = this.add.graphics().setDepth(5);
    lab.fillStyle(0x22d3ee, 0.3); lab.fillRect((left+3)*TILE, (roof+2)*TILE, (right-left-5)*TILE, TILE*2);
    lab.lineStyle(2, 0x67e8f9, 0.9); lab.strokeRect((left+3)*TILE, (roof+2)*TILE, (right-left-5)*TILE, TILE*2);
    lab.fillStyle(0xf97316, 0.9); lab.fillCircle((left+6)*TILE, (roof+5)*TILE, 7); lab.fillCircle((right-6)*TILE, (roof+5)*TILE, 7);
    this.addChunkDecor(cx, lab);
    this.spawnRobberAt(cx, left+5, floor, 'tex_robot_guard');
    this.spawnRobberAt(cx, Math.floor((left+right)/2), floor, 'tex_robot_guard');
    this.spawnRobberAt(cx, right-5, floor, 'tex_robot_guard');
    this.spawnBossAt(Math.floor((left + right)/2) - 2, roof + 2, 'robot_overseer');
    this.addGeneratedLabel(cx, 'ROBOTTITEHDAS', (left+right)/2, roof-1, '#67e8f9');
    const loot = this.pickups.create((left+right)*TILE/2, (floor-3)*TILE, 'tex_diamond');
    loot.body.setAllowGravity(false);
    this.chunks.get(cx)?.pickups.push(loot);
  }

  generateDragonNestFeature(cx, rng) {
    const startTx = cx * CHUNK_W;
    const left = startTx + 4;
    const width = 24;
    const top = SURFACE_Y + 6;
    const bottom = top + 10;
    const entrance = left + 10;
    for (let ty=SURFACE_Y; ty>=top+1; ty--) for (let tx=entrance; tx<entrance+3; tx++) this.removeGeneratedBlockAt(tx, ty);
    for (let tx=left; tx<left+width; tx++) for (let ty=top; ty<bottom; ty++) {
      const edge = tx===left || tx===left+width-1 || ty===top || ty===bottom-1;
      const nx = (tx-(left+width/2))/(width/2); const ny = (ty-(top+bottom)/2)/((bottom-top)/2);
      if (!edge && nx*nx + ny*ny < 1.1) this.removeGeneratedBlockAt(tx, ty);
    }
    this.drawGeneratedCaveBackdrop(cx, left, top, width, bottom-top+1, 0x24100c);
    this.spawnBossAt(Math.floor(left + width/2) - 2, top + 2, 'dragon');
    for (const tx of [left+4, left+width-5]) {
      const flame = this.add.image(tx*TILE+TILE/2, (bottom-2)*TILE, 'tex_flame').setTint(0xff6e42).setScale(2.2).setDepth(5);
      this.addChunkDecor(cx, flame);
    }
    this.addGeneratedLabel(cx, 'LOHIKÄÄRMEEN PESÄ', left+width/2, top-1, '#ffb38a');
    const loot = this.pickups.create((left+width/2)*TILE, (bottom-3)*TILE, rng()<0.4 ? 'tex_red' : 'tex_diamond');
    loot.body.setAllowGravity(false);
    this.chunks.get(cx)?.pickups.push(loot);
  }

  updateKingNpcs() {
    if (!this.player?.active) return;
    for (const npc of this.kingNpcs.values()) {
      if (!npc?.image?.active) continue;
      const dx = npc.image.x - this.player.x;
      const dy = npc.image.y - this.player.y;
      if (dx*dx + dy*dy < 95*95 && this.time.now >= this._kingToastAt) {
        this._kingToastAt = this.time.now + 1800;
        this.showToast?.('Kuningas: Tervetuloa palatsiin! Rosvot vartioivat aarretta.');
      }
    }
  }

  updateCarpenterNpcs() {
    if (!this.player?.active) return;
    for (const npc of this.carpenterNpcs.values()) {
      if (!npc?.image?.active) continue;
      const dx = npc.image.x - this.player.x;
      const dy = npc.image.y - this.player.y;
      if (dx*dx + dy*dy < 95*95 && this.time.now >= this._carpenterToastAt) {
        this._carpenterToastAt = this.time.now + 1800;
        this.showToast?.('Nikkari: Tuon puusta lankkuja ja rakennan sinulle!');
      }
    }
  }

  generateBiomeDecor(cx, biome, rng) {
    const startTx = cx * CHUNK_W;
    const left = startTx + 3;
    const right = startTx + CHUNK_W - 4;
    const floorTy = SURFACE_Y - 1;
    const baseY = floorTy*TILE + TILE/2;
    const label = (name, color) => this.addGeneratedLabel(cx, name, (left+right)/2, SURFACE_Y-4, color);

    if (biome === 'meadow') {
      const flowers = this.add.graphics().setDepth(4);
      const flowerColors = [0xff75a8, 0xffd34e, 0xb8f7ff, 0xc084fc];
      for (let i=0; i<10; i++) {
        const x = (left+Math.floor(rng()*(right-left)))*TILE + TILE/2;
        const y = baseY - 2;
        flowers.lineStyle(2, 0x3f8f54, 1); flowers.lineBetween(x,y+12,x,y-1);
        flowers.fillStyle(flowerColors[i%flowerColors.length], 1); flowers.fillCircle(x,y-4,4);
        flowers.fillStyle(0xfff6b3, 1); flowers.fillCircle(x,y-4,1.5);
      }
      this.addChunkDecor(cx, flowers);
      label('NIITTY', '#b8f7ff');
      return;
    }

    if (biome === 'village') {
      const house = (hx, tint) => {
        const doorX = hx + 3;
        for (let tx=hx; tx<=hx+7; tx++) {
          for (let ty=floorTy; ty>=floorTy-4; ty--) {
            const doorway = tx === doorX && ty >= floorTy-1;
            if (!doorway) {
              const block = this.addGeneratedBlockIfEmpty(tx,ty,'tex_plank','plank',true);
              block?.setTint?.(tint);
            }
          }
        }
        for (let tx=hx-1; tx<=hx+8; tx++) {
          const roof = this.addGeneratedBlockIfEmpty(tx,floorTy-5,'tex_plank','plank',true);
          roof?.setTint?.(tint);
        }
        this.addGeneratedTorch(cx, hx+1, floorTy-2, 0xffd34e);
      };
      house(left+1, 0xc98958);
      house(right-8, 0x8f6ac7);
      const well = this.add.graphics().setDepth(5);
      const wx = (left+right)*TILE/2, wy = baseY+2;
      well.fillStyle(0x657080,1); well.fillEllipse(wx,wy,46,18);
      well.lineStyle(3,0x293241,1); well.strokeEllipse(wx,wy,46,18);
      well.lineBetween(wx-18,wy-4,wx-18,wy-42); well.lineBetween(wx+18,wy-4,wx+18,wy-42);
      well.lineStyle(3,0x9d6b3e,1); well.lineBetween(wx-22,wy-40,wx+22,wy-40);
      this.addChunkDecor(cx,well);
      label('KYLÄ', '#ffe7a3');
      const carpenterX = (left + 11) * TILE + TILE/2;
      const carpenter = this.add.image(carpenterX, (floorTy-1)*TILE + TILE/2, 'tex_carpenter').setDepth(6);
      this.addChunkDecor(cx, carpenter);
      this.carpenterNpcs.set(`${cx}:${left+11}`, { cx, image: carpenter, name: 'Nikkari' });
      this.addGeneratedLabel(cx, 'NIKKARI', left+11, floorTy-3, '#fbbf24');
      const loot = this.pickups.create(wx, (floorTy-6)*TILE, 'tex_diamond');
      loot.body.setAllowGravity(false); this.chunks.get(cx)?.pickups.push(loot);
      return;
    }

    if (biome === 'jungle') {
      for (let i=0; i<5; i++) {
        const tx = left+2+Math.floor(rng()*Math.max(1,right-left-3));
        const height = 4+Math.floor(rng()*3);
        for (let h=0; h<height; h++) this.addGeneratedBlockIfEmpty(tx,floorTy-h,'tex_trunk','trunk',true);
        for (let lx=-2; lx<=2; lx++) for (let ly=-2; ly<=0; ly++) {
          if (Math.abs(lx)+Math.abs(ly)<=3) this.addBlock(tx+lx,floorTy-height+ly,'tex_leaves','leaves',false);
        }
      }
      const vines = this.add.graphics().setDepth(4);
      vines.lineStyle(3,0x35a66a,0.9);
      for (let i=0;i<7;i++) {
        const x=(left+Math.floor(rng()*(right-left)))*TILE+TILE/2;
        vines.lineBetween(x,(SURFACE_Y-4)*TILE,x+Math.sin(i)*8,SURFACE_Y*TILE);
      }
      this.addChunkDecor(cx,vines);
      label('VIIidakko', '#86efac');
      return;
    }

    if (biome === 'savanna') {
      const canopy = this.add.graphics().setDepth(4);
      for (let i=0; i<4; i++) {
        const tx=left+2+Math.floor(rng()*Math.max(1,right-left-3));
        const h=3+Math.floor(rng()*2);
        for (let y=0;y<h;y++) {
          const trunk=this.addGeneratedBlockIfEmpty(tx,floorTy-y,'tex_trunk','trunk',true);
          trunk?.setTint?.(0xc18b54);
        }
        const x=tx*TILE+TILE/2, y=(floorTy-h)*TILE+TILE/2;
        canopy.fillStyle(0x8f9f45,0.95); canopy.fillEllipse(x,y,92,34);
        canopy.fillStyle(0xb7bd55,0.7); canopy.fillEllipse(x-22,y-5,46,18);
      }
      this.addChunkDecor(cx,canopy);
      label('SAVANNI', '#fef08a');
      return;
    }

    if (biome === 'volcanic') {
      const lavaCracks = this.add.graphics().setDepth(4);
      lavaCracks.lineStyle(3,0xff5722,0.95);
      for (let i=0;i<8;i++) {
        const x=(left+Math.floor(rng()*(right-left)))*TILE+TILE/2;
        lavaCracks.lineBetween(x,baseY+14,x+8,baseY-4);
        lavaCracks.lineBetween(x+8,baseY-4,x+18,baseY-13);
      }
      lavaCracks.fillStyle(0xffd34e,0.8);
      lavaCracks.fillCircle((left+5)*TILE,baseY-35,5); lavaCracks.fillCircle((right-4)*TILE,baseY-48,4);
      this.addChunkDecor(cx,lavaCracks);
      label('TULIMAA', '#ff9b76');
      return;
    }

    if (biome === 'mushroom') {
      const mushrooms = this.add.graphics().setDepth(5);
      for (let i=0;i<7;i++) {
        const x=(left+Math.floor(rng()*(right-left)))*TILE+TILE/2;
        const y=baseY+5;
        const tall=i%3===0;
        mushrooms.fillStyle(0xe6d6ba,1); mushrooms.fillRect(x-4,y-(tall?48:30),8,tall?48:30);
        mushrooms.fillStyle(i%2?0xc084fc:0xef5da8,1); mushrooms.fillEllipse(x,y-(tall?49:31),34+(i%2)*10,18);
        mushrooms.fillStyle(0xfff1a8,0.9); mushrooms.fillCircle(x-8,y-(tall?52:34),3); mushrooms.fillCircle(x+7,y-(tall?47:29),2.5);
      }
      this.addChunkDecor(cx,mushrooms);
      label('SIENIMETSÄ', '#f0abfc');
      return;
    }

    if (biome === 'crystal') {
      const glow = this.add.graphics().setDepth(3);
      for (let i=0;i<6;i++) {
        const x=(left+2+Math.floor(rng()*Math.max(1,right-left-3)))*TILE+TILE/2;
        const y=baseY+5;
        const color=[0x67e8f9,0xc084fc,0xf9a8d4][i%3];
        glow.fillStyle(color,0.22); glow.fillCircle(x,y-30,25);
        glow.fillStyle(color,0.95); glow.fillTriangle(x,y,x-12,y-48,x+9,y-18);
        glow.fillStyle(0xffffff,0.7); glow.fillTriangle(x-2,y-9,x-2,y-36,x+3,y-12);
      }
      this.addChunkDecor(cx,glow);
      label('KRISTALLIMAA', '#e9d5ff');
      return;
    }

    if (biome === 'wasteland') {
      const waste = this.add.graphics().setDepth(4);
      waste.fillStyle(0xd0a96b,0.55);
      for (let i=0;i<5;i++) {
        const x=(left+Math.floor(rng()*(right-left)))*TILE;
        waste.fillEllipse(x,baseY+8,120,24);
      }
      this.addChunkDecor(cx,waste);
      for (const tx of [left+4,right-4]) {
        for (let h=0;h<3;h++) {
          const dead=this.addGeneratedBlockIfEmpty(tx,floorTy-h,'tex_trunk','trunk',true);
          dead?.setTint?.(0x6f4b38);
        }
        const skull=this.add.image(tx*TILE+TILE/2,(floorTy-3)*TILE,'tex_decal_skull').setScale(2).setDepth(5);
        this.addChunkDecor(cx,skull);
      }
      label('JOUTOMAA', '#fcd7aa');
    }
  }

  getSeasonalEvent(date = new Date()) {
    const month = date.getMonth();
    if (month === 9) return { id: 'halloween', name: 'HALLOWEEN', color: '#ff9a3d', icon: '🎃' };
    if (month === 11) return { id: 'christmas', name: 'JOULUTAPAHTUMA', color: '#b9e7ff', icon: '🎄' };
    return { id: 'normal', name: '', color: '#ffffff', icon: '' };
  }

  updateSeasonalEvent(force=false) {
    const next = this.getSeasonalEvent();
    if (!force && this.seasonal?.id === next.id) return;
    const changed = this.seasonal?.id !== next.id;
    this.seasonal = next;
    if (this.seasonalStatusText) {
      this.seasonalStatusText.setText(next.id === 'normal' ? '' : `${next.icon} ${next.name}`);
      this.seasonalStatusText.setColor(next.color);
    }
    if (changed && !force && this.started) this.showToast(`${next.icon} ${next.name} alkoi!`);
  }

  generateSeasonalChunkDecor(cx, biome, rng) {
    const event = this.seasonal;
    if (!event || event.id === 'normal' || biome === 'ocean') return;
    const startTx = cx * CHUNK_W;
    const left = startTx + 3;
    const right = startTx + CHUNK_W - 4;
    const baseY = (SURFACE_Y-1)*TILE + TILE/2;
    const positions = [
      left + Math.floor(rng()*Math.max(1, right-left)),
      left + 4 + Math.floor(rng()*Math.max(1, right-left-4)),
      right - 2
    ];

    if (event.id === 'halloween') {
      positions.forEach((tx, index) => {
        const pumpkin = this.add.graphics().setDepth(5);
        const x = tx*TILE + TILE/2;
        const y = baseY - (index%2)*4;
        pumpkin.fillStyle(0x1f120d, 0.75); pumpkin.fillEllipse(x, y+10, 31, 8);
        pumpkin.fillStyle(index===2 ? 0xff5a24 : 0xf58231, 1); pumpkin.fillCircle(x, y, 13);
        pumpkin.lineStyle(2, 0xb83a18, 0.9); pumpkin.strokeCircle(x, y, 13);
        pumpkin.fillStyle(0x201018, 1);
        pumpkin.fillTriangle(x-8, y-4, x-2, y-7, x-3, y+2);
        pumpkin.fillTriangle(x+8, y-4, x+2, y-7, x+3, y+2);
        pumpkin.fillRect(x-7, y+5, 14, 3);
        pumpkin.fillStyle(0x5b3a1c, 1); pumpkin.fillRect(x-2, y-15, 4, 5);
        this.addChunkDecor(cx, pumpkin);
      });
      const bats = this.add.graphics().setDepth(5);
      bats.lineStyle(3, 0x24113d, 1);
      for (let i=0; i<3; i++) {
        const x = (left+4+i*8)*TILE;
        const y = (SURFACE_Y-7-(i%2)*2)*TILE;
        bats.lineBetween(x-12,y,x-2,y+6); bats.lineBetween(x-2,y+6,x+8,y);
        bats.lineBetween(x-2,y+6,x-2,y+13);
      }
      this.addChunkDecor(cx, bats);
      this.addGeneratedLabel(cx, '🎃 HALLOWEEN', (left+right)/2, SURFACE_Y-5, '#ffb15c');
      const loot = this.pickups.create((left+right)*TILE/2, (SURFACE_Y-3)*TILE, 'tex_red');
      loot.body.setAllowGravity(false);
      this.chunks.get(cx)?.pickups.push(loot);
      return;
    }

    // Christmas: small decorated firs and gift boxes appear on the surface.
    positions.slice(0, 2).forEach((tx, index) => {
      const tree = this.add.graphics().setDepth(5);
      const x = tx*TILE + TILE/2;
      const y = baseY + 7;
      tree.fillStyle(0x6b3a1b, 1); tree.fillRect(x-3, y-18, 6, 19);
      tree.fillStyle(index ? 0x1d8c57 : 0x237a4b, 1);
      tree.fillTriangle(x, y-61, x-21, y-30, x+21, y-30);
      tree.fillTriangle(x, y-45, x-26, y-10, x+26, y-10);
      tree.fillStyle(0xffd34e, 1); tree.fillCircle(x-9, y-32, 3); tree.fillCircle(x+11, y-20, 3);
      tree.fillStyle(index ? 0xff4f70 : 0x63d8ff, 1); tree.fillCircle(x+4, y-44, 3);
      tree.fillStyle(0xffe5a0, 1); tree.fillTriangle(x, y-68, x-5, y-58, x+5, y-58);
      this.addChunkDecor(cx, tree);
    });
    const gift = this.add.graphics().setDepth(5);
    const gx = (right-4)*TILE + TILE/2, gy = baseY + 5;
    gift.fillStyle(0xd93d5e, 1); gift.fillRect(gx-13, gy-21, 26, 21);
    gift.fillStyle(0xffd34e, 1); gift.fillRect(gx-3, gy-21, 6, 21); gift.fillRect(gx-13, gy-14, 26, 5);
    gift.lineStyle(2, 0x7e1d35, 1); gift.strokeRect(gx-13, gy-21, 26, 21);
    this.addChunkDecor(cx, gift);
    this.addGeneratedLabel(cx, '🎄 JOULU', (left+right)/2, SURFACE_Y-5, '#b9e7ff');
    const loot = this.pickups.create((left+right)*TILE/2, (SURFACE_Y-3)*TILE, 'tex_diamond');
    loot.body.setAllowGravity(false);
    this.chunks.get(cx)?.pickups.push(loot);
  }

  hasSolidBlockAt(tx, ty) {
    return this.blocks.has(`${tx},${ty}`);
  }

  // Endless world init and chunk management
  initInfiniteWorld(){
    this.blocks.clear?.();
    this.loadedChunks.clear?.();
    this.chunks.clear?.();
    // Preload chunks around 0
    this.ensureChunksAround(0);
    // Re-spawn any saved cannons (after base terrain exists)
    if (Array.isArray(this.cannonPositions)) {
      for (const p of this.cannonPositions) {
        if (typeof p.tx === 'number' && typeof p.ty === 'number') this.spawnCannonAt(p.tx, p.ty);
      }
    }
  // Re-spawn saved portals
    if (Array.isArray(this.portalPositions)) {
      for (const p of this.portalPositions) {
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
        const tex = this.textureForPortal(p.color||'blue');
  const img = this.add.image(x,y,tex).setDepth(4);
  this.decor.add(img);
  const zone = this.physics.add.staticImage(x,y,tex).setVisible(false);
  zone.setData('type','portal'); zone.setData('tx',p.tx); zone.setData('ty',p.ty); zone.setData('color',p.color||'blue');
  this.portalsGroup.add(zone);
        const cx = Math.floor(p.tx / CHUNK_W);
  this.chunks.get(cx)?.decor.push(img);
  this.chunks.get(cx)?.decor.push(zone);
  this.portals.set(`${p.tx},${p.ty}`, { color:p.color||'blue', image: img, zone });
      }
    }
    // Re-spawn saved slime cloners
    if (Array.isArray(this.slimeClonerPositions)) {
      for (const p of this.slimeClonerPositions) {
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
        const img = this.add.image(x,y,'tex_slimecloner').setDepth(4);
        this.decor.add(img);
        const zone = this.add.zone(x, y, TILE*0.9, TILE*0.9);
        this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
        zone.setData('type','slimecloner'); zone.setData('tx',p.tx); zone.setData('ty',p.ty);
        this.physics.add.overlap(this.bullets, zone, (bullet, z)=>{ bullet.destroy(); this.removeSlimeClonerAt(z.getData('tx'), z.getData('ty')); this.saveState(); }, null, this);
        const cx = Math.floor(p.tx / CHUNK_W);
        this.chunks.get(cx)?.decor.push(img);
        this.chunks.get(cx)?.decor.push(zone);
        this.slimeCloners.set(`${p.tx},${p.ty}`, { tx:p.tx, ty:p.ty, image: img, zone, nextAt: this.time.now + 2500, count: 0 });
      }
    }
    // Re-spawn saved torches
    if (Array.isArray(this.torchPositions)) {
      for (const p of this.torchPositions) {
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
  const img = this.add.image(x,y,'tex_torch').setDepth(4);
        this.decor.add(img);
        const cx = Math.floor(p.tx / CHUNK_W);
        this.chunks.get(cx)?.decor.push(img);
  const flicker = { seed: Math.random()*Math.PI*2, speed: 2 + Math.random()*1.2, ampR: 0.05, ampA: 0.15 };
  this.torches.set(`${p.tx},${p.ty}`, { image: img, flicker });
      }
    }
    // Re-spawn saved campfires
    if (Array.isArray(this.campfirePositions)) {
      for (const p of this.campfirePositions) {
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
        const img = this.add.image(x,y,'tex_campfire').setDepth(4);
        this.decor.add(img);
        const cx = Math.floor(p.tx / CHUNK_W);
        this.chunks.get(cx)?.decor.push(img);
        const flicker = { seed: Math.random()*Math.PI*2, speed: 2.2 + Math.random()*1.3, ampR: 0.08, ampA: 0.22 };
        this.campfires.set(`${p.tx},${p.ty}`, { image: img, flicker });
      }
    }
    // Re-spawn saved furniture (lamps, sofas, tables)
    if (Array.isArray(this.lampPositions)) {
      for (const p of this.lampPositions) {
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2; const cx = Math.floor(p.tx/CHUNK_W);
        const key = `${p.tx},${p.ty}`;
        const img = this.add.image(x,y,'tex_lamp').setDepth(4);
        this.lamps.set(key, { image: img });
        this.decor.add(img);
        this.chunks.get(cx)?.decor.push(img);
      }
    }
    if (Array.isArray(this.sofaPositions)) {
      for (const p of this.sofaPositions) {
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2; const cx = Math.floor(p.tx/CHUNK_W);
        const key = `${p.tx},${p.ty}`;
        const img = this.add.image(x,y,'tex_sofa').setDepth(4);
        this.sofas.set(key, { image: img });
        this.decor.add(img);
        this.chunks.get(cx)?.decor.push(img);
      }
    }
    if (Array.isArray(this.tablePositions)) {
      for (const p of this.tablePositions) {
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2; const cx = Math.floor(p.tx/CHUNK_W);
        const key = `${p.tx},${p.ty}`;
        const img = this.add.image(x,y,'tex_table').setDepth(4);
        this.tables.set(key, { image: img });
        this.decor.add(img);
        this.chunks.get(cx)?.decor.push(img);
      }
    }
    // Re-spawn saved tool workstations.
    if (Array.isArray(this.workstationPositions)) {
      for (const p of this.workstationPositions) this.spawnWorkstationAt(p.tx, p.ty, p.type);
    }
    // Re-spawn saved mines
    if (Array.isArray(this.minePositions)) {
      for (const p of this.minePositions) {
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
        const img = this.add.image(x,y,'tex_mine').setDepth(5);
        const zone = this.add.zone(x, y, TILE*0.9, TILE*0.9);
        this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
        zone.setData('type','mine'); zone.setData('tx',p.tx); zone.setData('ty',p.ty);
        const key = `${p.tx},${p.ty}`;
        const trigger = ()=>{
          if (!zone.active) return;
          this.explodeAt(x,y);
          img.destroy(); zone.destroy();
          this.mines.delete(key);
          this.minePositions = this.minePositions.filter(q=> !(q.tx===p.tx && q.ty===p.ty));
          this.saveState();
        };
        this.physics.add.overlap(zone, this.slimes, trigger, null, this);
        this.physics.add.overlap(zone, this.birds, trigger, null, this);
        this.physics.add.overlap(zone, this.zombies, trigger, null, this);
        this.physics.add.overlap(zone, this.oppos, trigger, null, this);
        this.physics.add.overlap(zone, this.bosses, trigger, null, this);
        const cx = Math.floor(p.tx / CHUNK_W);
        this.chunks.get(cx)?.decor.push(img);
        this.chunks.get(cx)?.decor.push(zone);
        this.mines.set(key, { image: img, zone });
      }
    }

    // Re-spawn saved lightning rods
    if (Array.isArray(this.rodPositions)) {
      for (const p of this.rodPositions) {
        const key = `${p.tx},${p.ty}`;
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
        const img = this.add.image(x,y,'tex_rod').setDepth(4);
        this.decor.add(img);
        const cx = Math.floor(p.tx / CHUNK_W);
        this.chunks.get(cx)?.decor.push(img);
        this.rods.set(key, { image: img, hp: (typeof p.hp === 'number' ? p.hp : 3) });
      }
    }
    // Re-spawn saved sniper towers
    if (Array.isArray(this.towerPositions)) {
      for (const p of this.towerPositions) {
        const key = `${p.tx},${p.ty}`;
        const x = p.tx*TILE + TILE/2;
        const yBase = p.ty*TILE + TILE/2;
  const body = this.add.image(x, yBase + TILE/2, 'tex_tower_body').setDepth(4).setOrigin(0.5, 1.0);
  const head = this.add.image(x, yBase - TILE*2, 'tex_tower_gun').setDepth(5).setOrigin(0.4, 0.5);
  const soldier = this.add.image(x, yBase - TILE*2 - 2, 'tex_soldier').setDepth(5).setOrigin(0.5, 1.0);
        const zone = this.add.zone(x, yBase - TILE, TILE, TILE*3);
        this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
        zone.setData('type','tower'); zone.setData('tx',p.tx); zone.setData('ty',p.ty);
        const cx = Math.floor(p.tx / CHUNK_W);
  this.chunks.get(cx)?.decor.push(body);
        this.chunks.get(cx)?.decor.push(head);
        this.chunks.get(cx)?.decor.push(soldier);
        this.chunks.get(cx)?.decor.push(zone);
        this.towers.set(key, { body, head, soldier, zone, nextAt: 0 });
      }
    }
    // Re-spawn saved soldier cloners
    if (Array.isArray(this.soldierClonerPositions)) {
      for (const p of this.soldierClonerPositions) {
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
        const img = this.add.image(x,y,'tex_soldiercloner').setDepth(4);
        const zone = this.add.zone(x, y, TILE*0.9, TILE*0.9);
        this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
        zone.setData('type','soldiercloner'); zone.setData('tx',p.tx); zone.setData('ty',p.ty);
        const cx = Math.floor(p.tx / CHUNK_W);
        this.chunks.get(cx)?.decor.push(img);
        this.chunks.get(cx)?.decor.push(zone);
        this.soldierCloners.set(`${p.tx},${p.ty}`, { image: img, zone, nextAt: this.time.now + 2500, count: 0 });
      }
    }
    // Re-spawn saved tank cloners
    if (Array.isArray(this.tankClonerPositions)) {
      for (const p of this.tankClonerPositions) {
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
        const img = this.add.image(x,y,'tex_soldiercloner').setDepth(4).setTint(0x88bbff);
        const zone = this.add.zone(x, y, TILE*0.9, TILE*0.9);
        this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
        zone.setData('type','tankcloner'); zone.setData('tx',p.tx); zone.setData('ty',p.ty);
        const cx = Math.floor(p.tx / CHUNK_W);
        this.chunks.get(cx)?.decor.push(img);
        this.chunks.get(cx)?.decor.push(zone);
        this.tankCloners.set(`${p.tx},${p.ty}`, { image: img, zone, nextAt: this.time.now + 2500, count: 0 });
      }
    }
    // Re-spawn saved traps
    if (Array.isArray(this.trapPositions)) {
      for (const p of this.trapPositions) {
        const key = `${p.tx},${p.ty}`;
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
        const imgKey = p.textureKey || this.getTrapTextureKey(p.type);
        const img = this.add.image(x,y,imgKey).setDepth(4);
        const zone = this.add.zone(x,y,TILE*0.9,TILE*0.9);
        this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
        zone.setData('type','trap'); zone.setData('tx',p.tx); zone.setData('ty',p.ty);
        const cx = Math.floor(p.tx / CHUNK_W);
        this.chunks.get(cx)?.decor.push(img);
        this.chunks.get(cx)?.decor.push(zone);
        this.traps.set(key, { image: img, zone, type: p.type, dir: p.dir||'right', nextAt: 0 });
        this.armTrapAt(p.tx, p.ty, p.type);
      }
    }
  }

  ensureChunksAround(centerX){
    const center = Math.floor((centerX / TILE) / CHUNK_W);
    const loadRadius = this.performanceMode ? 2 : LOAD_RADIUS;
    // Load needed
    for (let cx = center-loadRadius; cx <= center+loadRadius; cx++) {
      if (!this.loadedChunks.has(cx)) {
        this.generateChunk(cx);
      }
    }
    // Unload far
    for (const cx of Array.from(this.loadedChunks)) {
      if (cx < center-loadRadius-1 || cx > center+loadRadius+1) this.unloadChunk(cx);
    }
  }

  generateSpecialMapChunk(cx, mapType){
    const startTx = cx * CHUNK_W;
    const endTx = startTx + CHUNK_W - 1;
    if (mapType === 'redstone') {
      // Redstone factory world: dark stone, glowing red circuits, repeaters,
      // piston-like machines and a clear industrial surface route.
      for (let tx = startTx; tx <= endTx; tx++) {
        const floor = this.addBlock(tx, SURFACE_Y, 'tex_stone', 'stone', true);
        floor?.setTint?.(0x6d2634);
        for (let ty = SURFACE_Y + 1; ty < WORLD_TILES_Y; ty++) {
          const rock = this.getUndergroundRock(ty - SURFACE_Y, 'tex_deep_stone', 'deepstone');
          const block = this.addBlock(tx, ty, rock.textureKey, rock.type, true);
          block?.setTint?.(ty < SURFACE_Y + 12 ? 0x3a2530 : 0x241c2a);
        }
      }

      const circuit = this.add.graphics().setDepth(4);
      circuit.lineStyle(4, 0xd92845, 0.95);
      const wireY = (SURFACE_Y - 3) * TILE + TILE / 2;
      circuit.lineBetween(startTx * TILE, wireY, (endTx + 1) * TILE, wireY);
      circuit.lineStyle(2, 0xff7b87, 0.8);
      for (let tx = startTx + 2; tx <= endTx; tx += 4) {
        circuit.strokeCircle(tx * TILE + TILE / 2, wireY, 6);
        circuit.lineBetween(tx * TILE + TILE / 2, wireY, tx * TILE + TILE / 2, (SURFACE_Y - 1) * TILE);
      }
      this.chunks.get(cx)?.decor.push(circuit);

      const machineArt = this.add.graphics().setDepth(5);
      for (let tx = startTx + 4; tx <= endTx; tx += 8) {
        const mx = tx * TILE + TILE / 2;
        const my = (SURFACE_Y - 1.8) * TILE;
        machineArt.fillStyle(0x222633, 1);
        machineArt.fillRoundedRect(mx - 24, my - 30, 48, 44, 6);
        machineArt.lineStyle(2, 0x6f7b91, 0.9);
        machineArt.strokeRoundedRect(mx - 24, my - 30, 48, 44, 6);
        machineArt.fillStyle(0xff334d, 0.95);
        machineArt.fillCircle(mx, my - 12, 7);
        machineArt.fillStyle(0x9b2036, 0.95);
        machineArt.fillRect(mx - 5, my + 2, 10, 18);
      }
      this.chunks.get(cx)?.decor.push(machineArt);

      if (cx === 0) {
        const title = this.add.text(16 * TILE, 10 * TILE, 'PUNAKIVI-MAAILMA', {
          fontFamily: 'monospace', fontSize: '22px', color: '#ffe4e6',
          backgroundColor: '#4a111dcc', padding: { x: 10, y: 6 }
        }).setDepth(8);
        const subtitle = this.add.text(16 * TILE, 13 * TILE, 'JOHDOT · TOISTIMET · KONEET · PORTAALI', {
          fontFamily: 'monospace', fontSize: '13px', color: '#ff9aa5',
          backgroundColor: '#1f1118dd', padding: { x: 8, y: 4 }
        }).setDepth(8);
        this.chunks.get(cx)?.decor.push(title, subtitle);
      }
      if (Array.isArray(this.workstationPositions)) {
        for (const p of this.workstationPositions) {
          if (Math.floor(p.tx / CHUNK_W) === cx) this.spawnWorkstationAt(p.tx, p.ty, p.type);
        }
      }
      return true;
    }
    if (mapType === 'backrooms') {
      // Endless yellow maze: solid floor, ceiling, and repeating corridor walls.
      for (let tx = startTx; tx <= endTx; tx++) {
        const floor = this.addBlock(tx, SURFACE_Y, 'tex_sand', 'sand', true);
        floor?.setTint?.(0xd6b84d);
        const ceiling = this.addBlock(tx, 8, 'tex_sand', 'sand', true);
        ceiling?.setTint?.(0xc5a43c);
        for (let ty = SURFACE_Y + 1; ty < WORLD_TILES_Y; ty++) {
          const rock = this.getUndergroundRock(ty - SURFACE_Y, 'tex_sandstone', 'stone');
          this.addBlock(tx, ty, rock.textureKey, rock.type, true);
        }
      }
      for (let tx = startTx; tx <= endTx; tx++) {
        if ((tx - startTx) % 12 === 0 && Math.abs(tx) > 2) {
          for (let ty = 14; ty < SURFACE_Y; ty++) {
            const wall = this.addBlock(tx, ty, 'tex_sand', 'sand', true);
            wall?.setTint?.(0xe0c35b);
          }
        }
      }
      if (cx === 0) {
        this.add.text(14 * TILE, 12 * TILE, 'BACKROOMS AREENA', { fontFamily:'monospace', fontSize:'18px', color:'#332700', backgroundColor:'#e8cf6888', padding:{x:8,y:5} }).setDepth(6);
      }
      return true;
    }
    if (mapType === 'pinball') {
      // Wide flipper table: flat floor, side rails, bumpers and stair-like ramps.
      for (let tx = startTx; tx <= endTx; tx++) {
        this.addBlock(tx, SURFACE_Y, 'tex_ground', 'ground', true);
        for (let ty = SURFACE_Y + 1; ty < WORLD_TILES_Y; ty++) {
          const rock = this.getUndergroundRock(ty - SURFACE_Y);
          this.addBlock(tx, ty, rock.textureKey, rock.type, true);
        }
        if (Math.abs(tx) % 18 === 0) {
          const bumper = this.addBlock(tx, SURFACE_Y - 1, 'tex_red', 'hotstone', true);
          bumper?.setTint?.(0xbd4cff);
        }
      }
      for (let ty = 18; ty < SURFACE_Y; ty++) {
        this.addBlock(startTx, ty, 'tex_stone', 'stone', true);
        this.addBlock(endTx, ty, 'tex_stone', 'stone', true);
      }
      const rampStart = startTx + 5;
      for (let i = 0; i < 8; i++) this.addBlock(rampStart + i, SURFACE_Y - 1 - Math.floor(i / 2), 'tex_plank', 'plank', true);
      const rampEnd = endTx - 12;
      for (let i = 0; i < 8; i++) this.addBlock(rampEnd + i, SURFACE_Y - 1 - Math.floor((7 - i) / 2), 'tex_plank', 'plank', true);
      if (cx === 0) {
        this.add.text(14 * TILE, 12 * TILE, 'FLIPPERI', { fontFamily:'monospace', fontSize:'20px', color:'#ffffff', backgroundColor:'#5a2088cc', padding:{x:10,y:5} }).setDepth(6);
      }
      return true;
    }
    return false;
  }

  generateChunk(cx){
    this.currentChunk = cx;
    this.loadedChunks.add(cx);
    this.chunks.set(cx, { blocks:new Set(), decor:[], pickups:[], enemies:[] });

    const rng = this.makeRandom((WORLD_SEED ^ (cx*73856093)) >>> 0);
    const startTx = cx * CHUNK_W;
    const endTx = startTx + CHUNK_W - 1;

    if (this.generateSpecialMapChunk(cx, this.mapType)) return;

  // Determine biome for this chunk. The first eight new biomes are placed at
  // fixed nearby chunks so the player can find them without a huge journey.
    const dist = Math.abs(cx);
    const centerNoAlt = 8;       // chunks around center: always forest
    const farAlwaysAlt = 25;     // beyond this: always alt biome per side
    const fixedBiome = {
      4: 'meadow', '-4': 'village', 5: 'jungle', '-5': 'savanna',
      6: 'volcanic', '-6': 'mushroom', 7: 'crystal', '-7': 'wasteland'
    }[cx] || null;
  let biome;
  // Special ocean bands: coarse groups of 4 chunks can become ocean away from spawn
  const g = Math.floor(cx / 4);
  const rngG = this.makeRandom((WORLD_SEED ^ (g*912367)) >>> 0);
  const isOceanBand = (Math.abs(g) >= 3 && Math.abs(g) <= 8 && rngG() < 0.28);
    if (fixedBiome) {
      biome = fixedBiome;
    } else if (dist <= centerNoAlt) {
      biome = 'forest';
    } else if (dist >= farAlwaysAlt) {
      biome = (cx >= 0) ? 'desert' : 'snow';
    } else {
      // Smooth transition probability from forest -> side biome
      const t = (dist - centerNoAlt) / (farAlwaysAlt - centerNoAlt); // 0..1
      const p = 0.15 + t * 0.70; // 0.15..0.85
      if (cx >= 0) biome = (rng() < p) ? 'desert' : 'forest';
      else biome = (rng() < p) ? 'snow' : 'forest';
    }
    if (isOceanBand) biome = 'ocean';

    // Surface line and underground fill per biome
    for (let tx = startTx; tx <= endTx; tx++) {
      if (biome === 'desert') {
        this.addBlock(tx, SURFACE_Y, 'tex_sand', 'sand', true);
        for (let ty = SURFACE_Y+1; ty < WORLD_TILES_Y; ty++) {
          const depth = ty - SURFACE_Y;
          const rock = this.getUndergroundRock(depth, depth > 2 ? 'tex_sandstone' : 'tex_sand', depth > 2 ? 'stone' : 'sand');
          this.addBlock(tx, ty, rock.textureKey, rock.type, true);
        }
      } else if (biome === 'snow') {
        this.addBlock(tx, SURFACE_Y, 'tex_snow', 'snow', true);
        for (let ty = SURFACE_Y+1; ty < WORLD_TILES_Y; ty++) {
          const depth = ty - SURFACE_Y;
          const rock = this.getUndergroundRock(depth, depth > 2 ? 'tex_stone' : 'tex_snow', depth > 2 ? 'stone' : 'snow');
          this.addBlock(tx, ty, rock.textureKey, rock.type, true);
        }
      } else if (biome === 'ocean') {
        // Ocean: no surface block, water from surface down to a sandy seafloor, stone below
        // Seafloor undulation per column
        const depth = 6 + Math.floor(rng()*4); // 6-9 tiles below surface
        const floorTy = SURFACE_Y + depth;
        // Place sandy floor
        this.addBlock(tx, floorTy, 'tex_sand', 'sand', true);
        // Below floor: progressively harder stone layers
        for (let ty = floorTy+1; ty < WORLD_TILES_Y; ty++) {
          const rock = this.getUndergroundRock(ty - SURFACE_Y);
          this.addBlock(tx, ty, rock.textureKey, rock.type, true);
        }
        // Water column from surface-1 down to just above floor
        for (let ty = SURFACE_Y-1; ty < floorTy; ty++) {
          const key = `${tx},${ty}`;
          const spr = this.blocks.get(key);
          if (spr) { spr.destroy(); this.blocks.delete(key); }
          this.addWater(tx, ty);
        }
      } else if (biome === 'volcanic') {
        const surface = this.addBlock(tx, SURFACE_Y, 'tex_stone', 'stone', true);
        surface?.setTint?.(0x9e5142);
        for (let ty=SURFACE_Y+1; ty<WORLD_TILES_Y; ty++) {
          const rock = this.getUndergroundRock(ty - SURFACE_Y);
          const stone = this.addBlock(tx, ty, rock.textureKey, rock.type, true);
          if (rock.type === 'stone') stone?.setTint?.(ty%3===0 ? 0x73403a : 0x82463d);
        }
      } else if (biome === 'wasteland') {
        this.addBlock(tx, SURFACE_Y, 'tex_sand', 'sand', true);
        for (let ty=SURFACE_Y+1; ty<WORLD_TILES_Y; ty++) {
          const depth = ty - SURFACE_Y;
          const rock = this.getUndergroundRock(depth, depth > 2 ? 'tex_sandstone' : 'tex_sand', depth > 2 ? 'stone' : 'sand');
          this.addBlock(tx, ty, rock.textureKey, rock.type, true);
        }
      } else if (biome === 'crystal') {
        const surface = this.addBlock(tx, SURFACE_Y, 'tex_stone', 'stone', true);
        surface?.setTint?.(0x514c83);
        for (let ty=SURFACE_Y+1; ty<WORLD_TILES_Y; ty++) {
          const rock = this.getUndergroundRock(ty - SURFACE_Y);
          const stone = this.addBlock(tx, ty, rock.textureKey, rock.type, true);
          if (rock.type === 'stone') stone?.setTint?.(ty%2 ? 0x403b6b : 0x4a4477);
        }
      } else { // forest
        this.addBlock(tx, SURFACE_Y, 'tex_ground', 'ground', true);
        for (let ty = SURFACE_Y+1; ty < WORLD_TILES_Y; ty++) {
          const depth = ty - SURFACE_Y;
          const rock = this.getUndergroundRock(depth, depth > 2 ? 'tex_stone' : 'tex_ground', depth > 2 ? 'stone' : 'ground');
          this.addBlock(tx, ty, rock.textureKey, rock.type, true);
        }
      }
    }

  // Create some underground water ponds in this chunk (rare in desert); none in ocean
  const ponds = biome === 'ocean' ? 0 : (biome === 'desert' ? (rng()<0.15?1:0) : Math.floor(rng()*2));
    for (let p=0; p<ponds; p++) {
      const pondW = 2 + Math.floor(rng()*3); // 2-4 tiles wide
      const pondX = startTx + 2 + Math.floor(rng() * Math.max(1, CHUNK_W - pondW - 4));
      const pondY = SURFACE_Y + 3 + Math.floor(rng() * Math.max(1, WORLD_TILES_Y - SURFACE_Y - 6));
      for (let i=0;i<pondW;i++) {
        const tx = pondX + i;
        const ty = pondY;
        const key = `${tx},${ty}`;
        // remove block and place water
        const spr = this.blocks.get(key);
        if (spr) { spr.destroy(); this.blocks.delete(key); }
        this.addWater(tx, ty);
      }
    }

    // The first landmarks are placed close enough to the spawn for testing;
    // farther out the same four types continue on a deterministic cycle.
    const structureBand = Math.abs(cx) % 11;
    let generatedFeature = null;
    if (dist > 1 && biome !== 'ocean' && !fixedBiome) {
      if (cx === 2) generatedFeature = 'palace';
      else if (cx === -2) generatedFeature = 'mine';
      else if (cx === 3) generatedFeature = 'mountain';
      else if (cx === -3) generatedFeature = 'zombie';
      else if (cx === 8) generatedFeature = 'robot';
      else if (cx === -8) generatedFeature = 'dragon';
      else if (cx === 9) generatedFeature = 'pirate';
      else if (structureBand === 1) generatedFeature = 'cave';
      else if (structureBand === 2) generatedFeature = 'mine';
      else if (structureBand === 3) generatedFeature = 'mountain';
      else if (structureBand === 4) generatedFeature = 'zombie';
      else if (structureBand === 5) generatedFeature = 'swamp';
      else if (structureBand === 6) generatedFeature = 'temple';
      else if (structureBand === 7) generatedFeature = 'crystal';
      else if (structureBand === 8) generatedFeature = 'lava';
      else if (structureBand === 9) generatedFeature = 'sky';
      else if (structureBand === 10) generatedFeature = 'ice';
      else if (structureBand === 0) generatedFeature = 'camp';
      else if (rng() < 0.16) generatedFeature = ['cave', 'mine', 'mountain', 'zombie', 'swamp', 'temple', 'crystal', 'lava', 'sky', 'ice', 'camp', 'palace', 'pirate', 'robot', 'dragon'][Math.floor(rng()*15)];
    }
    if (generatedFeature === 'palace') this.generatePalaceFeature(cx, rng);
    else if (generatedFeature === 'pirate') this.generatePirateCoveFeature(cx, rng);
    else if (generatedFeature === 'robot') this.generateRobotFactoryFeature(cx, rng);
    else if (generatedFeature === 'dragon') this.generateDragonNestFeature(cx, rng);
    else if (generatedFeature === 'cave') this.generateCaveFeature(cx, rng);
    else if (generatedFeature === 'mine') this.generateAbandonedMineFeature(cx, rng);
    else if (generatedFeature === 'mountain') this.generateMountainFeature(cx, biome, rng);
    else if (generatedFeature === 'zombie') this.generateZombieHideoutFeature(cx, rng);
    else if (generatedFeature === 'swamp') this.generateSwampFeature(cx, rng);
    else if (generatedFeature === 'temple') this.generateTempleFeature(cx, rng);
    else if (generatedFeature === 'crystal') this.generateCrystalCavernFeature(cx, rng);
    else if (generatedFeature === 'lava') this.generateLavaForgeFeature(cx, rng);
    else if (generatedFeature === 'sky') this.generateSkyRuinsFeature(cx, rng);
    else if (generatedFeature === 'ice') this.generateIcePalaceFeature(cx, rng);
    else if (generatedFeature === 'camp') this.generateBanditCampFeature(cx, rng);

    // Floating platforms above surface
    const plats = 6 + Math.floor(rng()*5);
    for (let i=0;i<plats;i++){
      const len = 2 + Math.floor(rng()*6);
      const px = startTx + 2 + Math.floor(rng() * Math.max(1, (CHUNK_W - len - 4)));
      const py = 6 + Math.floor(rng() * (SURFACE_Y - 8));
      const platTex = biome === 'desert' ? 'tex_sand' : (biome === 'snow' ? 'tex_snow' : 'tex_ground');
      const platType = biome === 'desert' ? 'sand' : (biome === 'snow' ? 'snow' : 'ground');
      for (let j=0;j<len;j++) this.addBlock(px+j, py, platTex, platType, true);
    }

    if (biome === 'desert') {
      // Cacti on surface
      const cacti = 4 + Math.floor(rng()*4);
      for (let i=0;i<cacti;i++){
        const tx = startTx + 2 + Math.floor(rng() * (CHUNK_W - 4));
        const baseTy = SURFACE_Y - 1;
        const height = 2 + Math.floor(rng()*3); // 2-4 tall
        for (let h=0; h<height; h++) this.addBlock(tx, baseTy - h, 'tex_cactus', 'cactus', true);
      }
    } else if (biome === 'forest') {
      // Trees on surface (forest)
      const trees = 3 + Math.floor(rng()*4);
      for (let i=0;i<trees;i++){
        const tx = startTx + 2 + Math.floor(rng() * (CHUNK_W - 4));
        const baseTy = SURFACE_Y - 1;
        const height = 3 + Math.floor(rng()*3);
        // 25% oak (tammi), 20% birch (koivu), otherwise regular trunk
        const roll = rng();
        const isTammi = roll < 0.25;
        const isKoivu = !isTammi && roll < 0.45;
        const trunkTex = isTammi ? 'tex_tammi' : (isKoivu ? 'tex_koivu' : 'tex_trunk');
        const trunkType = isTammi ? 'tammi' : (isKoivu ? 'koivu' : 'trunk');
        for (let h=0; h<height; h++) this.addBlock(tx, baseTy-h, trunkTex, trunkType, true);
        for (let lx=-2; lx<=2; lx++) for (let ly=-2; ly<=0; ly++) {
          if (Math.abs(lx)+Math.abs(ly) <= 3) this.addBlock(tx+lx, baseTy - height + ly, 'tex_leaves', 'leaves', false);
        }
        // Add a few horizontal branches sticking out from trunk; store perch spots
        const branchCount = 1 + Math.floor(rng()*3);
        for (let b=0;b<branchCount;b++){
          const by = baseTy - (1 + Math.floor(rng()*Math.max(1,height-1))); // height along trunk
          const dir = (rng()<0.5) ? -1 : 1;
          const blen = 1 + Math.floor(rng()*2); // 1-2 tiles
          const segments = [];
          for (let k=1;k<=blen;k++){
            const bx = tx + dir*k;
            // Avoid overwriting solid blocks; draw as decor image
            const x = bx*TILE + TILE/2, y = by*TILE + TILE/2;
            const img = this.add.image(x,y,'tex_branch').setDepth(3);
            img.setFlipX(dir<0);
            this.decor.add(img);
            this.chunks.get(cx)?.decor.push(img);
            segments.push({ tx: bx, ty: by, img });
          }
          // Perch spot at branch tip
          const ptx = tx + dir*blen; const pty = by;
          this.perchSpots.push({ tx: ptx, ty: pty });
          // Track under trunk anchor key (trunk tile coordinate at this height)
          const anchorKey = `${tx},${by}`;
          const arr = this.branches.get(anchorKey) || [];
          arr.push({ dir, segments });
          this.branches.set(anchorKey, arr);
        }
      }
    } else if (biome === 'snow') {
      // Sparse snowy trees: trunk with frosty leaves (tinted light)
      const trees = 2 + Math.floor(rng()*3);
      for (let i=0;i<trees;i++){
        const tx = startTx + 2 + Math.floor(rng() * (CHUNK_W - 4));
        const baseTy = SURFACE_Y - 1;
        const height = 3 + Math.floor(rng()*2);
        for (let h=0; h<height; h++) this.addBlock(tx, baseTy-h, 'tex_trunk', 'trunk', true);
        for (let lx=-2; lx<=2; lx++) for (let ly=-2; ly<=0; ly++) {
          if (Math.abs(lx)+Math.abs(ly) <= 3) {
            const leaf = this.addBlock(tx+lx, baseTy - height + ly, 'tex_leaves', 'leaves', false);
            try { leaf?.setTint?.(0xeef8ff); } catch(e) {}
          }
        }
      }
    } else if (biome === 'ocean') {
      // Spawn some fish within water column
      const fishCount = 3 + Math.floor(rng()*3);
      for (let i=0;i<fishCount;i++){
        const tx = startTx + 2 + Math.floor(rng() * (CHUNK_W - 4));
        const depth = 6 + Math.floor(rng()*4);
        const floorTy = SURFACE_Y + depth;
        const ty = (SURFACE_Y - 1) + Math.floor(rng() * Math.max(1, depth - 1));
        const x = tx*TILE + TILE/2;
        const y = ty*TILE + TILE/2;
        const f = this.fishes.create(x, y, 'tex_fish');
        f.setDepth(4);
        f._phase = rng()*Math.PI*2;
        f._dir = (rng()<0.5?-1:1);
        f.setVelocityX(f._dir * (40 + rng()*60));
        f.preUpdate = (t,dt)=>{
          Phaser.Physics.Arcade.Sprite.prototype.preUpdate.call(f,t,dt);
          // gentle bobbing
          f.setVelocityY(Math.sin((t+f._phase)*0.002)*22);
          // If outside water, flip direction
          const wtx = Math.floor(f.x / TILE), wty = Math.floor(f.y / TILE);
          if (!this.waterTiles.has(`${wtx},${wty}`)) {
            f._dir *= -1; f.setVelocityX(f._dir * Math.abs(f.body.velocity.x||60));
          }
        };
        this.chunks.get(cx)?.enemies.push(f);
      }
    }

    // Additional scenery for the named biomes (meadow, village, jungle, etc.).
    this.generateBiomeDecor(cx, biome, rng);

    // Seasonal decorations are added after biome scenery so they remain visible
    // when a chunk is generated during the event month.
    this.generateSeasonalChunkDecor(cx, biome, rng);

    // Gems (including some red)
    let reds = 0;
    for (let tx = startTx; tx <= endTx; tx++){
      if (rng() < 0.10) {
        const isRed = reds < 1 && rng() < 0.15; // at most one red per chunk
        const tex = isRed ? 'tex_red' : 'tex_diamond';
        if (isRed) reds++;
        const x = tx*TILE + TILE/2;
        const y = (SURFACE_Y-1)*TILE + TILE/2; // above ground
        const gem = this.pickups.create(x, y - TILE/2, tex);
        gem.body.setAllowGravity(false);
        gem.setScale(0.9);
        this.chunks.get(cx)?.pickups.push(gem);
      }
    }

    // Enemies per chunk
    // Bird
    if (biome !== 'ocean' && rng() < 0.8){
      const x = (startTx+Math.floor(rng()*CHUNK_W))*TILE + TILE/2;
      const y = 80 + rng() * (SURFACE_Y*TILE - 120);
      const bird = this.birds.create(x, y, 'tex_bird');
      bird.setVelocityX((rng()<0.5?-1:1) * (120 + rng()*120));
      bird.setBounce(1, 0);
      bird.setCollideWorldBounds(true);
      this.physics.add.collider(bird, this.platforms, (b)=>{ b.setVelocityY(-40); });
      this.chunks.get(cx)?.enemies.push(bird);
    }
    // Slime
    if (rng() < 0.9){
      const x = (startTx+Math.floor(rng()*CHUNK_W))*TILE + TILE/2;
      const y = (SURFACE_Y-2)*TILE - 20;
      const s = this.slimes.create(x, y, 'tex_slime');
    // Neutral animals on surface (daytime decoration)
    if (rng() < 0.7){
      const count = 1 + Math.floor(rng()*2);
      for (let i=0;i<count;i++){
        const tx = startTx + 2 + Math.floor(rng() * (CHUNK_W - 4));
        const x = tx*TILE + TILE/2;
        const y = (SURFACE_Y-2)*TILE - 10;
        const spec = this.pickBattleAnimalForBiome(biome, rng);
        const a = this.animals.create(x, y, this.getBattleAnimalTextureKey(spec.id));
        this.configureBattleAnimalSprite(a, spec, rng);
        this.chunks.get(cx)?.enemies.push(a); // reuse list for cleanup
      }
    }
      s.setBounce(0.1, 0.0);
      s.setCollideWorldBounds(true);
      s.setVelocityX(rng()<0.5?-80:80);
      s.body.setSize(24,16).setOffset(2,4);
      this.chunks.get(cx)?.enemies.push(s);
    }

    // Luonnossa voi löytyä harvinaisuudesta riippuvia aselaatikoita.
    this.spawnNatureGiftBox(cx, biome, rng);

    // Apply persistence diffs for this chunk
    this.applyWorldDiffForChunk(cx);

    // Ensure traps in this chunk are spawned
    if (Array.isArray(this.trapPositions)) {
      for (const p of this.trapPositions) {
        const tx=p.tx, ty=p.ty; if (Math.floor(tx/CHUNK_W)!==cx) continue;
        const key = `${tx},${ty}`;
        if (this.traps.has(key)) continue;
        const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
        const imgKey = p.textureKey || this.getTrapTextureKey(p.type);
        const img = this.add.image(x,y,imgKey).setDepth(4);
        const zone = this.add.zone(x,y,TILE*0.9,TILE*0.9); this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
        zone.setData('type','trap'); zone.setData('tx',tx); zone.setData('ty',ty);
        this.chunks.get(cx)?.decor.push(img); this.chunks.get(cx)?.decor.push(zone);
        this.traps.set(key, { image: img, zone, type: p.type, dir: p.dir||'right', nextAt: 0 });
        this.armTrapAt(tx, ty, p.type);
      }
    }

    this.currentChunk = null;
  }

  unloadChunk(cx){
    const data = this.chunks.get(cx);
    if (!data) { this.loadedChunks.delete(cx); return; }
    // Destroy blocks in this chunk
    for (const key of data.blocks) {
      const spr = this.blocks.get(key);
      this.blockDamage?.delete(key);
  if (spr) { if (spr.getData('type')==='cactus') this.cactusTiles.delete(key); spr.destroy(); this.blocks.delete(key); }
    }
  // Decor (also remove from water registry if water)
    for (const d of data.decor) {
      if (!d) continue;
      // try compute tile from position
  const tx = Math.floor(d.x / TILE);
  const ty = Math.floor(d.y / TILE);
      const k = `${tx},${ty}`;
      if (this.waterTiles.get(k) === d) this.waterTiles.delete(k);
  // if this decor was a portal image, clear its handle so it can be re-created on load
  const p = this.portals.get(k);
  if (p && p.image === d) { p.image = null; }
  if (p && p.zone === d) { p.zone = null; }
    // if this decor belonged to a slime cloner, clear its handles
    const sc = this.slimeCloners.get(k);
    if (sc && sc.image === d) { sc.image = null; }
    if (sc && sc.zone === d) { sc.zone = null; }
    // if this decor belonged to a soldier cloner, clear its handles
    const sc2 = this.soldierCloners?.get?.(k);
    if (sc2 && sc2.image === d) { sc2.image = null; }
    if (sc2 && sc2.zone === d) { sc2.zone = null; }
  // if this decor was a torch, clear handle
  const tt = this.torches.get(k);
  if (tt && tt.image === d) { tt.image = null; }
  // if this decor was a lightning rod, clear handle
  const rr = this.rods.get(k);
  if (rr && rr.image === d) { rr.image = null; }
  // if this decor belonged to any tower, clear its handles
  if (this.towers?.size) {
    for (const [tkey, tw] of this.towers) {
      if (!tw) continue;
      if (tw.body === d) tw.body = null;
      if (tw.head === d) tw.head = null;
      if (tw.soldier === d) tw.soldier = null;
      if (tw.zone === d) tw.zone = null;
    }
  }
      d.destroy();
    }
    // Pickups
    for (const p of data.pickups) p?.destroy();
    // Enemies
    for (const e of data.enemies) {
      if (!e) continue;
      if (e._eyes) { e._eyes.L?.destroy(); e._eyes.R?.destroy(); }
      e.destroy();
    }

    for (const [key, npc] of this.kingNpcs) {
      if (npc?.cx === cx) this.kingNpcs.delete(key);
    }
    for (const [key, npc] of this.carpenterNpcs) {
      if (npc?.cx === cx) this.carpenterNpcs.delete(key);
    }

    this.chunks.delete(cx);
    // Remove decor images in this chunk already handled above by destroying decor
    // Prune perch spots and branch anchors from this chunk
  this.perchSpots = this.perchSpots.filter(p=> Math.floor(p.tx/CHUNK_W) !== cx);
    for (const k of Array.from(this.branches.keys())){
      const [tx,ty] = k.split(',').map(Number);
      if (Math.floor(tx/CHUNK_W) === cx) this.branches.delete(k);
    }
  this.loadedChunks.delete(cx);
  }

  applyWorldDiffForChunk(cx){
    const startTx = cx*CHUNK_W, endTx = startTx+CHUNK_W-1;
    // Removed blocks
    if (Array.isArray(this.worldDiff.removed)) {
      for (const key of this.worldDiff.removed) {
        const [sx, sy] = key.split(',');
        const tx = Number(sx), ty = Number(sy);
        if (tx>=startTx && tx<=endTx) {
          const spr = this.blocks.get(key);
          if (spr) { spr.destroy(); this.blocks.delete(key); }
        }
      }
    }
    // Placed blocks
    if (Array.isArray(this.worldDiff.placed)) {
      for (const p of this.worldDiff.placed) {
        if (typeof p.tx !== 'number' || typeof p.ty !== 'number') continue;
        if (p.tx>=startTx && p.tx<=endTx) {
          const key = `${p.tx},${p.ty}`;
          if (this.blocks.has(key)) continue;
          this.addBlock(p.tx, p.ty, p.textureKey || 'tex_ground', p.type || 'plank', true);
        }
      }
    }

  // Portals in this chunk
    if (Array.isArray(this.portalPositions)) {
      for (const p of this.portalPositions) {
        if (p.tx>=startTx && p.tx<=endTx) {
          const key = `${p.tx},${p.ty}`;
          const existing = this.portals.get(key);
          if (existing?.image && existing.image.active) continue;
          const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
          const tex = this.textureForPortal(p.color||'blue');
          const img = this.add.image(x,y,tex).setDepth(4);
          this.decor.add(img);
          const zone = this.physics.add.staticImage(x,y,tex).setVisible(false);
          zone.setData('type','portal'); zone.setData('tx',p.tx); zone.setData('ty',p.ty); zone.setData('color',p.color||'blue');
          this.portalsGroup.add(zone);
          this.chunks.get(cx)?.decor.push(img);
          this.chunks.get(cx)?.decor.push(zone);
          if (existing) { existing.image = img; existing.zone = zone; existing.color = existing.color || (p.color||'blue'); }
          else this.portals.set(key, { color:p.color||'blue', image: img, zone });
        }
      }
    }
    // Slime cloners in this chunk
    if (Array.isArray(this.slimeClonerPositions)) {
      for (const p of this.slimeClonerPositions) {
        if (p.tx>=startTx && p.tx<=endTx) {
          const key = `${p.tx},${p.ty}`;
          const existing = this.slimeCloners.get(key);
          if (existing?.image && existing.image.active) continue;
          const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
          const img = this.add.image(x,y,'tex_slimecloner').setDepth(4);
          this.decor.add(img);
          const zone = this.add.zone(x, y, TILE*0.9, TILE*0.9);
          this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
          zone.setData('type','slimecloner'); zone.setData('tx',p.tx); zone.setData('ty',p.ty);
          this.physics.add.overlap(this.bullets, zone, (bullet, z)=>{ bullet.destroy(); this.removeSlimeClonerAt(z.getData('tx'), z.getData('ty')); this.saveState(); }, null, this);
          this.chunks.get(cx)?.decor.push(img);
          this.chunks.get(cx)?.decor.push(zone);
          if (existing) { existing.image = img; existing.zone = zone; }
          else this.slimeCloners.set(key, { tx:p.tx, ty:p.ty, image: img, zone, nextAt: this.time.now + 2500, count: 0 });
        }
      }
    }
    // Soldier cloners in this chunk
    if (Array.isArray(this.soldierClonerPositions)) {
      const startTx = cx*CHUNK_W, endTx = startTx+CHUNK_W-1;
      for (const p of this.soldierClonerPositions) {
        if (p.tx>=startTx && p.tx<=endTx) {
          const key = `${p.tx},${p.ty}`;
          const existing = this.soldierCloners.get(key);
          if (existing?.image && existing.image.active) continue;
          const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
          const img = this.add.image(x,y,'tex_soldiercloner').setDepth(4);
          const zone = this.add.zone(x, y, TILE*0.9, TILE*0.9);
          this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
          zone.setData('type','soldiercloner'); zone.setData('tx',p.tx); zone.setData('ty',p.ty);
          this.chunks.get(cx)?.decor.push(img);
          this.chunks.get(cx)?.decor.push(zone);
          if (existing) { existing.image = img; existing.zone = zone; }
          else this.soldierCloners.set(key, { image: img, zone, nextAt: this.time.now + 2500, count: 0 });
        }
      }
    }

    // Torches in this chunk
    if (Array.isArray(this.torchPositions)) {
      for (const p of this.torchPositions) {
        if (p.tx>=startTx && p.tx<=endTx) {
          const key = `${p.tx},${p.ty}`;
          const existing = this.torches.get(key);
          if (existing?.image && existing.image.active) continue;
          const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
          const img = this.add.image(x,y,'tex_torch').setDepth(4);
          this.decor.add(img);
          this.chunks.get(cx)?.decor.push(img);
          if (existing) { existing.image = img; }
          else {
            const flicker = { seed: Math.random()*Math.PI*2, speed: 2 + Math.random()*1.2, ampR: 0.05, ampA: 0.15 };
            this.torches.set(key, { image: img, flicker });
          }
        }
      }
    }
    // Campfires in this chunk
    if (Array.isArray(this.campfirePositions)) {
      for (const p of this.campfirePositions) {
        const cxp = Math.floor(p.tx/CHUNK_W);
        if (cxp !== cx) continue;
        const key = `${p.tx},${p.ty}`;
        const existing = this.campfires.get(key);
        if (existing && existing.image?.active) continue;
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
        const img = this.add.image(x,y,'tex_campfire').setDepth(4);
        this.decor.add(img);
        this.chunks.get(cx)?.decor.push(img);
        if (existing) { existing.image = img; }
        else {
          const flicker = { seed: Math.random()*Math.PI*2, speed: 2.2 + Math.random()*1.3, ampR: 0.08, ampA: 0.22 };
          this.campfires.set(key, { image: img, flicker });
        }
      }
    }
    // Furniture in this chunk
    if (Array.isArray(this.lampPositions)) {
      for (const p of this.lampPositions) {
        const cxp = Math.floor(p.tx/CHUNK_W);
        if (cxp !== cx) continue;
        const key = `${p.tx},${p.ty}`;
        const existing = this.lamps.get(key);
        if (existing && existing.image?.active) continue;
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
        const img = this.add.image(x,y,'tex_lamp').setDepth(4);
        this.lamps.set(key, { image: img });
        this.decor.add(img);
        this.chunks.get(cx)?.decor.push(img);
      }
    }
    if (Array.isArray(this.sofaPositions)) {
      for (const p of this.sofaPositions) {
        const cxp = Math.floor(p.tx/CHUNK_W);
        if (cxp !== cx) continue;
        const key = `${p.tx},${p.ty}`;
        const existing = this.sofas.get(key);
        if (existing && existing.image?.active) continue;
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
        const img = this.add.image(x,y,'tex_sofa').setDepth(4);
        this.sofas.set(key, { image: img });
        this.decor.add(img);
        this.chunks.get(cx)?.decor.push(img);
      }
    }
    if (Array.isArray(this.tablePositions)) {
      for (const p of this.tablePositions) {
        const cxp = Math.floor(p.tx/CHUNK_W);
        if (cxp !== cx) continue;
        const key = `${p.tx},${p.ty}`;
        const existing = this.tables.get(key);
        if (existing && existing.image?.active) continue;
        const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
        const img = this.add.image(x,y,'tex_table').setDepth(4);
        this.tables.set(key, { image: img });
        this.decor.add(img);
        this.chunks.get(cx)?.decor.push(img);
      }
    }
    if (Array.isArray(this.workstationPositions)) {
      for (const p of this.workstationPositions) {
        const cxp = Math.floor(p.tx / CHUNK_W);
        if (cxp !== cx) continue;
        this.spawnWorkstationAt(p.tx, p.ty, p.type);
      }
    }

    // Lightning rods in this chunk
    if (Array.isArray(this.rodPositions)) {
      for (const p of this.rodPositions) {
        if (p.tx>=startTx && p.tx<=endTx) {
          const key = `${p.tx},${p.ty}`;
          const existing = this.rods.get(key);
          if (existing?.image && existing.image.active) continue;
          const x = p.tx*TILE + TILE/2, y = p.ty*TILE + TILE/2;
          const img = this.add.image(x,y,'tex_rod').setDepth(4);
          this.decor.add(img);
          this.chunks.get(cx)?.decor.push(img);
          if (existing) { existing.image = img; if (typeof p.hp === 'number') existing.hp = p.hp; }
          else this.rods.set(key, { image: img, hp: (typeof p.hp === 'number' ? p.hp : 3) });
        }
      }
    }
    // Sniper towers in this chunk
    if (Array.isArray(this.towerPositions)) {
      for (const p of this.towerPositions) {
        if (p.tx>=startTx && p.tx<=endTx) {
          const key = `${p.tx},${p.ty}`;
          const existing = this.towers.get(key);
          if (existing && existing.head && existing.head.active) continue;
          const x = p.tx*TILE + TILE/2;
          const yBase = p.ty*TILE + TILE/2;
          const body = this.add.image(x, yBase + TILE/2, 'tex_tower_body').setDepth(4).setOrigin(0.5, 1.0);
          const head = this.add.image(x, yBase - TILE*2, 'tex_tower_gun').setDepth(5).setOrigin(0.4, 0.5);
          const soldier = this.add.image(x, yBase - TILE*2 - 2, 'tex_soldier').setDepth(5).setOrigin(0.5, 1.0);
          const zone = this.add.zone(x, yBase - TILE, TILE, TILE*3);
          this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
          zone.setData('type','tower'); zone.setData('tx',p.tx); zone.setData('ty',p.ty);
          this.chunks.get(cx)?.decor.push(body);
          this.chunks.get(cx)?.decor.push(head);
          this.chunks.get(cx)?.decor.push(soldier);
          this.chunks.get(cx)?.decor.push(zone);
          if (existing) { existing.body = body; existing.head = head; existing.soldier = soldier; existing.zone = zone; }
          else this.towers.set(key, { body, head, soldier, zone, nextAt: 0 });
        }
      }
    }
  }

  // --- Mörkö boss helpers ---
  trySpawnBossNearPlayer(){
    // choose a chunk within +/-1 of center to reduce pop-in
    const pcx = Math.floor((this.player.x / TILE) / CHUNK_W);
    const candidates = [pcx-1, pcx, pcx+1].filter(cx=> this.loadedChunks.has(cx));
    if (!candidates.length) return;
    // try a few times to find a cave spot
    for (let attempt=0; attempt<3; attempt++){
      const cx = candidates[Math.floor(Math.random()*candidates.length)];
      const spot = this.findCaveSpot(cx, 4, 4);
      if (spot) {
        const bossId = BOSS_DEFS[Math.floor(Math.random()*BOSS_DEFS.length)].id;
        this.spawnBossAt(spot.tx, spot.ty, bossId);
        return;
      }
    }
  }

  findCaveSpot(cx, wTiles, hTiles){
    const startTx = cx*CHUNK_W; const endTx = startTx+CHUNK_W-1;
    // search underground only
    for (let tries=0; tries<80; tries++){
      const tx0 = startTx + 2 + Math.floor(Math.random() * Math.max(1, CHUNK_W - wTiles - 4));
      const ty0 = SURFACE_Y + 2 + Math.floor(Math.random() * Math.max(1, WORLD_TILES_Y - SURFACE_Y - hTiles - 2));
      let free = true;
      for (let ox=0; ox<wTiles && free; ox++){
        for (let oy=0; oy<hTiles; oy++){
          if (this.hasSolidBlockAt(tx0+ox, ty0+oy)) { free=false; break; }
        }
      }
      if (free) return { tx: tx0, ty: ty0 };
    }
    return null;
  }

  spawnBossAt(tx, ty, bossId='morko'){
    const bossSpec = BOSS_MAP[bossId] || BOSS_MAP.morko;
    const x = tx*TILE + (TILE*2);
    const y = ty*TILE + (TILE*2);
    const s = this.bosses.create(x, y, bossSpec.texture);
    s.setImmovable(true);
    s.body.setAllowGravity(false);
    s.setDepth(6);
    s.setData('bossType', bossSpec.id);
    s._bossType = bossSpec.id;
    // big hitbox covering 4x4 tiles
    s.body.setSize(TILE*4-6, TILE*4-6).setOffset(3,3);
    s._hp = bossSpec.hp;
    this.setupMobHealth(s, 'boss', bossSpec.hp);
  // Eye pupils as separate images to follow player
  // compute precise eye centers from texture (0.32/0.68, 0.28 of sprite)
  const bw = TILE*4, bh = TILE*4;
  const eyeOffsetL = { x: bw*(0.32 - 0.5), y: bh*(0.28 - 0.5) };
  const eyeOffsetR = { x: bw*(0.68 - 0.5), y: bh*(0.28 - 0.5) };
  const pupilL = this.add.image(s.x + eyeOffsetL.x, s.y + eyeOffsetL.y, 'tex_pupil').setDepth(7);
  const pupilR = this.add.image(s.x + eyeOffsetR.x, s.y + eyeOffsetR.y, 'tex_pupil').setDepth(7);
  // radius 8px keeps pupils inside 14px eyeballs (pupil radius ~5)
  s._eyes = { L: pupilL, R: pupilR, offL: eyeOffsetL, offR: eyeOffsetR, radius: 8 };
    // add to chunk enemies for lifecycle
    const cx = Math.floor(tx / CHUNK_W);
    this.chunks.get(cx)?.enemies.push(s);
    // small spawn flash
    const gfx = this.add.graphics().setDepth(7);
    gfx.fillStyle(0x8844ff,0.25); gfx.fillRect(x-TILE*2, y-TILE*2, TILE*4, TILE*4);
    this.time.delayedCall(180,()=>gfx.destroy());
  }

  damageBoss(boss, amount){
    if (!boss || !boss.active) return;
    const bossSpec = BOSS_MAP[boss._bossType] || BOSS_MAP.morko;
    boss._hp = Math.max(0, (boss._hp||6) - amount);
    this.updateMobHealthUI(boss);
    // hit flash
    boss.setTintFill(0xffffff);
    this.time.delayedCall(60, ()=> boss.clearTint());
  if (boss._hp <= 0) {
  const x=boss.x, y=boss.y; if (boss._eyes){ boss._eyes.L?.destroy(); boss._eyes.R?.destroy(); }
  boss.destroy();
      // loot shower and one-time boss rewards
      this.dropCoins(x, y, 8 + Math.floor(bossSpec.hp / 3));
      this.grantBossRewards(bossSpec, x, y);
    }
  }

  grantBossRewards(bossSpec, x, y) {
    const firstVictory = !this.achievements?.[bossSpec.id];
    if (firstVictory) {
      this.achievements[bossSpec.id] = true;
      if (bossSpec.rewardWeapon && this.tools?.owned) this.tools.owned[bossSpec.rewardWeapon] = true;
      if (bossSpec.rewardArmor && BOOST_ARMOR_MAP[bossSpec.rewardArmor]) {
        this.boostArmor = bossSpec.rewardArmor;
        this.updateBoostArmorVisual?.();
      }
      this.state.coins += bossSpec.rewardCoins || 0;
      this.state.health = MAX_HEALTH;
      this.spawnPickup(x - TILE, y - TILE, 'tex_red');
      this.spawnPickup(x + TILE, y - TILE, 'tex_diamond');
      const weaponName = BOOST_WEAPON_MAP[bossSpec.rewardWeapon]?.name || bossSpec.rewardWeapon;
      const armorName = BOOST_ARMOR_MAP[bossSpec.rewardArmor]?.name || bossSpec.rewardArmor;
      this.showToast?.(`SAAVUTUS: ${bossSpec.achievement}! Sait ${weaponName} ja ${armorName}`);
    } else {
      this.showToast?.(`Voitit bossin: ${bossSpec.name}!`);
    }
    this.updateBossAchievementsUI();
    this.updateToolSelect?.();
    this.updateBoostArmorSelect?.();
    this.updateUI();
    this.saveState();
  }

  // Merchant helpers
  createMerchant(){
    const tx = 12; const ty = SURFACE_Y - 1;
    const x = tx*TILE + TILE/2; const y = ty*TILE + TILE/2 - 10;
    this.add.image(x, y-8, 'tex_merchant').setDepth(5);
    // interaction zone
    this.merchantZone = this.add.zone(x, y, 90, 80);
    this.physics.world.enable(this.merchantZone, Phaser.Physics.Arcade.STATIC_BODY);
    this.physics.add.overlap(this.player, this.merchantZone, ()=>{
      this.nearMerchant = true;
      if (this.merchantPrompt) this.merchantPrompt.setPosition(x, y-40).setVisible(true);
    }, null, this);
    // prompt
    this.merchantPrompt = this.add.text(x, y-40, 'E: Kauppias', { fontFamily:'monospace', fontSize:'14px', color:'#fff', backgroundColor:'#0008' }).setPadding(4,2).setDepth(1000).setVisible(false);
  }

  // Moped helpers
  createMoped(){
    const tx = 14; const ty = SURFACE_Y - 1;
    const x = tx*TILE + TILE/2; const y = ty*TILE + TILE/2;
  this.updateMopedAppearance();
  const s = this.add.image(x, y, 'tex_moped_dyn').setDepth(4);
  s.setScale(1.6);
    this.moped.sprite = s; this.moped.pos = { x, y };
    const z = this.add.zone(x, y, 80, 60);
    this.physics.world.enable(z, Phaser.Physics.Arcade.STATIC_BODY);
    this.physics.add.overlap(this.player, z, ()=>{
      this.nearMoped = true;
      if (!this.moped.prompt) this.moped.prompt = this.add.text(0,0,'F: Mopo', { fontFamily:'monospace', fontSize:'12px', color:'#fff', backgroundColor:'#0008' }).setPadding(4,2).setDepth(1000);
      this.moped.prompt.setPosition(s.x, s.y - 38).setVisible(!this.moped.mounted);
    }, null, this);
  }
  toggleMoped(){
    this.moped.mounted = !this.moped.mounted;
    if (this.moped.mounted) {
      // Hide prompt and stash pos
      this.moped.prompt?.setVisible(false);
      this.moped.pos = { x: this.moped.sprite.x, y: this.moped.sprite.y };
    } else {
      // Drop moped at player feet
      this.moped.pos = { x: this.player.x, y: this.player.y+10 };
      this.moped.sprite.setPosition(this.moped.pos.x, this.moped.pos.y);
    }
  }

  updateMopedAppearance(){
    const key = 'tex_moped_dyn';
    if (this.textures.exists(key)) this.textures.remove(key);
    const g = this.add.graphics();
    // draw base
    g.fillStyle(0xffffff,1); g.fillRect(0,0,32,26); // clear bg
    g.alpha = 1; g.fillStyle(0x000000,0);
    g.generateTexture('__blank',1,1); g.clear();
    // base image
    const base = this.textures.get('tex_moped_base').getSourceImage();
    const rt = this.add.renderTexture(0,0,32,26);
    rt.draw(base,0,0);
    // color body rectangle (matches body area 8..22 x 6..14)
    const col = (typeof this.moped.color==='string' && this.moped.color.startsWith('#')) ? parseInt(this.moped.color.slice(1),16) : (this.moped.color||0xff6a00);
    const cg = this.add.graphics(); cg.fillStyle(col,1); cg.fillRect(8,6,14,8); rt.draw(cg,0,0); cg.destroy();
    // decal
    let decalKey = null;
    if (this.moped.decal === 'skull') decalKey = 'tex_decal_skull';
    else if (this.moped.decal === 'pistol') decalKey = 'tex_decal_pistol';
    else if (this.moped.decal === 'triangle') decalKey = 'tex_decal_triangle';
    else if (this.moped.decal === 'square') decalKey = 'tex_decal_square';
    if (decalKey) rt.draw(this.textures.get(decalKey).getSourceImage(), 12, 6);
    // export
    rt.saveTexture(key);
    rt.destroy(); g.destroy();
    // Refresh current sprite texture if exists
    if (this.moped?.sprite?.active && this.moped.sprite.scene?.sys && this.textures.exists(key)) {
      const sc = this.moped.sprite.scale || 1.6;
      this.moped.sprite.setTexture(key);
      this.moped.sprite.setScale(sc);
    }
  }

  openMerchant(){
    document.getElementById('merchant')?.classList.remove('hidden');
    this._refreshMerchantAnimalShop();
  }

  _refreshMerchantAnimalShop(){
    const containers = [
      document.getElementById('merchantAnimalShop'),
      document.getElementById('settingsAnimalShop')
    ].filter(Boolean);
    if (!containers.length) return;
    // Valitaan 3 eläintä deterministisesti päivän ja peliajan mukaan
    const allIds = BATTLE_ANIMAL_SPECS.map(s=>s.id);
    const seed = (Math.floor(Date.now()/86400000) + (this.battle.wins||0)) % allIds.length;
    const picks = [];
    for (let i=0;i<3;i++) picks.push(allIds[(seed + i*7) % allIds.length]);

    containers.forEach((container)=>{
      container.innerHTML = '';
      picks.forEach((id)=>{
        const spec = BATTLE_ANIMAL_MAP[id];
        if (!spec) return;
        const owned = this.battle.collection[id] || 0;
        const row = document.createElement('div');
        row.className = 'merchant-animal-row';

        const name = document.createElement('span');
        name.className = 'merchant-animal-name';
        name.textContent = spec.name;

        const ownedText = document.createElement('small');
        ownedText.textContent = `omistettu: ${owned}`;
        name.appendChild(ownedText);

        const buyButton = document.createElement('button');
        buyButton.type = 'button';
        buyButton.dataset.animalid = id;
        buyButton.textContent = 'Osta 5 kolikkoa';
        buyButton.addEventListener('click', () => this.buyBattleAnimal(id, 5));

        row.appendChild(name);
        row.appendChild(buyButton);
        container.appendChild(row);
      });
    });
  }
  closeMerchant(){ document.getElementById('merchant')?.classList.add('hidden'); }

  // Health/damage and save/load
  damage(amount, opts = {}){
    if (this.isDead) return;
    if (this.builderMode) return; // Rakennustila on vahinkovapaa.
    const mountedAnimal = this.specialAnimals?.[this.mountedSpecialAnimal];
    if (mountedAnimal?.invincibleRider) {
      if (this.time.now >= (mountedAnimal._protectToastAt || 0)) {
        mountedAnimal._protectToastAt = this.time.now + 900;
        this.showToast?.(`${mountedAnimal.name} suojasi sinua`);
      }
      return;
    }
    // Shield gates damage while active
    if (!opts.ignoreShield && (this.itemBag?.shieldUntil||0) > this.time.now) {
      // small visual pulse
      try{
        if (!this._shieldFx) this._shieldFx = this.add.graphics().setDepth(7);
        const g=this._shieldFx; g.lineStyle(4,0x9ad3ff,1.0); g.strokeCircle(this.player.x, this.player.y, 28);
        this.time.delayedCall(80, ()=>{ try{ g.clear(); }catch(_){} });
        window.playSfx?.('shield');
      }catch(_){ }
      return; // no damage applied
    }
    if (!opts.ignoreDroneShield && this.droneShieldUntil > this.time.now) {
      amount = Math.max(1, Math.ceil(amount * 0.5));
    }
    this.state.health = Math.max(0, this.state.health - amount);
    window.playSfx?.('hit');
    this.updateUI();
    if (this.state.health <= 0) {
      this.handlePlayerDeath(opts.reason || 'damage');
    } else {
      this.saveState();
    }
  }

  handlePlayerDeath(reason='damage'){
    if (this.isDead) return;
    this.isDead = true;
    this.started = false;
    this.isPaused = true;
    this.physics.world.isPaused = true;
    this.player?.setVelocity?.(0,0);
    this.state.health = MAX_HEALTH;
    this.showToast(reason === 'drown' ? 'Hukuit!' : 'Kuolit!');
    window.playSfx?.('death');
    this.showDeathBanner();
    document.getElementById('pauseScreen')?.classList.add('hidden');
    document.getElementById('deathScreen')?.classList.remove('hidden');
    this.updateUI();
  }

  showDeathBanner(){
    const cam = this.cameras.main;
    const cx = cam.width/2, cy = cam.height/2;
    // Camera effects
    cam.flash(220, 255, 32, 32); // reddish flash
    cam.shake(250, 0.01);

    // Ensure container and graphics
    if (!this.deathContainer) {
      this.deathContainer = this.add.container(0,0).setScrollFactor(0).setDepth(2000).setVisible(false);
      this.deathGfx = this.add.graphics().setScrollFactor(0).setDepth(2000);
      this.deathText = this.add.text(0,0,'KUOLIT!', { fontFamily:'monospace', fontSize:'48px', color:'#ffffff' })
        .setOrigin(0.5)
        .setStroke('#000000', 8)
        .setShadow(4,4,'#000000', 8, true, true);
      this.deathContainer.add([this.deathGfx, this.deathText]);
    }

    // Draw vignette overlay
    this.deathGfx.clear();
    this.deathGfx.fillStyle(0x550000, 0.45);
    this.deathGfx.fillRect(0, 0, cam.width, cam.height);
    this.deathGfx.lineStyle(6, 0xaa2222, 0.35);
    for (let r=60; r<=Math.max(cam.width, cam.height); r+=120){
      this.deathGfx.strokeCircle(cx, cy, r);
    }

    // Place text and animate
    this.deathText.setPosition(cx, cy).setScale(0.6).setAngle(0);
    this.deathContainer.setVisible(true);
    this.tweens.add({ targets: this.deathText, scale: { from: 0.6, to: 1.3 }, angle: { from: -4, to: 4 }, yoyo: true, repeat: 1, duration: 220, ease: 'Quad.easeOut' });

    const burst = this.add.graphics().setScrollFactor(0).setDepth(2001);
    burst.fillStyle(0xff4444, 0.75);
    for (let i=0; i<28; i++) {
      const angle = (Math.PI * 2 * i) / 28;
      const radius = 36 + (i % 5) * 18;
      burst.fillCircle(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 3 + (i % 3));
    }
    this.tweens.add({ targets: burst, alpha: 0, duration: 700, ease: 'Quad.easeOut', onComplete: ()=> burst.destroy() });

    // Hide FX after delay
  this.time.delayedCall(1600, ()=>{
      this.deathContainer?.setVisible(false);
      this.deathGfx?.clear();
    });

    // DOM overlay (backup, with higher z-index)
    if (!this.deathDom) {
      const el = document.createElement('div');
      el.id = 'deathBanner';
      el.textContent = 'KUOLIT!';
      el.style.position = 'absolute';
      el.style.left = '50%';
      el.style.top = '50%';
      el.style.transform = 'translate(-50%, -50%)';
      el.style.zIndex = '2147483647';
      el.style.padding = '12px 16px';
      el.style.borderRadius = '8px';
      el.style.fontFamily = 'monospace';
      el.style.fontSize = '40px';
      el.style.color = '#fff';
      el.style.background = 'linear-gradient(135deg, rgba(200,0,0,0.85), rgba(120,0,0,0.85))';
      el.style.boxShadow = '0 6px 24px rgba(0,0,0,0.6)';
      el.style.pointerEvents = 'none';
      el.style.opacity = '0';
      el.style.transition = 'opacity 140ms ease-in-out';
      const parent = document.getElementById('gameContainer') || document.body;
      // Ensure parent is stacking context top
      if (parent === document.getElementById('gameContainer')) {
        parent.style.position = parent.style.position || 'relative';
      }
      parent.appendChild(el);
      this.deathDom = el;
    }
    this.deathDom.style.display = 'block';
    try { console.log('DeathBanner: show'); } catch(e) {}
    setTimeout(()=>{ if (this.deathDom) this.deathDom.style.opacity = '1'; }, 0);
    setTimeout(()=>{
      if (!this.deathDom) return;
      this.deathDom.style.opacity = '0';
      setTimeout(()=>{ if (this.deathDom) this.deathDom.style.display = 'none'; }, 180);
  }, 1100);
  }

  saveState(){
    const data = { health: this.state.health, coins: this.state.coins, canFly: this.state.canFly, bounceShoes: this.state.bounceShoes, builderMode: this.builderMode, performanceMode: this.performanceMode, achievements: this.achievements, giftBoxOpenings: this.giftBoxOpenings, inv: this.inv, worldDiff: this.worldDiff, tools: this.tools, weaponSkins: this.weaponSkins, droneType: this.droneType, droneSkin: this.droneSkin, boostArmor: this.boostArmor, buildBlock: this.building?.block || 'plank', outfit: this.custom.outfit, cannons: this.cannonPositions, portals: this.portalPositions, slimeCloners: this.slimeClonerPositions, soldierCloners: this.soldierClonerPositions, tankCloners: this.tankClonerPositions, torches: this.torchPositions, campfires: this.campfirePositions, mines: this.minePositions, rods: this.rodPositions, towers: this.towerPositions, traps: this.trapPositions, lamps: this.lampPositions, sofas: this.sofaPositions, tables: this.tablePositions, workstations: this.workstationPositions, weather: this.weather, moped: { color: this.moped.color, decal: this.moped.decal }, mode: this.mode?.current || 'classic', upgrades: this.upgrades, hunger: this.hunger, food: this.food, itemBag: this.itemBag, adventure: this.adventureProgress, battle: { collection: this.battle.collection, team: this.battle.team, wins: this.battle.wins, losses: this.battle.losses, wave: this.battle.wave } };
    try {
      const wid = window.localStorage.getItem('UAG_worldCurrent') || 'world-1';
      localStorage.setItem(`UAG_save_${wid}`, JSON.stringify(data));
    } catch(e) {}
  }

  loadState(){
    try {
      // ensure current world exists
      let wid = localStorage.getItem('UAG_worldCurrent');
      if (!wid) {
        // bootstrap world list
        const listRaw = localStorage.getItem('UAG_worlds');
        let worlds = [];
        try { worlds = listRaw ? JSON.parse(listRaw) : []; } catch(e) { worlds = []; }
        wid = 'world-1';
        if (!worlds.includes(wid)) { worlds.push(wid); localStorage.setItem('UAG_worlds', JSON.stringify(worlds)); }
        localStorage.setItem('UAG_worldCurrent', wid);
      }
      let raw = localStorage.getItem(`UAG_save_${wid}`);
      // Migration: if no world-specific save but legacy save exists, adopt it
      if (!raw) {
        const legacy = localStorage.getItem('UAG_save');
        if (legacy) {
          try { localStorage.setItem(`UAG_save_${wid}`, legacy); } catch(e) {}
          raw = legacy;
        }
      }
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.health === 'number') this.state.health = Math.max(0, Math.min(MAX_HEALTH, d.health));
      if (typeof d.coins === 'number') this.state.coins = d.coins >= 1e18 ? 0 : d.coins;
  if (typeof d.canFly === 'boolean') this.state.canFly = d.canFly;
  if (typeof d.bounceShoes === 'boolean') this.state.bounceShoes = d.bounceShoes;
  if (typeof d.builderMode === 'boolean') this.builderMode = d.builderMode;
  if (typeof d.performanceMode === 'boolean') this.performanceMode = d.performanceMode;
  if (d.achievements && typeof d.achievements === 'object') {
    this.achievements = Object.fromEntries(
      BOSS_DEFS.filter((boss) => d.achievements[boss.id]).map((boss) => [boss.id, true])
    );
  }
  if (Array.isArray(d.giftBoxOpenings)) {
    this.giftBoxOpenings = d.giftBoxOpenings.filter((key) => typeof key === 'string').slice(-20000);
  }
      if (d.inv) {
        this.inv.wood = d.inv.wood || 0;
        this.inv.plank = d.inv.plank || 0;
        this.inv.stone = d.inv.stone || 0;
      }
  if (BUILD_BLOCK_IDS.includes(d.buildBlock)) this.building.block = d.buildBlock;
  if (d.worldDiff) {
        if (Array.isArray(d.worldDiff.removed)) this.worldDiff.removed = d.worldDiff.removed.slice(0, 20000);
        if (Array.isArray(d.worldDiff.placed)) this.worldDiff.placed = d.worldDiff.placed.slice(0, 20000);
      }
  if (Array.isArray(d.cannons)) this.cannonPositions = d.cannons.slice(0, 2000);
  if (Array.isArray(d.portals)) this.portalPositions = d.portals.slice(0, 5000);
  if (Array.isArray(d.slimeCloners)) this.slimeClonerPositions = d.slimeCloners.slice(0, 1000);
  if (Array.isArray(d.soldierCloners)) this.soldierClonerPositions = d.soldierCloners.slice(0, 1000);
  if (Array.isArray(d.tankCloners)) this.tankClonerPositions = d.tankCloners.slice(0, 1000);
  if (Array.isArray(d.torches)) this.torchPositions = d.torches.slice(0, 3000);
  if (Array.isArray(d.campfires)) this.campfirePositions = d.campfires.slice(0, 2000);
  if (Array.isArray(d.lamps)) this.lampPositions = d.lamps.slice(0, 3000);
  if (Array.isArray(d.sofas)) this.sofaPositions = d.sofas.slice(0, 3000);
  if (Array.isArray(d.tables)) this.tablePositions = d.tables.slice(0, 3000);
  if (Array.isArray(d.workstations)) this.workstationPositions = d.workstations.slice(0, 3000);
  if (Array.isArray(d.traps)) this.trapPositions = d.traps.slice(0, 3000);
  if (Array.isArray(d.mines)) this.minePositions = d.mines.slice(0, 3000);
  if (Array.isArray(d.rods)) this.rodPositions = d.rods.slice(0, 2000);
  if (Array.isArray(d.towers)) this.towerPositions = d.towers.slice(0, 2000);
  if (d.weather) { this.weather.isStorm = !!d.weather.isStorm; this.weather.nextLightningAt = d.weather.nextLightningAt||0; this.weather.nextStormCheckAt = d.weather.nextStormCheckAt||0; this.weather.stormEndsAt = d.weather.stormEndsAt||0; }
  // Migration: convert legacy doors to portals (closed doors -> blue portals at same tile)
  if (Array.isArray(d.doors)) {
    this.portalPositions = (this.portalPositions||[]).concat(d.doors.slice(0,5000).map(x=>({ tx:x.tx, ty:x.ty, color:'blue' })));
  }
  if (d.tools) {
    this.tools = { ...this.tools, ...d.tools, owned: { ...this.tools.owned, ...(d.tools.owned || {}) } };
  }
  if (d.weaponSkins && typeof d.weaponSkins === 'object') {
    this.weaponSkins = Object.fromEntries(
      Object.entries(d.weaponSkins).filter(([weapon, skin]) => WEAPON_SKIN_BASES.has(weapon) && this.isWeaponSkinAvailable(weapon, skin))
    );
  }
  if (d.droneType && DRONE_MAP[d.droneType]) this.droneType = d.droneType;
  if (d.droneSkin && DRONE_SKIN_DEFS[d.droneSkin]) this.droneSkin = d.droneSkin;
  if (d.boostArmor && BOOST_ARMOR_MAP[d.boostArmor]) this.boostArmor = d.boostArmor;
  // These two custom weapons are available in every save, including older saves.
  this.tools.owned.dakkerssit = true;
  this.tools.owned.caran_bitti = true;
  WORKSTATION_DEFS.forEach((station) => {
    if (typeof this.tools.owned[station.id] !== 'boolean') this.tools.owned[station.id] = true;
  });
  if (d.mode) this.mode.current = d.mode;
  if (d.upgrades) this.upgrades = d.upgrades;
  if (d.hunger) { this.hunger.value = Math.max(0, Math.min(d.hunger.value||0, this.hunger.max)); }
  if (d.food) { this.food.meat = d.food.meat||0; }
  if (d.itemBag) {
    this.itemBag.glider = !!d.itemBag.glider;
    this.itemBag.jetpack = !!d.itemBag.jetpack;
    this.itemBag.invis = !!d.itemBag.invis;
    delete this.itemBag.timeCdUntil;
    delete this.itemBag.timeActiveUntil;
    this._timeStopped = false;
    this.itemBag.speedUntil = d.itemBag.speedUntil||0;
    this.itemBag.shieldUntil = d.itemBag.shieldUntil||0;
    this.itemBag.decoyUntil = d.itemBag.decoyUntil||0;
  }
  if (d.adventure && typeof d.adventure === 'object') {
    const a = d.adventure;
    this.adventureProgress.xp = Math.max(0, Number(a.xp) || 0);
    this.adventureProgress.level = Math.max(1, Math.floor(Number(a.level) || 1));
    this.adventureProgress.quests = (a.quests && typeof a.quests === 'object') ? { ...a.quests } : {};
    this.adventureProgress.stats = (a.stats && typeof a.stats === 'object') ? { ...a.stats } : {};
    this.adventureProgress.completedQuests = Array.isArray(a.completedQuests) ? a.completedQuests.filter((id) => typeof id === 'string') : [];
    this.adventureProgress.openedChests = Array.isArray(a.openedChests) ? a.openedChests.filter((id) => typeof id === 'string') : [];
    this.adventureProgress.collectedCrystals = Array.isArray(a.collectedCrystals) ? a.collectedCrystals.filter((id) => typeof id === 'string') : [];
    this.adventureProgress.activatedCheckpoints = Array.isArray(a.activatedCheckpoints) ? a.activatedCheckpoints.filter((id) => typeof id === 'string') : [];
    this.adventureProgress.dailyClaimed = typeof a.dailyClaimed === 'string' ? a.dailyClaimed : '';
    if (a.respawn && Number.isFinite(Number(a.respawn.x)) && Number.isFinite(Number(a.respawn.y))) {
      this.adventureProgress.respawn = { x: Number(a.respawn.x), y: Number(a.respawn.y) };
      this.respawnPoint = { ...this.adventureProgress.respawn };
    }
  }
  if (d.battle) {
    const validIds = new Set(BATTLE_ANIMAL_SPECS.map((spec)=> spec.id));
    const nextCollection = {};
    Object.entries(d.battle.collection || {}).forEach(([id, count])=>{
      if (validIds.has(id) && typeof count === 'number' && count > 0) nextCollection[id] = Math.floor(count);
    });
    this.battle.collection = nextCollection;
    if (Array.isArray(d.battle.team)) {
      const used = {};
      this.battle.team = [];
      d.battle.team.forEach((id)=>{
        if (!validIds.has(id)) return;
        used[id] = used[id] || 0;
        if (used[id] >= (nextCollection[id] || 0)) return;
        used[id] += 1;
        this.battle.team.push(id);
      });
    } else {
      this.battle.team = [];
    }
    this.battle.wins = Math.max(0, d.battle.wins || 0);
    this.battle.losses = Math.max(0, d.battle.losses || 0);
    this.battle.wave = Math.max(1, d.battle.wave || 1);
  }
  // Ensure pistol, cannon, minigun, knife, sniper & bazooka exist for older saves
  if (!this.tools.owned?.pistol) this.tools.owned.pistol = true;
  if (!this.tools.owned?.cannon) this.tools.owned.cannon = true;
  if (!this.tools.owned?.minigun) this.tools.owned.minigun = true;
  if (!this.tools.owned?.knife) this.tools.owned.knife = true;
  if (!this.tools.owned?.sniper) this.tools.owned.sniper = true;
  if (!this.tools.owned?.bazooka) this.tools.owned.bazooka = true;
  if (!this.tools.owned?.tnt) this.tools.owned.tnt = true;
  if (!this.tools.owned?.mop) this.tools.owned.mop = true;
  if (!this.tools.owned?.roller_skates) this.tools.owned.roller_skates = true;
  if (!this.tools.owned?.trident) this.tools.owned.trident = true;
  BOOST_WEAPON_SPECS.forEach((spec) => {
    if (!this.tools.owned?.[spec.id]) this.tools.owned[spec.id] = true;
  });
  NORMAL_WEAPON_SPECS.forEach((spec) => {
    if (!this.tools.owned?.[spec.id]) this.tools.owned[spec.id] = true;
  });
  // Ensure grenade exists for older saves
  if (!this.tools.owned?.grenade) this.tools.owned.grenade = true;
  // Ensure nuke exists for older saves
  if (!this.tools.owned?.nuke) this.tools.owned.nuke = true;
  // Ensure plane exists for older saves
  if (!this.tools.owned?.plane) this.tools.owned.plane = true;
  if (!this.tools.owned?.cloner) this.tools.owned.cloner = true;
  if (!this.tools.owned?.slimecloner) this.tools.owned.slimecloner = true;
  if (!this.tools.owned?.soldiercloner) this.tools.owned.soldiercloner = true;
  if (!this.tools.owned?.torch) this.tools.owned.torch = true;
  if (!this.tools.owned?.tankcloner) this.tools.owned.tankcloner = true;
  // Ensure new tools exist for older saves
  if (!this.tools.owned?.wizard) this.tools.owned.wizard = true;
  if (!this.tools.owned?.flame) this.tools.owned.flame = true;
  if (!this.tools.owned?.pamppu) this.tools.owned.pamppu = true;
  if (!this.tools.owned?.ak47) this.tools.owned.ak47 = true;
  if (!this.tools.owned?.bow) this.tools.owned.bow = true;
  if (!this.tools.owned?.spear) this.tools.owned.spear = true;
  if (!this.tools.owned?.boomerang) this.tools.owned.boomerang = true;
  if (!this.tools.owned?.mine) this.tools.owned.mine = true;
  if (!this.tools.owned?.rod) this.tools.owned.rod = true;
  if (!this.tools.owned?.tower) this.tools.owned.tower = true;
  if (!this.tools.owned?.trap) this.tools.owned.trap = true;
  // Tool migration: rename door -> teleport
  if (this.tools.owned?.door) { delete this.tools.owned.door; this.tools.owned.teleport = true; }
  if (!this.tools.owned?.teleport) this.tools.owned.teleport = true;
  if (this.tools.equipped === 'door') this.tools.equipped = 'teleport';
  if (!this.tools.cannonMode) this.tools.cannonMode = 'minigun';
  if (!this.tools.equipped) this.tools.equipped = 'pistol';
  if (d.outfit) this.custom.outfit = d.outfit;
  if (d.moped) { if (d.moped.color) this.moped.color = d.moped.color; if (d.moped.decal) this.moped.decal = d.moped.decal; }
    } catch(e) {}
  // Update tool select after loading
  this.updateToolSelect();
  this.updateBoostArmorSelect?.();
  this.updateDroneSelects?.();
  this.updateBoostArmorVisual?.();
  this.updateWeaponSprite?.();
  // Update moped after load
  this.updateMopedAppearance?.();
  }

  // Appearance settings load from UAG_settings
  loadAppearanceSettings(){
    try {
      const raw = localStorage.getItem('UAG_settings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.shirtColor) this.custom.shirtColor = s.shirtColor;
      if (s.pantsColor) this.custom.pantsColor = s.pantsColor;
      if (typeof s.eyesGlow === 'boolean') this.custom.eyesGlow = s.eyesGlow;
      if (s.eyeColor) this.custom.eyeColor = s.eyeColor;
      if (s.hairColor) this.custom.hairColor = s.hairColor;
  if (s.mopedColor) this.moped.color = s.mopedColor;
  if (s.mopedDecal) this.moped.decal = s.mopedDecal;
      if (s.toggleFly === true) this.state.canFly = true;
      if (typeof s.builderMode === 'boolean') this.builderMode = s.builderMode;
      if (typeof s.lowPerformanceMode === 'boolean') this.performanceMode = s.lowPerformanceMode;
    } catch(e) {}
  }

  // Update/generate dynamic player texture based on customization
  updatePlayerAppearance(){
    const pw = 28, ph = 36;
    const g = this.add.graphics();
    const hexToNum = (hex)=> {
      if (typeof hex === 'number') return hex;
      if (!hex || typeof hex !== 'string') return 0xffffff;
      return parseInt(hex.replace('#',''), 16);
    };

    // Clear old texture
    if (this.textures.exists('tex_player_dyn')) this.textures.remove('tex_player_dyn');

    // Backpack (for special suit) - draw first (behind)
    if (this.custom.outfit === 'special') {
      g.fillStyle(0x3a3a3a, 1);
      g.fillRoundedRect(2, 6, 8, 16, 3);
      // straps
      g.fillStyle(0x2a2a2a, 1);
      g.fillRect(9, 8, 3, 12);
      g.fillRect(16, 8, 3, 12);
    }

    // Head (skin)
    g.fillStyle(0xffdd66, 1);
    g.fillRect(4, 2, pw-8, 10);

    // Hair (top/fringe)
    const hair = hexToNum(this.custom.hairColor);
    g.fillStyle(hair, 1);
    g.fillRect(3, 1, pw-6, 4); // top band
    g.fillRect(4, 4, pw-8, 2); // fringe

    // Eyes with strong glow
    const eyeCol = hexToNum(this.custom.eyeColor);
    const left = { x: 10, y: 7 };
    const right = { x: 18, y: 7 };
    if (this.custom.eyesGlow) {
      // glow halos
      g.fillStyle(eyeCol, 0.35); g.fillCircle(left.x, left.y, 5); g.fillCircle(right.x, right.y, 5);
      g.fillStyle(eyeCol, 0.22); g.fillCircle(left.x, left.y, 4); g.fillCircle(right.x, right.y, 4);
    }
    // eyeballs
    g.fillStyle(eyeCol, 1); g.fillCircle(left.x, left.y, 3); g.fillCircle(right.x, right.y, 3);
    // pupils
    g.fillStyle(0x000000, 1); g.fillCircle(left.x, left.y, 1.4); g.fillCircle(right.x, right.y, 1.4);

    // Shirt
    g.fillStyle(hexToNum(this.custom.shirtColor), 1);
    g.fillRect(3, 12, pw-6, 12);

    // Pants
    g.fillStyle(hexToNum(this.custom.pantsColor), 1);
    g.fillRect(4, 24, pw-8, 10);

    // Outfit overlays
    if (this.custom.outfit === 'normal') {
      // belt/trim
      g.fillStyle(0xffffff, 0.85);
      g.fillRect(3, 20, pw-6, 2);
    } else if (this.custom.outfit === 'special') {
      // special suit accents
      g.fillStyle(0x55e0ff, 0.9);
      g.fillRect(3, 14, pw-6, 2);
      g.fillRect(3, 22, pw-6, 2);
    }

    g.generateTexture('tex_player_dyn', pw, ph);
    g.destroy();

    if (this.player?.active && this.player.scene?.sys && this.textures.exists('tex_player_dyn')) {
      this.player.setTexture('tex_player_dyn');
    }
  }

  // Tool helpers
  tryEquipTool(tool){
    if (!this.tools.owned[tool]) { this.showToast('Ei ostettu'); return; }
  this.tools.equipped = tool; this.updateInventoryUI(); this.updateWeaponSprite?.(); this.updateWeaponSkinSelect?.(); this.saveState();
  }
  cycleTool(step = 1, weaponsOnly = false){
  let order = ['hand','wooden','stone','iron',
    'pistol','pistol_copper',
    'bow','bow_copper',
    'crossbow','crossbow_copper',
    'boomerang',
    'cannon',
    'minigun','minigun_copper','dakkerssit','roller_skates','caran_bitti',
    'ak47','ak47_copper',
    'knife','knife_copper',
    'sniper','sniper_copper',
    'bazooka','bazooka_copper','tnt','mop','trident',
    ...BOOST_WEAPON_IDS,
    'grenade','grenade_copper',
    'nuke','nuke_copper',
    'wizard','flame',
    'pamppu','pamppu_copper',
  'mine','rod','fishingrod','tower','trap','lamp','sofa','table',
    ...WORKSTATION_DEFS.map((station) => station.id),
    'soldiercloner','tankcloner','spear',
    'plane','plane_copper',
    'hook','cloner','teleport','slimecloner','torch'];
  if (weaponsOnly) {
    order = ['pistol','pistol_copper','bow','bow_copper','crossbow','crossbow_copper',
      'boomerang','cannon','minigun','minigun_copper','dakkerssit','roller_skates','caran_bitti',
      'ak47','ak47_copper','knife','knife_copper','sniper','sniper_copper','rifle',
      'bazooka','bazooka_copper','tnt','mop','trident',...BOOST_WEAPON_IDS,
      'grenade','grenade_copper','nuke','nuke_copper',
      'wizard','flame','pamppu','pamppu_copper','spear','plane','plane_copper'];
  }
  if (!this.tools.owned?.hook) this.tools.owned.hook = true;
  if (!this.tools.owned?.crossbow) this.tools.owned.crossbow = true;
  if (!this.tools.owned?.boomerang) this.tools.owned.boomerang = true;
  if (!this.tools.owned?.lamp) this.tools.owned.lamp = true;
  if (!this.tools.owned?.sofa) this.tools.owned.sofa = true;
  if (!this.tools.owned?.table) this.tools.owned.table = true;
    let idx = order.indexOf(this.tools.equipped);
    if (idx < 0) idx = 0;
    const direction = step < 0 ? -1 : 1;
    for (let i=1;i<=order.length;i++){
      const next = order[(idx + direction * i + order.length) % order.length];
      if (this.tools.owned[next]) { this.tools.equipped = next; break; }
    }
    this.updateInventoryUI(); this.updateWeaponSprite?.(); this.updateWeaponSkinSelect?.(); this.saveState();
  if (this.tools.equipped === 'teleport') this.showToast('Teleportti: oikea klikkaus asettaa (8 puuta). R vaihtaa väriä. Mene porttiin: 1,2,3 -> siirto.');
  if (this.tools.equipped === 'slimecloner') this.showToast('Limaklooni: oikea asettaa laitteen, vasen poistaa. Tuottaa limoja ajan kanssa.');
  if (this.tools.equipped === 'torch') this.showToast('Soihdu: oikea asettaa, vasen poistaa. Estää zombeja yöllä.');
  if (this.tools.equipped === 'mine') this.showToast('Miina: oikea asettaa, vasen poistaa. Räjähtää vihollisen koskiessa.');
  if (this.tools.equipped === 'rod') this.showToast('Ukonjohdatin: oikea asettaa, vasen poistaa. Suojaa salamilta lähellä. Kestää 3 osumaa.');
  if (/_copper$/.test(this.tools.equipped)) this.showToast('Kupari-ase: enemmän damagea ja +17 kantamaa');
  if (this.tools.equipped === 'tower') this.showToast('Ampumatorni: oikea asetus, vasen poisto (3 blokkia korkea)');
  if (this.tools.equipped === 'trap') this.showToast('Ansat: R vaihtaa tyypin — mukana myös tramppa. Oikea asettaa, vasen poistaa.');
  if (this.tools.equipped === 'boomerang') this.showToast('Bumerangi: vasen klikkaus heittää. Tähtää lähimpään viholliseen.');
  if (this.tools.equipped === 'tnt') this.showToast('TNT: heitä ja räjähdä — räjähdys buustaa sinua!');
  if (this.tools.equipped === 'dakkerssit') this.showToast('Dakkerssit: ninjaheitto, vasen klikkaus heittää kaksi ninjan veistä.');
  if (this.tools.equipped === 'caran_bitti') this.showToast('Caran Bitti: heitä veitsi vasemmalla klikkauksella.');
  if (this.tools.equipped === 'soldiercloner') this.showToast('Sotilasklooni: oikea aseta laite, vasen poista. Tekee AK-47 -sotilaita limoja ja zombeja vastaan.');
  if (this.tools.equipped === 'tankcloner') this.showToast('Tankkiklooni: oikea aseta laite, vasen poista. Tekee tankkeja (AK-47 + ylhäältä putoava bazooka).');
  if (this.tools.equipped === 'lamp') this.showToast('Lamppu: oikea asettaa, vasen poistaa. Vain koriste.');
  if (this.tools.equipped === 'sofa') this.showToast('Sohva: oikea asettaa, vasen poistaa. Vain koriste.');
  if (this.tools.equipped === 'table') this.showToast('Pöytä: oikea asettaa, vasen poistaa. Vain koriste.');
  if (WORKSTATION_MAP[this.tools.equipped]) {
    const station = WORKSTATION_MAP[this.tools.equipped];
    this.showToast(`${station.label}: oikea asettaa, vasen poistaa. E käyttää työasemaa.`);
  }
  }

  // Small deterministic RNG for reproducible world
  makeRandom(seed) {
    let s = seed >>> 0;
    return () => {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      return ((s >>> 0) % 1000000) / 1000000;
    };
  }

  // --- Dog System ---
  createDogMenu() {
    this.dogMenu = document.createElement('div');
    Object.assign(this.dogMenu.style, {
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.85)', padding: '20px', borderRadius: '10px',
      color: 'white', display: 'none', flexDirection: 'column', gap: '8px', zIndex: '2000',
      boxShadow: '0 0 15px rgba(255,255,255,0.2)'
    });
    this.dogMenu.innerHTML = `
      <h3 style="margin:0">Koira: <span id="dogName">Musti</span></h3>
      <div id="dogStats" style="font-size:12px; color:#ccc;"></div>
      <button id="btnDogPet" style="padding:6px;">👋 Silitä</button>
      <button id="btnDogMode" style="padding:6px;">⚔️ Tila: Seuraa</button>
      <div style="display:flex; gap:5px;">
        <button id="btnDogTakeMoney" style="flex:1; padding:6px;">💰 Ota rahat</button>
        <button id="btnDogGiveMoney" style="flex:1; padding:6px;">💵 Anna (10)</button>
      </div>
      <div>
        <strong>Repun sisältö (17 max):</strong>
        <div id="dogInv" style="display:flex; flex-wrap:wrap; gap:4px; max-width:200px; max-height:100px; overflow-y:auto; margin-top:5px; background:#222; padding:4px; min-height:30px;"></div>
      </div>
      <button id="btnDogClose" style="margin-top:10px; background:#444; padding:6px;">Sulje</button>
    `;
    document.body.appendChild(this.dogMenu);

    this.dogMenu.querySelector('#btnDogPet').onclick = () => {
      this.dogHeartEffect();
      this.showToast('Silitit koiraa! ❤️');
    };
    this.dogMenu.querySelector('#btnDogMode').onclick = (e) => {
      const modes = ['follow', 'attack', 'fetch'];
      let idx = modes.indexOf(this.dogState.mode);
      this.dogState.mode = modes[(idx + 1) % modes.length];
      e.target.textContent = `⚔️ Tila: ${this.dogState.mode === 'follow' ? 'Seuraa' : this.dogState.mode === 'attack' ? 'Hyökkää' : 'Etsi rahaa'}`;
      this.refreshDogMenu();
      this.showToast(`Koiran tila: ${this.dogState.mode}`);
    };
    this.dogMenu.querySelector('#btnDogTakeMoney').onclick = () => {
      if (this.dogState.money > 0) {
        this.state.coins += this.dogState.money;
        this.updateUI();
        this.showToast(`Otit koiralta ${this.dogState.money} kolikkoa.`);
        this.dogState.money = 0;
        this.refreshDogMenu();
      } else {
        this.showToast('Koiralla ei ole rahaa.');
      }
    };
    this.dogMenu.querySelector('#btnDogGiveMoney').onclick = () => {
      if (this.state.coins >= 10) {
        this.state.coins -= 10;
        this.dogState.money += 10;
        this.updateUI();
        this.refreshDogMenu();
        this.showToast('Annoit koiralle 10 kolikkoa.');
      } else {
        this.showToast('Ei tarpeeksi rahaa!');
      }
    };
    this.dogMenu.querySelector('#btnDogClose').onclick = () => {
      this.hideDogMenu();
    };
  }

  showDogMenu() {
    if (!this.dogMenu) this.createDogMenu();
    this.refreshDogMenu();
    this.dogMenu.style.display = 'flex';
  }

  hideDogMenu() {
    if (this.dogMenu) this.dogMenu.style.display = 'none';
    this.resumeGame();
  }

  refreshDogMenu() {
    if (!this.dogMenu) return;
    const s = this.dogMenu.querySelector('#dogName');
    if (s) s.textContent = this.dogState.name;
    const stats = this.dogMenu.querySelector('#dogStats');
    if (stats) stats.textContent = `Rahaa: ${this.dogState.money} | Tila: ${this.dogState.mode}`;
    
    // Inventory
    const div = this.dogMenu.querySelector('#dogInv');
    div.innerHTML = '';
    if (this.dogState.inventory.length === 0) {
      div.textContent = '(Tyhjä)';
      div.style.color = '#888';
    } else {
      div.style.color = '#fff';
      this.dogState.inventory.forEach((item, i) => {
        const el = document.createElement('div');
        el.textContent = item;
        el.style.cssText = 'background:#555; padding:2px 6px; border-radius:3px; font-size:11px; cursor:pointer; margin:2px;';
        el.title = 'Klikkaa ottaaksesi';
        el.onclick = () => {
          // Move item to player
          this.dogState.inventory.splice(i, 1);
          if (this.inv[item] !== undefined) this.inv[item]++;
          else if (item==='wood') this.inv.wood++; // fallback
          else if (item==='stone') this.inv.stone++;
          else if (item==='plank') this.inv.plank++;
          
          this.updateInventoryUI();
          this.showToast(`Otit tavaran: ${item}`);
          this.refreshDogMenu();
        };
        div.appendChild(el);
      });
    }
  }

  dogHeartEffect() {
    try {
      const h = this.add.text(this.dog.x, this.dog.y - 20, '❤️', {fontSize:'20px'});
      this.tweens.add({ targets: h, y: h.y - 30, alpha: 0, duration: 800, onComplete: ()=>h.destroy() });
      if (window.playSfx) window.playSfx('powerup');
    } catch(e){}
  }

  toggleDogActive() {
    if (!this.dog) return;
    this.dogState.active = !this.dogState.active;
    if (this.dogState.active) {
      this.dog.setAlpha(1.0);
      this.showToast('Koira aktivoitu! 🐶');
    } else {
      this.dog.setAlpha(0.6); // Dim when sleeping
      this.showToast('Koira huilaa. 💤');
    }
  }

  onDogPickup(dog, pickup) {
    if (!this.dogState.active || this.dogState.mode !== 'fetch') return;
    if (pickup.texture.key === 'tex_coin') {
      pickup.destroy();
      this.dogState.money += 1;
      const t = this.add.text(dog.x, dog.y-20, '+1💰', { fontSize:'12px', color:'#ffdd00', stroke:'#000', strokeThickness:2 }).setDepth(200);
      this.tweens.add({ targets:t, y:t.y-20, alpha:0, duration:600, onComplete:()=>t.destroy() });
    } else if (this.dogState.inventory.length < 17) {
       // Also pick up wood/stone?
       let type = null;
       if (pickup.texture.key === 'tex_woodItem') type = 'wood';
       else if (pickup.texture.key === 'tex_stoneItem') type = 'stone';
       
       if (type) {
           pickup.destroy();
           this.dogState.inventory.push(type);
           const t = this.add.text(dog.x, dog.y-20, `+${type}`, { fontSize:'10px', color:'#fff', stroke:'#000', strokeThickness:2 }).setDepth(200);
           this.tweens.add({ targets:t, y:t.y-20, alpha:0, duration:600, onComplete:()=>t.destroy() });
       }
    }
  }

  updateDog() {
    if (!this.dog || !this.dog.active) return;
    if (!this.dogState.active || this._timeStopped) { this.dog.setVelocity(0,0); return; }
    
    const speed = this.dogState.stats.speed;
    const px = this.player.x, py = this.player.y;
    const dx = px - this.dog.x, dy = py - this.dog.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    let targetX = px;
    let shouldMove = false;
    let jump = false;

    if (this.dogState.mode === 'attack') {
        let best = null, bestDist = 250;
        const enemies = [this.zombies, this.slimes, this.wolves, this.birds, this.enemySoldiers];
        enemies.forEach(group => {
            group?.children?.iterate(e => {
                if (e && e.active) {
                    const edx = e.x - this.dog.x, edy = e.y - this.dog.y;
                    const d = Math.sqrt(edx*edx + edy*edy);
                    if (d < bestDist) { bestDist = d; best = e; }
                }
            });
        });

        if (best) {
            targetX = best.x;
            shouldMove = true;
            if (bestDist < 24) {
                 if (this.time.now > (this.dog._nextAttack||0)) {
                     this.dog._nextAttack = this.time.now + 800;
                     if (best.takeDamage) best.takeDamage(this.dogState.stats.damage);
                     else { best.destroy(); this.dropCoins(best.x, best.y, 1); }
                     try {window.playSfx?.('hit');}catch(e){}
                     const t = this.add.text(best.x, best.y, 'BORK!', {fontSize:'10px', color:'#fff', stroke:'#000', strokeThickness:2});
                     this.time.delayedCall(300, ()=>t.destroy());
                 }
            } else if (best.y < this.dog.y - 20) {
              jump = true;
            }
        } else {
             if (dist > 60) shouldMove = true;
        }
    } else if (this.dogState.mode === 'fetch') {
        let best = null, bestDist = 300;
        this.pickups?.children?.iterate(c => {
             if (c && c.active && (c.texture.key === 'tex_coin' || c.texture.key === 'tex_woodItem' || c.texture.key === 'tex_stoneItem')) {
                const cdx = c.x - this.dog.x, cdy = c.y - this.dog.y;
                const d = Math.sqrt(cdx*cdx + cdy*cdy);
                if (d < bestDist) { bestDist = d; best = c; }
             }
        });
        if (best) {
            targetX = best.x; shouldMove = true;
            if (best.y < this.dog.y - 20) jump = true;
        } else {
             if (dist > 60) shouldMove = true;
        }
    } else { // Follow
        if (dist > 50) shouldMove = true;
        if (py < this.dog.y - 40 && dist < 100) jump = true;
    }

    if (shouldMove) {
        const moveDx = targetX - this.dog.x;
        const moveDir = Math.sign(moveDx);
        if (Math.abs(moveDx) > 8) {
            this.dog.setVelocityX(moveDir * speed);
            this.dog.setFlipX(moveDir < 0);
        } else {
            this.dog.setVelocityX(0);
        }
    } else {
        this.dog.setVelocityX(0);
    }
    
    // Jump
    if ((jump || (this.dog.body.blocked.left || this.dog.body.blocked.right)) && this.dog.body.blocked.down) {
         this.dog.setVelocityY(-360);
    }
  }
}

// Phaser config and boot
class MinigameScene extends Phaser.Scene {
  constructor(){ super('MinigameScene'); this.mode = 'murder'; this.ui = null; }
  init(data){ this.mode = (data && data.type) || 'murder'; }
  create(){
    // Basic scene setup
  const worldH = WORLD_TILES_Y * TILE;
  // Make a super-wide minigame playfield ~40000px wide (~1000 tiles)
  const halfW = 20000; // px
  this.physics.world.setBounds(-halfW, 0, halfW*2, worldH);
    this.cameras.main.setBackgroundColor('#3a93ff');
    // Groups
    this.platforms = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.pickups = this.physics.add.group();
    // Generate terrain depending on mode
    const groundY = SURFACE_Y + 3;
    const rng = (min,max)=> min + Math.floor(Math.random()*(max-min+1));
    if (this.mode === 'desert') {
      // Aavikko: leveä hiekkamaasto + dyynit
      for (let tx=-600; tx<=600; tx++){
        const baseH = groundY + 2; // pehmeä hiekkakerros
        // pieni dyynikorkeus siniaallolla
        const dune = Math.floor(Math.sin(tx/14) * 2 + Math.sin(tx/37) * 3);
        for (let ty=groundY; ty<WORLD_TILES_Y; ty++){
          const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
          if (ty < baseH + dune) {
            const s = this.platforms.create(x,y,'tex_sand'); s.refreshBody();
          } else {
            const s = this.platforms.create(x,y,'tex_sandstone'); s.refreshBody();
          }
        }
        // satunnaisia kivipaasia (esteitä) pinnalle
        if (Math.random() < 0.12) {
          const h = rng(2,4);
          for (let i=0;i<h;i++){
            const x = tx*TILE + TILE/2, y = (groundY-1-i)*TILE + TILE/2;
            const s = this.platforms.create(x,y,'tex_sandstone'); s.refreshBody();
          }
        }
      }
      // Tavoite: keidas oikealla laidalla
      const oasisTx = 520; const ox = oasisTx*TILE + TILE/2;
      this.oasis = this.add.text(ox, (SURFACE_Y-3)*TILE, 'KEIDAS', { fontFamily:'monospace', fontSize:'16px', color:'#0ff', backgroundColor:'#0008' }).setOrigin(0.5);
      this.oasisZone = this.add.zone(ox, (SURFACE_Y-3)*TILE, TILE*3, TILE*4); this.physics.world.enable(this.oasisZone, Phaser.Physics.Arcade.STATIC_BODY);
      this.physics.add.overlap(this.player, this.oasisZone, ()=>{ this.showToast('Pelastuit keitaalle!'); this.time.delayedCall(600, ()=> this.exitMinigame()); });
      // Jano-mekaniikka
      this.thirst = 100; this.lastThirstTick = 0;
      this.ui = this.add.text(10,10,'', { fontFamily:'monospace', fontSize:'14px', color:'#fff' }).setScrollFactor(0).setDepth(1000);
      this.ui.setText('Aavikkovaellus: Pääse keitaalle oikealla. A/D/←/→, W/Space hyppy. Jano vähenee kuumuudessa. Poimi vesipulloja!');
      // Vesi-pickupit reitille
      this.desertPickups = this.physics.add.group();
      for (let i=0;i<25;i++){
        const tx = rng(-40, 500); const ty = SURFACE_Y - rng(2,6);
        const px = tx*TILE + TILE/2, py = ty*TILE + TILE/2;
        const p = this.desertPickups.create(px, py, 'tex_water'); // käytetään 'tex_water' placeholderina
        p.setScale(0.6); p.body.setAllowGravity(false);
        this.physics.add.overlap(this.player, p, ()=>{ p.destroy(); this.thirst = Math.min(100, this.thirst + 35); this.showToast('Vettä +35'); }, null, this);
      }
      // Skorpionit: pienet viholliset maanpinnalla
      this.scorpions = this.physics.add.group();
      for (let i=0;i<18;i++){
        const tx = rng(-60, 520), ty = SURFACE_Y-1; const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
        const sc = this.scorpions.create(x,y,'tex_oppo').setScale(0.7).setTint(0xffaa33);
        sc.body.setSize(16,16).setOffset(4,6); this.physics.add.collider(sc, this.platforms);
      }
      this.physics.add.overlap(this.player, this.scorpions, ()=>{ this.showToast('Skorpioni pisti!'); this.damageInDesert?.(20); }, null, this);
      // Lämpöväreily overlay
      this.heat = this.add.graphics().setScrollFactor(0).setDepth(850);
    } else {
      // City ground + rakennukset (murder/parkour)
      for (let tx=-500; tx<=500; tx++){
        for (let ty=groundY; ty<WORLD_TILES_Y; ty++){
          const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
          if (ty < groundY + 3) { const s = this.platforms.create(x,y,'tex_stone'); s.refreshBody(); }
          else { const s = this.platforms.create(x,y,'tex_ground'); s.refreshBody(); }
        }
      }
      for (let i=0;i<220;i++){
        const bx = rng(-480,480), bw = rng(3,10), bh = rng(3,11);
        for (let tx=0; tx<bw; tx++) for (let ty=0; ty<bh; ty++){
          const x = (bx+tx)*TILE + TILE/2; const y = (groundY-1-ty)*TILE + TILE/2;
          const s = this.platforms.create(x,y,'tex_sandstone'); s.refreshBody();
        }
      }
    }
    // Helpers to query/clear tile occupancy for static platforms
    const hasPlatformAt = (tx,ty)=>{
      let found=false; this.platforms?.children?.iterate?.((c)=>{
        if (found || !c) return; if (Math.floor(c.x/TILE)===tx && Math.floor(c.y/TILE)===ty) found=true; }); return found;
    };
  const clearAreaAboveGround = (cx, widthTiles=7, heightTiles=10)=>{
      const tx0 = Math.floor(cx / TILE);
      const minTx = tx0 - Math.floor(widthTiles/2), maxTx = tx0 + Math.floor(widthTiles/2);
      const minTy = Math.max(0, groundY - heightTiles), maxTy = groundY - 1;
      const toRemove = [];
      this.platforms?.children?.iterate?.((c)=>{
        if (!c) return; const tx=Math.floor(c.x/TILE), ty=Math.floor(c.y/TILE);
        if (tx>=minTx && tx<=maxTx && ty>=minTy && ty<=maxTy) toRemove.push(c);
      });
      toRemove.forEach(c=> c.destroy());
      try { this.platforms.refresh(); this.physics.world.staticBodiesDirty = true; } catch(e) {}
    };
    const columnIsClear = (tx, topTy, bottomTy)=>{
      for (let ty=topTy; ty<=bottomTy; ty++) if (hasPlatformAt(tx, ty)) return false; return true;
    };
    const chooseSafeSpawn = ()=>{
      const desiredTop = groundY - 12; const desiredBottom = groundY - 1;
      const cx = Math.floor((-24 * TILE) / TILE);
      // scan horizontally ±80 tiles
      for (let r=0; r<=80; r++){
        for (const sx of [cx - r, cx + r]){
          if (columnIsClear(sx, desiredTop, desiredBottom)) {
            return { tx: sx, ty: groundY - 2 };
          }
        }
      }
      // fallback: original
      return { tx: cx, ty: groundY - 2 };
    };
  // Player spawn (ensure clear space)
  const safe = chooseSafeSpawn();
  this.spawnX = safe.tx * TILE; this.groundY = groundY;
  clearAreaAboveGround(this.spawnX, 9, 12);
  this.player = this.physics.add.sprite(safe.tx*TILE + TILE/2, safe.ty*TILE + TILE/2, 'tex_player_dyn');
    this.player.body.setSize(20,34).setOffset(4,2);
    this.player.setBounce(0.05);
    this.player.setCollideWorldBounds(true);
  this.physics.add.collider(this.player, this.platforms);
  // After colliders, ensure no overlap remains
  this.time.delayedCall(0, ()=> this.ensureClear(this.player));
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({A:'A',D:'D',W:'W',SPACE:'SPACE'});
    // Camera
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    // Night darkness overlay
    this.darknessGfx = this.add.graphics().setScrollFactor(0).setDepth(900);
    // Helper: resolve if player gets stuck inside platforms by nudging up
    this.ensureClear = (sprite)=>{
      let tries = 0;
      while (tries++ < 40 && this.physics.world.overlap(sprite, this.platforms)) {
        sprite.y -= 4;
      }
    };
    this.safeRespawn = ()=>{
      clearAreaAboveGround(this.spawnX, 5, 8);
      this.player.setPosition(this.spawnX, (this.groundY-2)*TILE);
      this.player.body.stop();
      this.ensureClear(this.player);
    };
    // Initial ensure not stuck
    this.ensureClear(this.player);
    // UI overlay with instructions and exit button
    this.ui = this.add.text(10,10,'', { fontFamily:'monospace', fontSize:'14px', color:'#fff' }).setScrollFactor(0).setDepth(1000);
    this.exitBtn = this.add.text(10, 36, '[Poistu minipelistä]', { fontFamily:'monospace', fontSize:'14px', color:'#fffe' })
      .setInteractive({ useHandCursor:true }).setScrollFactor(0).setDepth(1000)
      .on('pointerdown', ()=> this.exitMinigame());
    // Mode-specific setup
  if (this.mode === 'murder') this.setupMurder({ groundY, hasPlatformAt, clearAreaAboveGround });
  else if (this.mode === 'parkour') this.setupParkour({ groundY, hasPlatformAt });
  else if (this.mode === 'desert') this.setupDesert();
    // Esc exits
    this.input.keyboard.on('keydown-ESC', ()=> this.exitMinigame());
  }
  setupDesert(){
    // Ei erillisiä aseita; selviydy ja juokse oikealle
    this.weapon = 'none';
  }
  setupMurder(ctx){
    this.ui.setText('Murhaajajahti: juokse maan tasalla! A/D/←/→, W/Space hyppy. Puukko (lähi), satunnainen pistooli (1 kpl). Ei blockien rikkomista.');
    // Weapons
    this.weapon = 'knife';
    this.lastShoot = 0;
    // Spawns
    // Killer enemy that chases player on ground
    const killerX = this.player.x - 10*TILE;
  ctx?.clearAreaAboveGround?.(killerX, 7, 10);
    const k = this.enemies.create(killerX, this.player.y, 'tex_oppo');
    k.setTint(0xff3333); k.body.setSize(20,24).setOffset(4,2);
    this.physics.add.collider(k, this.platforms);
    this.killer = k;
    // Rare pistol pickup somewhere on roof
    let p=null, tries=0;
    while (!p && tries++ < 80){
      const tx = Phaser.Math.Between(-480, 480);
      const ty = (SURFACE_Y - Phaser.Math.Between(4,8));
      if (!ctx?.hasPlatformAt?.(tx, ty)) {
        const px = tx*TILE + TILE/2; const py = ty*TILE + TILE/2;
        p = this.pickups.create(px, py, 'tex_weapon_pistol');
      }
    }
    if (p) {
      p.body.setAllowGravity(false);
      this.physics.add.overlap(this.player, p, ()=>{ p.destroy(); this.weapon = 'pistol'; this.showToast('Löysit pistoolin (vain yksi)!'); }, null, this);
    }
    // Collisions
    this.physics.add.collider(this.enemies, this.platforms);
  }
  setupParkour(ctx){
    this.ui.setText('Parkour-kisa: satunnaisia esteitä. A/D/←/→, W/Space hyppy. Ei blockien rikkomista.');
    // Generate random obstacles ahead to the right
  const startX = -80; const endX = 320;
    for (let x=startX; x<endX; x+= Phaser.Math.Between(2,4)){
      const h = Phaser.Math.Between(1,4);
      for (let i=0;i<h;i++){
        const tx = x; const ty = (SURFACE_Y-1) - i;
        const gx = tx*TILE + TILE/2, gy = ty*TILE + TILE/2;
        const s = this.platforms.create(gx, gy, 'tex_stone'); s.refreshBody();
      }
      // occasional gap
      if (Math.random()<0.25) {
        // remove one ground tile to form a pit
        const pitX = x + Phaser.Math.Between(1,2);
        const gx = pitX*TILE + TILE/2, gy = (SURFACE_Y+1)*TILE + TILE/2;
        // leave as gap (no tile placed)
      }
    }
    // Finish flag
    const fx = endX*TILE + TILE/2;
  this.finish = this.add.text(fx, (SURFACE_Y-3)*TILE, 'MAALI', { fontFamily:'monospace', fontSize:'16px', color:'#fff', backgroundColor:'#0008' }).setOrigin(0.5);
  this.finishZone = this.add.zone(fx, (SURFACE_Y-3)*TILE, TILE*2, TILE*3);
  this.physics.world.enable(this.finishZone, Phaser.Physics.Arcade.STATIC_BODY);
  this.physics.add.overlap(this.player, this.finishZone, ()=>{ this.showToast('Voitto!'); this.time.delayedCall(600, ()=> this.exitMinigame()); });
  }
  update(){
    if (!this.player) return;
    const cam = this.cameras.main; 
    // Desert heat haze and thirst
    if (this.mode === 'desert'){
      // Thirst tick
      if (!this.lastThirstTick) this.lastThirstTick = this.time.now;
      if (this.time.now - this.lastThirstTick > 900){
        this.lastThirstTick = this.time.now;
        this.thirst = Math.max(0, this.thirst - 3);
        if (!this.thirstText) this.thirstText = this.add.text(cam.scrollX+cam.width-10, cam.scrollY+10, '', { fontFamily:'monospace', fontSize:'14px', color:'#fff', backgroundColor:'#0008' }).setOrigin(1,0).setDepth(1000);
        this.thirstText.setPosition(cam.scrollX+cam.width-10, cam.scrollY+10).setText(`Jano: ${this.thirst}`);
        if (this.thirst === 0) { this.showToast('Nääntyit janoon...'); this.time.delayedCall(700, ()=> this.exitMinigame()); }
      }
      // Simple heat shimmer effect
      this.heat.clear();
      this.heat.fillStyle(0xffdd66, 0.03);
      for (let i=0;i<10;i++){
        const y = (i*cam.height/10) + Math.sin((this.time.now/500)+(i*0.8))*6;
        this.heat.fillRect(0, y, cam.width, 3);
      }
    }
    // Keep it dark (night): redraw overlay each frame
    this.darknessGfx.clear();
    // Dark base
    this.darknessGfx.fillStyle(0x000000, 0.68);
    this.darknessGfx.fillRect(0, 0, cam.width, cam.height);
    // Soft light halo around player (erase blend)
    const sx = this.player.x - cam.scrollX;
    const sy = this.player.y - cam.scrollY;
    this.darknessGfx.setBlendMode(Phaser.BlendModes.ERASE);
    const rad = 150; const steps = 28; const maxA = 0.32; const minA = 0.06;
    for (let i = steps; i >= 1; i--) {
      const frac = i / steps;           // 1 -> 1/steps
      const rr = rad * frac;            // radius taper
      const t = 1 - frac;               // 0 at edge -> 1 at center
      const eased = t * t;              // ease-in for smoother center
      const a = minA + (maxA - minA) * eased;
      this.darknessGfx.fillStyle(0xffffff, a);
      this.darknessGfx.fillCircle(sx, sy, rr);
    }
    this.darknessGfx.setBlendMode(Phaser.BlendModes.NORMAL);
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jump = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;
    // Movement
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    const speed = 220;
    if (left) { this.player.setVelocityX(-speed); this.player.setFlipX(true); } else if (right) { this.player.setVelocityX(speed); this.player.setFlipX(false); } else { this.player.setVelocityX(0); }
    if (jump && onGround) { this.player.setVelocityY(-440); window.playSfx?.('jump'); }
    // Murder mode AI and combat
    if (this.mode === 'murder'){
      if (this.killer && this.killer.active){
        const dir = Math.sign(this.player.x - this.killer.x) || 1;
        this.killer.setVelocityX(dir * 120);
        // Jump up to ~4 blocks when blocked horizontally, else occasional hop
        const onGround = this.killer.body.blocked.down || this.killer.body.touching.down;
        const hitWall = this.killer.body.blocked.left || this.killer.body.blocked.right;
        if (onGround && (hitWall || Math.random()<0.01)) this.killer.setVelocityY(-560);
        // contact hurts instantly
        this.physics.world.overlap(this.player, this.killer, ()=>{ this.showToast('Jäit kiinni!'); this.time.delayedCall(500, ()=> this.exitMinigame()); });
      }
      // simple attack: knife or pistol
      if (this.input.activePointer.isDown){
        if (this.weapon === 'pistol') this.shootAtPointer(); else this.stab();
      }
    }
    // Clamp to ground-only rule: if falling out, respawn safely at start
    if (this.player.y > (WORLD_TILES_Y*TILE - 20)) this.safeRespawn();
  }
  damageInDesert(d){
    // Desert-only damage (e.g., scorpions) reduces thirst more quickly
    this.thirst = Math.max(0, this.thirst - Math.floor(d/5));
  }
  shootAtPointer(){
    const p = this.input.activePointer; const wp = this.cameras.main.getWorldPoint(p.x,p.y);
    const dx = wp.x - this.player.x, dy = wp.y - this.player.y; const d = Math.hypot(dx,dy)||1;
    const nx=dx/d, ny=dy/d; const b = this.physics.add.image(this.player.x, this.player.y, 'tex_bullet'); b.setVelocity(nx*700, ny*700).setRotation(Math.atan2(ny,nx));
    window.playSfx?.('shoot');
    // hit killer
    this.physics.add.overlap(b, this.enemies, (bullet, e)=>{ e.destroy(); bullet.destroy(); this.showToast('Pääsit karkuun!'); this.time.delayedCall(600, ()=> this.exitMinigame()); });
    this.time.delayedCall(800, ()=> b.destroy());
  }
  stab(){
    if (this._stabCd && this._stabCd > this.time.now) return; this._stabCd = this.time.now + 220;
    const reach = 2*TILE; const px=this.player.x, py=this.player.y;
    this.enemies.children.iterate((e)=>{ if (!e||!e.active) return; const dx=e.x-px, dy=e.y-py; if (dx*dx+dy*dy<=reach*reach){ e.destroy(); this.showToast('Pääsit karkuun!'); this.time.delayedCall(600, ()=> this.exitMinigame()); } });
  }
  showToast(msg){
    const t = this.add.text(this.cameras.main.scrollX + 10, this.cameras.main.scrollY + 64, msg, { fontFamily:'monospace', fontSize:'14px', color:'#fff', backgroundColor:'#0009' }).setDepth(1000);
    this.time.delayedCall(1200, ()=> t.destroy());
  }
  exitMinigame(){
    const gameScene = this.scene.get('GameScene');
    gameScene?.onReturnFromMinigame?.();
    this.scene.stop();
  }


}
const config = {
  type: Phaser.AUTO,
  parent: 'gameContainer',
  backgroundColor: '#5db2ff',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 900 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [GameScene, MinigameScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
  buildSuperAnimalPanel();

  // Toggle settings popup (existing UI)
  const btn = document.getElementById('settingsBtn');
  const menu = document.getElementById('settingsMenu');
  btn?.addEventListener('click', () => {
    menu?.classList.toggle('hidden');
    window.gameScene?._refreshMerchantAnimalShop?.();
  });
  document.getElementById('animalsBtn')?.addEventListener('click', () => {
    document.getElementById('animalPanel')?.classList.toggle('hidden');
  });
  document.getElementById('megaAnimalsBtn')?.addEventListener('click', () => {
    document.getElementById('megaAnimalPanel')?.classList.toggle('hidden');
  });
  document.getElementById('superAnimalsBtn')?.addEventListener('click', () => {
    document.getElementById('superAnimalPanel')?.classList.toggle('hidden');
  });
  document.getElementById('callHawk')?.addEventListener('click', () => window.gameScene?.summonSpecialAnimal('hawk'));
  document.getElementById('callDragon')?.addEventListener('click', () => window.gameScene?.summonSpecialAnimal('dragon'));
  document.getElementById('callDirewolf')?.addEventListener('click', () => window.gameScene?.summonSpecialAnimal('direwolf'));
  document.getElementById('callWaterSerpent')?.addEventListener('click', () => window.gameScene?.summonSpecialAnimal('waterSerpent'));
  document.getElementById('callStormEagle')?.addEventListener('click', () => window.gameScene?.summonSpecialAnimal('stormEagle'));
  document.getElementById('callFireLion')?.addEventListener('click', () => window.gameScene?.summonSpecialAnimal('fireLion'));
  document.getElementById('callIceBear')?.addEventListener('click', () => window.gameScene?.summonSpecialAnimal('iceBear'));
  document.getElementById('callShadowPanther')?.addEventListener('click', () => window.gameScene?.summonSpecialAnimal('shadowPanther'));
  document.getElementById('callStoneRhino')?.addEventListener('click', () => window.gameScene?.summonSpecialAnimal('stoneRhino'));
  document.getElementById('callSkyWhale')?.addEventListener('click', () => window.gameScene?.summonSpecialAnimal('skyWhale'));
  document.getElementById('callDeathBird')?.addEventListener('click', () => window.gameScene?.summonSpecialAnimal('deathBird'));
  document.getElementById('spawnDroneBtn')?.addEventListener('click', () => {
    const scene = window.gameScene;
    if (!scene) return;
    if (scene.spawnAllyDrone()) scene.showToast?.('Hyvis drone liittyi');
  });

  // Backpack UI buttons
  document.getElementById('backpackBtn')?.addEventListener('click', ()=> window.gameScene?.toggleBackpack());
  document.getElementById('bpClose')?.addEventListener('click', ()=> window.gameScene?.toggleBackpack());
  document.getElementById('bpDump')?.addEventListener('click', ()=> window.gameScene?.dumpBackpackToInventory());

  // Merchant buttons
  document.getElementById('buyWood')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 5) { s.state.coins -= 5; s.inv.wood += 30; s.updateUI(); s.saveState(); }
  });
  // Settings-merchant mirrors
  document.getElementById('buyWood2')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 5) { s.state.coins -= 5; s.inv.wood += 30; s.updateUI(); s.saveState(); }
  });
  // Outfit purchases
  document.getElementById('buyOutfitNormal')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 3) { s.state.coins -= 3; s.custom.outfit = 'normal'; s.updatePlayerAppearance(); s.updateUI(); s.saveState(); }
  });
  document.getElementById('buyOutfitNormal2')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 3) { s.state.coins -= 3; s.custom.outfit = 'normal'; s.updatePlayerAppearance(); s.updateUI(); s.saveState(); }
  });
  document.getElementById('buyOutfitSpecial')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 7) { s.state.coins -= 7; s.custom.outfit = 'special'; s.updatePlayerAppearance(); s.updateUI(); s.saveState(); }
  });
  document.getElementById('buyOutfitSpecial2')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 7) { s.state.coins -= 7; s.custom.outfit = 'special'; s.updatePlayerAppearance(); s.updateUI(); s.saveState(); }
  });
  // Tool purchases
  document.getElementById('buyPickWood')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 2) { s.state.coins -= 2; s.tools.owned.wooden = true; s.updateUI(); s.updateToolSelect(); s.saveState(); }
  });
  document.getElementById('buyPickWood2')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 2) { s.state.coins -= 2; s.tools.owned.wooden = true; s.updateUI(); s.updateToolSelect(); s.saveState(); }
  });
  document.getElementById('buyPickStone')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 4) { s.state.coins -= 4; s.tools.owned.stone = true; s.updateUI(); s.updateToolSelect(); s.saveState(); }
  });
  document.getElementById('buyPickStone2')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 4) { s.state.coins -= 4; s.tools.owned.stone = true; s.updateUI(); s.updateToolSelect(); s.saveState(); }
  });
  document.getElementById('buyPickIron')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 6) { s.state.coins -= 6; s.tools.owned.iron = true; s.updateUI(); s.updateToolSelect(); s.saveState(); }
  });
  document.getElementById('buyPickIron2')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 6) { s.state.coins -= 6; s.tools.owned.iron = true; s.updateUI(); s.updateToolSelect(); s.saveState(); }
  });
  document.getElementById('buyPistol')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 10) { s.state.coins -= 10; s.tools.owned.pistol = true; s.updateUI(); s.updateToolSelect(); s.saveState(); }
  });
  document.getElementById('buyPistol2')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
  if (s.state.coins >= 10) { s.state.coins -= 10; s.tools.owned.pistol = true; s.updateUI(); s.updateToolSelect(); s.saveState(); }
  });

  // Copper weapons purchase (both UIs)
  const buyCopper = ()=>{
    const s = window.gameScene; if (!s) return;
    if (s.upgrades.copperUnlocked) { s.showToast?.('Kupari-aseet on jo ostettu'); return; }
    if (s.state.coins >= 70) {
      s.state.coins -= 70;
      s.upgrades.copperUnlocked = true;
      // Grant copper variants for all weapons
      const w = s.tools.owned;
  ['pistol','bow','crossbow','minigun','ak47','knife','sniper','bazooka','grenade','nuke','pamppu','plane'].forEach(t=>{ const k=t+'_copper'; if (w[k]===false) w[k]=true; });
      s.updateUI(); s.updateToolSelect(); s.saveState();
      s.showToast?.('Kupari-aseet avattu!');
    }
  };
  document.getElementById('buyCopper')?.addEventListener('click', buyCopper);
  document.getElementById('buyCopper2')?.addEventListener('click', buyCopper);

  // Bounce shoes purchases
  document.getElementById('buyBoots')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
    if (!s.state.bounceShoes && s.state.coins >= 8) {
      s.state.coins -= 8; s.state.bounceShoes = true; s.updateUI(); s.saveState(); s.showToast?.('Pomppukengät ostettu!');
    }
  });
  document.getElementById('buyBoots2')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
    if (!s.state.bounceShoes && s.state.coins >= 8) {
      s.state.coins -= 8; s.state.bounceShoes = true; s.updateUI(); s.saveState(); s.showToast?.('Pomppukengät ostettu!');
    }
  });

  document.getElementById('closeMerchant')?.addEventListener('click', () => window.gameScene?.closeMerchant());

  // Stone-based shop actions
  // Convert 10 stone -> 5 coins
  const stoneToCoins = ()=>{ const s=window.gameScene; if(!s) return; if (s.inv.stone>=10){ s.inv.stone-=10; s.state.coins+=5; s.updateUI(); s.saveState(); s.showToast?.('Vaihdettu 10 kiveä -> 5 kolikkoa'); } };
  document.getElementById('btnStoneToCoins')?.addEventListener('click', stoneToCoins);
  document.getElementById('btnStoneToCoins2')?.addEventListener('click', stoneToCoins);
  // Buy pistol with stone: 25 stone
  const buyPistolWithStone = ()=>{ const s=window.gameScene; if(!s) return; if (s.inv.stone>=25){ s.inv.stone-=25; s.tools.owned.pistol=true; s.updateUI(); s.updateToolSelect(); s.saveState(); s.showToast?.('Pistooli ostettu kivillä!'); } };
  document.getElementById('buyPistolStone')?.addEventListener('click', buyPistolWithStone);
  document.getElementById('buyPistolStone2')?.addEventListener('click', buyPistolWithStone);
  // Buy rifle with stone: 40 stone
  const buyRifleWithStone = ()=>{ const s=window.gameScene; if(!s) return; if (s.inv.stone>=40){ s.inv.stone-=40; s.tools.owned.rifle=true; s.updateUI(); s.updateToolSelect(); s.saveState(); s.showToast?.('Kivääri ostettu kivillä!'); } };
  document.getElementById('buyRifleStone')?.addEventListener('click', buyRifleWithStone);
  document.getElementById('buyRifleStone2')?.addEventListener('click', buyRifleWithStone);
  // Hire jetpack soldier: costs 30 stone
  const hireJetpackSoldier = ()=>{ const s=window.gameScene; if(!s) return; if (s.inv.stone>=30){ s.inv.stone-=30; s.spawnJetpackSoldier(); s.updateUI(); s.saveState(); s.showToast?.('Sotilas rakettirepulla liittyi!'); } };
  document.getElementById('hireJetSoldier')?.addEventListener('click', hireJetpackSoldier);
  document.getElementById('hireJetSoldier2')?.addEventListener('click', hireJetpackSoldier);

  // Settings: volumes and toggles
  // Worlds UI
  const worldSelect = document.getElementById('worldSelect');
  const createWorld = document.getElementById('createWorld');
  const deleteWorld = document.getElementById('deleteWorld');

  function refreshWorldsUI(){
    if (!worldSelect) return;
    let worlds = [];
    try { const r = localStorage.getItem('UAG_worlds'); worlds = r ? JSON.parse(r) : []; } catch(e) { worlds = []; }
    if (!Array.isArray(worlds)) worlds = [];
    let current = localStorage.getItem('UAG_worldCurrent') || worlds[0] || 'world-1';
    if (!current) current = 'world-1';
    // ensure current is in list
    if (worlds.indexOf(current) === -1) { worlds.push(current); localStorage.setItem('UAG_worlds', JSON.stringify(worlds)); }
    // populate
    worldSelect.innerHTML = '';
    for (const w of worlds){
      const opt = document.createElement('option');
      opt.value = w; opt.textContent = w;
      if (w === current) opt.selected = true;
      worldSelect.appendChild(opt);
    }
  }

  refreshWorldsUI();

  // Start screen world and game-mode picker. It only changes selection; the
  // normal input handlers stay locked while `started` is false.
  const startWorldList = document.getElementById('startWorldList');
  const startCreateWorld = document.getElementById('startCreateWorld');
  const startModeDescription = document.getElementById('startModeDescription');
  const startModeDescriptions = {
    adventure: 'Tutki maailmaa, kerää varusteita ja rakenna.',
    multiplayer: 'Näe muut pelaajat samassa maailmassa verkkomoninpelissä.',
    rivals: 'Rivals-tyylinen kilpailu: kisatkaa samassa maailmassa ja yrittäkää voittaa.'
  };

  function refreshStartWorldsUI(){
    if (!startWorldList) return;
    let worlds = [];
    try { worlds = JSON.parse(localStorage.getItem('UAG_worlds') || '[]'); } catch(e) { worlds = []; }
    if (!Array.isArray(worlds) || !worlds.length) worlds = ['world-1'];
    const current = localStorage.getItem('UAG_worldCurrent') || worlds[0];
    localStorage.setItem('UAG_worlds', JSON.stringify(worlds));
    if (!localStorage.getItem('UAG_worldCurrent')) localStorage.setItem('UAG_worldCurrent', current);
    startWorldList.innerHTML = '';
    worlds.forEach((worldId, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `start-world${worldId === current ? ' active' : ''}`;
      button.textContent = `Maailma ${index + 1}`;
      button.title = worldId;
      button.addEventListener('click', () => {
        localStorage.setItem('UAG_worldCurrent', worldId);
        refreshStartWorldsUI();
      });
      startWorldList.appendChild(button);
    });
  }
  refreshStartWorldsUI();
  startCreateWorld?.addEventListener('click', () => {
    let worlds = [];
    try { worlds = JSON.parse(localStorage.getItem('UAG_worlds') || '[]'); } catch(e) { worlds = []; }
    if (!Array.isArray(worlds)) worlds = [];
    let n = worlds.length + 1;
    let worldId = `world-${n}`;
    while (worlds.includes(worldId)) worldId = `world-${++n}`;
    worlds.push(worldId);
    localStorage.setItem('UAG_worlds', JSON.stringify(worlds));
    localStorage.setItem('UAG_worldCurrent', worldId);
    refreshWorldsUI();
    refreshStartWorldsUI();
  });
  const startMapDescription = document.getElementById('startMapDescription');
  const startMapDescriptions = {
    adventure: 'Laaja maailma, metsää, aavikkoa, lunta ja merta.',
    backrooms: 'Keltainen sokkeloareena, käytäviä ja seinäesteitä.',
    pinball: 'Flipperipöytä, reunat, puskurit ja rampit.',
    redstone: 'Punakivikoneita, johtoja, toistimia ja oma paluuportaali.'
  };
  document.querySelectorAll('.start-map').forEach((button) => {
    button.addEventListener('click', () => {
      const mapType = button.dataset.mapType || 'adventure';
      localStorage.setItem('UAG_mapType', mapType);
      document.querySelectorAll('.start-map').forEach((item) => item.classList.toggle('active', item === button));
      if (startMapDescription) startMapDescription.textContent = startMapDescriptions[mapType] || startMapDescriptions.adventure;
      // Terrain is generated when the Phaser scene starts, so reload to apply
      // a newly selected map without mixing it with the old terrain.
      location.reload();
    });
  });
  const savedMapType = localStorage.getItem('UAG_mapType') || 'adventure';
  const savedMapButton = document.querySelector(`.start-map[data-map-type="${savedMapType}"]`);
  savedMapButton?.classList.add('active');
  document.querySelectorAll('.start-map').forEach((item) => item.classList.toggle('active', item === savedMapButton));
  if (startMapDescription) startMapDescription.textContent = startMapDescriptions[savedMapType] || startMapDescriptions.adventure;
  document.querySelectorAll('.start-mode').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.startMode || 'adventure';
      localStorage.setItem('UAG_startGameMode', mode);
      document.querySelectorAll('.start-mode').forEach((item) => item.classList.toggle('active', item === button));
      if (startModeDescription) startModeDescription.textContent = startModeDescriptions[mode] || startModeDescriptions.adventure;
    });
  });
  const savedStartMode = localStorage.getItem('UAG_startGameMode') || 'adventure';
  const savedModeButton = document.querySelector(`.start-mode[data-start-mode="${savedStartMode}"]`);
  savedModeButton?.click();

  worldSelect?.addEventListener('change', (e)=>{
    const wid = worldSelect.value;
    localStorage.setItem('UAG_worldCurrent', wid);
    // reload the page to load new world
    location.reload();
  });

  createWorld?.addEventListener('click', ()=>{
    // generate a new unique world id
    let worlds = [];
    try { const r = localStorage.getItem('UAG_worlds'); worlds = r ? JSON.parse(r) : []; } catch(e) { worlds = []; }
    if (!Array.isArray(worlds)) worlds = [];
    let i = 1; let wid;
    do { wid = `world-${++i}`; } while (worlds.includes(wid));
    worlds.push(wid);
    localStorage.setItem('UAG_worlds', JSON.stringify(worlds));
    localStorage.setItem('UAG_worldCurrent', wid);
    refreshWorldsUI();
    // clear in-memory state and reload to spawn fresh world
    location.reload();
  });

  deleteWorld?.addEventListener('click', ()=>{
    let worlds = [];
    try { const r = localStorage.getItem('UAG_worlds'); worlds = r ? JSON.parse(r) : []; } catch(e) { worlds = []; }
    const current = localStorage.getItem('UAG_worldCurrent');
    if (!current) return;
    // prevent deleting last world: ensure at least one remains
    if (worlds.length <= 1) { alert('Et voi poistaa viimeistä maailmaa.'); return; }
    // remove save and references
    try { localStorage.removeItem(`UAG_save_${current}`); } catch(e) {}
    worlds = worlds.filter(w=>w!==current);
    localStorage.setItem('UAG_worlds', JSON.stringify(worlds));
    const next = worlds[0];
    localStorage.setItem('UAG_worldCurrent', next);
    refreshWorldsUI();
    location.reload();
  });
  const musicVol = document.getElementById('musicVol');
  const sfxVol = document.getElementById('sfxVol');
  const sfxMute = document.getElementById('sfxMute');
  const showHearts = document.getElementById('showHearts');
  const toggleFly = document.getElementById('toggleFly');
  const builderMode = document.getElementById('builderMode');
  const lowPerformanceMode = document.getElementById('lowPerformanceMode');
  const toggleBoots = document.getElementById('toggleBoots');
  const shirtColor = document.getElementById('shirtColor');
  const pantsColor = document.getElementById('pantsColor');
  const eyesGlow = document.getElementById('eyesGlow');
  const eyeColor = document.getElementById('eyeColor');
  const hairColor = document.getElementById('hairColor');
  const mopedColor = document.getElementById('mopedColor');
  const mopedDecal = document.getElementById('mopedDecal');
  // Ninja controls
  const ninjaEnable = document.getElementById('ninjaEnable');
  const ninjaSword = document.getElementById('ninjaSword');
  const ninjaKnife = document.getElementById('ninjaKnife');
  const ninjaStrike = document.getElementById('ninjaStrike');
  const ninjaRows = document.getElementById('ninjaRows');
  const ninjaSwordRangeRow = document.getElementById('ninjaSwordRangeRow');
  const ninjaSwordRange = document.getElementById('ninjaSwordRange');

  function applySettings(){
    const settings = {
      musicVol: Number(musicVol?.value||0.5),
      sfxVol: Number(sfxVol?.value||0.8),
      sfxMute: !!sfxMute?.checked,
      showHearts: !!showHearts?.checked,
      toggleFly: !!toggleFly?.checked,
      builderMode: !!builderMode?.checked,
      lowPerformanceMode: !!lowPerformanceMode?.checked,
  toggleBoots: !!toggleBoots?.checked,
      shirtColor: shirtColor?.value,
      pantsColor: pantsColor?.value,
      eyesGlow: !!eyesGlow?.checked,
      eyeColor: eyeColor?.value,
  hairColor: hairColor?.value,
  mopedColor: mopedColor?.value || window.gameScene?.moped?.color,
  mopedDecal: mopedDecal?.value || window.gameScene?.moped?.decal,
      ninja: {
        active: !!ninjaEnable?.checked,
        sword: Number(ninjaSword?.value||1),
        knife: Number(ninjaKnife?.value||1),
        strike: Number(ninjaStrike?.value||1),
        swordRange: Number(ninjaSwordRange?.value||2)
      }
    };
  try { localStorage.setItem('UAG_settings', JSON.stringify(settings)); } catch(e) {}
  // Apply SFX volume/mute immediately
  const vol = settings.sfxMute ? 0 : Math.max(0, Math.min(1, settings.sfxVol));
  try { window.Sfx?.setVolume(vol); } catch(e) {}
  if (sfxVol) sfxVol.disabled = !!settings.sfxMute;
    if (window.gameScene && toggleFly) { window.gameScene.state.canFly = !!toggleFly.checked; window.gameScene.saveState(); window.gameScene.updateInventoryUI(); }
    if (window.gameScene && builderMode) window.gameScene.setBuilderMode(builderMode.checked);
    if (window.gameScene && lowPerformanceMode) window.gameScene.setPerformanceMode(lowPerformanceMode.checked);
    if (window.gameScene && toggleBoots) {
      // Allow enabling/disabling bounce shoes from settings regardless of ownership
      window.gameScene.state.bounceShoes = !!toggleBoots.checked;
      window.gameScene.saveState();
    }
    if (showHearts) { const h=document.getElementById('health'); if (h) h.style.display = showHearts.checked ? '' : 'none'; }
    // Apply appearance to player in-game
    if (window.gameScene) {
      if (shirtColor?.value) window.gameScene.custom.shirtColor = shirtColor.value;
      if (pantsColor?.value) window.gameScene.custom.pantsColor = pantsColor.value;
      window.gameScene.custom.eyesGlow = !!eyesGlow?.checked;
      if (eyeColor?.value) window.gameScene.custom.eyeColor = eyeColor.value;
      if (hairColor?.value) window.gameScene.custom.hairColor = hairColor.value;
      window.gameScene.updatePlayerAppearance();
  if (mopedColor?.value) { window.gameScene.moped.color = mopedColor.value; }
  if (mopedDecal?.value) { window.gameScene.moped.decal = mopedDecal.value; }
  window.gameScene.updateMopedAppearance?.();
      // Apply ninja settings
      if (typeof settings.ninja?.active === 'boolean') window.gameScene.ninja.active = settings.ninja.active;
      if (settings.ninja) {
        window.gameScene.ninja.swordLevel = settings.ninja.sword;
        window.gameScene.ninja.knifeLevel = settings.ninja.knife;
        window.gameScene.ninja.strikeLevel = settings.ninja.strike;
        window.gameScene.ninja.swordRange = settings.ninja.swordRange || 2;
      }
      // Toggle UI rows according to Ninja enabled
      if (ninjaRows && ninjaSwordRangeRow && ninjaEnable) {
        const on = !!ninjaEnable.checked;
        ninjaRows.style.display = on ? 'none' : '';
        ninjaSwordRangeRow.style.display = on ? '' : 'none';
      }
    }
  }

  // Load settings
  try {
    const raw = localStorage.getItem('UAG_settings');
    if (raw) {
      const s = JSON.parse(raw);
      if (musicVol && typeof s.musicVol === 'number') musicVol.value = s.musicVol;
  if (sfxVol && typeof s.sfxVol === 'number') sfxVol.value = s.sfxVol;
  if (sfxMute && typeof s.sfxMute === 'boolean') sfxMute.checked = s.sfxMute;
      if (showHearts && typeof s.showHearts === 'boolean') showHearts.checked = s.showHearts;
  if (toggleFly && typeof s.toggleFly === 'boolean') toggleFly.checked = s.toggleFly;
  if (builderMode && typeof s.builderMode === 'boolean') builderMode.checked = s.builderMode;
  if (lowPerformanceMode && typeof s.lowPerformanceMode === 'boolean') lowPerformanceMode.checked = s.lowPerformanceMode;
  if (toggleBoots && typeof s.toggleBoots === 'boolean') toggleBoots.checked = s.toggleBoots;
      if (shirtColor && typeof s.shirtColor === 'string') shirtColor.value = s.shirtColor;
      if (pantsColor && typeof s.pantsColor === 'string') pantsColor.value = s.pantsColor;
      if (eyesGlow && typeof s.eyesGlow === 'boolean') eyesGlow.checked = s.eyesGlow;
      if (eyeColor && typeof s.eyeColor === 'string') eyeColor.value = s.eyeColor;
      if (hairColor && typeof s.hairColor === 'string') hairColor.value = s.hairColor;
  if (mopedColor && typeof s.mopedColor === 'string') mopedColor.value = s.mopedColor;
  if (mopedDecal && typeof s.mopedDecal === 'string') mopedDecal.value = s.mopedDecal;
      if (s.ninja) {
        if (ninjaEnable) ninjaEnable.checked = !!s.ninja.active;
        if (ninjaSword) ninjaSword.value = String(s.ninja.sword||1);
        if (ninjaKnife) ninjaKnife.value = String(s.ninja.knife||1);
        if (ninjaStrike) ninjaStrike.value = String(s.ninja.strike||1);
        if (ninjaSwordRange) ninjaSwordRange.value = String(s.ninja.swordRange||2);
        if (ninjaRows && ninjaSwordRangeRow && ninjaEnable) {
          const on = !!s.ninja.active; ninjaRows.style.display = on ? 'none' : ''; ninjaSwordRangeRow.style.display = on ? '' : 'none';
        }
      }
    }
  } catch(e) {}

  musicVol?.addEventListener('input', applySettings);
  sfxVol?.addEventListener('input', applySettings);
  sfxMute?.addEventListener('change', applySettings);
  showHearts?.addEventListener('change', applySettings);
  toggleFly?.addEventListener('change', applySettings);
  builderMode?.addEventListener('change', applySettings);
  lowPerformanceMode?.addEventListener('change', applySettings);
  toggleBoots?.addEventListener('change', applySettings);
  shirtColor?.addEventListener('input', applySettings);
  pantsColor?.addEventListener('input', applySettings);
  eyesGlow?.addEventListener('change', applySettings);
  eyeColor?.addEventListener('input', applySettings);
  hairColor?.addEventListener('input', applySettings);
  mopedColor?.addEventListener('input', applySettings);
  mopedDecal?.addEventListener('change', applySettings);
  ninjaEnable?.addEventListener('change', applySettings);
  ninjaSword?.addEventListener('change', applySettings);
  ninjaKnife?.addEventListener('change', applySettings);
  ninjaStrike?.addEventListener('change', applySettings);
  ninjaSwordRange?.addEventListener('input', applySettings);

  // Initial apply
  applySettings();
});
