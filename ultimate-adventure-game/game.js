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
    this.state = { health: 4, coins: 0, canFly: false };
    this.nearMerchant = false;

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
  owned: { hand: true, wooden: false, stone: false, iron: false, pistol: true, cannon: true, minigun: true, knife: true, sniper: true, bazooka: true, hook: true, cloner: true, teleport: true, slimecloner: true, torch: true },
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
  // Death banner handle
  this.deathText = null;
  this.deathDom = null;

  // Placeable cannons state
  this.cannons = [];
  this.cannonTiles = new Set(); // keys "tx,ty" where cannons are placed
  this.cannonPositions = []; // persisted positions [{tx,ty}]
  this.slimeCloners = new Map(); // key -> { tx,ty, image?, zone?, nextAt:number, count:number }
  // Teleports
  this.portalPositions = []; // persisted [{tx,ty,color}]
  this.portals = new Map(); // key -> { color:string, sprite:Phaser.GameObjects.GameObject }
  this.portal = { placeColor: 'blue', countdown: null, countdownKey: null, countdownText: null, cooldownUntil: 0 };
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

    // Tree trunk and leaves
    g.fillStyle(0x6b3a1b,1); g.fillRect(0,0,TILE,TILE); g.lineStyle(2,0x4a2a12,1); g.strokeRect(0,0,TILE,TILE); g.generateTexture('tex_trunk',TILE,TILE); g.clear();
    g.fillStyle(0x2e8b57,1); g.fillRect(0,0,TILE,TILE); g.lineStyle(2,0x1d5d3a,1); g.strokeRect(0,0,TILE,TILE); g.generateTexture('tex_leaves',TILE,TILE); g.clear();

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
  g.fillStyle(0x000000,1); g.fillCircle(bwT*0.32, bhT*0.28, 7); g.fillCircle(bwT*0.68, bhT*0.28, 7);
  g.fillStyle(0xff3355,1); g.fillRoundedRect(bwT*0.28, bhT*0.58, bwT*0.44, 26, 10);
  g.generateTexture('tex_boss_morko', bwT, bhT); g.clear();

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

    // Bullet texture
    g.fillStyle(0x333333,1); g.fillRect(0,0,8,4); g.lineStyle(1,0x000000,1); g.strokeRect(0,0,8,4);
  g.generateTexture('tex_bullet',8,4); g.clear();
  // Laser (galactic mode)
  g.fillStyle(0xff2a2a,1); g.fillRect(0,0,14,3); g.generateTexture('tex_laser',14,3); g.clear();
  // Web pellet (web mode)
  g.fillStyle(0xffffff,1); g.fillCircle(3,3,3); g.generateTexture('tex_web',6,6); g.clear();

  // Rocket texture (for bazooka)
  g.fillStyle(0x777777,1); g.fillRect(0,0,12,4);
  g.fillStyle(0xdd3333,1); g.fillRect(10,0,2,4);
  g.lineStyle(1,0x333333,1); g.strokeRect(0,0,12,4);
  g.generateTexture('tex_rocket',12,4); g.clear();

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
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.slimes, this.platforms);
    this.physics.add.collider(this.bullets, this.platforms, this.onBulletHit, null, this);
    this.physics.add.overlap(this.player, this.pickups, this.onPickup, null, this);
    this.physics.add.overlap(this.player, this.waters, this.onEnterWater, null, this);
    this.physics.add.overlap(this.player, this.items, this.onItemPickup, null, this);
  this.physics.add.overlap(this.player, this.birds, this.onBirdHit, null, this);
    this.physics.add.overlap(this.player, this.slimes, this.onSlimeHit, null, this);
  this.physics.add.overlap(this.player, this.zombies, (p,z)=>{ this._hitByEnemy(z); }, null, this);
  this.physics.add.overlap(this.player, this.bosses, (p,b)=>{ this._hitByEnemy(b); }, null, this);
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
  this.physics.add.overlap(this.bullets, this.zombies, (bullet, zombie)=>{
      if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); bullet.destroy(); return; }
      if (bullet?.getData && bullet.getData('isWeb') && this.mode.current==='web') {
        zombie.setVelocity(0,0); zombie._webbedUntil = this.time.now + 4000;
      } else {
        const x=zombie.x,y=zombie.y; zombie.destroy(); this.dropCoins(x,y,2);
      }
      bullet.destroy();
    }, null, this);
  // Boss hit handling: only minigun bullets and bazooka explosions can damage
  this.physics.add.overlap(this.bullets, this.bosses, (bullet, boss)=>{
      if (bullet?.getData && bullet.getData('isRocket')) { this.explodeAt(bullet.x, bullet.y); bullet.destroy(); return; }
      const eq = this.tools?.equipped;
      const isMinigunBullet = (eq === 'minigun') && !bullet.getData('isWeb');
      if (isMinigunBullet) {
        this.damageBoss(boss, 1);
      }
      bullet.destroy();
    }, null, this);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
  this.keys = this.input.keyboard.addKeys({ A: 'A', D: 'D', W: 'W', SPACE: 'SPACE', C: 'C', V: 'V', E: 'E', ONE: 'ONE', TWO: 'TWO', THREE: 'THREE', FOUR: 'FOUR', FIVE: 'FIVE', SIX: 'SIX', SEVEN: 'SEVEN', EIGHT: 'EIGHT', NINE: 'NINE', Q: 'Q', R: 'R', T: 'T', X: 'X', M: 'M' });
  this.input.mouse?.disableContextMenu();
  // Pointer interactions: on desktop left-click mines/shoots, right-click places
    // On touch, use placeMode toggle to place plank with a tap
    this.input.on('pointerdown', (pointer) => {
      if (!this.started || this.isPaused) return;
      const isTouch = pointer.pointerType === 'touch';
      if (!isTouch && pointer.rightButtonDown()) {
        if (this.tools.equipped === 'cannon') this.placeCannon(pointer);
        else if (this.tools.equipped === 'teleport') this.placePortal(pointer);
        else if (this.tools.equipped === 'slimecloner') this.placeSlimeCloner(pointer);
        else if (this.tools.equipped === 'torch') this.placeTorch(pointer);
        else if (this.tools.equipped === 'cloner') this.cycleCloneTarget();
        else this.placePlank(pointer);
      } else {
        if (isTouch && this.touchState.placeMode) {
          if (this.tools.equipped === 'cannon') this.placeCannon(pointer);
          else if (this.tools.equipped === 'teleport') this.placePortal(pointer);
          else if (this.tools.equipped === 'slimecloner') this.placeSlimeCloner(pointer);
          else if (this.tools.equipped === 'torch') this.placeTorch(pointer);
          else if (this.tools.equipped === 'cloner') this.spawnClone(pointer);
          else this.placePlank(pointer);
        }
        else {
          // Cannon fire when equipped
          if (this.tools.equipped === 'cannon') {
            this.fireCannon(pointer);
          } else if (this.tools.equipped === 'teleport') {
            this.removePortalAtPointer(pointer);
          } else if (this.tools.equipped === 'slimecloner') {
            this.removeSlimeClonerAtPointer(pointer);
          } else if (this.tools.equipped === 'torch') {
            this.removeTorchAtPointer(pointer);
          } else if (this.tools.equipped === 'cloner') {
            this.spawnClone(pointer);
          } else {
            this.attemptMine(pointer);
          }
        }
      }
    });
  this.input.keyboard.on('keydown-C', () => { if (this.started && !this.isPaused) this.craftPlank(); });
  this.input.keyboard.on('keydown-V', () => { if (this.started && !this.isPaused) this.craftPlank(); });
    // Open backpack with E too; if near merchant, E opens merchant as before
    this.input.keyboard.on('keydown-E', () => {
      if (!this.nearMerchant) this.toggleBackpack();
    });

    // Tool selection keys
    const guard = (fn)=>()=>{ if (this.started && !this.isPaused) fn(); };
    this.input.keyboard.on('keydown-ONE', guard(()=> this.tryEquipTool('hand')));
    this.input.keyboard.on('keydown-TWO', guard(()=> this.tryEquipTool('wooden')));
    this.input.keyboard.on('keydown-THREE', guard(()=> this.tryEquipTool('stone')));
    this.input.keyboard.on('keydown-FOUR', guard(()=> this.tryEquipTool('iron')));
    this.input.keyboard.on('keydown-FIVE', guard(()=> this.tryEquipTool('pistol')));
    this.input.keyboard.on('keydown-SIX', guard(()=> this.tryEquipTool('minigun')));
    this.input.keyboard.on('keydown-SEVEN', guard(()=> this.tryEquipTool('knife')));
    this.input.keyboard.on('keydown-EIGHT', guard(()=> this.tryEquipTool('sniper')));
  // Quick-equip bazooka with T
  this.input.keyboard.on('keydown-T', guard(()=> this.tryEquipTool('bazooka')));
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
    }));
  // Mode toggle (Classic -> Star -> Spider)
  this.input.keyboard.on('keydown-M', guard(()=> this.cycleMode()));
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
      if (this.isPaused) this.resumeGame(); else this.pauseGame();
    });

    // Mopo: F nouse/poistu, Shift = turbo
    this.input.keyboard.on('keydown-F', ()=>{
      if (!this.started || this.isPaused) return;
    if (this.nearMoped) this.toggleMoped();
    if (this.nearCar) this.toggleCar();
    });
    // Enter/exit car with Down arrow
    this.input.keyboard.on('keydown-DOWN', ()=>{
      if (!this.started || this.isPaused) return;
      // If near car and not mounted, enter. If mounted, allow exit too.
      if ((this.nearCar && !this.car.mounted) || this.car.mounted) this.toggleCar();
    });
    // Also support cursor down key object
    this.cursors?.down?.on('down', ()=>{
      if (!this.started || this.isPaused) return;
      if ((this.nearCar && !this.car.mounted) || this.car.mounted) this.toggleCar();
    });
    this.input.keyboard.on('keydown-SHIFT', ()=>{ this._mopedBoost = true; });
    this.input.keyboard.on('keyup-SHIFT',   ()=>{ this._mopedBoost = false; });

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

  this.updateUI();

    // Expose scene for UI handlers
    window.gameScene = this;

    // Populate tool select
    this.updateToolSelect();

    // Ensure chunks around the player now that player exists
    this.ensureChunksAround(this.player.x);

  // Hook up mobile/touch controls from DOM
  this.setupTouchControls();

    // Start/pause UI buttons
    document.getElementById('btnStart')?.addEventListener('click', ()=> this.startGame());
    document.getElementById('btnStartSettings')?.addEventListener('click', ()=> document.getElementById('settingsMenu')?.classList.toggle('hidden'));
    document.getElementById('btnResume')?.addEventListener('click', ()=> this.resumeGame());
    document.getElementById('btnRestart')?.addEventListener('click', ()=> this.restartGame());
    document.getElementById('btnPauseSettings')?.addEventListener('click', ()=> document.getElementById('settingsMenu')?.classList.toggle('hidden'));

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

    // Update car proximity and prompt
    if (this.car?.sprite) {
      const dx = Math.abs(this.player.x - this.car.sprite.x);
      const dy = Math.abs(this.player.y - this.car.sprite.y);
      const wasNear = this.nearCar;
  this.nearCar = (dx < 110 && dy < 80);
      if (this.car.prompt) this.car.prompt.setPosition(this.car.sprite.x, this.car.sprite.y - 38).setVisible(this.nearCar && !this.car.mounted);
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
      const groups = [this.slimes, this.birds, this.zombies];
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

  const left = this.cursors.left.isDown || this.keys.A.isDown || this.touchState.left;
  const right = this.cursors.right.isDown || this.keys.D.isDown || this.touchState.right;
  const jump = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown || this.touchState.jump;
    const baseSpeed = 220;
    const riding = this.moped?.mounted;
    const speed = riding ? baseSpeed * (this.moped.speedMult * (this._mopedBoost?1.25:1)) : baseSpeed;

  if (left) { this.player.setVelocityX(-speed); this.player.setFlipX(true); }
  else if (right) { this.player.setVelocityX(speed); this.player.setFlipX(false); }
    else { this.player.setVelocityX(0); }

    if (this.state.canFly) {
  if (jump) this.player.setVelocityY(-280);
    } else if (jump && onGround) {
      this.player.setVelocityY(-440);
      this.player.setScale(1.05,0.95); this.time.delayedCall(120,()=>this.player.setScale(1,1));
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
  // Run slime cloner spawners
  this.maybeRunSlimeCloners();
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
    this.resumeGame();
    document.getElementById('startScreen')?.classList.add('hidden');
  }
  pauseGame(initial=false){
    this.isPaused = true;
    this.physics.world.isPaused = true;
    if (!initial) document.getElementById('pauseScreen')?.classList.remove('hidden');
  }
  resumeGame(){
    this.isPaused = false;
    this.physics.world.isPaused = false;
    document.getElementById('pauseScreen')?.classList.add('hidden');
  }
  restartGame(){
    // Reset save and reload scene
    try { localStorage.removeItem('UAG_save'); } catch(e) {}
    this.scene.restart();
    // After restart, started should be false so start screen shows again (handled in create)
    const startEl = document.getElementById('startScreen');
    startEl?.classList.remove('hidden');
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
    if (this.tools.equipped === 'pistol' || this.tools.equipped === 'minigun' || this.tools.equipped === 'sniper' || this.tools.equipped === 'cannon' || this.tools.equipped === 'bazooka') {
      if (this.tools.equipped === 'pistol') {
        this.shootBullet(pointer);
      } else if (this.tools.equipped === 'minigun') {
        this.shootMinigunBurst(pointer);
      } else if (this.tools.equipped === 'cannon') {
        this.fireCannon(pointer);
      } else if (this.tools.equipped === 'bazooka') {
        this.fireBazooka(pointer);
      } else {
        this.shootSniper(pointer);
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

    if (type === 'trunk') this.dropWood(sprite.x, sprite.y);
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

  removeSlimeClonerAtPointer(pointer){
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(world.x / TILE); const ty = Math.floor(world.y / TILE);
  this.removeSlimeClonerAt(tx, ty);
  this.saveState();
  this.showToast('Limaklooni poistettu');
  }

  removeSlimeClonerAt(tx, ty){
    const key = `${tx},${ty}`; const e = this.slimeCloners.get(key);
    if (!e) return;
    e.image?.destroy(); e.zone?.destroy?.();
    this.slimeCloners.delete(key);
    this.slimeClonerPositions = this.slimeClonerPositions.filter(p=> !(p.tx===tx && p.ty===ty));
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
    const reach = 2 * TILE;
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

  shootMinigunBurst(pointer){
    // Fire 5 bullets with slight spread and short interval
    const shots = 5;
    for (let i=0;i<shots;i++){
      this.time.delayedCall(i*60, ()=>{
  this.shootBullet(pointer, { spread: 0.10, markMinigun: true });
      });
    }
  }

  shootSniper(pointer){
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
  const lifeMs = (19 * TILE / speed) * 1000; // longer reach for tarkka
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

  // Bazooka: fires a slow rocket that explodes on impact without breaking blocks, damaging enemies in radius
  fireBazooka(pointer){
    if (this._bazookaCd && this._bazookaCd > this.time.now) return; // small cooldown
    this._bazookaCd = this.time.now + 600;
    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const sx = this.player.x, sy = this.player.y;
    const rocket = this.spawnBulletFrom(sx, sy, wp.x, wp.y, { speed: 420, lifeTiles: 10, spread: 0 });
    rocket.setTexture('tex_rocket');
    rocket.setData('isRocket', true);
    rocket.setData('noBlockDamage', true);
    // override tile-scan to not remove cannons and to explode on platform hit (handled in onBulletHit already)
    rocket._lastCheck = 0;
    const origPreUpdate = Phaser.Physics.Arcade.Sprite.prototype.preUpdate;
    const scene = this;
    rocket.preUpdate = function(t, dt){ origPreUpdate.call(this, t, dt); };
  }

  explodeAt(x, y){
    // 6x6 tile area centered around impact (even size -> skew one tile to negative side)
    const cx = Math.floor(x / TILE);
    const cy = Math.floor(y / TILE);
    const txMin = cx - 3, txMax = cx + 2; // 6 tiles wide
    const tyMin = cy - 3, tyMax = cy + 2; // 6 tiles tall

    // FX: flash rectangle
    const gfx = this.add.graphics().setDepth(800);
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
        if (type === 'trunk') this.dropWood(spr.x, spr.y);
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
    this.slimes?.children?.iterate?.(s=>{ if (inBox(s)) { const ex=s.x, ey=s.y; s.destroy(); this.dropCoins(ex,ey,3); } });
    this.zombies?.children?.iterate?.(z=>{ if (inBox(z)) { const ex=z.x, ey=z.y; z.destroy(); this.dropCoins(ex,ey,2); } });
  this.bosses?.children?.iterate?.(bs=>{ if (inBox(bs)) { this.damageBoss(bs, 2); } });
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
    const order = ['none','ground','stone','sand','cactus','trunk'];
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
    if (this.time.now < this.invulnUntil) return;
    this.invulnUntil = this.time.now + 1000;
    this.damage(1);
    const dir = Math.sign(this.player.x - (enemy?.x ?? this.player.x)) || 1;
    this.player.setVelocityX(dir * 260);
    this.player.setVelocityY(-200);
    this.player.setTint(0xff4444);
    this.time.delayedCall(180, () => this.player.clearTint());
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
  if (this.tools.equipped === 'minigun' || opts.markMinigun) bullet.setData('isMinigun', true);
  if (this.mode.current === 'web') bullet.setData('isWeb', true);
  const speed = 600; // px per second
  bullet.setVelocity(normX * speed, normY * speed);
    bullet.setRotation(Math.atan2(normY, normX));
  // Destroy after 4 tiles distance (time = distance / speed)
  const lifeMs = (4 * TILE / speed) * 1000;
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
      this.explodeAt(bullet.x, bullet.y);
      try { bullet.destroy(); } catch(e) {}
      return;
    }
  // Bullets flagged noBlockDamage (e.g., car turrets) simply disappear on hit
    if (bullet?.getData && bullet.getData('noBlockDamage')) { try { bullet.destroy(); } catch(e) {} return; }
    const tx = Math.floor(block.x / TILE);
    const ty = Math.floor(block.y / TILE);
    const key = `${tx},${ty}`;
    const type = block.getData('type');
    if (type === 'trunk') this.dropWood(block.x, block.y);
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
  this.physics.add.overlap(this.player, coin, ()=>{ coin.destroy(); this.state.coins++; this.updateUI(); this.saveState(); }, null, this);
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
    } else {
  this.state.coins += 1;
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
  const toolNames = { hand:'Käsi', wooden:'Puuhakku', stone:'Kivihakku', iron:'Rautahakku', pistol:'Pistooli', cannon:'Tykki', minigun:'Minigun', knife:'Puukko', sniper:'Tarkka-ase', bazooka:'Bazooka', hook:'Koukku', cloner:'Kloonaaja', teleport:'Teleportti', slimecloner:'Limaklooni', torch:'Soihtu' };
  const eq = this.tools.equipped;
  const suffix = eq === 'cannon' ? ` (${this.tools.cannonMode==='minigun'?'Minigun':'Tarkka'})` : '';
  const modeLabel = this.mode?.current==='classic' ? 'Klassinen' : (this.mode.current==='galactic'?'Star':'Spider');
  slots[5].textContent = `Työkalu: ${toolNames[eq]}${suffix}  |  Tila: ${modeLabel}`;
  }

  updateToolSelect(){
    const select = document.getElementById('toolSelect');
    if (!select) return;
    select.innerHTML = '';
  const toolNames = { hand:'Käsi', wooden:'Puuhakku', stone:'Kivihakku', iron:'Rautahakku', pistol:'Pistooli', cannon:'Tykki', minigun:'Minigun', knife:'Puukko', sniper:'Tarkka-ase', bazooka:'Bazooka', hook:'Koukku', cloner:'Kloonaaja', teleport:'Teleportti', slimecloner:'Limaklooni', torch:'Soihtu' };
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
        for (let h=0; h<height; h++) this.addBlock(tx, baseTy-h, 'tex_trunk', 'trunk', true);
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
  // if this decor was a torch, clear handle
  const tt = this.torches.get(k);
  if (tt && tt.image === d) { tt.image = null; }
      d.destroy();
    }
    // Pickups
    for (const p of data.pickups) p?.destroy();
    // Enemies
  for (const e of data.enemies) e?.destroy();

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
      const x=boss.x, y=boss.y; boss.destroy();
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
    this.updateUI(); this.saveState();
    if (this.state.health <= 0) {
      this.state.health = 4;
      this.state.coins = Math.max(0, this.state.coins - 5);
      this.player.setPosition(this.player.x,100); this.player.setVelocity(0,0);
      this.showToast('Kuolit! -5 kolikkoa');
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
  const data = { health: this.state.health, coins: this.state.coins, canFly: this.state.canFly, inv: this.inv, worldDiff: this.worldDiff, tools: this.tools, outfit: this.custom.outfit, cannons: this.cannonPositions, portals: this.portalPositions, slimeCloners: this.slimeClonerPositions, torches: this.torchPositions, moped: { color: this.moped.color, decal: this.moped.decal }, mode: this.mode?.current || 'classic' };
    try { localStorage.setItem('UAG_save', JSON.stringify(data)); } catch(e) {}
  }

  loadState(){
    try {
      const raw = localStorage.getItem('UAG_save');
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.health === 'number') this.state.health = d.health;
      if (typeof d.coins === 'number') this.state.coins = d.coins;
      if (typeof d.canFly === 'boolean') this.state.canFly = d.canFly;
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
  if (Array.isArray(d.torches)) this.torchPositions = d.torches.slice(0, 3000);
  // Migration: convert legacy doors to portals (closed doors -> blue portals at same tile)
  if (Array.isArray(d.doors)) {
    this.portalPositions = (this.portalPositions||[]).concat(d.doors.slice(0,5000).map(x=>({ tx:x.tx, ty:x.ty, color:'blue' })));
  }
  if (d.tools) this.tools = d.tools;
  if (d.mode) this.mode.current = d.mode;
  // Ensure pistol, cannon, minigun, knife, sniper & bazooka exist for older saves
  if (!this.tools.owned?.pistol) this.tools.owned.pistol = true;
  if (!this.tools.owned?.cannon) this.tools.owned.cannon = true;
  if (!this.tools.owned?.minigun) this.tools.owned.minigun = true;
  if (!this.tools.owned?.knife) this.tools.owned.knife = true;
  if (!this.tools.owned?.sniper) this.tools.owned.sniper = true;
  if (!this.tools.owned?.bazooka) this.tools.owned.bazooka = true;
  if (!this.tools.owned?.cloner) this.tools.owned.cloner = true;
  if (!this.tools.owned?.slimecloner) this.tools.owned.slimecloner = true;
  if (!this.tools.owned?.torch) this.tools.owned.torch = true;
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
    this.tools.equipped = tool; this.updateInventoryUI(); this.saveState();
  }
  cycleTool(){
  const order = ['hand','wooden','stone','iron','pistol','cannon','minigun','knife','sniper','bazooka','hook','cloner','teleport','slimecloner','torch'];
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
  scene: [GameScene]
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

  document.getElementById('closeMerchant')?.addEventListener('click', () => window.gameScene?.closeMerchant());

  // Settings: volumes and toggles
  const musicVol = document.getElementById('musicVol');
  const sfxVol = document.getElementById('sfxVol');
  const showHearts = document.getElementById('showHearts');
  const toggleFly = document.getElementById('toggleFly');
  const shirtColor = document.getElementById('shirtColor');
  const pantsColor = document.getElementById('pantsColor');
  const eyesGlow = document.getElementById('eyesGlow');
  const eyeColor = document.getElementById('eyeColor');
  const hairColor = document.getElementById('hairColor');
  const mopedColor = document.getElementById('mopedColor');
  const mopedDecal = document.getElementById('mopedDecal');

  function applySettings(){
    const settings = {
      musicVol: Number(musicVol?.value||0.5),
      sfxVol: Number(sfxVol?.value||0.8),
      showHearts: !!showHearts?.checked,
      toggleFly: !!toggleFly?.checked,
      shirtColor: shirtColor?.value,
      pantsColor: pantsColor?.value,
      eyesGlow: !!eyesGlow?.checked,
      eyeColor: eyeColor?.value,
  hairColor: hairColor?.value,
  mopedColor: mopedColor?.value || window.gameScene?.moped?.color,
  mopedDecal: mopedDecal?.value || window.gameScene?.moped?.decal
    };
    try { localStorage.setItem('UAG_settings', JSON.stringify(settings)); } catch(e) {}
    if (window.gameScene && toggleFly) { window.gameScene.state.canFly = !!toggleFly.checked; window.gameScene.saveState(); window.gameScene.updateInventoryUI(); }
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
    }
  }

  // Load settings
  try {
    const raw = localStorage.getItem('UAG_settings');
    if (raw) {
      const s = JSON.parse(raw);
      if (musicVol && typeof s.musicVol === 'number') musicVol.value = s.musicVol;
      if (sfxVol && typeof s.sfxVol === 'number') sfxVol.value = s.sfxVol;
      if (showHearts && typeof s.showHearts === 'boolean') showHearts.checked = s.showHearts;
      if (toggleFly && typeof s.toggleFly === 'boolean') toggleFly.checked = s.toggleFly;
      if (shirtColor && typeof s.shirtColor === 'string') shirtColor.value = s.shirtColor;
      if (pantsColor && typeof s.pantsColor === 'string') pantsColor.value = s.pantsColor;
      if (eyesGlow && typeof s.eyesGlow === 'boolean') eyesGlow.checked = s.eyesGlow;
      if (eyeColor && typeof s.eyeColor === 'string') eyeColor.value = s.eyeColor;
      if (hairColor && typeof s.hairColor === 'string') hairColor.value = s.hairColor;
  if (mopedColor && typeof s.mopedColor === 'string') mopedColor.value = s.mopedColor;
  if (mopedDecal && typeof s.mopedDecal === 'string') mopedDecal.value = s.mopedDecal;
    }
  } catch(e) {}

  musicVol?.addEventListener('input', applySettings);
  sfxVol?.addEventListener('input', applySettings);
  showHearts?.addEventListener('change', applySettings);
  toggleFly?.addEventListener('change', applySettings);
  shirtColor?.addEventListener('input', applySettings);
  pantsColor?.addEventListener('input', applySettings);
  eyesGlow?.addEventListener('change', applySettings);
  eyeColor?.addEventListener('input', applySettings);
  hairColor?.addEventListener('input', applySettings);
  mopedColor?.addEventListener('input', applySettings);
  mopedDecal?.addEventListener('change', applySettings);

  // Initial apply
  applySettings();
});
