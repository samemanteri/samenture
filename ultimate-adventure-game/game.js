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
      owned: { hand: true, wooden: false, stone: false, iron: false, pistol: true, cannon: true, minigun: true, knife: true, sniper: true, hook: true, cloner: true },
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

  // Cloner tool and clones
  this.cloneSettings = { target: 'none' }; // 'none'|'ground'|'stone'|'sand'|'cactus'|'trunk'
  this.clones = this.physics?.add?.group ? this.physics.add.group() : null;
  this.cloneList = [];

  // Moped state
  this.moped = { sprite: null, zone: null, prompt: null, mounted: false, color: '#ff6a00', speedMult: 1.6, pos: null };
  this.nearMoped = false;

  // Placeable cannons state
  this.cannons = [];
  this.cannonTiles = new Set(); // keys "tx,ty" where cannons are placed
  this.cannonPositions = []; // persisted positions [{tx,ty}]
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

  // Sandstone tile (deeper desert)
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

  // Hook head texture
  g.fillStyle(0xffffff,1); g.fillCircle(6,6,6); g.lineStyle(2,0x444444,1); g.strokeCircle(6,6,6);
  g.generateTexture('tex_hook',12,12); g.clear();

  // Moped texture (side view)
  g.fillStyle(0x333333,1); g.fillRect(2,10,26,8);
  g.fillStyle(0x000000,1); g.fillCircle(8,20,6); g.fillCircle(22,20,6);
  g.lineStyle(2,0x111111,1); g.strokeCircle(8,20,6); g.strokeCircle(22,20,6);
  g.fillStyle(0xff6a00,1); g.fillRect(8,6,14,8);
  g.generateTexture('tex_moped',32,26); g.clear();

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
    this.bullets = this.physics.add.group({ allowGravity: false });
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
  this.physics.add.overlap(this.bullets, this.birds, (bullet, bird)=>{ bird.destroy(); bullet.destroy(); }, null, this);
  this.physics.add.overlap(this.bullets, this.slimes, (bullet, slime)=>{ slime.destroy(); bullet.destroy(); }, null, this);
  this.physics.add.overlap(this.bullets, this.clones, (bullet, clone)=>{ this.removeClone(clone); bullet.destroy(); }, null, this);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
  this.keys = this.input.keyboard.addKeys({ A: 'A', D: 'D', W: 'W', SPACE: 'SPACE', C: 'C', E: 'E', ONE: 'ONE', TWO: 'TWO', THREE: 'THREE', FOUR: 'FOUR', FIVE: 'FIVE', SIX: 'SIX', SEVEN: 'SEVEN', EIGHT: 'EIGHT', NINE: 'NINE', Q: 'Q', R: 'R', X: 'X' });
  this.input.mouse?.disableContextMenu();
  // Pointer interactions: on desktop left-click mines/shoots, right-click places
    // On touch, use placeMode toggle to place plank with a tap
    this.input.on('pointerdown', (pointer) => {
      if (!this.started || this.isPaused) return;
      const isTouch = pointer.pointerType === 'touch';
      if (!isTouch && pointer.rightButtonDown()) {
        if (this.tools.equipped === 'cannon') this.placeCannon(pointer);
        else if (this.tools.equipped === 'cloner') this.cycleCloneTarget();
        else this.placePlank(pointer);
      } else {
        if (isTouch && this.touchState.placeMode) {
          if (this.tools.equipped === 'cannon') this.placeCannon(pointer);
          else if (this.tools.equipped === 'cloner') this.spawnClone(pointer);
          else this.placePlank(pointer);
        }
        else {
          // Cannon fire when equipped
          if (this.tools.equipped === 'cannon') {
            this.fireCannon(pointer);
          } else if (this.tools.equipped === 'cloner') {
            this.spawnClone(pointer);
          } else {
            this.attemptMine(pointer);
          }
        }
      }
    });
  this.input.keyboard.on('keydown-C', () => { if (this.started && !this.isPaused) this.craftPlank(); });
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
    }));
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

    // Instructions
    this.add.text(14,14,
    'Ohjeet:\nVasen/Oikea tai A/D = liiku  |  Ylös/Space = hyppy' +
    '\nVasen klikkaus = mainaa (myös alaspäin) tai ammu (pistoolilla)  |  Oikea klikkaus = aseta lankku' +
  '\nC = craftaa 3 puusta 1 lankku  |  E = kauppias  |  1-9/Q = työkalut' +
      '\nSpace = liaani  |  R = Tykki-tila (Minigun/Tarkka)' +
      '\nPunainen timantti -> Lento  |  Vesi: uida ylös/alas Ylöksellä/Space' +
      '\nVaro lintuja ja limoja!',
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
            const opts = this.tools.cannonMode==='minigun' ? { speed: 650, lifeTiles: 6, spread: 0.09 } : { speed: 980, lifeTiles: 19, spread: 0 };
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
        if (sl.body.blocked.left) { sl.setVelocityX(80); sl.setFlipX(false); }
        else if (sl.body.blocked.right) { sl.setVelocityX(-80); sl.setFlipX(true); }
        if ((sl.body.blocked.down || sl.body.touching.down) && Math.random()<0.005) sl.setVelocityY(-260);
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
      this.vineGfx.lineStyle(3, 0x6b8e23, 0.95);
      this.vineGfx.beginPath();
      this.vineGfx.moveTo(this.player.x, this.player.y);
      this.vineGfx.lineTo(this.vine.anchor.x, this.vine.anchor.y);
      this.vineGfx.strokePath();

      const ax = this.vine.anchor.x, ay = this.vine.anchor.y;
      const dx = ax - this.player.x, dy = ay - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (!this.vine.length) this.vine.length = dist;
      if (this.vine.reeling) this.vine.length = Math.max(18, this.vine.length - 200 * (1/60));
      if (dist > this.vine.length) {
        const nx = dx / dist, ny = dy / dist;
        const pull = 520;
        this.player.setVelocity(nx * pull, ny * pull);
        this.player.setGravityY(300);
      }
      if (dist < 16) this.cancelVine();
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
    if (this.tools.equipped === 'pistol' || this.tools.equipped === 'minigun' || this.tools.equipped === 'sniper' || this.tools.equipped === 'cannon') {
      if (this.tools.equipped === 'pistol') {
        this.shootBullet(pointer);
      } else if (this.tools.equipped === 'minigun') {
        this.shootMinigunBurst(pointer);
      } else if (this.tools.equipped === 'cannon') {
        this.fireCannon(pointer);
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
        sl.destroy();
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
        this.shootBullet(pointer, { spread: 0.10 });
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
  const bullet = this.bullets.create(this.player.x, this.player.y, 'tex_bullet');
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
    const b = this.bullets.create(sx, sy, 'tex_bullet');
    const speed = opts.speed || 600;
    b.setVelocity(nx*speed, ny*speed);
    b.setRotation(Math.atan2(ny, nx));
    if (opts.ignoreCannonKey) b.setData('ignoreCannonKey', opts.ignoreCannonKey);
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
  const toolNames = { hand:'Käsi', wooden:'Puuhakku', stone:'Kivihakku', iron:'Rautahakku', pistol:'Pistooli', cannon:'Tykki', minigun:'Minigun', knife:'Puukko', sniper:'Tarkka-ase', hook:'Koukku', cloner:'Kloonaaja' };
    const eq = this.tools.equipped;
    const suffix = eq === 'cannon' ? ` (${this.tools.cannonMode==='minigun'?'Minigun':'Tarkka'})` : '';
    slots[5].textContent = `Työkalu: ${toolNames[eq]}${suffix}`;
  }

  updateToolSelect(){
    const select = document.getElementById('toolSelect');
    if (!select) return;
    select.innerHTML = '';
  const toolNames = { hand:'Käsi', wooden:'Puuhakku', stone:'Kivihakku', iron:'Rautahakku', pistol:'Pistooli', cannon:'Tykki', minigun:'Minigun', knife:'Puukko', sniper:'Tarkka-ase', hook:'Koukku', cloner:'Kloonaaja' };
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
    const s = this.add.image(x, y, 'tex_moped').setDepth(4);
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
      this.updateUI(); this.saveState();
    }
  }

  saveState(){
  const data = { health: this.state.health, coins: this.state.coins, canFly: this.state.canFly, inv: this.inv, worldDiff: this.worldDiff, tools: this.tools, outfit: this.custom.outfit, cannons: this.cannonPositions };
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
  if (d.tools) this.tools = d.tools;
  // Ensure pistol, cannon, minigun, knife & sniper exist for older saves
  if (!this.tools.owned?.pistol) this.tools.owned.pistol = true;
  if (!this.tools.owned?.cannon) this.tools.owned.cannon = true;
  if (!this.tools.owned?.minigun) this.tools.owned.minigun = true;
  if (!this.tools.owned?.knife) this.tools.owned.knife = true;
  if (!this.tools.owned?.sniper) this.tools.owned.sniper = true;
  if (!this.tools.owned?.cloner) this.tools.owned.cloner = true;
  if (!this.tools.cannonMode) this.tools.cannonMode = 'minigun';
  if (!this.tools.equipped) this.tools.equipped = 'pistol';
      if (d.outfit) this.custom.outfit = d.outfit;
    } catch(e) {}
  // Update tool select after loading
  this.updateToolSelect();
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
  const order = ['hand','wooden','stone','iron','pistol','cannon','minigun','knife','sniper','hook','cloner'];
  if (!this.tools.owned?.hook) this.tools.owned.hook = true;
    let idx = order.indexOf(this.tools.equipped);
    for (let i=1;i<=order.length;i++){
      const next = order[(idx+i)%order.length];
      if (this.tools.owned[next]) { this.tools.equipped = next; break; }
    }
    this.updateInventoryUI(); this.saveState();
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
      hairColor: hairColor?.value
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

  // Initial apply
  applySettings();
});
