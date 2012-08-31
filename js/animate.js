//var canvas;
var context;
//TODO: imageData unused
//var imageData;
var colorOn = "#FFF";
var colorOff = "#000";

function canvasInit(){
    console.log("starting");

    //Initialize the canvas
    var canvas = document.getElementById("myCanvas");
    context = canvas.getContext("2d");

    width = canvas.width;
    height = canvas.height;
    //imageData = context.createImageData(width, height);

    clearScreen();
};

window.onload = function() {
    enableFileSelection();
    populateDropdown();
    canvasInit();
    chip8.setTimerRate(60);
};

//Maps keycodes (uppercase) to chip8 keys
//TODO: GUI to set keyMap
var keyMap = {
    49: 0x1,
    50: 0x2,
    51: 0x3,
    81: 0x4,
    87: 0x5,
    69: 0x6,
    65: 0x7,
    83: 0x8,
    68: 0x9,
    90: 0xA,
    88: 0x0,
    67: 0xB,
    52: 0xC,
    82: 0xD,
    70: 0xE,
    86: 0xF };

document.onkeyup = function(evt){
    evt = evt || window.event;
    var key = evt.keyCode || evt.charCode;
    //toUpperCase approximation
    if( key > 96 ) key -= 32;
    //check to see if we have this key mapped to a chip8 key
    var keycode = keyMap[key];
    if( keycode ){
        chip8.keys[ keycode ] = false;
    }
};

document.onkeydown = function(evt){
    evt = evt || window.event;
    var key = evt.keyCode || evt.charCode;
    //toUpperCase approximation
    if( key > 96 ) key -= 32;
    //check to see if we have this key mapped to a chip8 key
    var keycode = keyMap[key];
    if( keycode ){
        chip8.keys[ keycode ] = true;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( keycode );
        }
    }
    else if(key === 80){
        chip8.paused = true;
    }
};

var rsize = 12;
function drawPixel( X, Y, value ){
    context.fillStyle = value ? colorOn : colorOff;
    context.fillRect( X*rsize, Y*rsize, rsize, rsize );
};

function changeOn(){
    colorOn = '#' + pad( document.getElementById("txtColorOn").value, 3 );
    chip8.fullRender();
};

function changeOff(){
    colorOff = '#' + pad( document.getElementById("txtColorOff").value, 3 );
    chip8.fullRender();
};

function changeTimeout(){
    chip8.timeout = parseInt( document.getElementById("txtTimeout").value );
};

function changeTimer(){
    chip8.setTimerRate( parseInt( document.getElementById("txtTimer").value ) );
};

function pad(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
};

function clearScreen(){
    context.fillStyle = colorOff;
    context.fillRect( 0, 0, width, height );
};
