//This is a chip-8 emulator
//Written by Jerry Schneider

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
}

function main(){
    console.log("here");
    memoryInit();
}
