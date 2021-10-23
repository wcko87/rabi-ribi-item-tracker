var PAD = localStorage.getItem("RABI_PAD") ? parseInt(localStorage.getItem("RABI_PAD")) : 5;
var SIZE_X = localStorage.getItem("RABI_SIZE_X") ? parseInt(localStorage.getItem("RABI_SIZE_X")) : 512;
var SIZE_Y = localStorage.getItem("RABI_SIZE_Y") ? parseInt(localStorage.getItem("RABI_SIZE_Y")) : 200;
var RES_X = SIZE_X + PAD*2;
var RES_Y = SIZE_Y + PAD*2;
var backgroundColor = localStorage.getItem("RABI_BG_COLOR") ? localStorage.getItem("RABI_BG_COLOR") : "#000000";

document.getElementById("canvasSizeX").setAttribute("value", SIZE_X);
document.getElementById("canvasSizeY").setAttribute("value", SIZE_Y);
document.getElementById("backgroundColor").value = backgroundColor;

var mainCanvas = document.getElementById('mainCanvas');
mainCanvas.width = RES_X;
mainCanvas.height = RES_Y;
var ctx = mainCanvas.getContext('2d');

var win = document.getElementById('window');
//window.addEventListener("keydown", keyboardPress, false);
//window.addEventListener("keyup", keyboardRelease, false);
window.addEventListener("click", mouseClick, false);

var spriteSheetActive = new Image();
spriteSheetActive.src = "item_active.png";
spriteSheetActive.addEventListener('load', function() {hasChangeToDraw = true;});
var spriteSheetInactive = new Image();
spriteSheetInactive.src = "item_inactive.png";
spriteSheetInactive.addEventListener('load', function() {hasChangeToDraw = true;});
var hasChangeToDraw = false;


var MODE_OFF = 0;
var MODE_ON = 1;
var MODE_CROSS = 2;
var MODE_CIRCLE = 3;

var ICON_WIDTH = 64;

var itemIcons = [];
var toggleList = [0,2,3,1];

var errorList = [];
function error(message) {
    errorList.push(message);
}

function initializeBoard() {
    errorList = [];
    var items = document.getElementById("itemList").value.split("\n");
    var item_id_list = [];
    for (var i=0; i<items.length; ++i) {
        var key = items[i].trim().toUpperCase();
        if (key.length <= 0) {
            item_id_list.push(null);
            continue;
        }
        if (!ITEM_ID_MAP.hasOwnProperty(key)) {
            error("Unknown item: " + key);
        }
        item_id_list.push(ITEM_ID_MAP[key]);
    }

    var modes = document.getElementById("modeList").value.split("\n");
    var mode_id_list = [];
    for (var i=0; i<modes.length; ++i) {
        var key = modes[i].trim().toUpperCase();
        if (key.length <= 0) continue;
        if (!MODE_ID_MAP.hasOwnProperty(key)) {
            error("Unknown toggle: " + key);
        }
        mode_id_list.push(MODE_ID_MAP[key]);
    }

    var sizeX = Number(document.getElementById("canvasSizeX").value);
    var sizeY = Number(document.getElementById("canvasSizeY").value);

    var bgColorText = document.getElementById("backgroundColor").value;
    if (bgColorText.trim().length === 0) {
        backgroundColor = null;
    } else {
        backgroundColor = bgColorText;
    }

    localStorage.setItem("RABI_BG_COLOR", backgroundColor);

    var errorMessage = "";
    if (errorList.length > 0) {
        errorMessage = "Error:<br>" + errorList.join("<br>")
        console.log("Error:\n" + errorList.join("\n"));
    }
    document.getElementById("errorBox").innerHTML = errorMessage;
    
    if (errorList.length === 0) {
        resizeCanvas(sizeX, sizeY);
        setupBoard(item_id_list, mode_id_list);
    }   
}

