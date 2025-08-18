// Ultimate Adventure Game - Phaser Edition (no external assets)

// Config
const TILE = 40;
const WORLD_TILES_X = 160; // wider world
const WORLD_TILES_Y = 40;  // deeper world to allow digging down
const SURFACE_Y = 20;      // surface level (y-index)

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

    // Core state
    this.state = { health: 4, coins: 0, canFly: false };
    this.nearMerchant = false;

    // World persistence diff
    this.worldDiff = { removed: [], placed: [] }; // removed: ["tx,ty"], placed: [{tx,ty,type,textureKey}]

    // Character customization and outfit
    this.custom = { shirtColor: '#4477ff', pantsColor: '#333333', eyesGlow: false, outfit: 'none' };

    // Tool system
    this.tools = {
      owned: { hand: true, wooden: false, stone: false, iron: false },
      equipped: 'hand'
    };
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

    // Player base texture (will be replaced by dynamic one too)
    const pw = 28, ph = 36;
    g.fillStyle(0xffdd66, 1);
    g.fillRect(0, 0, pw, ph);
    g.lineStyle(2, 0x996633, 1);
    g.strokeRect(0, 0, pw, ph);
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

    // Merchant stall
    g.fillStyle(0x9b7653,1); g.fillRect(0,10,30,26); g.lineStyle(2,0x6b4a2b,1); g.strokeRect(0,10,30,26);
    g.fillStyle(0xff5555,1); g.fillRect(0,0,30,12); g.lineStyle(2,0xaa2222,1); g.strokeRect(0,0,30,12);
    g.generateTexture('tex_merchant',30,36); g.clear();
  }

  create() {
    this.blocks = new Map();
    this.decor = this.add.group();

    // Static platforms group
    this.platforms = this.physics.add.staticGroup();

    // Build world first
    this.createWorld();

    // Load saved state and world diffs (before spawning pickups)
    this.loadState();
    // Load appearance settings (colors/glow) early and generate player texture
    this.loadAppearanceSettings();

    this.applyWorldDiff();

    // Player
    this.updatePlayerAppearance();
    this.player = this.physics.add.sprite(100, 100, 'tex_player_dyn');
    this.player.setBounce(0.06);
    this.player.body.setSize(20, 34).setOffset(4, 2);

    // Groups and collisions
    this.pickups = this.physics.add.group();
    this.items = this.physics.add.group();

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.pickups, this.onPickup, null, this);
    this.physics.add.overlap(this.player, this.items, this.onItemPickup, null, this);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({ A: 'A', D: 'D', W: 'W', SPACE: 'SPACE', C: 'C', E: 'E', ONE: 'ONE', TWO: 'TWO', THREE: 'THREE', FOUR: 'FOUR', Q: 'Q' });
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) this.placePlank(pointer);
      else this.attemptMine(pointer);
    });
    this.input.keyboard.on('keydown-C', () => this.craftPlank());

    // Tool selection keys
    this.input.keyboard.on('keydown-ONE', ()=> this.tryEquipTool('hand'));
    this.input.keyboard.on('keydown-TWO', ()=> this.tryEquipTool('wooden'));
    this.input.keyboard.on('keydown-THREE', ()=> this.tryEquipTool('stone'));
    this.input.keyboard.on('keydown-FOUR', ()=> this.tryEquipTool('iron'));
    this.input.keyboard.on('keydown-Q', ()=> this.cycleTool());

    // Camera/bounds
    const worldW = WORLD_TILES_X * TILE, worldH = WORLD_TILES_Y * TILE;
    this.cameras.main.setBounds(0,0,worldW,worldH);
    this.physics.world.setBounds(0,0,worldW,worldH);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // Gems and enemies
    this.spawnGems();
    this.spawnBirds();
    this.spawnSlimes();

    // Merchant placement and interaction
    this.createMerchant();

    // Instructions
    this.add.text(14,14,
      'Ohjeet:\nVasen/Oikea tai A/D = liiku  |  Ylös/Space = hyppy' +
      '\nVasen klikkaus = mainaa (myös alaspäin)  |  Oikea klikkaus = aseta lankku' +
      '\nC = craftaa 3 puusta 1 lankku  |  E = kauppias  |  1-4/Q = työkalut' +
      '\nPunainen timantti -> Lento  |  Varo lintuja ja limoja!',
      { fontFamily:'monospace', fontSize:'14px', color:'#fff' })
      .setScrollFactor(0).setDepth(1000).setShadow(2,2,'#000',3);

    // Sync UI and settings checkboxes
    const toggleFly = document.getElementById('toggleFly');
    if (toggleFly) toggleFly.checked = !!this.state.canFly;

    this.updateUI();

    // Expose scene for UI handlers
    window.gameScene = this;
  }

  update() {
    // Reset merchant hint each frame, will be re-enabled by overlap
    this.nearMerchant = false;
    if (this.merchantPrompt) this.merchantPrompt.setVisible(false);

    const onGround = this.player.body.blocked.down || this.player.body.touching.down;

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jump = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;
    const speed = 220;

    if (left) { this.player.setVelocityX(-speed); this.player.setFlipX(true); }
    else if (right) { this.player.setVelocityX(speed); this.player.setFlipX(false); }
    else { this.player.setVelocityX(0); }

    if (this.state.canFly) {
      if (jump) this.player.setVelocityY(-280);
    } else if (jump && onGround) {
      this.player.setVelocityY(-440);
      document.getElementById('sfxJump')?.play().catch(()=>{});
      this.player.setScale(1.05,0.95); this.time.delayedCall(120,()=>this.player.setScale(1,1));
    }

    const worldW = WORLD_TILES_X*TILE, worldH = WORLD_TILES_Y*TILE;
    if (this.player.x < 16) this.player.x = 16;
    if (this.player.x > worldW-16) this.player.x = worldW-16;
    if (this.player.y > worldH+200) { this.player.setPosition(100,100); this.player.setVelocity(0,0); this.damage(1); }

    // Interact with merchant
    if (Phaser.Input.Keyboard.JustDown(this.keys.E) && this.nearMerchant) this.openMerchant();

    // Slime AI: simple patrol and hop
    if (this.slimes) {
      this.slimes.children.iterate((sl)=>{
        if (!sl || !sl.body) return;
        if (sl.body.blocked.left) { sl.setVelocityX(80); sl.setFlipX(false); }
        else if (sl.body.blocked.right) { sl.setVelocityX(-80); sl.setFlipX(true); }
        if ((sl.body.blocked.down || sl.body.touching.down) && Math.random()<0.005) sl.setVelocityY(-260);
      });
    }
  }

  // Mining logic (supports digging down by clicking lower tiles within reach)
  attemptMine(pointer) {
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
    // Also remove static body from platforms group at position
    // (Phaser staticGroup handles destroy above)
    this.saveState();
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
    document.getElementById('sfxPlace')?.play().catch(()=>{});

    // persist placement
    this.worldDiff.placed.push({ tx, ty, type:'plank', textureKey:'tex_ground' });
    // If it was previously removed (same coordinate), clean up
    this.worldDiff.removed = this.worldDiff.removed.filter(k=>k!==key);
    this.saveState();
  }

  craftPlank() {
    if (this.inv.wood >= 3) {
      this.inv.wood -= 3; this.inv.plank += 1; this.updateInventoryUI(); this.saveState();
      this.showToast('Craftattu: 1 lankku');
    } else {
      this.showToast('Tarvitset 3 puuta');
    }
  }

  dropCoin(x,y){
    const coin = this.physics.add.sprite(x, y-10, 'tex_coin');
    coin.setVelocity(Phaser.Math.Between(-80,80), -220); coin.setBounce(0.4); coin.setCollideWorldBounds(true);
    this.physics.add.collider(coin, this.platforms);
    this.physics.add.overlap(this.player, coin, ()=>{ coin.destroy(); this.state.coins++; this.updateUI(); this.saveState(); document.getElementById('sfxPickup')?.play().catch(()=>{}); }, null, this);
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
    if (type === 'wood') { this.inv.wood++; this.updateInventoryUI(); this.saveState(); document.getElementById('sfxPickup')?.play().catch(()=>{}); }
    else if (type === 'stone') { this.inv.stone++; this.updateInventoryUI(); this.saveState(); document.getElementById('sfxPickup')?.play().catch(()=>{}); }
    item.destroy();
  }

  onPickup(player, gem) {
    if (gem.texture.key === 'tex_red') {
      this.state.canFly = true;
      this.showToast('LENTO AVATTU! Pidä Ylös/Space lentääksesi');
      document.getElementById('sfxCoin')?.play().catch(()=>{});
    } else {
      this.state.coins += 1; document.getElementById('sfxPickup')?.play().catch(()=>{});
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
    const toolNames = { hand:'Käsi', wooden:'Puuhakku', stone:'Kivihakku', iron:'Rautahakku' };
    slots[5].textContent = `Työkalu: ${toolNames[this.tools.equipped]}`;
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
      this.blocks.set(this.keyFromTile(tx, ty), sprite);
    } else {
      sprite = this.add.image(x, y, textureKey);
      this.decor.add(sprite);
    }
    return sprite;
  }

  createWorld() {
    // Clear in case of restart
    this.blocks.clear?.();

    // Surface line
    for (let tx = 0; tx < WORLD_TILES_X; tx++) {
      this.addBlock(tx, SURFACE_Y, 'tex_ground', 'ground', true);
    }

    // Random floating platforms above surface
    const rng = this.makeRandom(1337);
    for (let i = 0; i < 80; i++) {
      const len = 2 + Math.floor(rng() * 6);
      const px = 4 + Math.floor(rng() * (WORLD_TILES_X - len - 8));
      const py = 6 + Math.floor(rng() * (SURFACE_Y - 8));
      for (let j = 0; j < len; j++) this.addBlock(px + j, py, 'tex_ground', 'ground', true);
    }

    // Underground fill: stone layers below surface
    for (let ty = SURFACE_Y+1; ty < WORLD_TILES_Y; ty++) {
      for (let tx = 0; tx < WORLD_TILES_X; tx++) {
        const tex = (ty - SURFACE_Y > 2) ? 'tex_stone' : 'tex_ground';
        const type = (tex === 'tex_stone') ? 'stone' : 'ground';
        this.addBlock(tx, ty, tex, type, true);
      }
    }

    // Trees on the surface
    for (let i = 0; i < 24; i++) {
      const tx = 3 + Math.floor(Math.random() * (WORLD_TILES_X - 6));
      const baseTy = SURFACE_Y - 1; // tile above the ground surface
      const height = 3 + Math.floor(Math.random()*3);
      for (let h = 0; h < height; h++) this.addBlock(tx, baseTy - h, 'tex_trunk', 'trunk', true);
      // leaves cluster (non-colliding)
      for (let lx = -2; lx <= 2; lx++) for (let ly = -2; ly <= 0; ly++) {
        if (Math.abs(lx)+Math.abs(ly) <= 3) this.addBlock(tx+lx, baseTy - height + ly, 'tex_leaves', 'leaves', false);
      }
    }
  }

  applyWorldDiff(){
    // Remove mined blocks
    if (Array.isArray(this.worldDiff.removed)) {
      for (const key of this.worldDiff.removed) {
        const spr = this.blocks.get(key);
        if (spr) { spr.destroy(); this.blocks.delete(key); }
      }
    }
    // Re-add placed blocks
    if (Array.isArray(this.worldDiff.placed)) {
      for (const p of this.worldDiff.placed) {
        if (typeof p.tx !== 'number' || typeof p.ty !== 'number') continue;
        const key = `${p.tx},${p.ty}`;
        if (this.blocks.has(key)) continue;
        this.addBlock(p.tx, p.ty, p.textureKey || 'tex_ground', p.type || 'plank', true);
      }
    }
  }

  spawnGems() {
    // Blue diamonds scattered on platforms; a few red special ones
    const bodies = this.platforms.getChildren();
    const rng = this.makeRandom(4242);
    let reds = 0;
    for (const b of bodies) {
      if (!b || !b.getData) continue;
      // Avoid spawning gems in deep underground
      const isUnderground = (b.y / TILE) > SURFACE_Y + 4;
      if (isUnderground) continue;
      if (rng() < 0.10) {
        const isRed = reds < 3 && rng() < 0.12;
        const tex = isRed ? 'tex_red' : 'tex_diamond';
        if (isRed) reds++;
        const gem = this.pickups.create(b.x, b.y - TILE, tex);
        gem.body.setAllowGravity(false);
        gem.setScale(0.9);
      }
    }
  }

  spawnBirds() {
    this.birds = this.physics.add.group({ allowGravity: false });
    for (let i = 0; i < 12; i++) {
      const x = 200 + Math.random() * (WORLD_TILES_X*TILE - 400);
      const y = 80 + Math.random() * (SURFACE_Y*TILE - 120);
      const bird = this.birds.create(x, y, 'tex_bird');
      bird.setVelocityX((Math.random()<0.5?-1:1) * (120 + Math.random()*120));
      bird.setBounce(1, 0);
      bird.setCollideWorldBounds(true);
    }
    this.physics.add.collider(this.birds, this.platforms, (bird)=>{ bird.setVelocityY(-40); });
    this.physics.add.overlap(this.player, this.birds, this.onBirdHit, null, this);
  }

  spawnSlimes(){
    this.slimes = this.physics.add.group();
    for (let i=0;i<14;i++){
      const x = 80 + Math.random() * (WORLD_TILES_X*TILE - 160);
      const y = (SURFACE_Y-2)*TILE - 20;
      const s = this.slimes.create(x, y, 'tex_slime');
      s.setBounce(0.1, 0.0);
      s.setCollideWorldBounds(true);
      s.setVelocityX(Math.random()<0.5?-80:80);
      s.body.setSize(24,16).setOffset(2,4);
    }
    this.physics.add.collider(this.slimes, this.platforms);
    this.physics.add.overlap(this.player, this.slimes, this.onSlimeHit, null, this);
  }

  onBirdHit(player, bird) {
    const now = this.time.now;
    if (now < this.invulnUntil) return;
    this.invulnUntil = now + 900;
    this.damage(1);
    const dir = Math.sign(player.x - bird.x) || 1;
    player.setVelocity(260*dir, -240);
    player.setTint(0xff8888);
    this.time.delayedCall(250, ()=> player.clearTint());
  }

  onSlimeHit(player, slime){
    const now = this.time.now;
    if (now < this.invulnUntil) return;
    this.invulnUntil = now + 900;
    this.damage(1);
    const dir = Math.sign(player.x - slime.x) || 1;
    player.setVelocity(220*dir, -200);
    player.setTint(0x88ff88);
    this.time.delayedCall(250, ()=> player.clearTint());
  }

  showToast(text) {
    const t = this.add.text(this.player.x, this.player.y - 60, text,
      { fontFamily:'monospace', fontSize:'14px', color:'#fff', backgroundColor:'#0008' })
      .setPadding(6,3).setDepth(2000);
    t.setScrollFactor(1);
    this.tweens.add({ targets:t, y: t.y-30, alpha:0, duration:1600, ease:'sine.in', onComplete:()=>t.destroy() });
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

  openMerchant(){ document.getElementById('merchant')?.classList.remove('hidden'); }
  closeMerchant(){ document.getElementById('merchant')?.classList.add('hidden'); }

  // Health/damage and save/load
  damage(amount){
    this.state.health = Math.max(0, this.state.health - amount);
    this.updateUI(); this.saveState();
    if (this.state.health <= 0) {
      this.state.health = 4;
      this.state.coins = Math.max(0, this.state.coins - 5);
      this.player.setPosition(100,100); this.player.setVelocity(0,0);
      this.showToast('Kuolit! -5 kolikkoa');
      this.updateUI(); this.saveState();
    }
  }

  saveState(){
    const data = { health: this.state.health, coins: this.state.coins, canFly: this.state.canFly, inv: this.inv, worldDiff: this.worldDiff, tools: this.tools, outfit: this.custom.outfit };
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
        if (Array.isArray(d.worldDiff.removed)) this.worldDiff.removed = d.worldDiff.removed.slice(0, 5000);
        if (Array.isArray(d.worldDiff.placed)) this.worldDiff.placed = d.worldDiff.placed.slice(0, 5000);
      }
      if (d.tools) this.tools = d.tools;
      if (d.outfit) this.custom.outfit = d.outfit;
    } catch(e) {}
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

    // Body outline
    g.lineStyle(2, 0x996633, 1);
    g.strokeRect(0, 0, pw, ph);

    // Head (skin)
    g.fillStyle(0xffdd66, 1);
    g.fillRect(4, 2, pw-8, 10);

    // Eyes
    const eyeGlow = this.custom.eyesGlow ? 0xffffaa : 0xffffff;
    g.fillStyle(eyeGlow, 1); g.fillCircle(10, 7, 2); g.fillCircle(18, 7, 2);
    g.fillStyle(0x000000, 1); g.fillCircle(10, 7, 1); g.fillCircle(18, 7, 1);

    // Shirt
    g.fillStyle(hexToNum(this.custom.shirtColor), 1);
    g.fillRect(3, 12, pw-6, 12);

    // Pants
    g.fillStyle(hexToNum(this.custom.pantsColor), 1);
    g.fillRect(4, 24, pw-8, 10);

    // Outfit overlays
    if (this.custom.outfit === 'normal') {
      // add a belt/trim
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(3, 20, pw-6, 2);
    } else if (this.custom.outfit === 'special') {
      // special suit accents
      g.fillStyle(0x55e0ff, 0.8);
      g.fillRect(3, 14, pw-6, 2);
      g.fillRect(3, 22, pw-6, 2);
      // small backpack top cap already drawn
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
    const order = ['hand','wooden','stone','iron'];
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

  // Merchant buttons
  document.getElementById('buyWood')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
    if (s.state.coins >= 5) {
      s.state.coins -= 5; s.inv.wood += 30; s.updateUI(); s.saveState();
      document.getElementById('sfxCoin')?.play().catch(()=>{});
    }
  });
  // Outfit purchases
  document.getElementById('buyOutfitNormal')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
    if (s.state.coins >= 3) {
      s.state.coins -= 3; s.custom.outfit = 'normal'; s.updatePlayerAppearance(); s.updateUI(); s.saveState();
      document.getElementById('sfxCoin')?.play().catch(()=>{});
    }
  });
  document.getElementById('buyOutfitSpecial')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
    if (s.state.coins >= 7) {
      s.state.coins -= 7; s.custom.outfit = 'special'; s.updatePlayerAppearance(); s.updateUI(); s.saveState();
      document.getElementById('sfxCoin')?.play().catch(()=>{});
    }
  });
  // Tool purchases
  document.getElementById('buyPickWood')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
    if (s.state.coins >= 2) { s.state.coins -= 2; s.tools.owned.wooden = true; s.updateUI(); s.saveState(); document.getElementById('sfxCoin')?.play().catch(()=>{}); }
  });
  document.getElementById('buyPickStone')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
    if (s.state.coins >= 4) { s.state.coins -= 4; s.tools.owned.stone = true; s.updateUI(); s.saveState(); document.getElementById('sfxCoin')?.play().catch(()=>{}); }
  });
  document.getElementById('buyPickIron')?.addEventListener('click', () => {
    const s = window.gameScene; if (!s) return;
    if (s.state.coins >= 6) { s.state.coins -= 6; s.tools.owned.iron = true; s.updateUI(); s.saveState(); document.getElementById('sfxCoin')?.play().catch(()=>{}); }
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

  function applySettings(){
    const m = document.getElementById('bgm');
    const sfxEls = ['sfxJump','sfxPlace','sfxPickup','sfxCoin'].map(id=>document.getElementById(id));
    if (m && musicVol) m.volume = Number(musicVol.value);
    if (sfxVol) sfxEls.forEach(e=>{ if (e) e.volume = Number(sfxVol.value); });
    const settings = { musicVol: Number(musicVol?.value||0.5), sfxVol: Number(sfxVol?.value||0.8), showHearts: !!showHearts?.checked, toggleFly: !!toggleFly?.checked, shirtColor: shirtColor?.value, pantsColor: pantsColor?.value, eyesGlow: !!eyesGlow?.checked };
    try { localStorage.setItem('UAG_settings', JSON.stringify(settings)); } catch(e) {}
    if (window.gameScene && toggleFly) { window.gameScene.state.canFly = !!toggleFly.checked; window.gameScene.saveState(); window.gameScene.updateInventoryUI(); }
    if (showHearts) { const h=document.getElementById('health'); if (h) h.style.display = showHearts.checked ? '' : 'none'; }
    // Apply appearance to player in-game
    if (window.gameScene) {
      window.gameScene.custom.shirtColor = shirtColor?.value || window.gameScene.custom.shirtColor;
      window.gameScene.custom.pantsColor = pantsColor?.value || window.gameScene.custom.pantsColor;
      window.gameScene.custom.eyesGlow = !!eyesGlow?.checked;
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
    }
  } catch(e) {}

  musicVol?.addEventListener('input', applySettings);
  sfxVol?.addEventListener('input', applySettings);
  showHearts?.addEventListener('change', applySettings);
  toggleFly?.addEventListener('change', applySettings);
  shirtColor?.addEventListener('input', applySettings);
  pantsColor?.addEventListener('input', applySettings);
  eyesGlow?.addEventListener('change', applySettings);

  // Initial apply and try start bgm
  applySettings();
  document.getElementById('bgm')?.play().catch(()=>{});
});
