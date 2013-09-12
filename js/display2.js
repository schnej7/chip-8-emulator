/* TO USE:
// create the display object
var display = new Display( 64, 32, 12, !!CanvasRenderingContext2D )
// clear screen
display.fill(0).flush();
// add to the DOM
document.getElementById('screen').appendChild( display.container );
*/

function Display( width, height, pixelSize, canvas ){
    /* CONSTRUCTOR */
    var api = this,
        length = width * height,
        buffer = [],
        renderQueue = [],
		colorMap = {
			0: '#000000',
			1: '#FFFFFF' };
    if( !canvas ){
        var container = document.createElement('div');
        container.style.width = width * pixelSize + 'px';
        container.style.height = height * pixelSize + 'px';
        container.innerHTML = 'Not Supported';
        return null;
    } else {
        var container = document.createElement('canvas'),
            context = container.getContext('2d');
        container.width = width * pixelSize;
        container.height = height * pixelSize;
    }
    /* PUBLIC VARIABLES AND FUNCTIONS */
	api.colorMap = colorMap;
    api.container = container;
    api.fill = function( value ){
        for( var i = 0; i < length; i++ ){
            buffer[i] = value;
            renderQueue.push({x: i % width, y: Math.floor( i / width ), i: i});
        }
        return api;
    };
    api.flush = function( _x, _y, w, h ){
        while( renderQueue.length > 0 ){
            var pix = renderQueue.shift();
            context.fillStyle = buffer[ pix.i ];
            context.fillStyle = colorMap[ buffer[ pix.i ] ];
            context.fillRect( pix.x * pixelSize, pix.y * pixelSize, pixelSize, pixelSize );
        }
        return api;
    };
    api.setPixel = function( x, y, value ){
        buffer[ (y * width + x) % length ] = value;
        renderQueue.push({x: x, y: y, i: (y * width + x) % length});
        //context.fillStyle = value;
        //context.fillRect( x * pixelSize, y * pixelSize, pixelSize,  pixelSize);
        return api;
    };
    api.getPixel = function( x, y ){
        return buffer[ (y * width + x) % length ];
    };
    return api;
};
