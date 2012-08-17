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

function decodeAndExecute( opcode ){
    switch( opcode & 0xF000 ){

        case 0x0000:    // 0---: more decoding
            switch( opcode & 0x000F ){

                case 0x0000:    // 0x00E0: clear the screen
                    //TODO: opcode not yet implemented
                break;

                case 0x000E:    // 0x00EE: return from a subroutine
                    pc = stack[--sp];
                break;

                default:
                    console.log("Unknown opcode: " + opcode.toString(16));
            }
        break;

        case 0x1000:    // 1NNN: Jumps to address NNN
            pc = 0x0FFF & opcode;
        break

        case 0x2000:    // 2NNN: Calls subroutine at address NNN
            stack[sp++] = pc;
            pc = 0x0FFF & opcode;
        break;

        case 0x3000:    // 3XNN: Skips the next instrouction if VX equals NN
            if( V[ (0x0F00 & opcode) >> 8 ] == 0x00FF & opcode ){
                pc += 4;
            }
            else{
                pc += 2;
            }
        break;

        case 0x4000:    // 4XNN: Skips the next instrouction if VX does not equal NN
            if( V[ (0x0F00 & opcode) >> 8 ] != 0x00FF & opcode ){
                pc += 4;
            }
            else{
                pc += 2;
            }
        break;

        case 0x5000:    // 5XY0: Skips the next instrouction if VX equals VY
            if( V[ (0x0F00 & opcode) >> 8 ] == V[ (0x00F0 & opcode) >> 4 ] ){
                pc += 4;
            }
            else{
                pc += 2;
            }
        break;

        case 0x6000:    // 6XNN: Sets VX to NN
            V[ (0x0F00 & opcode) >> 8 ] = 0x00FF & opcode;
            pc += 2;
        break;

        case 0x7000:    // 7XNN: Adds NN to VX
            V[ (0x0F00 & opcode) >> 8 ] += 0x00FF & opcode;
            pc += 2;
        break;

        case 0x8000:    // 8---: more decoding
            switch( opcode & 0x000F ){
                case 0x0000:    // 8XY0: Sets VX to the value of VY
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x00F0 & opcode) >> 4 ];
                    pc += 2;
                break;

                case 0x0001:    // 8XY1: Sets VX to VX | VY
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] | V[ (0x00F0 & opcode) >> 4 ];
                    pc += 2;
                break;

                case 0x0002:    // 8XY2: Sets VX to VX & VY
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] & V[ (0x00F0 & opcode) >> 4 ];
                    pc += 2;
                break;

                case 0x0003:    // 8XY3: Sets VX to VX XOR VY
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] XOR V[ (0x00F0 & opcode) >> 4 ];
                    pc += 2;
                break;

                case 0x0004:    // 8XY4: Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] + V[ (0x00F0 & opcode) >> 4 ];
                    V[ 0xF ] = ( V[ (0x0F00 & opcode) >> 8 ] & 0x100 ) >> 9;
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] & 0x00FF;
                    pc += 2;
                break;

                case 0x0005:    // 8XY5: VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't
                    V[ (0x0F00 & opcode) >> 8 ] += 0x100;
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] - V[ (0x00F0 & opcode) >> 4 ];
                    V[ 0xF ] = (V[ (0x0F00 & opcode) >> 8 ] & 0x100) >> 9;
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] & 0x00FF;
                    pc += 2;
                break;

                case 0x0006:    // 8XY6: Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift
                    V[ 0xF ] = V[ (0x0F00 & opcode) >> 8 ] & 0x1;
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] >> 1;
                    pc += 2;
                break;

                case 0x0007:    // 8XY7: Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't
                    V[ (0x00F0 & opcode) >> 4 ] += 0x100;
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x00F0 & opcode) >> 4 ] - V[ (0x0F00 & opcode) >> 8 ];
                    V[ 0xF ] = (V[ (0x00F0 & opcode) >> 4 ] & 0x100) >> 9;
                    V[ (0x00F0 & opcode) >> 4 ] = V[ (0x00F0 & opcode) >> 4 ] & 0x00FF;
                    pc += 2;
                break;

                case 0x000E:    // 8XYE: Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift
                    V[ 0xF ] = V[ (0x0F00 & opcode) >> 8 ] & 0x80;
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] << 1;
                    pc += 2;
                break;

                default:
                    console.log("Unknown opcode: " + opcode.toString(16));
            }
        break;

        case 0x9000:    // Skips the next instruction if VX doesn't equal VY
            if( V[ (0x0F00 & opcode) >> 8 ] != V[ (0x00F0 & opcode) >> 4 ] ){
                pc += 4;
            }
            else{
                pc += 2;
            }
        break;

        case 0xA000:    // ANNN: sets I to the address NNN
            I = opcode & 0x0FFF;
            pc += 2;
        break;

        case 0xB000:    // BNNN: Jumps to the address NNN plus V0
            pc = (opcode & 0x0FFF) + V[ 0 ];
        break;

        case 0xC000:    // CXNN: Sets VX to a random number & NN
            V[ (0x0F00 & opcode) >> 8 ] = ( Math.random() * 0x80 ) & ( opcode & 0x00FF );
            pc += 2;
        break;

        case 0xD000:    // DXYN: Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels.
                        //       Each row of 8 pixels is read as bit-coded (with the most significant bit of each byte displayed on the left) starting from memory location I;
                        //       I value doesn't change after the execution of this instruction. 
                        //       As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 if that doesn't happen.
            //TODO: opcode not yet implemented
        break;

        case 0xE000:    // E---: more decoding
            switch( opcode & 0x00FF ){

                case 0x009E:    // EX9E: Skips the next instruction if the key stored in VX is pressed
                    //TODO: opcode not yet implemented
                break

                case 0x00A1:    // EXA1: Skips the next instruction if the key stored in VX isn't pressed
                    //TODO: opcode not yet implemented
                break;

                default:
                    console.log("Unknown opcode: " + opcode.toString(16));
            }
        break;

        case 0xF000:    // F000: more decoding
            switch( opcode & 0x00FF ){

                case 0x0007:    // FX07: Sets VX to the value of the delay timer
                    V[ (0x0F00 & opcode) >> 8 ] = delay_timer;
                    pc += 2;
                break;

                case 0x000A:    // FX0A: A key press is awaited, and then stored in VX
                    //TODO: opcode not yet implemented
                break;

                case 0x0015:    // FX15: Sets the delay timer to VX
                    delay_timer = V[ (0x0F00 & opcode) >> 8 ];
                break;

                case 0x0018:    // FX19: Sets the sound timer to VX
                    sound_timer = V[ (0x0F00 & opcode) >> 8 ];
                    pc += 2;
                break;

                case 0x001E:    // FX1E: Adds VX to I
                    I += V[ (0x0F00 & opcode) >> 8 ];
                    pc += 2;
                break;

                case 0x0029:    // FX29: Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font
                    I = 0x50 + ( V[ (0x0F00 & opcode) >> 8 ] * 5 );
                    pc += 2;
                break;

                case 0x0033:    // FX33: Stores the Binary-coded decimal representation of VX, with 
                                //       the most significant of three digits at the address in I, 
                                //       the middle digit at I plus 1, 
                                //       and the least significant digit at I plus 2
                break;

                case 0x0055:    // FX55: Stores V0 to VX in memory starting at address I
                    X = (opcode & 0x0F00) >> 8;
                    for( i = 0; i < X; i++ ){
                        memoryView[I+i] = V[i];
                    }
                    pc += 2;
                break;

                case 0x0065:    // FX65: Fills V0 to VX with values from memory starting at address I
                    X = (opcode & 0x0F00) >> 8;
                    for( i = 0; i < X; i++ ){
                        V[i] = memoryView[I+i];
                    }
                    pc += 2;
                break;

                default:
                    console.log("Unknown opcode: " + opcode.toString(16));
            }
        break;

        default:
            console.log("Unknown opcode: " + opcode.toString(16));
    }
}

function emulateCycle(){
    //Fetch opcode, instructions are 2 bytes long
    opcode = memory[pc] << 8 | memory[pc+1];
    //Decode and execute opcode

    //Update timers
    if( delay_timer > 0 ){
        delay_timer--;
    }
    if( sound_timer > 0 ){
        sound_timer--;
    }
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
