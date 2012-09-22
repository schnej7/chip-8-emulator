/* TO USE:
// create the display object
var display = new Display( 64, 32, 12, !CanvasRenderingContext2D )
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
		colorMap = {
			0: '#000000',
			1: '#FFFFFF' };
	if( !canvas ){
		var container = document.createElement('div'),
			pixel = document.createElement('div'),
			pixels = container.childNodes;
		container.style.width = width * pixelSize + 'px';
		container.style.height = height * pixelSize + 'px';
		pixel.style.width = pixel.style.height = pixelSize + 'px';
		pixel.style.cssFloat = pixel.style.styleFloat = 'left';
		for( var i = 0; i < length; i++ )
			container.appendChild( pixel.cloneNode() );
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
		for( var i = 0; i < length; i++ )
			buffer[i] = value;
		return api;
	};
	api.flush = !canvas ?
		function( _x, _y, w, h ){
            var flushHeight = ( h + y ) || height;
            var flushWidth = ( w + x ) || width;
            for( var y = _y || 0; y < flushHeight; y++ ){
                for( var x = _x || 0; x < flushWidth; x++ ){
                    pixels[ y * width + x ].style.backgroundColor = colorMap[ buffer[ y * width + x ] ];
                }
            }
			return api;
            
            /*
			for( var i = 0; i < length; i++ )
				pixels[i].style.backgroundColor = colorMap[ buffer[i] ];
			return api;
            */
		} :
		function( _x, _y, w, h ){
            var flushHeight = ( h + y ) || height;
            var flushWidth = ( w + x ) || width;
            for( var y = _y || 0; y < flushHeight; y++ ){
                for( var x = _x || 0; x < flushWidth; x++ ){
                    context.fillStyle = colorMap[ buffer[ y * width + x ] ];
                    context.fillRect(
                        x * pixelSize, y * pixelSize,
                        pixelSize, pixelSize );
                }
            }
			return api;
		};
	api.setPixel = function( x, y, value ){
		buffer[ (y * width + x) % length ] = value;
		return api;
	};
	api.getPixel = function( x, y ){
		return buffer[ (y * width + x) % length ];
	};
	return api;
};

