
//board
let board;
let boardWidth = 750;
let boardHeight = 250;
let context;

//dino
let dinoWidth = 88;
let dinoHeight = 94;
let dinoX = 50;
let dinoY = boardHeight - dinoHeight;

let dino = {
    x : dinoX,
    y : dinoY,
    width : dinoWidth,
    height : dinoHeight
}

//phase 2 dino state
let dinoRun1Img;
let dinoRun2Img;
let dinoJumpImg;
let dinoDuck1Img;
let dinoDuck2Img;
let dinoDeadImg;
let dinoState = "running"; //"running" | "jumping" | "ducking" | "dead" — derived per frame in update()
let isDuckHeld = false;    //true while ArrowDown is held; set on keydown, cleared on keyup
let frameCount = 0;        //incremented at top of update(); drives sprite cycling
let duckWidth = 118;       //match dino-duck1.png width
let duckHeight = 60;       //match dino-duck*.png height
let duckY = boardHeight - duckHeight; //190 — ducking ground y

//cactus
let cactusArray = [];

let cactus1Width = 34;
let cactus2Width = 69;
let cactus3Width = 102;

let cactusHeight = 70;
let cactusX = 700;
let cactusY = boardHeight - cactusHeight;

let cactus1Img;
let cactus2Img;
let cactus3Img;

//bird
let birdArray = [];

let birdWidth = 97;       //match bird1.png width — canonical hitbox even when bird2 (93×62) is rendered
let birdHeight = 68;      //match bird1.png height

let birdLowY = 130;       //must-duck height — bird hits standing dino head, misses ducking dino (insets recalibrated)
let birdMidY = 160;       //must-jump height — overlaps both standing and ducking; only apex jump clears
let birdHighY = 80;       //don't-jump height — passes over standing/ducking, but jump apex gets caught

let bird1Img;
let bird2Img;

//physics
let velocityX = -4; //world scroll speed (cacti, track, birds — all read this)
let velocityY = 0;
let gravity = .3;
let jumpVelocity = -9; //initial upward velocity on jump

let gameOver = false;
let score = 0;
let debugHitbox = false; //toggle with 'd' — strokes AABB hitboxes for collision tuning
let spawnSeparation = 350; //min px between a cactus and a bird at spawn time — prevents unwinnable cross-type stacks

//collision insets — sprites have transparent padding inside their PNG bounds; shrink the collision rect per side (drawImage stays at full sprite size)
//dino has two very different sprite shapes (88×94 standing vs 118×60 ducking), so insets are per-state
let dinoStandingHit = { left: 12, top: 12, right: 12, bottom: 12 }; //run/jump/dead — symmetric so box stays centered on the visible body
let dinoDuckHit     = { left: 4,  top: 4,  right: 8,  bottom: 4 };  //duck — body fills most of 118×60
//cactus sprites: minor side padding only
let cactusInsetLeft = 4;
let cactusInsetTop = 0;
let cactusInsetRight = 4;
let cactusInsetBottom = 0;
//bird sprites (97×68 / 93×62): canonical hitbox locked at 97×68 per Phase 3 D-08; tight inset on wings + tail tip
let birdInsetLeft = 8;
let birdInsetTop = 8;
let birdInsetRight = 12;
let birdInsetBottom = 8;

//track
let trackImg;
let trackWidth = 2404;  //track.png native width
let trackHeight = 28;   //track.png native height
let trackX = 0;
let trackY = boardHeight - trackHeight; //222 — bottom-aligned under dino/cactus feet
let track1;
let track2;

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;

    context = board.getContext("2d"); //used for drawing on the board

    // draw initial dinosaur
    // context.fillStyle="green";
    // context.fillRect(dino.x, dino.y, dino.width, dino.height);

    dinoRun1Img = new Image();
    dinoRun1Img.src = "./img/dino-run1.png";
    dinoRun2Img = new Image();
    dinoRun2Img.src = "./img/dino-run2.png";
    dinoJumpImg = new Image();
    dinoJumpImg.src = "./img/dino-jump.png";
    dinoDuck1Img = new Image();
    dinoDuck1Img.src = "./img/dino-duck1.png";
    dinoDuck2Img = new Image();
    dinoDuck2Img.src = "./img/dino-duck2.png";
    dinoDeadImg = new Image();
    dinoDeadImg.src = "./img/dino-dead.png";

    cactus1Img = new Image();
    cactus1Img.src = "./img/cactus1.png";

    cactus2Img = new Image();
    cactus2Img.src = "./img/cactus2.png";

    cactus3Img = new Image();
    cactus3Img.src = "./img/cactus3.png";

    bird1Img = new Image();
    bird1Img.src = "./img/bird1.png";

    bird2Img = new Image();
    bird2Img.src = "./img/bird2.png";

    trackImg = new Image();
    trackImg.src = "./img/track.png";

    track1 = { img: trackImg, x: trackX,              y: trackY, width: trackWidth, height: trackHeight };
    track2 = { img: trackImg, x: trackX + trackWidth, y: trackY, width: trackWidth, height: trackHeight };

    requestAnimationFrame(update);
    setInterval(placeCactus, 1000); //1000 milliseconds = 1 second
    setInterval(placeBird, 1500); //birds spawn every 1.5 seconds
    document.addEventListener("keydown", moveDino);
    document.addEventListener("keyup", keyUp);
}

