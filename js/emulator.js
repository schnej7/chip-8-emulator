//This is a chip-8 emulator
//Written by Jerry Schneider

//Load the fontset into memory at 0x50
function loadFontset(){
    for( i = 0; i < chip8_fontset.length; i++){
        memoryView[0x50 + i] = chip8_fontset[i];
    }
};

//Hardcoded fontset for the chip8
var chip8_fontset = [
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
  0x20, 0x60, 0x20, 0x20, 0x70, // 1
  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
  0xF0, 0x80, 0xF0, 0x80, 0x80  // F
];

//Recieves messages from the font end
self.onmessage = function(event){
    //Begin emulation
    if(event.data == "start"){
        main();
    }
    //Kill the emulator
    else if(event.data == "stop"){
        self.close();
    }
};

//The current opcode
var opcode;

//4k memory
// 0x000-0x1FF - Chip 8 interpreter (contains font set in emu)
// 0x050-0x0A0 - Used for the built in 4x5 pixel font set (0-F)
// 0x200-0xFFF - Program ROM and work RAM
var memory = new ArrayBuffer(4096);

var memoryView = new Uint8Array(memory, 0);

//Registers
var V = [];

//Index register (upper 4 bits are unused)
var I = new ArrayBuffer(2);

//Program counter (upper 4 bits are unused)
var pc = new ArrayBuffer(2);

//Pixel Display 64 x 32
var pixels = [64 * 32];

//Timers which count down from X to 0 at 60hz
var delay_timer;
var sound_timer;

//16 frame stack
var stack = [16];
//Stack pointer
var sp;

//Key state
var key = [16];

function memoryInit(){
    //Init 16 8-bit registers
    for( i = 0; i < 16; i++ ){
        V.push( new ArrayBuffer(8) );
    }
    //Applications are expected to be loaded at 0x200
    pc = 0x200;
    
    //Clear memory
    opcode = 0;
    sp = 0;
    I = 0;

    //Load Fontset
    loadFontset();
}

function emulateCycle(){
    //Fetch opcode, instructions are 2 bytes long
    opcode = memory[pc] << 8 | memory[pc+1];
    //Decode opcode
    //Execute opcode

    //Update timers
}

function main(){
    memoryInit();

    //Emulation will begin once the game is loaded
}

//Load the game into the emulator memory
function loadGame(){
    for( i = 0; i < romFile.byteLength; i++ ){
        memoryView[0x200 + i] = romFile[i];
    }
}

function gameLoaded(){

    loadGame();
    for( i = 0; i < memory.byteLength; i++ ){
        console.log( memoryView[i] );
    }
    console.log('beginning emulation');
    //Emulation loop
    //while(true){
        //Emulate one cycle
        emulateCycle();

        //Draw to the screen

        //Get input
    //}
}
