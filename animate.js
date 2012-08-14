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

function animate() {
    var canvas = document.getElementById("myCanvas");
    var context = canvas.getContext("2d");

    width = canvas.width;
    height = canvas.height;
    imageData = context.createImageData(width, height);

    // update stage
    setPixelResize(imageData, 0, 0, 255, 0, 0, 127, 100);
    setPixelResize(imageData, 0, 1, 0, 255, 0, 127, 100);
    setPixelResize(imageData, 1, 0, 0, 0, 255, 127, 100);
    setPixelResize(imageData, 1, 1, 0, 0, 0, 127, 100);

    // clear stage
    context.clearRect(0, 0, canvas.width, canvas.height);

    // render stage
    context.putImageData(imageData, 0, 0);

    // request new frame
    requestAnimFrame(function() {
        animate();
    });
}

window.onload = function() {
    animate();
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