function update() {
    frameCount++;
    requestAnimationFrame(update);
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height);

    //track
    track1.x += velocityX;
    track2.x += velocityX;
    if (track1.x + track1.width <= 0) {
        track1.x = track2.x + track2.width;
    }
    if (track2.x + track2.width <= 0) {
        track2.x = track1.x + track1.width;
    }
    context.drawImage(track1.img, track1.x, track1.y, track1.width, track1.height);
    context.drawImage(track2.img, track2.x, track2.y, track2.width, track2.height);

    //dino — state machine: derive state, apply hitbox dims, gravity (skip while ducking), pick sprite, draw
    if (gameOver) {
        dinoState = "dead";
    } else if (dino.y < dinoY) {
        dinoState = "jumping";
    } else if (isDuckHeld) {
        dinoState = "ducking";
    } else {
        dinoState = "running";
    }

    if (dinoState == "ducking") {
        dino.width = duckWidth;
        dino.height = duckHeight;
        dino.y = duckY;
    } else {
        dino.width = dinoWidth;
        dino.height = dinoHeight;
        //do NOT touch dino.y here — gravity owns it for non-ducking states
    }

    //gravity — skip while ducking; running gravity with a duckY=190 dino.y would clamp it back UP to dinoY=156 (Math.min(190+v, 156)=156), teleporting the duck dino upward by 34px
    if (dinoState != "ducking") {
        velocityY += gravity;
        dino.y = Math.min(dino.y + velocityY, dinoY); //apply gravity, clamp to ground
    } else {
        velocityY = 0; //zero accumulated velocity so stand-up doesn't launch the dino
    }

    let dinoSprite;
    if (dinoState == "dead")         dinoSprite = dinoDeadImg;
    else if (dinoState == "jumping") dinoSprite = dinoJumpImg;
    else if (dinoState == "ducking") dinoSprite = (Math.floor(frameCount / 6) % 2 == 0) ? dinoDuck1Img : dinoDuck2Img;
    else /* running */               dinoSprite = (Math.floor(frameCount / 6) % 2 == 0) ? dinoRun1Img  : dinoRun2Img;
    context.drawImage(dinoSprite, dino.x, dino.y, dino.width, dino.height);
    let dinoIn = (dinoState == "ducking") ? dinoDuckHit : dinoStandingHit;
    let dinoHit = hitbox(dino, dinoIn.left, dinoIn.top, dinoIn.right, dinoIn.bottom);
    drawHitbox(dinoHit, "red");

    //cactus
    for (let i = 0; i < cactusArray.length; i++) {
        let cactus = cactusArray[i];
        cactus.x += velocityX;
        context.drawImage(cactus.img, cactus.x, cactus.y, cactus.width, cactus.height);
        let cactusHit = hitbox(cactus, cactusInsetLeft, cactusInsetTop, cactusInsetRight, cactusInsetBottom);
        drawHitbox(cactusHit, "lime");

        if (detectCollision(dinoHit, cactusHit)) {
            console.log("[collision] cactus", {frame: frameCount, score: score, state: dinoState,
                dino: dinoHit, cactus: cactusHit,
                gap: {x: cactusHit.x - (dinoHit.x + dinoHit.width), y: cactusHit.y - (dinoHit.y + dinoHit.height)}});
            gameOver = true;
            //draw the dead sprite same-frame; subsequent frames early-return before clearRect, so this paint persists
            context.drawImage(dinoDeadImg, dino.x, dino.y, dino.width, dino.height);
        }
    }

    //bird
    for (let i = 0; i < birdArray.length; i++) {
        let bird = birdArray[i];
        bird.x += velocityX;

        let birdSprite = (Math.floor(frameCount / 12) % 2 == 0) ? bird1Img : bird2Img;
        context.drawImage(birdSprite, bird.x, bird.y, bird.width, bird.height);
        let birdHit = hitbox(bird, birdInsetLeft, birdInsetTop, birdInsetRight, birdInsetBottom);
        drawHitbox(birdHit, "cyan");

        if (detectCollision(dinoHit, birdHit)) {
            console.log("[collision] bird", {frame: frameCount, score: score, state: dinoState,
                dino: dinoHit, bird: birdHit,
                gap: {x: birdHit.x - (dinoHit.x + dinoHit.width), y: birdHit.y - (dinoHit.y + dinoHit.height)}});
            gameOver = true;
            //draw the dead sprite same-frame; subsequent frames early-return before clearRect, so this paint persists
            context.drawImage(dinoDeadImg, dino.x, dino.y, dino.width, dino.height);
        }
    }

    //score
    context.fillStyle="black";
    context.font="20px courier";
    score++;
    context.fillText(score, 5, 20);
}

