var display;

function canvasInit(){
    console.log("starting");
    //Initialize the Display
    display = new Display( 64, 32, 12, !!window.CanvasRenderingContext2D );
    // clear screen
    display.fill(0).flush();
    // add to the DOM
    document.getElementById('viewport').appendChild( display.container );
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
    88: 0x0,
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
    if( keycode !== undefined ){
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
    if( keycode !== undefined ){
        chip8.keys[ keycode ] = true;
        if( chip8.bWaitingForKey ){
            chip8.emulateCycleSecondHalf( keycode );
        }
    }
    else if(key === 80){
        chip8.paused = true;
    }
};

function enableConsole(){
    if( !chip8.debug ){
        var classname = document.getElementById("enableConsole").className;
        classname += 'btn-warning';
        document.getElementById("enableConsole").className = classname.replace('btn-info', '');
        document.getElementById("enableConsole").innerHTML = "Disable Console";
        chip8.enableDebug(true);
    }
    else{
        var classname = document.getElementById("enableConsole").className;
        classname += 'btn-info';
        document.getElementById("enableConsole").className = classname.replace('btn-warning', '');
        document.getElementById("enableConsole").innerHTML = "Enable Console";
        chip8.enableDebug(false);
    }
};


function pauseEmulation(){
    if( !chip8.paused ){
        var classname = document.getElementById("pause").className;
        classname += 'btn-warning';
        document.getElementById("pause").className = classname.replace('btn-info', '');
        document.getElementById("pause").innerHTML = "Resume";
        chip8.pause(true);
    }
    else{
        var classname = document.getElementById("pause").className;
        classname += 'btn-info';
        document.getElementById("pause").className = classname.replace('btn-warning', '');
        document.getElementById("pause").innerHTML = "Pause";
        chip8.pause(false);
    }
};

function step(){
    chip8.step();
};

function changeOn(){
    display.colorMap[1] = '#' + pad( document.getElementById("txtColorOn").value, 3 );
    display.flush();
};

function changeOff(){
    display.colorMap[0] = '#' + pad( document.getElementById("txtColorOff").value, 3 );
    display.flush();
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
