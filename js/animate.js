window.requestAnimFrame = (function(callback) {
    return window.requestAnimationFrame || 
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame || 
    window.oRequestAnimationFrame || 
    window.msRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
})();

function animate( pixelatedArray ) {
    var canvas = document.getElementById("myCanvas");
    var context = canvas.getContext("2d");

    width = canvas.width;
    height = canvas.height;
    imageData = context.createImageData(width, height);

    // update stage
    for( q = 0; q < pixelatedArray.length; q++ ){
        pixel = pixelatedArray[q];
        setPixelResize(imageData, pixel.x, pixel.y, pixel.r, pixel.g, pixel.b, pixel.a, 8);
    }

    // clear stage
    context.clearRect(0, 0, canvas.width, canvas.height);

    // render stage
    context.putImageData(imageData, 0, 0);
}

var worker;

function newGame(){
    /*
    worker = new Worker('js/emulator.js');
    worker.onmessage = function(event){
        if(event.data){
            if( event.data == "end" ){
                newGame();
            }
            requestAnimFrame( function(){
                animate( event.data.data )
            });
        }
    }
    worker.postMessage("start");
    */
    console.log("starting");
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

function keydown(evt){
    evt = evt || window.event;
    key = evt.keyCode || evt.charCode;
    if(key == 49){
        keys[0x1] = 0x1;
    }
    else if(key == 50){
        keys[0x2] = 0x1;
    }
    else if(key == 51){
        keys[0x3] = 0x1;
    }
    else if(key == 113 || key == 81){
        keys[0x4] = 0x1;
    }
    else if(key == 119 || key == 87){
        keys[0x5] = 0x1;
    }
    else if(key == 101 || key == 69){
        keys[0x6] = 0x1;
    }
    else if(key == 97 || key == 65){
        keys[0x7] = 0x1;
    }
    else if(key == 115 || key == 83){
        keys[0x8] = 0x1;
    }
    else if(key == 100 || key == 68){
        keys[0x9] = 0x1;
    }
    else if(key == 122 || key == 90){
        keys[0xA] = 0x1;
    }
    else if(key == 120 || key == 88){
        keys[0x0] = 0x1;
    }
    else if(key == 99 || key == 67){
        keys[0xB] = 0x1;
    }
    else if(key == 52){
        keys[0xC] = 0x1;
    }
    else if(key == 114 || key == 82){
        keys[0xD] = 0x1;
    }
    else if(key == 102 || key == 70){
        keys[0xE] = 0x1;
    }
    else if(key == 118 || key == 86){
        keys[0xF] = 0x1;
    }
    else if(key == 112 || key == 80){
        paused = true;
    }

    //TODO: put the right keys in here
    /*
    if( key == 119 ){
        worker.postMessage("w");
    }
    else if( key == 97 ){
        worker.postMessage("a");
    }
    else if( key == 115 ){
        worker.postMessage("s");
    }
    else if( key == 100 ){
        worker.postMessage("d");
    }
    */
};

document.onkeydown = keydown;

function setPixelResize(imageData, x, y, r, g, b, a, rsize) {
    for( i = 0; i < rsize; i++ ){
        for( j = 0; j < rsize; j++ ){
            setPixel(imageData, x*rsize+i, y*rsize+j, r, g, b, a);
        }
    }
}

function setPixel(imageData, x, y, r, g, b, a) {
    index = (x + y * imageData.width) * 4;
    imageData.data[index+0] = r;
    imageData.data[index+1] = g;
    imageData.data[index+2] = b;
    imageData.data[index+3] = a;
}