function resizeCanvas(sizeX, sizeY) {
    SIZE_X = sizeX;
    SIZE_Y = sizeY;
    RES_X = sizeX + PAD*2;
    RES_Y = sizeY + PAD*2;

    mainCanvas.width = RES_X;
    mainCanvas.height = RES_Y;

    localStorage.setItem("RABI_SIZE_X", SIZE_X.toString());
    localStorage.setItem("RABI_SIZE_Y", SIZE_Y.toString());

}

function addItem(index, item_id) {
    var cols = Math.floor(SIZE_X/ICON_WIDTH);
    var px = ICON_WIDTH * (index%cols);
    var py = ICON_WIDTH * Math.floor(index/cols);
    itemIcons.push(new ItemIcon(px, py, item_id));
}

function setupBoard(id_list, toggle_list) {
    toggleList = toggle_list;
    itemIcons = [];

    for (var i=0; i<id_list.length; ++i) {
        if (id_list[i] == null) continue;
        addItem(i, id_list[i]);
    }

    hasChangeToDraw = true;
}

function drawItem(x1, y1, index, current_mode) {
    x1 += PAD;
    y1 += PAD;

    var sx = ICON_WIDTH*(index%32);
    var sy = ICON_WIDTH*Math.floor(index/32);
    if (current_mode === MODE_ON) {
        var chosenSpriteSheet = spriteSheetActive;
    } else {
        var chosenSpriteSheet = spriteSheetInactive;
    }

    if (current_mode === MODE_ON) {
        var radius = ICON_WIDTH/2
        var thickness = 3
        ctx.beginPath();
        ctx.arc(x1+radius, y1+radius, radius-thickness, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#ffff0040';
        ctx.fill();
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(chosenSpriteSheet,sx,sy,ICON_WIDTH,ICON_WIDTH,x1,y1,ICON_WIDTH,ICON_WIDTH);
    ctx.restore();

    if (current_mode === MODE_CROSS) {
        var thickness = 6;
        var offset = 6;

        ctx.lineWidth = thickness;
        ctx.strokeStyle = '#ff0000';

        ctx.beginPath();
        ctx.moveTo(x1+offset,y1+offset);
        ctx.lineTo(x1+ICON_WIDTH-offset,y1+ICON_WIDTH-offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x1+offset,y1+ICON_WIDTH-offset);
        ctx.lineTo(x1+ICON_WIDTH-offset,y1+offset);
        ctx.stroke();
    }
    if (current_mode === MODE_CIRCLE) {
        var radius = ICON_WIDTH/2
        var thickness = 6
        ctx.beginPath();
        ctx.arc(x1+radius, y1+radius, radius-thickness, 0, 2 * Math.PI, false);
        ctx.lineWidth = thickness;
        ctx.strokeStyle = '#ff0000';
        ctx.stroke();
    }
}

var ItemIcon = function(x1, y1, item_id) {
    this.x1 = x1;
    this.y1 = y1;
    this.item_id = item_id;
    this.modeIndex = 0;
}

ItemIcon.prototype = {
    withinBounds: function(cx, cy) {
        return cx >= this.x1 && cy >= this.y1 && cx < this.x1+ICON_WIDTH && cy < this.y1+ICON_WIDTH;
    },

    toggleMode: function() {
        this.modeIndex = (this.modeIndex+1)%toggleList.length;
        hasChangeToDraw = true;
    },

    draw: function() {
        this.modeIndex = this.modeIndex%toggleList.length;
        var mode = toggleList[this.modeIndex];
        drawItem(this.x1, this.y1, this.item_id, mode);
    },
}

function mouseClick(e) {
    var canvasRect = mainCanvas.getBoundingClientRect();
    var mouseX = e.clientX - canvasRect.left - PAD;
    var mouseY = e.clientY - canvasRect.top - PAD;
    if (mouseX < 0 || mouseY < 0 || mouseX > SIZE_X || mouseY > SIZE_Y) return;

    for (var i=0; i<itemIcons.length; ++i) {
        if (itemIcons[i].withinBounds(mouseX, mouseY)) {
            itemIcons[i].toggleMode();
        }
    }
}

function drawFrame() {
    for (var i=0; i<itemIcons.length; ++i) {
        itemIcons[i].draw();
    }
}

function gameLoop(time){
    if (hasChangeToDraw) {
        hasChangeToDraw = false;
        ctx.clearRect(0, 0, RES_X, RES_Y);
        if (backgroundColor !== null) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, RES_X, RES_Y);
        }
        drawFrame();
    }
    window.requestAnimationFrame(gameLoop);
}

