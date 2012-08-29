var worker;

var canvas;
var context;
var imageData;
var colorOn = "#FFF";
var colorOff = "#000";

function newGame(){
    console.log("starting");

    //Initalize the canvas
    canvas = document.getElementById("myCanvas");
    context = canvas.getContext("2d");

    width = canvas.width;
    height = canvas.height;
    imageData = context.createImageData(width, height);

    clearScreen();

    chip8.main();
};

window.onload = function() {
    enableFileSelection();
    newGame();
};

//maps keycodes (uppercase) to chip8 keys
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
        chip8.keys[ keycode ] = 0x0;
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
        chip8.keys[ keycode ] = 0x1;
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

//Enlarge the image
function setPixelResize(imageData, x, y, r, g, b, a, rsize) {
    for( var i = 0; i < rsize; i++ ){
        for( var j = 0; j < rsize; j++ ){
            setPixel(imageData, x*rsize+i, y*rsize+j, r, g, b, a);
        }
    }
};

//Set a single pixel in the image
function setPixel(imageData, x, y, r, g, b, a) {
    var index = (x + y * imageData.width) * 4;
    imageData.data[index] = r;
    imageData.data[index+1] = g;
    imageData.data[index+2] = b;
    imageData.data[index+3] = a;
};