function moveDino(e) {
    if (e.code == "KeyD") { //debug toggle — runs in any game state, never restarts
        debugHitbox = !debugHitbox;
        return;
    }

    if (gameOver) {
        resetGame();
        return;
    }

    if ((e.code == "Space" || e.code == "ArrowUp") && dino.y == dinoY) {
        //jump
        velocityY = jumpVelocity;
    }
    else if (e.code == "ArrowDown") {
        isDuckHeld = true;
    }

}

function keyUp(e) {
    if (e.code == "ArrowDown") {
        isDuckHeld = false;
    }
}

function placeCactus() {
    if (gameOver) {
        return;
    }

    //skip if a bird is still in the spawn zone — prevents unwinnable cross-type stacks
    for (let i = 0; i < birdArray.length; i++) {
        if (birdArray[i].x > cactusX - spawnSeparation) return;
    }

    //place cactus
    let cactus = {
        img : null,
        x : cactusX,
        y : cactusY,
        width : null,
        height: cactusHeight
    }

    let placeCactusChance = Math.random(); //0 - 0.9999...

    if (placeCactusChance > .90) { //10% you get cactus3
        cactus.img = cactus3Img;
        cactus.width = cactus3Width;
        cactusArray.push(cactus);
    }
    else if (placeCactusChance > .70) { //30% you get cactus2
        cactus.img = cactus2Img;
        cactus.width = cactus2Width;
        cactusArray.push(cactus);
    }
    else if (placeCactusChance > .50) { //50% you get cactus1
        cactus.img = cactus1Img;
        cactus.width = cactus1Width;
        cactusArray.push(cactus);
    }

    if (cactusArray.length > 5) {
        cactusArray.shift(); //remove the first element from the array so that the array doesn't constantly grow
    }
}

function placeBird() {
    if (gameOver) {
        return;
    }

    //skip if a cactus is still in the spawn zone — prevents unwinnable cross-type stacks
    for (let i = 0; i < cactusArray.length; i++) {
        if (cactusArray[i].x > cactusX - spawnSeparation) return;
    }

    //place bird
    let bird = {
        img : bird1Img,    //initial frame; the update() draw loop re-picks per-frame from frameCount (added in plan 03-02)
        x : cactusX,       //reuse cactusX = 700 — both obstacle types enter from the right edge per D-04
        y : 0,             //assigned below by the height roll
        width : birdWidth,
        height: birdHeight
    }

    let placeBirdChance = Math.random(); //0 - 0.9999...

    if (placeBirdChance > .80) { //20% no bird — breathing room when a cactus stack would be unfair
        return;
    }
    else if (placeBirdChance > .55) { //25% high (y=birdHighY) — punishes reflexive jumping
        bird.y = birdHighY;
        birdArray.push(bird);
    }
    else if (placeBirdChance > .30) { //25% mid (y=birdMidY) — must jump
        bird.y = birdMidY;
        birdArray.push(bird);
    }
    else { //30% low (y=birdLowY) — must duck (depends on Phase 2 D-14 hitbox shrink)
        bird.y = birdLowY;
        birdArray.push(bird);
    }

    if (birdArray.length > 5) {
        birdArray.shift(); //count-based prune; safe at current scroll speed, see CONCERNS.md §"Latent Bugs" #1
    }
}

function resetGame() {
    gameOver = false;
    score = 0;
    cactusArray = [];
    birdArray = [];
    velocityY = 0;
    dino.y = dinoY;
    dinoState = "running";
    isDuckHeld = false;
    frameCount = 0;
    dino.width = dinoWidth;   //restore standing hitbox in case the player died while ducking
    dino.height = dinoHeight;
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}

function hitbox(entity, left, top, right, bottom) {
    return {
        x: entity.x + left,
        y: entity.y + top,
        width:  entity.width  - left - right,
        height: entity.height - top  - bottom
    };
}

function drawHitbox(entity, color) {
    if (!debugHitbox) return;
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.strokeRect(entity.x, entity.y, entity.width, entity.height);
}