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
}

window.onload = function() {
    enableFileSelection();
    newGame();
};

document.onkeyup = function(evt){
    evt = evt || window.event;
    key = evt.keyCode || evt.charCode;
    if(key == 49){
        chip8.keys[0x1] = 0x0;
    }
    else if(key == 50){
        chip8.keys[0x2] = 0x0;
    }
    else if(key == 51){
        chip8.keys[0x3] = 0x0;
    }
    else if(key == 113 || key == 81){
        chip8.keys[0x4] = 0x0;
    }
    else if(key == 119 || key == 87){
        chip8.keys[0x5] = 0x0;
    }
    else if(key == 101 || key == 69){
        chip8.keys[0x6] = 0x0;
    }
    else if(key == 97 || key == 65){
        chip8.keys[0x7] = 0x0;
    }
    else if(key == 115 || key == 83){
        chip8.keys[0x8] = 0x0;
    }
    else if(key == 100 || key == 68){
        chip8.keys[0x9] = 0x0;
    }
    else if(key == 122 || key == 90){
        chip8.keys[0xA] = 0x0;
    }
    else if(key == 120 || key == 88){
        chip8.keys[0x0] = 0x0;
    }
    else if(key == 99 || key == 67){
        chip8.keys[0xB] = 0x0;
    }
    else if(key == 52){
        chip8.keys[0xC] = 0x0;
    }
    else if(key == 114 || key == 82){
        chip8.keys[0xD] = 0x0;
    }
    else if(key == 102 || key == 70){
        chip8.keys[0xE] = 0x0;
    }
    else if(key == 118 || key == 86){
        chip8.keys[0xF] = 0x0;
    }
};

document.onkeydown = function(evt){
    evt = evt || window.event;
    key = evt.keyCode || evt.charCode;
    if(key == 49){
        chip8.keys[0x1] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0x1 );
        }
    }
    else if(key == 50){
        chip8.keys[0x2] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0x2 );
        }
    }
    else if(key == 51){
        chip8.keys[0x3] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0x3 );
        }
    }
    else if(key == 113 || key == 81){
        chip8.keys[0x4] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0x4 );
        }
    }
    else if(key == 119 || key == 87){
        chip8.keys[0x5] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0x5 );
        }
    }
    else if(key == 101 || key == 69){
        chip8.keys[0x6] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0x6 );
        }
    }
    else if(key == 97 || key == 65){
        chip8.keys[0x7] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0x7 );
        }
    }
    else if(key == 115 || key == 83){
        chip8.keys[0x8] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0x8 );
        }
    }
    else if(key == 100 || key == 68){
        chip8.keys[0x9] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0x9 );
        }
    }
    else if(key == 122 || key == 90){
        chip8.keys[0xA] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0xA );
        }
    }
    else if(key == 120 || key == 88){
        chip8.keys[0x0] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0x0 );
        }
    }
    else if(key == 99 || key == 67){
        chip8.keys[0xB] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0xB );
        }
    }
    else if(key == 52){
        chip8.keys[0xC] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0xC );
        }
    }
    else if(key == 114 || key == 82){
        chip8.keys[0xD] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0xD );
        }
    }
    else if(key == 102 || key == 70){
        chip8.keys[0xE] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0xE );
        }
    }
    else if(key == 118 || key == 86){
        chip8.keys[0xF] = 0x1;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( 0xF );
        }
    }
    else if(key == 112 || key == 80){
        chip8.paused = true;
    }
};

var rsize = 12;
function drawPixel( X, Y, value ){
    context.fillStyle = value ? colorOn : colorOff;
    context.fillRect( X*rsize, Y*rsize, rsize, rsize );
}

function changeOn(){
    colorOn = '#' + pad( document.getElementById("txtColorOn").value, 3 );
    chip8.fullRender();
}

function changeOff(){
    colorOff = '#' + pad( document.getElementById("txtColorOff").value, 3 );
    chip8.fullRender();
}

function changeTimeout(){
    chip8.timeout = parseInt( document.getElementById("txtTimeout").value );
}

function pad(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}

function clearScreen(){
    context.fillStyle = colorOff;
    context.fillRect( 0, 0, width, height );
}

//Enlarge the image
function setPixelResize(imageData, x, y, r, g, b, a, rsize) {
    for( i = 0; i < rsize; i++ ){
        for( j = 0; j < rsize; j++ ){
            setPixel(imageData, x*rsize+i, y*rsize+j, r, g, b, a);
        }
    }
}

//Set a single pixel in the image
function setPixel(imageData, x, y, r, g, b, a) {
    index = (x + y * imageData.width) * 4;
    imageData.data[index] = r;
    imageData.data[index+1] = g;
    imageData.data[index+2] = b;
    imageData.data[index+3] = a;
}
