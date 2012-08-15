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
        setPixelResize(imageData, pixel.x, pixel.y, pixel.r, pixel.g, pixel.b, pixel.a, 4);
    }

    // clear stage
    context.clearRect(0, 0, canvas.width, canvas.height);

    // render stage
    context.putImageData(imageData, 0, 0);
}

var worker;

function newGame(){
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
}

window.onload = function() {
    newGame();
};

document.onkeypress = function(evt){
    evt = evt || window.event;
    key = evt.keyCode;
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
};

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
