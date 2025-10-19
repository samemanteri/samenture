// Ultimate Adventure Game - Phaser Edition (no external assets)

// Config
const TILE = 40;
// Removed fixed WORLD_TILES_X to support endless world
const WORLD_TILES_Y = 60;  // vertical depth (bigger world)
const SURFACE_Y = 28;      // surface level (y-index)
// Endless world params
const CHUNK_W = 32;        // tiles per chunk horizontally
const LOAD_RADIUS = 3;     // chunks to load around player
const WORLD_SEED = 987654321;
const INF_W = 10000000;    // huge world bounds width

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

  // Backpack: up to 3 item stacks (each { item: 'wood'|'stone'|..., qty:number })
  this.backpack = [null, null, null];

  // Core state
  this.state = { health: 4, coins: 0, canFly: false, bounceShoes: false };
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

    // Tool system
    this.tools = {
  owned: { hand: true, wooden: false, stone: false, iron: false, pistol: true, bow: true, cannon: true, minigun: true, ak47: true, knife: true, spear: true, sniper: true, rifle: true, bazooka: true, grenade: true, nuke: true, plane: true, hook: true, cloner: true, teleport: true, slimecloner: true, torch: true, wizard: true, flame: true, pamppu: true, mine: true, rod: true, tower: true, trap: true,
           pistol_copper: false, bow_copper: false, minigun_copper: false, ak47_copper: false, knife_copper: false, sniper_copper: false, bazooka_copper: false, grenade_copper: false, nuke_copper: false, pamppu_copper: false, plane_copper: false },
      equipped: 'pistol',
      cannonMode: 'minigun' // 'minigun' | 'sniper'
    };

    // Endless world bookkeeping
    this.chunks = new Map(); // cx -> { blocks:Set(keys), decor:[], pickups:[], enemies:[] }
    this.loadedChunks = new Set();
    this.currentChunk = null;
    this.lastCenterChunk = null;

  // Touch/mobile controls state
  this.touchState = { left:false, right:false, jump:false, placeMode:false };

  // Cactus hazard bookkeeping
  this.cactusTiles = new Set(); // keys of tiles with cactus
  this._nextCactusHurtAt = 0;

  // Grappling hook state
  this.hook = { active: false, anchor: null };

  // Ninja mode state
  this.ninja = { active: false, swordLevel: 1, knifeLevel: 1, strikeLevel: 1, striking: false, strikeEndAt: 0 };

  // Pamppu (baton) state: modes 'attack' or 'block'
  this.pamppu = { mode: 'attack' };

  // Pause state
  this.isPaused = false;
  this.started = false;

  // Vine (liaani) state
  this.vine = { active:false, reeling:false, anchor:null, length:0 };

  // Game mode: 'classic' | 'galactic' | 'web'
  this.mode = { current: 'classic' };

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

  // Weather: thunderstorms
  this.weather = { isStorm: false, nextLightningAt: 0, nextStormCheckAt: 0, stormEndsAt: 0 };

  // Lightning rods (Ukonjohdatin)
  this.rodPositions = []; // [{tx,ty,hp}]
  this.rods = new Map(); // key -> { image, hp }

  // Day/Night cycle and darkness overlay
  this.day = { period: 120000, start: 0, isNight: false, lastIsNight: false };
  this.darknessGfx = null;
  this._nextZombieSpawnAt = 0;
  this._nextBossSpawnAt = 0;

  // Torches (light sources) prevent zombie spawns nearby
  this.torchPositions = [];
  this.torches = new Map(); // key -> { image }

  // Day/Night cycle and darkness overlay
  this.day = { period: 120000, start: 0, isNight: false, lastIsNight: false }; // 120s per full day
  this.darknessGfx = null;
  this._nextZombieSpawnAt = 0;

  // Torches (light sources) to block zombie spawns
  this.torchPositions = []; // persisted [{tx,ty}]
  this.torches = new Map(); // key -> { image }
  // Traps
  this.trapPositions = []; // [{tx,ty,type,dir}]
  this.traps = new Map(); // key -> { image, zone, type, dir, nextAt }
  this.trap = { type: 'spike', dir: 'right' }; // current selection when placing
  // Death banner handle
  this.deathText = null;
  this.deathDom = null;

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
  
  }

  preload() {
    // Generate simple textures at runtime so the game works without any files
    const g = this.add.graphics();

    // Ground tile (dirt)
    g.fillStyle(0x8B5A2B, 1);
    g.fillRect(0, 0, TILE, TILE);
    g.lineStyle(2, 0x6b3a1b, 1);
    g.strokeRect(0, 0, TILE, TILE);
    g.generateTexture('tex_ground', TILE, TILE);
    g.clear();

    // Stone tile
    g.fillStyle(0x7b7b7b, 1);
    g.fillRect(0, 0, TILE, TILE);
    g.lineStyle(2, 0x5c5c5c, 1);
    g.strokeRect(0, 0, TILE, TILE);
    g.generateTexture('tex_stone', TILE, TILE);
    g.clear();

  // Sand tile (aavikko)
  g.fillStyle(0xE2C572, 1); // warm sand
  g.fillRect(0, 0, TILE, TILE);
  g.lineStyle(2, 0xC9AE5F, 1);
  g.strokeRect(0, 0, TILE, TILE);
  g.generateTexture('tex_sand', TILE, TILE);
  g.clear();

  
  g.fillStyle(0xCFA35B, 1);
  g.fillRect(0, 0, TILE, TILE);
  g.lineStyle(2, 0xA27E44, 1);
  g.generateTexture('tex_sandstone', TILE, TILE);
  g.clear();

  // Player base texture (keep plain, no border)
  const pw = 28, ph = 36;
  g.fillStyle(0xffdd66, 1);
  g.fillRect(0, 0, pw, ph);
  // removed outline to avoid black border
  g.generateTexture('tex_player', pw, ph);
  g.clear();

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

  // Tree trunk and leaves
  g.fillStyle(0x6b3a1b,1); g.fillRect(0,0,TILE,TILE); g.lineStyle(2,0x4a2a12,1); g.strokeRect(0,0,TILE,TILE); g.generateTexture('tex_trunk',TILE,TILE); g.clear();
  // Oak (tammi) trunk variant
  g.fillStyle(0x8e5b2f,1); g.fillRect(0,0,TILE,TILE); g.lineStyle(2,0x6b3f1b,1); g.strokeRect(0,0,TILE,TILE); g.generateTexture('tex_tammi',TILE,TILE); g.clear();
    g.fillStyle(0x2e8b57,1); g.fillRect(0,0,TILE,TILE); g.lineStyle(2,0x1d5d3a,1); g.strokeRect(0,0,TILE,TILE); g.generateTexture('tex_leaves',TILE,TILE); g.clear();
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
  // Arrow projectile
  g.fillStyle(0x8b5a2b,1); g.fillRect(0,3,10,2); // shaft
  g.fillStyle(0xffffff,1); g.fillRect(10,2,2,4); // tip
  g.fillStyle(0xbfbfbf,1); g.fillRect(0,2,2,4); // fletching block
  g.generateTexture('tex_arrow',12,8); g.clear();
  // Bow weapon sprite (draw arc path for the bow limb)
  g.lineStyle(2,0x8b5a2b,1);
  g.beginPath();
  g.arc(6,4,6,-Math.PI/2,Math.PI/2,false);
  g.strokePath();
  // string
  g.fillStyle(0xffffff,1); g.fillRect(1,3,10,2);
  g.generateTexture('tex_weapon_bow',14,8); g.clear();
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
  

  // Rope graphics
  this.hookGfx = this.add.graphics();
  this.vineGfx = this.add.graphics();
  // Cannon aim graphics (for tarkka mode)
  this.cannonAimGfx = this.add.graphics();

    // Initialize endless world (generate starting chunks around x=0)
    this.initInfiniteWorld();

    // Player (use dynamic texture, generated below)
    this.updatePlayerAppearance();
    this.player = this.physics.add.sprite(100, 100, 'tex_player_dyn');
    this.player.setBounce(0.06);
    this.player.body.setSize(20, 34).setOffset(4, 2);

  // Colliders/overlaps
  this.col_player_platforms = this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.slimes, this.platforms);
  this.physics.add.collider(this.oppos, this.platforms);
    this.physics.add.collider(this.bullets, this.platforms, this.onBulletHit, null, this);
    this.physics.add.overlap(this.player, this.pickups, this.onPickup, null, this);
    this.physics.add.overlap(this.player, this.waters, this.onEnterWater, null, this);
    this.physics.add.overlap(this.player, this.items, this.onItemPickup, null, this);
  this.physics.add.overlap(this.player, this.birds, this.onBirdHit, null, this);
    this.physics.add.overlap(this.player, this.slimes, this.onSlimeHit, null, this);
  this.physics.add.overlap(this.player, this.zombies, (p,z)=>{ this._hitByEnemy(z); }, null, this);
  this.physics.add.overlap(this.player, this.enemySoldiers, (p,e)=>{ this._hitByEnemy(e); }, null, this);
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
    this._hitByEnemy({ x:b.x, y:b.y }); b.destroy();
  }, null, this);
  
  // Player bullets vs Oppo
  this.physics.add.overlap(this.bullets, this.oppos, (bullet, oppo)=>{
      if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); bullet.destroy(); return; }
      if (bullet?.getData && bullet.getData('isWeb') && this.mode.current==='web') {
        oppo.setVelocity(0,0); oppo._webbedUntil = this.time.now + 4000; // 4s
      } else {
  const x=oppo.x,y=oppo.y; oppo.destroy(); this.dropCoins(x,y,2);
  if (Math.random() < 0.22 && !this.state.bounceShoes) this.spawnPickup(x, y, 'tex_boots');
      }
      bullet.destroy();
    }, null, this);
  // Player bullets vs enemy soldiers
  this.physics.add.overlap(this.bullets, this.enemySoldiers, (bullet, enemy)=>{
      if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); bullet.destroy(); return; }
      if (bullet?.getData && bullet.getData('fromEnemy')) return; // ignore friendly fire rules for enemy bullets
      const x=enemy.x,y=enemy.y; enemy.destroy(); this.dropCoins(x,y,3+Math.floor(Math.random()*2)); bullet.destroy();
    }, null, this);
  this.physics.add.overlap(this.bullets, this.birds, (bullet, bird)=>{
      if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); bullet.destroy(); return; }
      if (bullet?.getData && bullet.getData('isWeb') && this.mode.current==='web') {
        bird.setVelocity(0,0); bird.body.allowGravity = false; bird._webbedUntil = this.time.now + 3000; // 3s
      } else {
        bird.destroy();
      }
      bullet.destroy();
    }, null, this);
  this.physics.add.overlap(this.bullets, this.slimes, (bullet, slime)=>{
      if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); bullet.destroy(); return; }
      if (bullet?.getData && bullet.getData('isWeb') && this.mode.current==='web') {
        slime.setVelocity(0,0); slime._webbedUntil = this.time.now + 4000; // 4s
      } else {
        const x = slime.x, y = slime.y; slime.destroy(); this.dropCoins(x, y, 3);
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
        const x=zombie.x,y=zombie.y; zombie.destroy(); this.dropCoins(x,y,2);
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
      const isMinigunBullet = ((eq === 'minigun' || eq === 'minigun_copper') && !bullet.getData('isWeb'));
      if (isMinigunBullet) {
        const dmg = (bullet.getData('isCopper') || eq === 'minigun_copper') ? 2 : 1;
        this.damageBoss(boss, dmg);
      }
      bullet.destroy();
    }, null, this);
    

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
  this.keys = this.input.keyboard.addKeys({ A: 'A', D: 'D', W: 'W', SPACE: 'SPACE', C: 'C', V: 'V', E: 'E', ONE: 'ONE', TWO: 'TWO', THREE: 'THREE', FOUR: 'FOUR', FIVE: 'FIVE', SIX: 'SIX', SEVEN: 'SEVEN', EIGHT: 'EIGHT', NINE: 'NINE', Q: 'Q', R: 'R', T: 'T', G: 'G', X: 'X', M: 'M' });
  this.input.mouse?.disableContextMenu();
  // Pointer interactions: on desktop left-click mines/shoots, right-click places
    // On touch, use placeMode toggle to place plank with a tap
    this.input.on('pointerdown', (pointer) => {
      if (!this.started || this.isPaused) return;
      // Ninja mode overrides: left = sword, right = knife
      if (this.ninja.active) {
        if (pointer.rightButtonDown()) this.ninjaThrowKnife(pointer); else this.ninjaSwordSlash(pointer);
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
  else if (this.tools.equipped === 'tower') this.placeTower(pointer);
  else if (this.tools.equipped === 'trap') this.placeTrap(pointer);
        else if (this.tools.equipped === 'mine') this.placeMine(pointer);
        else if (this.tools.equipped === 'rod') this.placeRod(pointer);
        else if (this.tools.equipped === 'cloner') this.cycleCloneTarget();
        else this.placePlank(pointer);
      } else {
        if (isTouch && this.touchState.placeMode) {
          if (this.tools.equipped === 'cannon') this.placeCannon(pointer);
          else if (this.tools.equipped === 'teleport') this.placePortal(pointer);
          else if (this.tools.equipped === 'slimecloner') this.placeSlimeCloner(pointer);
          else if (this.tools.equipped === 'soldiercloner') this.placeSoldierCloner(pointer);
          else if (this.tools.equipped === 'tankcloner') this.placeTankCloner(pointer);
          else if (this.tools.equipped === 'torch') this.placeTorch(pointer);
          else if (this.tools.equipped === 'tower') this.placeTower(pointer);
          else if (this.tools.equipped === 'trap') this.placeTrap(pointer);
          else if (this.tools.equipped === 'cloner') this.spawnClone(pointer);
          else if (this.tools.equipped === 'mine') this.placeMine(pointer);
          else if (this.tools.equipped === 'rod') this.placeRod(pointer);
          else this.placePlank(pointer);
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
          } else if (this.tools.equipped === 'tower') {
            this.removeTowerAtPointer(pointer);
          } else if (this.tools.equipped === 'trap') {
            this.removeTrapAtPointer(pointer);
          } else if (this.tools.equipped === 'rod') {
            this.removeRodAtPointer(pointer);
          } else if (this.tools.equipped === 'cloner') {
            this.spawnClone(pointer);
          } else {
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
  this.input.keyboard.on('keydown-V', () => { if (this.started && !this.isPaused) this.craftPlank(); });
    // Open backpack with E too; if near merchant, E opens merchant as before
    this.input.keyboard.on('keydown-E', () => {
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
  // Quick-equip bazooka with T
  this.input.keyboard.on('keydown-T', guard(()=> this.tryEquipTool('bazooka')));
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
    }));
  // Mode toggle (Classic -> Star -> Spider)
  this.input.keyboard.on('keydown-M', guard(()=> this.cycleMode()));
  // Toggle Ninja mode (J)
  this.input.keyboard.on('keydown-J', guard(()=> this.toggleNinjaMode()));
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
      if (this.buildMiniGame.active) { this.cancelBuildMiniGame(); return; }
      if (this.isPaused) this.resumeGame(); else this.pauseGame();
    });

    // Mopo: F nouse/poistu, Shift = turbo
    this.input.keyboard.on('keydown-F', ()=>{
      if (!this.started || this.isPaused) return;
  if (this.nearMoped) this.toggleMoped();
  if (this.nearCar) this.toggleCar();
  if (this.nearPlane) this.togglePlane();
    });
    // Enter/exit car with Down arrow
    this.input.keyboard.on('keydown-DOWN', ()=>{
      if (!this.started || this.isPaused) return;
      // If near car and not mounted, enter. If mounted, allow exit too.
  if ((this.nearCar && !this.car.mounted) || this.car.mounted) this.toggleCar();
  else if ((this.nearPlane && !this.plane.mounted) || this.plane.mounted) this.togglePlane();
    });
    // Also support cursor down key object
    this.cursors?.down?.on('down', ()=>{
      if (!this.started || this.isPaused) return;
  if ((this.nearCar && !this.car.mounted) || this.car.mounted) this.toggleCar();
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
  
  // Spawn first Oppo a bit later
  this._nextOppoAt = this.time.now + 8000;
  // Place plane near spawn
  this.createPlane();

  // Instructions
    this.add.text(14,14,
    'Ohjeet:\nVasen/Oikea tai A/D = liiku  |  Ylös/Space = hyppy' +
    '\nVasen klikkaus = mainaa (myös alaspäin) tai ammu (pistoolilla)  |  Oikea klikkaus = aseta lankku' +
  '\nC/V = craftaa 3 puusta 1 lankku  |  E = kauppias  |  1-9/Q = työkalut' +
      '\nSpace = liaani  |  R = Tykki-tila (Minigun/Tarkka)' +
      '\nM = Pelitila (Klassinen / Star / Spider)' +
  '\nTeleportti: oikea klikkaus asettaa (8 puuta). Vasen poistaa. R vaihtaa väriä. Mene porttiin: 1,2,3 -> siirto.' +
  '\nLimaklooni: oikea asettaa laitteen, vasen poistaa. Tuottaa limoja ajan kanssa.' +
      '\nPunainen timantti -> Lento  |  Vesi: uida ylös/alas Ylöksellä/Space' +
  '\nVaro lintuja ja limoja!  |  Yö: pimeää ja zombeja. Soihdut estävät spawnit.',
      { fontFamily:'monospace', fontSize:'14px', color:'#fff' })
      .setScrollFactor(0).setDepth(1000).setShadow(2,2,'#000',3);

    // Sync UI and settings checkboxes
  const toggleFly = document.getElementById('toggleFly');
  if (toggleFly) toggleFly.checked = !!this.state.canFly;
  const toggleBoots = document.getElementById('toggleBoots');
  if (toggleBoots) toggleBoots.checked = !!this.state.bounceShoes;

  this.updateUI();

    // Expose scene for UI handlers
    window.gameScene = this;

    // Populate tool select
    this.updateToolSelect();
  // Create weapon sprite (follows player hand)
  this.weaponSprite = this.add.image(this.player.x, this.player.y, 'tex_weapon_pistol').setDepth(6).setVisible(false);
  this.weaponSprite.setOrigin(0.15, 0.5);
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

  // Hotkey: spawn ally drone (Shift+D), cap to 2
  this.input.keyboard.on('keydown-D', ()=>{
    const shift = this.input.keyboard.addKey('SHIFT');
    if (this.input.keyboard.checkDown(shift, 0)) {
      if ((this.drones?.countActive(true)||0) < 2) { this.spawnAllyDrone(); this.showToast?.('Hyvis drone liittyi'); }
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
    document.getElementById('btnStart')?.addEventListener('click', ()=> this.startGame());
    document.getElementById('btnStartSettings')?.addEventListener('click', ()=> document.getElementById('settingsMenu')?.classList.toggle('hidden'));
    document.getElementById('btnResume')?.addEventListener('click', ()=> this.resumeGame());
    document.getElementById('btnRestart')?.addEventListener('click', ()=> this.restartGame());
    document.getElementById('btnPauseSettings')?.addEventListener('click', ()=> document.getElementById('settingsMenu')?.classList.toggle('hidden'));
  // Minigames from pause
  document.getElementById('btnMiniMurder')?.addEventListener('click', ()=>{ try{ window.Sfx?.resume(); }catch(e){} this.startMinigame('murder'); });
  document.getElementById('btnMiniParkour')?.addEventListener('click', ()=>{ try{ window.Sfx?.resume(); }catch(e){} this.startMinigame('parkour'); });
  document.getElementById('btnMiniDesert')?.addEventListener('click', ()=>{ try{ window.Sfx?.resume(); }catch(e){} this.startMinigame('desert'); });
  document.getElementById('btnMiniBuild')?.addEventListener('click', ()=>{ if(!this.buildMiniGame.active && !this.buildMiniGame.awaitingPlacement){ this.startBuildMiniGame(); } });

  // Darkness overlay
  this.darknessGfx = this.add.graphics().setScrollFactor(0).setDepth(900);

  // Initially paused until started
    this.pauseGame(true);
  }

  update() {
  if (!this.started || this.isPaused) { this.hookGfx?.clear(); this.vineGfx?.clear(); this.cannonAimGfx?.clear(); return; }
    // Reset merchant hint each frame, will be re-enabled by overlap
    this.nearMerchant = false;
    if (this.merchantPrompt) this.merchantPrompt.setVisible(false);

    // Reset inWater flag
    this.inWater = false;

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
      const onGround = e.body?.blocked?.down || e.body?.touching?.down;
      const sx=e.x, sy=e.y; const px=this.player.x, py=this.player.y;
      const dx=px-sx, dy=py-sy; const dist2=dx*dx+dy*dy; const range=22*TILE, range2=range*range;
      // LOS
      let los=false; if (dist2<range2){ const steps=Math.ceil(Math.hypot(dx,dy)/(TILE/3)); los=true; for(let i=1;i<=steps;i++){ const ix=sx+dx*i/steps, iy=sy+dy*i/steps; const tx=Math.floor(ix/TILE), ty=Math.floor(iy/TILE); if (this.hasSolidBlockAt(tx,ty)) { los=false; break; } } }
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
          const b=this.spawnBulletFrom(sx2, sy2, px, py, { speed: 1100, lifeTiles: 16, spread: 0.008, noBlockDamage: true, fromEnemy: true });
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
        if (los && (!e._ai?.nextShotAt || this.time.now>=e._ai.nextShotAt)) { if(!e._ai) e._ai={}; e._ai.nextShotAt=this.time.now+Phaser.Math.Between(450,900); const ang=Math.atan2(dy,dx)+Phaser.Math.FloatBetween(-0.05,0.05); const nx=Math.cos(ang), ny=Math.sin(ang); const sx2=sx+nx*12, sy2=sy+ny*6; const b=this.spawnBulletFrom(sx2,sy2,px,py,{ speed:900, lifeTiles:10, spread:0.04, noBlockDamage:true, fromEnemy:true }); }
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
      // hover to a target offset from player
      const toX = this.player.x + (d._ai?.targetOffX||-60);
      const toY = this.player.y + (d._ai?.targetOffY||-90);
      const dx = toX - d.x, dy = toY - d.y;
      d.setVelocity(dx*2.2, dy*2.2);
      // target nearest hostile
      const groups = [this.slimes, this.zombies, this.oppos, this.birds, this.enemySoldiers];
      let best=null, bestD2=Infinity; const r=18*TILE, r2=r*r;
      groups.forEach(gr=> gr?.children?.iterate?.(e=>{ if(!e||!e.active) return; const ddx=e.x-d.x, ddy=e.y-d.y; const d2=ddx*ddx+ddy*ddy; if (d2<bestD2 && d2<r2) { best=e; bestD2=d2; } }));
      const now=this.time.now;
      if (best && (!d._ai.nextAt || now>=d._ai.nextAt)){
        d._ai.nextAt = now + 180;
        const ang = Math.atan2(best.y-d.y, best.x-d.x) + Phaser.Math.FloatBetween(-0.015,0.015);
        const nx=Math.cos(ang), ny=Math.sin(ang);
        const sx=d.x+nx*10, sy=d.y+ny*4;
        this.spawnBulletFrom(sx,sy,best.x,best.y,{ speed:900, lifeTiles:12, spread:0.01, noBlockDamage:true });
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
        const dx = this.player.x - w.x;
        const dir = dx>0?1:-1;
        w.setVelocityX(dir*120);
        if ((w.body.blocked.left || w.body.blocked.right) && w.body.blocked.down) w.setVelocityY(-250);
        const dy = Math.abs(this.player.y - w.y);
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
      if (o._webbedUntil && this.time.now < o._webbedUntil) { o.setVelocity(0,0); return; } else if (o._webbedUntil && this.time.now >= o._webbedUntil) { o._webbedUntil = 0; }
      const dir = Math.sign(this.player.x - o.x) || (Math.random()<0.5?-1:1);
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

    // Car turrets: auto-target mobs with line-of-sight (no shooting through walls)
    // If mounted, attach car to player for clear feedback
    if (this.car?.mounted && this.car.sprite) {
      this.car.sprite.setPosition(this.player.x, this.player.y+10);
      const [tL, tR] = this.car.turrets || [];
      if (tL) tL.setPosition(this.car.sprite.x-28, this.car.sprite.y-12).setVisible(true);
      if (tR) tR.setPosition(this.car.sprite.x+28, this.car.sprite.y-12).setVisible(true);
    }

    if (this.car?.mounted && this.car.turrets?.length) {
  const groups = [this.slimes, this.birds, this.zombies, this.oppos];
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
  const groups = [this.slimes, this.birds, this.zombies, this.oppos];
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

    // Towers: auto-aim precise sniper fire with reload indicator
    if (this.towers?.size) {
      const groups = [this.slimes, this.birds, this.zombies, this.oppos];
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

  const onGround = this.player.body.blocked.down || this.player.body.touching.down;

  // Handle active Ninja strike movement (dash through blocks and home into nearest enemy)
  if (this.ninja.active && this.ninja.striking) {
    // Temporarily disable collisions with platforms
    if (this.col_player_platforms) this.col_player_platforms.active = false;
    this.player.body.checkCollision.none = true;
    // Home into nearest enemy
    const groups = [this.slimes, this.birds, this.zombies, this.oppos];
    let best=null, bestD2=Infinity;
    for (const g of groups) {
      g?.children?.iterate?.(e=>{ if (!e||!e.active) return; const dx=e.x-this.player.x, dy=e.y-this.player.y; const d2=dx*dx+dy*dy; if (d2<bestD2){ bestD2=d2; best=e; }});
    }
    if (best) {
      const dx = best.x - this.player.x, dy = best.y - this.player.y; const d = Math.hypot(dx,dy)||1; const nx=dx/d, ny=dy/d;
      this.player.setVelocity(nx*520, ny*520);
      // Hit on proximity
      if (bestD2 < (1.4*TILE)*(1.4*TILE)) { const x=best.x,y=best.y; best.destroy(); this.dropCoins?.(x,y,3); this.ninja.striking = false; this.ninjaStrikeOff(); this.showToast('Ninja: Hyppyisku!'); }
    }
    if (this.time.now >= this.ninja.strikeEndAt) { this.ninja.striking = false; this.ninjaStrikeOff(); }
  } else {
    // Ensure collisions restored when not striking
    if (this.col_player_platforms) this.col_player_platforms.active = true;
    this.player.body.checkCollision.none = false;
  }

  const left = this.cursors.left.isDown || this.keys.A.isDown || this.touchState.left;
  const right = this.cursors.right.isDown || this.keys.D.isDown || this.touchState.right;
  const jump = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown || this.touchState.jump;
    const baseSpeed = 220;
  const ridingMoped = this.moped?.mounted;
  const ridingPlane = this.plane?.mounted;
  let speed = baseSpeed;
  if (ridingPlane) speed = baseSpeed * (this.plane.speedMult || 2.2);
  else if (ridingMoped) speed = baseSpeed * (this.moped.speedMult * (this._mopedBoost?1.25:1));

  if (left) { this.player.setVelocityX(-speed); this.player.setFlipX(true); }
  else if (right) { this.player.setVelocityX(speed); this.player.setFlipX(false); }
    else { this.player.setVelocityX(0); }

    const canFlyNow = this.state.canFly || this.tools.equipped === 'wizard';
    if (canFlyNow) {
  if (jump) this.player.setVelocityY(-280);
    } else if (jump && onGround) {
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
    if (this.player.y > worldH+200) { this.player.setPosition(this.player.x, 100); this.player.setVelocity(0,0); this.damage(1); }

    // Interact with merchant
  if (Phaser.Input.Keyboard.JustDown(this.keys.E) && this.nearMerchant) this.openMerchant();

    // Handle gravity
    if (this.inWater) {
      this.player.setGravityY(100);
    } else {
      this.player.setGravityY(900);
    }

    // Slime AI: simple patrol and hop
  if (this.slimes) {
      this.slimes.children.iterate((sl)=>{
        if (!sl || !sl.body) return;
        if (sl._webbedUntil && this.time.now < sl._webbedUntil) { sl.setVelocity(0,0); return; } else if (sl._webbedUntil && this.time.now >= sl._webbedUntil) { sl._webbedUntil = 0; }
        if (sl.body.blocked.left) { sl.setVelocityX(80); sl.setFlipX(false); }
        else if (sl.body.blocked.right) { sl.setVelocityX(-80); sl.setFlipX(true); }
        if ((sl.body.blocked.down || sl.body.touching.down) && Math.random()<0.005) sl.setVelocityY(-260);
      });
    }

    // Bird web recovery
    if (this.birds) {
      this.birds.children.iterate((b)=>{
        if (!b) return;
        if (b._webbedUntil && this.time.now >= b._webbedUntil) {
          b._webbedUntil = 0; b.body && (b.body.allowGravity = false);
          // resume horizontal drift
          if (b.active) b.setVelocityX((Math.random()<0.5?-1:1) * (120 + Math.random()*120));
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
        consider(this.slimes); consider(this.zombies);
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
            if (type === 'trunk') this.dropWood(bestSprite.x, bestSprite.y);
            else if (type === 'ground') { if (Math.random() < 0.30) this.dropCoin(bestSprite.x, bestSprite.y); }
            else if (type === 'stone') { if (Math.random() < 0.85) this.dropStone(bestSprite.x, bestSprite.y); }
            // persistence
            if (type === 'plank') {
              this.worldDiff.placed = this.worldDiff.placed.filter(p=>!(p.tx===bestTx && p.ty===bestTy));
            } else {
              if (!this.worldDiff.removed.includes(bestKey)) this.worldDiff.removed.push(bestKey);
            }
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
      // torch light holes
      if (this.torchPositions?.length) {
        this.darknessGfx.setBlendMode(Phaser.BlendModes.ERASE);
  const rad = 140;
  for (const p of this.torchPositions) {
          const wx = p.tx*TILE + TILE/2;
          const wy = p.ty*TILE + TILE/2;
          const sx = wx - cam.scrollX;
          const sy = wy - cam.scrollY;
          if (sx < -rad || sy < -rad || sx > cam.width+rad || sy > cam.height+rad) continue;
          // Radial gradient: strong erase at center, smoothly fading to edge (more transparent overall)
          const steps = 32; const maxA = 0.30, minA = 0.02;
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
        // Add a warm yellow glow pass on top to simulate fire tint (also flickers)
        this.darknessGfx.setBlendMode(Phaser.BlendModes.ADD);
        const glowColor = 0xffcc55;
        const glowSteps = 20; const glowMaxA = 0.12; const glowMinA = 0.0; const glowRad = rad * 0.75;
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
        this.darknessGfx.setBlendMode(Phaser.BlendModes.NORMAL);
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
          if (!nearTorch) {
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
      this.zombies.children.iterate((z)=>{ if (z && z.active) z.destroy(); });
    }

    // Zombie AI: shuffle towards player and hop at ledges
    if (this.zombies) {
      this.zombies.children.iterate((z)=>{
        if (!z || !z.body) return;
        if (z._webbedUntil && this.time.now < z._webbedUntil) { z.setVelocity(0,0); return; } else if (z._webbedUntil && this.time.now >= z._webbedUntil) { z._webbedUntil = 0; }
        const dx = this.player.x - z.x;
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
  ninjaSwordSlash(pointer){
    if (this._ninjaSlashCd && this._ninjaSlashCd > this.time.now) return; this._ninjaSlashCd = this.time.now + 220;
    const tiles = Math.max(1, this.ninja.swordRange || Math.ceil(1.6 + 0.2*(this.ninja.swordLevel-1)));
    const reach = tiles * TILE;
    const px = this.player.x, py = this.player.y;
    const dirRight = !this.player.flipX;
    // Find nearest enemy IN FRONT within reach
    const groups = [this.slimes, this.birds, this.zombies, this.oppos];
    let target = null; let bestD2 = Infinity;
    for (const gr of groups){ gr?.children?.iterate?.((e)=>{ if (!e||!e.active) return; const dx=e.x-px, dy=e.y-py; const forward = dirRight ? dx>=0 : dx<=0; if (!forward) return; const d2=dx*dx+dy*dy; if (d2 <= reach*reach && d2 < bestD2){ bestD2 = d2; target = e; } }); }
    // Visual swipe (straight slash in facing dir)
    const g = this.add.graphics().setDepth(800);
    g.lineStyle(6, 0xffffff, 0.6);
    const sx = px, sy = py; const ex = px + (dirRight ? reach : -reach), ey = py;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.strokePath(); this.time.delayedCall(100, ()=> g.destroy());
    if (target) { const x=target.x,y=target.y; target.destroy(); this.dropCoins?.(x,y,2); }
  }
  ninjaThrowKnife(pointer){
    if (this._ninjaKnifeCd && this._ninjaKnifeCd > this.time.now) return; this._ninjaKnifeCd = this.time.now + Math.max(100, 260 - this.ninja.knifeLevel*20);
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const b = this.spawnBulletFrom(this.player.x, this.player.y, wp.x, wp.y, { speed: 900, lifeTiles: 18, spread: 0, noBlockDamage: true });
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

  // Pause/Start helpers
  startGame(){
    this.started = true;
    try { window.Sfx?.resume(); } catch(e) {}
    this.resumeGame();
    document.getElementById('startScreen')?.classList.add('hidden');
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
  if (this.tools.equipped === 'pistol' || this.tools.equipped === 'pistol_copper' || this.tools.equipped === 'bow' || this.tools.equipped === 'bow_copper' || this.tools.equipped === 'minigun' || this.tools.equipped === 'minigun_copper' || this.tools.equipped === 'sniper' || this.tools.equipped === 'sniper_copper' || this.tools.equipped === 'rifle' || this.tools.equipped === 'cannon' || this.tools.equipped === 'bazooka' || this.tools.equipped === 'bazooka_copper' || this.tools.equipped === 'grenade' || this.tools.equipped === 'grenade_copper' || this.tools.equipped === 'nuke' || this.tools.equipped === 'nuke_copper' || this.tools.equipped === 'plane' || this.tools.equipped === 'plane_copper') {
      if (this.tools.equipped === 'pistol') {
        this.shootBullet(pointer);
      } else if (this.tools.equipped === 'pistol_copper') {
        this.shootBullet(pointer, { copper: true });
      } else if (this.tools.equipped === 'bow') {
        this.fireBow(pointer);
      } else if (this.tools.equipped === 'bow_copper') {
        this.fireBow(pointer, { copper: true });
      } else if (this.tools.equipped === 'minigun') {
        this.shootMinigunBurst(pointer);
      } else if (this.tools.equipped === 'minigun_copper') {
        this.shootMinigunBurst(pointer, { copper: true });
      } else if (this.tools.equipped === 'cannon') {
        this.fireCannon(pointer);
      } else if (this.tools.equipped === 'bazooka') {
        this.fireBazooka(pointer);
      } else if (this.tools.equipped === 'bazooka_copper') {
        this.fireBazooka(pointer, { copper: true });
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

    // Tool gating: require a pickaxe for stone
    if (type === 'stone') {
      const allowed = this.tools.equipped === 'wooden' || this.tools.equipped === 'stone' || this.tools.equipped === 'iron';
      if (!allowed) { this.showToast('Tarvitset hakun! (2: puuhakku)'); return; }
    }

  if (type === 'trunk' || type === 'tammi') this.dropWood(sprite.x, sprite.y);
    else if (type === 'ground') { if (Math.random() < 0.30) this.dropCoin(sprite.x, sprite.y); }
    else if (type === 'stone') { if (Math.random() < 0.85) this.dropStone(sprite.x, sprite.y); }

    // Update persistence diff
    if (type === 'plank') {
      // remove from placed list
      this.worldDiff.placed = this.worldDiff.placed.filter(p=>!(p.tx===tx && p.ty===ty));
    } else {
      if (!this.worldDiff.removed.includes(key)) this.worldDiff.removed.push(key);
    }

  sprite.destroy();
  this.blocks.delete(key);
  if (type === 'cactus') this.cactusTiles.delete(key);
  // If there is water above this tile, let it flow down
  this.tryFlowWaterFrom(tx, ty-1);
    this.saveState();
  }

  // === Build Minigame Helpers ===
  startBuildMiniGame(){
    const palette = ['wood','stone','plank','sand','cactus','tammi'];
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
  placeTrap(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.get(key)) { this.showToast('Paikka varattu'); return; }
    if (!this.hasSolidBlockAt(tx, ty+1)) { this.showToast('Tarvitset lattian alle'); return; }
    if (this.traps.has(key)) { this.showToast('Ansa jo tässä'); return; }
    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
  let imgKey = 'tex_trap_spike';
  const t = this.trap?.type || 'spike';
  if (t==='bear') imgKey='tex_trap_bear'; else if (t==='tripwire') imgKey='tex_trap_tripwire';
  else if (t==='fire') imgKey='tex_trap_fire'; else if (t==='poison') imgKey='tex_trap_poison';
  else if (t==='spring') imgKey='tex_trap_spring'; else if (t==='freeze') imgKey='tex_trap_freeze'; else if (t==='alarm') imgKey='tex_trap_alarm';
    const img = this.add.image(x,y,imgKey).setDepth(4);
    // detection zone slightly smaller than tile to avoid edge hits
    const zone = this.add.zone(x,y,TILE*0.9,TILE*0.9);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    zone.setData('type','trap'); zone.setData('tx',tx); zone.setData('ty',ty);
    // Store
    const dir = this.trap?.dir || (pointer.worldX >= this.player.x ? 'right' : 'left');
    this.traps.set(key, { image: img, zone, type: t, dir, nextAt: 0 });
    this.trapPositions.push({ tx, ty, type: t, dir });
    // Hook behavior
  if (t === 'tripwire') this._armTripwireAt(tx, ty);
  else if (t === 'bear') this._armBearAt(tx, ty);
  else if (t === 'spike') this._armSpikeAt(tx, ty);
  else if (t === 'fire') this._armFireAt(tx,ty);
  else if (t === 'poison') this._armPoisonAt(tx,ty);
  else if (t === 'spring') this._armSpringAt(tx,ty);
  else if (t === 'freeze') this._armFreezeAt(tx,ty);
  else if (t === 'alarm') this._armAlarmAt(tx,ty);
    this.saveState();
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
    const order = ['spike','bear','tripwire','fire','poison','spring','freeze','alarm'];
    const i = order.indexOf(this.trap.type);
    const next = order[(i+1)%order.length];
    this.trap.type = next;
    const name = { spike:'Piikki', bear:'Karhu', tripwire:'Lankaviritin', fire:'Tuli', poison:'Myrkky', spring:'Jousi', freeze:'Jää', alarm:'Hälytin' }[next] || next;
    this.showToast(`Ansa: ${name}`);
  }
  // Public helper: set trap type programmatically (supports Finnish aliases)
  setTrapType(type){
    const alias = { piikki:'spike', karhu:'bear', lankaviritin:'tripwire', tuli:'fire', myrkky:'poison', jousi:'spring', jää:'freeze', jaa:'freeze', halytin:'alarm', hälytin:'alarm' };
    const t = alias[type] || type;
    const valid = new Set(['spike','bear','tripwire','fire','poison','spring','freeze','alarm']);
    if (valid.has(t)) { this.trap.type = t; const name = { spike:'Piikki', bear:'Karhu', tripwire:'Lankaviritin', fire:'Tuli', poison:'Myrkky', spring:'Jousi', freeze:'Jää', alarm:'Hälytin' }[t]; this.showToast(`Ansa: ${name}`); this.saveState(); }
  }
  _armSpikeAt(tx, ty){
    const key = `${tx},${ty}`; const rec = this.traps.get(key); if (!rec) return;
    const zone = rec.zone;
    // Spike: overlapping enemies take damage or die
    this.physics.add.overlap(zone, [this.slimes, this.zombies, this.oppos, this.birds, this.enemySoldiers], (z, enemy)=>{
      const x=enemy.x,y=enemy.y; enemy.destroy(); this.dropCoins(x,y,2);
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
      this.time.delayedCall(600, ()=>{ try{ enemy.destroy(); }catch(e){} this.removeTrapAt(tx,ty); });
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
      this.physics.add.overlap(dart, [this.slimes, this.zombies, this.oppos, this.enemySoldiers, this.birds], (d,e)=>{ const px=e.x,py=e.y; e.destroy(); d.destroy(); this.dropCoins(px,py,1); }, null, this);
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
        this.physics.add.overlap(f, [this.slimes,this.zombies,this.oppos,this.enemySoldiers,this.birds], (ff,e)=>{ const px=e.x,py=e.y; e.destroy(); this.dropCoins(px,py,1); ff.destroy(); }, null, this);
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
      const kill = (e)=>{ const px=e.x,py=e.y; e.destroy(); this.dropCoins(px,py,1); };
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
      if (forward && d2 <= reach*reach) { const x=e.x,y=e.y; e.destroy(); if (coins>0) this.dropCoins(x,y,coins); }
    };
    this.slimes?.children?.iterate?.(e=>hitEnemy(e,3));
    this.birds?.children?.iterate?.(e=>hitEnemy(e,0));
    this.zombies?.children?.iterate?.(e=>hitEnemy(e,2));
    this.oppos?.children?.iterate?.(e=>hitEnemy(e,2));
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
      if (Math.abs(dy) <= 14 && Math.abs(dx) <= reach) { const x=e.x,y=e.y; e.destroy(); if (coins>0) this.dropCoins(x,y,coins); }
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
      if (!e || !e.active) return; const x=e.x,y=e.y; e.destroy(); if (coins>0) this.dropCoins(x,y,coins);
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
  this.shootBullet(pointer, { spread: 0.10, markMinigun: true, copper: !!opts.copper });
      });
    }
  }

  shootSniper(pointer, opts = {}){
    // Long range 17 tiles, faster projectile
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
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
  if (type === 'trunk' || type==='tammi') this.dropWood(spr.x, spr.y);
      else if (type === 'ground') { if (Math.random() < 0.30) this.dropCoin(spr.x, spr.y); }
      else if (type === 'stone') { if (Math.random() < 0.85) this.dropStone(spr.x, spr.y); }
      if (type === 'plank') {
        this.worldDiff.placed = this.worldDiff.placed.filter(p=>!(p.tx===tx && p.ty===ty));
      } else {
        if (!this.worldDiff.removed.includes(key)) this.worldDiff.removed.push(key);
      }
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
  if (type === 'trunk' || type==='tammi') this.dropWood(spr.x, spr.y);
      else if (type === 'ground') { if (Math.random() < 0.35) this.dropCoin(spr.x, spr.y); }
      else if (type === 'stone') { if (Math.random() < 0.9) this.dropStone(spr.x, spr.y); }
      if (type === 'plank') {
        this.worldDiff.placed = this.worldDiff.placed.filter(p=>!(p.tx===tx && p.ty===ty));
      } else {
        if (!this.worldDiff.removed.includes(key)) this.worldDiff.removed.push(key);
      }
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
  if (type === 'trunk' || type==='tammi') this.dropWood(spr.x, spr.y);
        else if (type === 'ground') { if (Math.random() < 0.30) this.dropCoin(spr.x, spr.y); }
        else if (type === 'stone') { if (Math.random() < 0.85) this.dropStone(spr.x, spr.y); }
        // persistence
        if (type === 'plank') {
          this.worldDiff.placed = this.worldDiff.placed.filter(p=>!(p.tx===tx && p.ty===ty));
        } else {
          if (!this.worldDiff.removed.includes(key)) this.worldDiff.removed.push(key);
        }
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
    const order = ['none','ground','stone','sand','cactus','trunk','tammi'];
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
  _hitByEnemy(enemy){
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

  // Spawn a friendly hovering drone near player
  spawnAllyDrone(){
    const x = this.player.x + (Math.random()<0.5?-60:60);
    const y = this.player.y - 80;
    const d = this.drones.create(x,y,'tex_drone');
    d.setDepth(5);
    d._ai = { targetOffX: Phaser.Math.Between(-70,-50), targetOffY: Phaser.Math.Between(-100,-80), nextAt: 0 };
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
        if (type === 'trunk' || type==='tammi') this.dropWood(spr.x, spr.y);
        else if (type === 'ground') { if (Math.random() < 0.30) this.dropCoin(spr.x, spr.y); }
        else if (type === 'stone') { if (Math.random() < 0.85) this.dropStone(spr.x, spr.y); }
        // Persistence
        if (type === 'plank') {
          this.worldDiff.placed = this.worldDiff.placed.filter(p=> !(p.tx===tx && p.ty===ty));
        } else {
          if (!this.worldDiff.removed.includes(key)) this.worldDiff.removed.push(key);
        }
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

  placePlank(pointer) {
    if (this.inv.plank <= 0) { this.showToast('Ei lankkuja! Craftaa C'); return; }
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(worldPoint.x / TILE);
    const ty = Math.floor(worldPoint.y / TILE);
    const key = `${tx},${ty}`;
    if (this.blocks.has(key)) { this.showToast('Paikka varattu'); return; }

    const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
    const newRect = new Phaser.Geom.Rectangle(x - TILE/2, y - TILE/2, TILE, TILE);
    const pb = new Phaser.Geom.Rectangle(this.player.body.x, this.player.body.y, this.player.body.width, this.player.body.height);
    if (Phaser.Geom.Intersects.RectangleToRectangle(newRect, pb)) { this.showToast('Liian lähellä'); return; }

  this.addBlock(tx, ty, 'tex_ground', 'plank', true);
  this.inv.plank -= 1; this.updateInventoryUI();

    // persist placement
    this.worldDiff.placed.push({ tx, ty, type:'plank', textureKey:'tex_ground' });
    // If it was previously removed (same coordinate), clean up
    this.worldDiff.removed = this.worldDiff.removed.filter(k=>k!==key);
    this.saveState();
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
  let projKey = 'tex_bullet';
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
  const speed = 600; // px per second
  bullet.setVelocity(normX * speed, normY * speed);
    bullet.setRotation(Math.atan2(normY, normX));
  if (opts.copper) bullet.setData('isCopper', true);
  // Destroy after 4 tiles distance (time = distance / speed)
  const extraTiles = opts.copper ? 17 : 0;
  const lifeMs = ((4 + extraTiles) * TILE / speed) * 1000;
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
    // Tap: fire 2 magic shots, range 13 tiles
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const sx = this.player.x, sy = this.player.y;
    // two shots with slight spread
    this.spawnBulletFrom(sx, sy, wp.x, wp.y, { speed: 700, lifeTiles: 13, spread: 0.05 });
    this.time.delayedCall(70, ()=>{
      this.spawnBulletFrom(sx, sy, wp.x, wp.y, { speed: 700, lifeTiles: 13, spread: 0.05 });
    });
    window.playSfx?.('shoot');
  }
  wizardChargeRelease(pointer){
    // Hold+release: fire an explosive rocket
    this.fireBazooka(pointer);
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
        if (type==='trunk' || type==='tammi' || type==='leaves' || type==='cactus'){
          if (type==='trunk' || type==='tammi') this.dropWood(spr.x, spr.y);
          if (type === 'plank') {
            this.worldDiff.placed = this.worldDiff.placed.filter(p=>!(p.tx===tx && p.ty===ty));
          } else {
            if (!this.worldDiff.removed.includes(key)) this.worldDiff.removed.push(key);
          }
          spr.destroy(); this.blocks.delete(key); if (type==='cactus') this.cactusTiles.delete(key);
        }
      }
    }
  }

  // Spawn a bullet from (sx,sy) to (tx,ty). opts: { speed, lifeTiles, spread, ignoreCannonKey }
  spawnBulletFrom(sx, sy, tx, ty, opts={}){
    const dirX = tx - sx, dirY = ty - sy;
    const dist = Math.hypot(dirX, dirY) || 1;
    let nx = dirX / dist, ny = dirY / dist;
    if (opts.spread && opts.spread > 0) {
      const base = Math.atan2(ny, nx);
      const jitter = (Math.random()*2 - 1) * opts.spread;
      const a = base + jitter;
      nx = Math.cos(a); ny = Math.sin(a);
    }
  let projKey = 'tex_bullet';
  if (this.mode.current === 'galactic') projKey = 'tex_laser';
  if (this.mode.current === 'web') projKey = 'tex_web';
  const b = this.bullets.create(sx, sy, projKey);
  if (this.mode.current === 'web') b.setData('isWeb', true);
  if (opts.isMinigun) b.setData('isMinigun', true);
    const speed = opts.speed || 600;
    b.setVelocity(nx*speed, ny*speed);
    b.setRotation(Math.atan2(ny, nx));
  if (opts.ignoreCannonKey) b.setData('ignoreCannonKey', opts.ignoreCannonKey);
  if (opts.fromEnemy) b.setData('fromEnemy', true);
  if (opts.noBlockDamage) b.setData('noBlockDamage', true);
    const lifeMs = ((opts.lifeTiles || 6) * TILE / speed) * 1000;
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
  if (type === 'trunk' || type==='tammi') this.dropWood(block.x, block.y);
    else if (type === 'ground') { if (Math.random() < 0.30) this.dropCoin(block.x, block.y); }
    else if (type === 'stone') { if (Math.random() < 0.85) this.dropStone(block.x, block.y); }
    // Update persistence
    if (type === 'plank') {
      this.worldDiff.placed = this.worldDiff.placed.filter(p=>!(p.tx===tx && p.ty===ty));
    } else {
      if (!this.worldDiff.removed.includes(key)) this.worldDiff.removed.push(key);
    }
  block.destroy();
  this.blocks.delete(key);
  if (type === 'cactus') this.cactusTiles.delete(key);
    // If there is water above this tile, let it flow down
    this.tryFlowWaterFrom(tx, ty-1);
    bullet.destroy();
    this.saveState();
  }

  cycleMode(){
    const order = ['classic','galactic','web'];
    const i = order.indexOf(this.mode.current);
    this.mode.current = order[(i+1)%order.length];
    this.showToast(`Tila: ${this.mode.current==='classic'?'Klassinen': this.mode.current==='galactic'?'Star':'Spider'}`);
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

  onItemPickup(player, item){
    const type = item.getData('item');
    if (type === 'wood' || type === 'stone') {
      if (!this.addToBackpack(type, 1)) {
        // fallback to main inv if backpack full
        if (type === 'wood') this.inv.wood++; else this.inv.stone++;
      }
  this.updateInventoryUI(); this.updateBackpackUI(); this.saveState();
    }
    item.destroy();
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
    if (healthEl) healthEl.textContent = `Elämät: ${this.state.health}`;
    if (coinsEl) coinsEl.textContent = `Kolikot: ${this.state.coins}`;
    this.updateInventoryUI();
  }

  updateInventoryUI(){
    const slots = document.querySelectorAll('#inventory .slot');
    if (!slots?.length) return;
    slots[0].textContent = `Puu: ${this.inv.wood}`;
    slots[1].textContent = `Lankku: ${this.inv.plank}`;
    slots[2].textContent = `Kivi: ${this.inv.stone}`;
    slots[3].textContent = `Kolikot: ${this.state.coins}`;
    slots[4].textContent = this.state.canFly ? 'Lento ✓' : '';
    // Show equipped tool
  const toolNames = { hand:'Käsi', wooden:'Puuhakku', stone:'Kivihakku', iron:'Rautahakku', pistol:'Pistooli', bow:'Jousipyssy', cannon:'Tykki', minigun:'Minigun', ak47:'AK-47', knife:'Puukko', sniper:'Tarkka-ase', rifle:'Kivääri', bazooka:'Bazooka', grenade:'Kranaatti', nuke:'Ydinase', plane:'Lentokone', hook:'Koukku', cloner:'Kloonaaja', teleport:'Teleportti', slimecloner:'Limaklooni', soldiercloner:'Sotilasklooni', torch:'Soihtu', wizard:'Velho', flame:'Tulenheitin', pamppu:'Pamppu', mine:'Miina', rod:'Ukonjohdatin', tower:'Ampumatorni',
    pistol_copper:'Pistooli (Kupari)', bow_copper:'Jousipyssy (Kupari)', minigun_copper:'Minigun (Kupari)', ak47_copper:'AK-47 (Kupari)', knife_copper:'Puukko (Kupari)', sniper_copper:'Tarkka-ase (Kupari)', bazooka_copper:'Bazooka (Kupari)', grenade_copper:'Kranaatti (Kupari)', nuke_copper:'Ydinase (Kupari)', pamppu_copper:'Pamppu (Kupari)', plane_copper:'Lentokone (Kupari)'
  };
  const eq = this.tools.equipped;
  let suffix = '';
  if (eq === 'cannon') suffix = ` (${this.tools.cannonMode==='minigun'?'Minigun':'Tarkka'})`;
  if (eq === 'pamppu') suffix = ` (${this.pamppu.mode==='attack'?'Lyönti':'Suojaus'})`;
  const modeLabel = this.mode?.current==='classic' ? 'Klassinen' : (this.mode.current==='galactic'?'Star':'Spider');
  slots[5].textContent = `Työkalu: ${toolNames[eq]}${suffix}  |  Tila: ${modeLabel}`;
  }

  updateWeaponSprite(){
    if (!this.weaponSprite) return;
    const eq = this.tools?.equipped;
  let key = null;
    if (eq === 'pistol') key = 'tex_weapon_pistol';
    else if (eq === 'minigun') key = 'tex_weapon_minigun';
  else if (eq === 'sniper') key = 'tex_weapon_sniper';
  else if (eq === 'rifle') key = 'tex_weapon_rifle';
    else if (eq === 'bazooka') key = 'tex_weapon_bazooka';
  else if (eq === 'knife') key = 'tex_weapon_knife';
  else if (eq === 'spear') key = 'tex_weapon_spear';
  else if (eq === 'grenade') key = 'tex_grenade';
    else if (eq === 'nuke') key = 'tex_nuke';
  else if (eq === 'wizard') key = 'tex_weapon_wand';
  else if (eq === 'pamppu') key = 'tex_weapon_baton';
  else if (eq === 'ak47') key = 'tex_weapon_ak47';
  else if (eq === 'flame') key = 'tex_weapon_flamer';
  else if (eq === 'bow') key = 'tex_weapon_bow';
    // Show cannon as a small barrel when selected (optional)
    else if (eq === 'cannon') key = 'tex_cannon_base';
    // copper variants reuse same sprites for now
    else if (/_copper$/.test(eq)) {
      const base = eq.replace(/_copper$/,'');
  const map = { pistol:'tex_weapon_pistol', minigun:'tex_weapon_minigun', sniper:'tex_weapon_sniper', rifle:'tex_weapon_rifle', bazooka:'tex_weapon_bazooka', knife:'tex_weapon_knife', grenade:'tex_grenade', nuke:'tex_nuke', wizard:'tex_weapon_wand', pamppu:'tex_weapon_baton', ak47:'tex_weapon_ak47', flame:'tex_weapon_flamer', bow:'tex_weapon_bow', cannon:'tex_cannon_base' };
      key = map[base] || null;
    }
    // Hide for non-weapon tools
    if (key) {
      this.weaponSprite.setTexture(key).setVisible(true);
      // Dynamic origin & scale based on weapon length so hand grips near rear
  const longWeapons = new Set(['tex_weapon_sniper','tex_weapon_bazooka']);
      const midWeapons = new Set(['tex_weapon_minigun','tex_weapon_ak47','tex_weapon_flamer']);
      if (eq === 'grenade' || eq === 'nuke') {
        this.weaponSprite.setOrigin(0.5,0.5).setScale(0.9);
      } else if (longWeapons.has(key)) {
        this.weaponSprite.setOrigin(0.1,0.55).setScale(1);
      } else if (midWeapons.has(key)) {
        this.weaponSprite.setOrigin(0.18,0.55).setScale(1);
      } else if (eq === 'knife') {
        this.weaponSprite.setOrigin(0.25,0.55).setScale(0.9);
      } else if (eq === 'pamppu') {
        this.weaponSprite.setOrigin(0.15,0.55).setScale(1);
      } else if (eq === 'wizard') {
        this.weaponSprite.setOrigin(0.15,0.55).setScale(1);
      } else if (eq === 'bow') {
        this.weaponSprite.setOrigin(0.2,0.55).setScale(1);
      } else if (eq === 'cannon') {
        this.weaponSprite.setOrigin(0.3,0.5).setScale(0.8);
      } else {
        this.weaponSprite.setOrigin(0.2,0.55).setScale(1);
      }
      // Copper variant tint overlay (simple colorize)
      if (/_copper$/.test(eq)) {
        this.weaponSprite.setTint(0xffb25a);
      } else {
        this.weaponSprite.clearTint();
      }
    } else {
      this.weaponSprite.setVisible(false);
    }
  }

  updateToolSelect(){
    const select = document.getElementById('toolSelect');
    if (!select) return;
    select.innerHTML = '';
  const toolNames = { hand:'Käsi', wooden:'Puuhakku', stone:'Kivihakku', iron:'Rautahakku', pistol:'Pistooli', bow:'Jousipyssy', cannon:'Tykki', minigun:'Minigun', ak47:'AK-47', knife:'Puukko', spear:'Keihäs', sniper:'Tarkka-ase', rifle:'Kivääri', bazooka:'Bazooka', grenade:'Kranaatti', nuke:'Ydinase', plane:'Lentokone', hook:'Koukku', cloner:'Kloonaaja', teleport:'Teleportti', slimecloner:'Limaklooni', soldiercloner:'Sotilasklooni', torch:'Soihtu', wizard:'Velho', flame:'Tulenheitin', pamppu:'Pamppu', mine:'Miina', rod:'Ukonjohdatin', tower:'Ampumatorni', trap:'Ansat',
    pistol_copper:'Pistooli (Kupari)', bow_copper:'Jousipyssy (Kupari)', minigun_copper:'Minigun (Kupari)', ak47_copper:'AK-47 (Kupari)', knife_copper:'Puukko (Kupari)', sniper_copper:'Tarkka-ase (Kupari)', bazooka_copper:'Bazooka (Kupari)', grenade_copper:'Kranaatti (Kupari)', nuke_copper:'Ydinase (Kupari)', pamppu_copper:'Pamppu (Kupari)', plane_copper:'Lentokone (Kupari)'
  };
    for (const tool in this.tools.owned) {
      if (this.tools.owned[tool]) {
        const option = document.createElement('option');
        option.value = tool;
        option.textContent = toolNames[tool];
        select.appendChild(option);
      }
    }
    select.value = this.tools.equipped;
    select.addEventListener('change', () => {
      this.tools.equipped = select.value;
      this.updateInventoryUI();
      this.updateWeaponSprite?.();
      this.saveState();
    });
  }

  // --- World building helpers ---
  keyFromTile(tx, ty) { return `${tx},${ty}`; }

  addBlock(tx, ty, textureKey, type='ground', collides=true) {
    const x = tx * TILE + TILE/2;
    const y = ty * TILE + TILE/2;
    let sprite;
    if (collides) {
      sprite = this.platforms.create(x, y, textureKey);
      sprite.refreshBody();
      sprite.setData('type', type);
  const k = this.keyFromTile(tx, ty);
  this.blocks.set(k, sprite);
  if (type === 'cactus') this.cactusTiles.add(k);
      if (this.currentChunk!=null) this.chunks.get(this.currentChunk)?.blocks.add(k);
    } else {
      sprite = this.add.image(x, y, textureKey);
      this.decor.add(sprite);
      if (this.currentChunk!=null) this.chunks.get(this.currentChunk)?.decor.push(sprite);
    }
    return sprite;
  }

  addWater(tx, ty) {
    const x = tx * TILE + TILE/2;
    const y = ty * TILE + TILE/2;
    const sprite = this.add.image(x, y, 'tex_water');
    this.waters.add(sprite);
    this.waterTiles.set(`${tx},${ty}`, sprite);
    if (this.currentChunk!=null) this.chunks.get(this.currentChunk)?.decor.push(sprite);
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
  let imgKey = 'tex_trap_spike'; if (p.type==='bear') imgKey='tex_trap_bear'; else if (p.type==='tripwire') imgKey='tex_trap_tripwire'; else if (p.type==='fire') imgKey='tex_trap_fire'; else if (p.type==='poison') imgKey='tex_trap_poison'; else if (p.type==='spring') imgKey='tex_trap_spring'; else if (p.type==='freeze') imgKey='tex_trap_freeze'; else if (p.type==='alarm') imgKey='tex_trap_alarm';
        const img = this.add.image(x,y,imgKey).setDepth(4);
        const zone = this.add.zone(x,y,TILE*0.9,TILE*0.9);
        this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
        zone.setData('type','trap'); zone.setData('tx',p.tx); zone.setData('ty',p.ty);
        const cx = Math.floor(p.tx / CHUNK_W);
        this.chunks.get(cx)?.decor.push(img);
        this.chunks.get(cx)?.decor.push(zone);
        this.traps.set(key, { image: img, zone, type: p.type, dir: p.dir||'right', nextAt: 0 });
  if (p.type==='tripwire') this._armTripwireAt(p.tx,p.ty); else if (p.type==='bear') this._armBearAt(p.tx,p.ty); else if (p.type==='spike') this._armSpikeAt(p.tx,p.ty); else if (p.type==='fire') this._armFireAt(p.tx,p.ty); else if (p.type==='poison') this._armPoisonAt(p.tx,p.ty); else if (p.type==='spring') this._armSpringAt(p.tx,p.ty); else if (p.type==='freeze') this._armFreezeAt(p.tx,p.ty); else if (p.type==='alarm') this._armAlarmAt(p.tx,p.ty);
      }
    }
  }

  ensureChunksAround(centerX){
    const center = Math.floor((centerX / TILE) / CHUNK_W);
    // Load needed
    for (let cx = center-LOAD_RADIUS; cx <= center+LOAD_RADIUS; cx++) {
      if (!this.loadedChunks.has(cx)) {
        this.generateChunk(cx);
      }
    }
    // Unload far
    for (const cx of Array.from(this.loadedChunks)) {
      if (cx < center-LOAD_RADIUS-1 || cx > center+LOAD_RADIUS+1) this.unloadChunk(cx);
    }
  }

  generateChunk(cx){
    this.currentChunk = cx;
    this.loadedChunks.add(cx);
    this.chunks.set(cx, { blocks:new Set(), decor:[], pickups:[], enemies:[] });

    const rng = this.makeRandom((WORLD_SEED ^ (cx*73856093)) >>> 0);
    const startTx = cx * CHUNK_W;
    const endTx = startTx + CHUNK_W - 1;

  // Determine biome for this chunk: trend toward desert the farther from center ("pelin reunaan" aavikko)
    const dist = Math.abs(cx);
    const centerNoDesert = 8;      // chunks around center: no desert here
    const farAlwaysDesert = 25;    // beyond this: always desert
    let biome;
    if (dist <= centerNoDesert) {
      biome = 'forest';
    } else if (dist >= farAlwaysDesert) {
      biome = 'desert';
    } else {
      // Smoothly increase desert probability from 15% to 85% between the thresholds
      const t = (dist - centerNoDesert) / (farAlwaysDesert - centerNoDesert);
      const desertProb = 0.15 + t * 0.70; // 0.15..0.85
      biome = (rng() < desertProb) ? 'desert' : 'forest';
    }

    // Surface line and underground fill per biome
    for (let tx = startTx; tx <= endTx; tx++) {
      if (biome === 'desert') {
        this.addBlock(tx, SURFACE_Y, 'tex_sand', 'sand', true);
        for (let ty = SURFACE_Y+1; ty < WORLD_TILES_Y; ty++) {
          const tex = (ty - SURFACE_Y > 2) ? 'tex_sandstone' : 'tex_sand';
          const type = (tex === 'tex_sandstone') ? 'stone' : 'sand';
          this.addBlock(tx, ty, tex, type, true);
        }
      } else {
        this.addBlock(tx, SURFACE_Y, 'tex_ground', 'ground', true);
        for (let ty = SURFACE_Y+1; ty < WORLD_TILES_Y; ty++) {
          const tex = (ty - SURFACE_Y > 2) ? 'tex_stone' : 'tex_ground';
          const type = (tex === 'tex_stone') ? 'stone' : 'ground';
          this.addBlock(tx, ty, tex, type, true);
        }
      }
    }

  // Create some underground water ponds in this chunk (rare in desert)
  const ponds = biome === 'desert' ? (rng()<0.15?1:0) : Math.floor(rng()*2); // desert rare oases
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

    // Floating platforms above surface
    const plats = 6 + Math.floor(rng()*5);
    for (let i=0;i<plats;i++){
      const len = 2 + Math.floor(rng()*6);
      const px = startTx + 2 + Math.floor(rng() * Math.max(1, (CHUNK_W - len - 4)));
      const py = 6 + Math.floor(rng() * (SURFACE_Y - 8));
      const platTex = biome === 'desert' ? 'tex_sand' : 'tex_ground';
      const platType = biome === 'desert' ? 'sand' : 'ground';
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
    } else {
      // Trees on surface (forest)
      const trees = 3 + Math.floor(rng()*4);
      for (let i=0;i<trees;i++){
        const tx = startTx + 2 + Math.floor(rng() * (CHUNK_W - 4));
        const baseTy = SURFACE_Y - 1;
        const height = 3 + Math.floor(rng()*3);
        // 25% chance to generate an oak (tammi) tree
        const isTammi = rng() < 0.25;
        const trunkTex = isTammi ? 'tex_tammi' : 'tex_trunk';
        const trunkType = isTammi ? 'tammi' : 'trunk';
        for (let h=0; h<height; h++) this.addBlock(tx, baseTy-h, trunkTex, trunkType, true);
        for (let lx=-2; lx<=2; lx++) for (let ly=-2; ly<=0; ly++) {
          if (Math.abs(lx)+Math.abs(ly) <= 3) this.addBlock(tx+lx, baseTy - height + ly, 'tex_leaves', 'leaves', false);
        }
      }
    }

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
    if (rng() < 0.8){
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
      s.setBounce(0.1, 0.0);
      s.setCollideWorldBounds(true);
      s.setVelocityX(rng()<0.5?-80:80);
      s.body.setSize(24,16).setOffset(2,4);
      this.chunks.get(cx)?.enemies.push(s);
    }

    // Apply persistence diffs for this chunk
    this.applyWorldDiffForChunk(cx);

    // Ensure traps in this chunk are spawned
    if (Array.isArray(this.trapPositions)) {
      for (const p of this.trapPositions) {
        const tx=p.tx, ty=p.ty; if (Math.floor(tx/CHUNK_W)!==cx) continue;
        const key = `${tx},${ty}`;
        if (this.traps.has(key)) continue;
        const x = tx*TILE + TILE/2, y = ty*TILE + TILE/2;
  let imgKey = 'tex_trap_spike'; if (p.type==='bear') imgKey='tex_trap_bear'; else if (p.type==='tripwire') imgKey='tex_trap_tripwire'; else if (p.type==='fire') imgKey='tex_trap_fire'; else if (p.type==='poison') imgKey='tex_trap_poison'; else if (p.type==='spring') imgKey='tex_trap_spring'; else if (p.type==='freeze') imgKey='tex_trap_freeze'; else if (p.type==='alarm') imgKey='tex_trap_alarm';
        const img = this.add.image(x,y,imgKey).setDepth(4);
        const zone = this.add.zone(x,y,TILE*0.9,TILE*0.9); this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
        zone.setData('type','trap'); zone.setData('tx',tx); zone.setData('ty',ty);
        this.chunks.get(cx)?.decor.push(img); this.chunks.get(cx)?.decor.push(zone);
        this.traps.set(key, { image: img, zone, type: p.type, dir: p.dir||'right', nextAt: 0 });
  if (p.type==='tripwire') this._armTripwireAt(tx,ty); else if (p.type==='bear') this._armBearAt(tx,ty); else if (p.type==='spike') this._armSpikeAt(tx,ty); else if (p.type==='fire') this._armFireAt(tx,ty); else if (p.type==='poison') this._armPoisonAt(tx,ty); else if (p.type==='spring') this._armSpringAt(tx,ty); else if (p.type==='freeze') this._armFreezeAt(tx,ty); else if (p.type==='alarm') this._armAlarmAt(tx,ty);
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

    this.chunks.delete(cx);
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
      if (spot) { this.spawnBossAt(spot.tx, spot.ty); return; }
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

  spawnBossAt(tx, ty){
    const x = tx*TILE + (TILE*2);
    const y = ty*TILE + (TILE*2);
    const s = this.bosses.create(x, y, 'tex_boss_morko');
    s.setImmovable(true);
    s.body.setAllowGravity(false);
    s.setDepth(6);
    // big hitbox covering 4x4 tiles
    s.body.setSize(TILE*4-6, TILE*4-6).setOffset(3,3);
    s._hp = 6; // 6 hearts
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
    boss._hp = Math.max(0, (boss._hp||6) - amount);
    // hit flash
    boss.setTintFill(0xffffff);
    this.time.delayedCall(60, ()=> boss.clearTint());
    if (boss._hp <= 0) {
  const x=boss.x, y=boss.y; if (boss._eyes){ boss._eyes.L?.destroy(); boss._eyes.R?.destroy(); }
  boss.destroy();
      // loot shower
      this.dropCoins(x, y, 8);
      // rare red gem
      if (Math.random() < 0.25) this.spawnPickup(x, y, 'tex_red');
    }
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
    if (this.moped?.sprite) {
      const sc = this.moped.sprite.scale || 1.6;
      this.moped.sprite.setTexture(key);
      this.moped.sprite.setScale(sc);
    }
  }

  openMerchant(){ document.getElementById('merchant')?.classList.remove('hidden'); }
  closeMerchant(){ document.getElementById('merchant')?.classList.add('hidden'); }

  // Health/damage and save/load
  damage(amount){
    this.state.health = Math.max(0, this.state.health - amount);
    window.playSfx?.('hit');
    this.updateUI(); this.saveState();
    if (this.state.health <= 0) {
      this.state.health = 4;
      this.state.coins = Math.max(0, this.state.coins - 5);
      this.player.setPosition(this.player.x,100); this.player.setVelocity(0,0);
      this.showToast('Kuolit! -5 kolikkoa');
      window.playSfx?.('death');
      this.showDeathBanner();
      this.updateUI(); this.saveState();
    }
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

    // Particle burst (use coin texture tinted red)
    const pm = this.add.particles('tex_coin');
    const emitter = pm.createEmitter({
      x: cx, y: cy,
      speed: { min: 120, max: 320 },
      angle: { min: 0, max: 360 },
      gravityY: 400,
      lifespan: 900,
      quantity: 0,
      scale: { start: 1.0, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0xff4444,
      blendMode: 'ADD'
    });
    emitter.explode(28, cx, cy);
  this.time.delayedCall(1400, ()=>{ pm.destroy(); });

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
  const data = { health: this.state.health, coins: this.state.coins, canFly: this.state.canFly, bounceShoes: this.state.bounceShoes, inv: this.inv, worldDiff: this.worldDiff, tools: this.tools, outfit: this.custom.outfit, cannons: this.cannonPositions, portals: this.portalPositions, slimeCloners: this.slimeClonerPositions, soldierCloners: this.soldierClonerPositions, tankCloners: this.tankClonerPositions, torches: this.torchPositions, mines: this.minePositions, rods: this.rodPositions, towers: this.towerPositions, traps: this.trapPositions, weather: this.weather, moped: { color: this.moped.color, decal: this.moped.decal }, mode: this.mode?.current || 'classic', upgrades: this.upgrades };
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
      if (typeof d.health === 'number') this.state.health = d.health;
      if (typeof d.coins === 'number') this.state.coins = d.coins;
  if (typeof d.canFly === 'boolean') this.state.canFly = d.canFly;
  if (typeof d.bounceShoes === 'boolean') this.state.bounceShoes = d.bounceShoes;
      if (d.inv) {
        this.inv.wood = d.inv.wood || 0;
        this.inv.plank = d.inv.plank || 0;
        this.inv.stone = d.inv.stone || 0;
      }
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
  if (Array.isArray(d.traps)) this.trapPositions = d.traps.slice(0, 3000);
  if (Array.isArray(d.mines)) this.minePositions = d.mines.slice(0, 3000);
  if (Array.isArray(d.rods)) this.rodPositions = d.rods.slice(0, 2000);
  if (Array.isArray(d.towers)) this.towerPositions = d.towers.slice(0, 2000);
  if (d.weather) { this.weather.isStorm = !!d.weather.isStorm; this.weather.nextLightningAt = d.weather.nextLightningAt||0; this.weather.nextStormCheckAt = d.weather.nextStormCheckAt||0; this.weather.stormEndsAt = d.weather.stormEndsAt||0; }
  // Migration: convert legacy doors to portals (closed doors -> blue portals at same tile)
  if (Array.isArray(d.doors)) {
    this.portalPositions = (this.portalPositions||[]).concat(d.doors.slice(0,5000).map(x=>({ tx:x.tx, ty:x.ty, color:'blue' })));
  }
  if (d.tools) this.tools = d.tools;
  if (d.mode) this.mode.current = d.mode;
  if (d.upgrades) this.upgrades = d.upgrades;
  // Ensure pistol, cannon, minigun, knife, sniper & bazooka exist for older saves
  if (!this.tools.owned?.pistol) this.tools.owned.pistol = true;
  if (!this.tools.owned?.cannon) this.tools.owned.cannon = true;
  if (!this.tools.owned?.minigun) this.tools.owned.minigun = true;
  if (!this.tools.owned?.knife) this.tools.owned.knife = true;
  if (!this.tools.owned?.sniper) this.tools.owned.sniper = true;
  if (!this.tools.owned?.bazooka) this.tools.owned.bazooka = true;
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

    if (this.player) this.player.setTexture('tex_player_dyn');
  }

  // Tool helpers
  tryEquipTool(tool){
    if (!this.tools.owned[tool]) { this.showToast('Ei ostettu'); return; }
  this.tools.equipped = tool; this.updateInventoryUI(); this.updateWeaponSprite?.(); this.saveState();
  }
  cycleTool(){
  const order = ['hand','wooden','stone','iron',
    'pistol','pistol_copper',
    'bow','bow_copper',
    'cannon',
    'minigun','minigun_copper',
    'ak47','ak47_copper',
    'knife','knife_copper',
    'sniper','sniper_copper',
    'bazooka','bazooka_copper',
    'grenade','grenade_copper',
    'nuke','nuke_copper',
    'wizard','flame',
    'pamppu','pamppu_copper',
  'mine','rod','tower','trap','soldiercloner','tankcloner','spear',
    'plane','plane_copper',
    'hook','cloner','teleport','slimecloner','torch'];
  if (!this.tools.owned?.hook) this.tools.owned.hook = true;
    let idx = order.indexOf(this.tools.equipped);
    for (let i=1;i<=order.length;i++){
      const next = order[(idx+i)%order.length];
      if (this.tools.owned[next]) { this.tools.equipped = next; break; }
    }
    this.updateInventoryUI(); this.saveState();
  if (this.tools.equipped === 'teleport') this.showToast('Teleportti: oikea klikkaus asettaa (8 puuta). R vaihtaa väriä. Mene porttiin: 1,2,3 -> siirto.');
  if (this.tools.equipped === 'slimecloner') this.showToast('Limaklooni: oikea asettaa laitteen, vasen poistaa. Tuottaa limoja ajan kanssa.');
  if (this.tools.equipped === 'torch') this.showToast('Soihdu: oikea asettaa, vasen poistaa. Estää zombeja yöllä.');
  if (this.tools.equipped === 'mine') this.showToast('Miina: oikea asettaa, vasen poistaa. Räjähtää vihollisen koskiessa.');
  if (this.tools.equipped === 'rod') this.showToast('Ukonjohdatin: oikea asettaa, vasen poistaa. Suojaa salamilta lähellä. Kestää 3 osumaa.');
  if (/_copper$/.test(this.tools.equipped)) this.showToast('Kupari-ase: enemmän damagea ja +17 kantamaa');
  if (this.tools.equipped === 'tower') this.showToast('Ampumatorni: oikea asetus, vasen poisto (3 blokkia korkea)');
  if (this.tools.equipped === 'trap') this.showToast('Ansat: R vaihtaa tyyppiä (piikki, karhu, lankaviritin). Oikea asettaa, vasen poistaa.');
  if (this.tools.equipped === 'soldiercloner') this.showToast('Sotilasklooni: oikea aseta laite, vasen poista. Tekee AK-47 -sotilaita limoja ja zombeja vastaan.');
  if (this.tools.equipped === 'tankcloner') this.showToast('Tankkiklooni: oikea aseta laite, vasen poista. Tekee tankkeja (AK-47 + ylhäältä putoava bazooka).');
  }

  // Small deterministic RNG for reproducible world
  makeRandom(seed) {
    let s = seed >>> 0;
    return () => {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      return ((s >>> 0) % 1000000) / 1000000;
    };
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

  // Toggle settings popup (existing UI)
  const btn = document.getElementById('settingsBtn');
  const menu = document.getElementById('settingsMenu');
  btn?.addEventListener('click', () => menu?.classList.toggle('hidden'));

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
      ['pistol','bow','minigun','ak47','knife','sniper','bazooka','grenade','nuke','pamppu','plane'].forEach(t=>{ const k=t+'_copper'; if (w[k]===false) w[k]=true; });
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
