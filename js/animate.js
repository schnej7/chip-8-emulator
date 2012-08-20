var worker;

var canvas;
var context;
var imageData;

function newGame(){
    console.log("starting");

    //Initalize the canvas
    canvas = document.getElementById("myCanvas");
    context = canvas.getContext("2d");

    width = canvas.width;
    height = canvas.height;
    imageData = context.createImageData(width, height);

    main();
}

window.onload = function() {
    enableFileSelection();
    newGame();
};

document.onkeyup = function(evt){
    evt = evt || window.event;
    key = evt.keyCode || evt.charCode;
    if(key == 49){
        keys[0x1] = 0x0;
    }
    else if(key == 50){
        keys[0x2] = 0x0;
    }
    else if(key == 51){
        keys[0x3] = 0x0;
    }
    else if(key == 113 || key == 81){
        keys[0x4] = 0x0;
    }
    else if(key == 119 || key == 87){
        keys[0x5] = 0x0;
    }
    else if(key == 101 || key == 69){
        keys[0x6] = 0x0;
    }
    else if(key == 97 || key == 65){
        keys[0x7] = 0x0;
    }
    else if(key == 115 || key == 83){
        keys[0x8] = 0x0;
    }
    else if(key == 100 || key == 68){
        keys[0x9] = 0x0;
    }
    else if(key == 122 || key == 90){
        keys[0xA] = 0x0;
    }
    else if(key == 120 || key == 88){
        keys[0x0] = 0x0;
    }
    else if(key == 99 || key == 67){
        keys[0xB] = 0x0;
    }
    else if(key == 52){
        keys[0xC] = 0x0;
    }
    else if(key == 114 || key == 82){
        keys[0xD] = 0x0;
    }
    else if(key == 102 || key == 70){
        keys[0xE] = 0x0;
    }
    else if(key == 118 || key == 86){
        keys[0xF] = 0x0;
    }
};

document.onkeydown = function(evt){
    evt = evt || window.event;
    key = evt.keyCode || evt.charCode;
    if(key == 49){
        keys[0x1] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0x1 );
        }
    }
    else if(key == 50){
        keys[0x2] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0x2 );
        }
    }
    else if(key == 51){
        keys[0x3] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0x3 );
        }
    }
    else if(key == 113 || key == 81){
        keys[0x4] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0x4 );
        }
    }
    else if(key == 119 || key == 87){
        keys[0x5] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0x5 );
        }
    }
    else if(key == 101 || key == 69){
        keys[0x6] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0x6 );
        }
    }
    else if(key == 97 || key == 65){
        keys[0x7] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0x7 );
        }
    }
    else if(key == 115 || key == 83){
        keys[0x8] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0x8 );
        }
    }
    else if(key == 100 || key == 68){
        keys[0x9] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0x9 );
        }
    }
    else if(key == 122 || key == 90){
        keys[0xA] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0xA );
        }
    }
    else if(key == 120 || key == 88){
        keys[0x0] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0x0 );
        }
    }
    else if(key == 99 || key == 67){
        keys[0xB] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0xB );
        }
    }
    else if(key == 52){
        keys[0xC] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0xC );
        }
    }
    else if(key == 114 || key == 82){
        keys[0xD] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0xD );
        }
    }
    else if(key == 102 || key == 70){
        keys[0xE] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0xE );
        }
    }
    else if(key == 118 || key == 86){
        keys[0xF] = 0x1;
        if( bWaitingForKey ){
            emulateCycleSecondHalf( 0xF );
        }
    }
    else if(key == 112 || key == 80){
        paused = true;
    }
};

//Enlarge the image
function setPixelResize(imageData, x, y, r, g, b, a, rsize) {
    for( i = 0; i < rsize; i++ ){
        for( j = 0; j < rsize; j++ ){
            setPixel(imageData, x*rsize+i, y*rsize+j, r, g, b, a);
        }
    }
}

//Set a single pixel in the image
function setPixel(imageData, x, y, a) {
    index = (x + y * imageData.width) * 4;
    imageData.data[index+3] = a;
}