gameLoop();

var MODE_ID_MAP = {
    "OFF": MODE_OFF,
    "ON": MODE_ON,
    "CROSS": MODE_CROSS,
    "CIRCLE": MODE_CIRCLE
};

var ITEM_ID_MAP = {
    "NATURE_ORB": 20,
    "BLESSED": 86,
    "TOXIC_STRIKE": 81,
    "PIKO_HAMMER": 1,
    "TOUGH_SKIN": 91,
    "WALL_JUMP": 31,
    "CARROT_BOMB": 4,
    "DEF_TRADE": 72,
    "LIGHT_ORB": 17,
    "CHARGE_RING": 34,
    "ARM_STRENGTH": 73,
    "MANA_WAGER": 84,
    "SURVIVAL": 89,
    "HEALTH_WAGER": 83,
    "SUNNY_BEAM": 22,
    "AUTO_EARRINGS": 7,
    "AUTO_TRIGGER": 94,
    "HEALTH_PLUS": 64,
    "CRISIS_BOOST": 68,
    "ARMORED": 77,
    "CHAOS_ROD": 14,
    "TOP_FORM": 90,
    "HITBOX_DOWN": 87,
    "AIR_DASH": 28,
    "PURE_LOVE": 80,
    "HOURGLASS": 5,
    "DEF_GROW": 70,
    "ATK_TRADE": 71,
    "RABI_SLIPPERS": 10,
    "HEALTH_SURGE": 65,
    "HEX_CANCEL": 79,
    "LUCKY_SEVEN": 78,
    "HAMMER_WAVE": 15,
    "UNKNOWN_ITEM_1": 40,
    "MANA_SURGE": 67,
    "UNKNOWN_ITEM_2": 61,
    "WATER_ORB": 18,
    "MANA_PLUS": 66,
    "STAMINA_PLUS": 85,
    "SELF_DEFENSE": 76,
    "GOLD_CARROT": 39,
    "QUICK_BARRETTE": 12,
    "SUPER_CARROT": 36,
    "CARROT_BOOST": 74,
    "ATK_GROW": 69,
    "BUNNY_WHIRL": 11,
    "EXPLODE_SHOT": 27,
    "SPIKE_BARRIER": 32,
    "FRAME_CANCEL": 82,
    "SLIDING_POWDER": 3,
    "CASHBACK": 88,
    "PLUS_NECKLACE": 23,
    "WEAKEN": 75,
    "HAMMER_ROLL": 16,
    "RIBBON_BADGE": 93,
    "ERINA_BADGE": 92,
    "CARROT_SHOOTER": 35,
    "UNKNOWN_ITEM_3": 33,
    "FIRE_ORB": 19,
    "CYBER_FLOWER": 24,
    "AIR_JUMP": 2,

    "SPEED_BOOST" : 6,
    "SOUL_HEART" : 9,
    "BOOK_OF_CARROT" : 13,
    "P_HAIRPIN" : 21,
    "HEALING_STAFF" : 25,
    "MAX_BRACELET" : 26,
    "BUNNY_STRIKE" : 29,
    "STRANGE_BOX" : 30,
    "BUNNY_AMULET" : 33,
    "RUMI_DONUT" : 37,
    "RUMI_CAKE" : 38,
    "COCOA_BOMB" : 40,

    "CONGRATULATIONS" : 42,

    "BUNNY_CLOVER" : 60,
    "WIND_BLESSING" : 61,
    "FAIRY_FLUTE" : 62,
    "BUNNY_MEMORIES" : 63,

    "HEALTH_UP": 96,
    "ATTACK_UP": 97,
    "MANA_UP": 98,
    "REGEN_UP": 99,
    "PACK_UP": 100,
    "RAINBOW_EGG": 47
};


