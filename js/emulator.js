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

    else if(event.data == "1"){
        keys[0x1] = key[0x1] ^ 0x1;
    }
    else if(event.data == "2"){
        keys[0x2] = key[0x2] ^ 0x1;
    }
    else if(event.data == "3"){
        keys[0x3] = key[0x3] ^ 0x1;
    }
    else if(event.data == "q"){
        keys[0x4] = key[0x4] ^ 0x1;
    }
    else if(event.data == "w"){
        keys[0x5] = key[0x5] ^ 0x1;
    }
    else if(event.data == "e"){
        keys[0x6] = key[0x6] ^ 0x1;
    }
    else if(event.data == "a"){
        keys[0x7] = key[0x7] ^ 0x1;
    }
    else if(event.data == "s"){
        keys[0x8] = key[0x8] ^ 0x1;
    }
    else if(event.data == "d"){
        keys[0x9] = key[0x9] ^ 0x1;
    }
    else if(event.data == "z"){
        keys[0xA] = key[0xA] ^ 0x1;
    }
    else if(event.data == "x"){
        keys[0x0] = key[0x0] ^ 0x1;
    }
    else if(event.data == "c"){
        keys[0xB] = key[0xB] ^ 0x1;
    }
    else if(event.data == "4"){
        keys[0xC] = key[0xC] ^ 0x1;
    }
    else if(event.data == "r"){
        keys[0xD] = key[0xD] ^ 0x1;
    }
    else if(event.data == "f"){
        keys[0xE] = key[0xE] ^ 0x1;
    }
    else if(event.data == "v"){
        keys[0xF] = key[0xF] ^ 0x1;
    }
};

//The current opcode
var opcode;

//If the game is paused on input
var paused = false;

//4k memory
// 0x000-0x1FF - Chip 8 interpreter (contains font set in emu)
// 0x050-0x0A0 - Used for the built in 4x5 pixel font set (0-F)
// 0x200-0xFFF - Program ROM and work RAM
var memory = new ArrayBuffer(4096);

var memoryView = new Uint8Array(memory, 0);

//Registers
var V = [];

//Index register (upper 4 bits are unused)
var I;

//Program counter (upper 4 bits are unused)
var pc;

//Pixel Display
var pixels = [];

//Timers which count down from X to 0 at 60hz
var delay_timer;
var sound_timer;

//16 frame stack
var stack = [];
//Stack pointer
var sp;

//Key state
var keys = [];

function memoryInit(){
    //Init 16 8-bit registers
    for( i = 0; i < 16; i++ ){
        V[i] = 0;
    }
    //Applications are expected to be loaded at 0x200
    pc = 0x200;
    
    //Clear memory
    opcode = 0;
    sp = 0;
    I = 0;

    //Set all pixels to 0
    for( i = 0; i < 64 * 32; i++ ){
        pixels[i] = 0;
    }

    //Set all keys to unpressed
    for( i = 0; i < 16; i++ ){
        keys[i] = 0;
    }

    //Load Fontset
    loadFontset();
}

function compare( array1, array2 ){
    for( i = 0; i < array1.length; i++ ){
        if( array1[i] != array2[i] ){
            return false;
        }
    }
    return true;
}

function display(){
    render = new Array();
    for( i = 0; i < pixels.length; i++ ){
        alpha = pixels[i] ? 0 : 255;
        render.push({"x": (i % 64), "y": (i - (i % 64)) / 64, "r": 0, "g": 0, "b": 0, "a": alpha});
    }
    animate( render );
}

function waitForKey(){
    key_cache = keys;
    if( compare(key_cache, keys) ){
        setTimeout( waitForKey, 5 );
        return;
    }
    for( i = 0; i < key_cache.length; i++ ){
        if( key_cache[i] ^ keys[i] ){
            V[ (0x0F00 & opcode) >> 8 ] = i;
            emulateCycleSecondHalf();
        }
    }
}

function decodeAndExecute( opcode ){
    switch( opcode & 0xF000 ){

        case 0x0000:    // 0---: more decoding
            switch( opcode & 0x000F ){

                case 0x0000:    // 0x00E0: clear the screen
                    //console.log("cls");
                    for( i = 0; i < pixels.length; i++ ){
                        pixels[i] = 0;
                    }
                    pc += 2;
                break;

                case 0x000E:    // 0x00EE: return from a subroutine
                    //console.log("return from subroutine");
                    pc = stack[--sp] + 2;
                break;

                default:
                    //console.log("Unknown opcode: " + opcode.toString(16));
            }
        break;

        case 0x1000:    // 1NNN: Jumps to address NNN
            //console.log("jump to " + (0x0FFF & opcode).toString(16));
            pc = 0x0FFF & opcode;
        break

        case 0x2000:    // 2NNN: Calls subroutine at address NNN
            //console.log("call subroutine at " + (0x0FFF & opcode).toString(16));
            stack[sp++] = pc;
            pc = 0x0FFF & opcode;
        break;

        case 0x3000:    // 3XNN: Skips the next instrouction if VX equals NN
            //console.log("VX: " + V[ (0x0F00 & opcode) >> 8 ].toString(16) + "; NN: " + (0x00FF & opcode).toString(16) );
            if( V[ (0x0F00 & opcode) >> 8 ] == (0x00FF & opcode) ){
                //console.log("skipped");
                pc += 4;
            }
            else{
                pc += 2;
            }
        break;

        case 0x4000:    // 4XNN: Skips the next instrouction if VX does not equal NN
            //console.log("VX: " + V[ (0x0F00 & opcode) >> 8 ].toString(16) + "; NN: " + (0x00FF & opcode).toString(16) );
            if( V[ (0x0F00 & opcode) >> 8 ] != (0x00FF & opcode) ){
                //console.log("skipped");
                pc += 4;
            }
            else{
                pc += 2;
            }
        break;

        case 0x5000:    // 5XY0: Skips the next instrouction if VX equals VY
            //console.log("VX: " + V[ (0x0F00 & opcode) >> 8 ].toString(16) + "; VY: " + V[ (0x00F0 & opcode) >> 4 ].toString(16) );
            if( V[ (0x0F00 & opcode) >> 8 ] == V[ (0x00F0 & opcode) >> 4 ] ){
                //console.log("skipped");
                pc += 4;
            }
            else{
                pc += 2;
            }
        break;

        case 0x6000:    // 6XNN: Sets VX to NN
            //console.log("VX = " + (0x00FF & opcode).toString(16) );
            V[ (0x0F00 & opcode) >> 8 ] = 0x00FF & opcode;
            pc += 2;
        break;

        case 0x7000:    // 7XNN: Adds NN to VX
            //console.log("VX += " + (0x00FF & opcode).toString(16) );
            V[ (0x0F00 & opcode) >> 8 ] += 0x00FF & opcode;
            V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] & 0x00FF;
            pc += 2;
        break;

        case 0x8000:    // 8---: more decoding
            switch( opcode & 0x000F ){
                case 0x0000:    // 8XY0: Sets VX to the value of VY
                    //console.log("VX = VY");
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x00F0 & opcode) >> 4 ];
                    pc += 2;
                break;

                case 0x0001:    // 8XY1: Sets VX to VX | VY
                    //console.log("VX = VX | VY");
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] | V[ (0x00F0 & opcode) >> 4 ];
                    pc += 2;
                break;

                case 0x0002:    // 8XY2: Sets VX to VX & VY
                    //console.log("VX = VX & VY");
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] & V[ (0x00F0 & opcode) >> 4 ];
                    pc += 2;
                break;

                case 0x0003:    // 8XY3: Sets VX to VX XOR VY
                    //console.log("VX = VX ^ VY");
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] ^ V[ (0x00F0 & opcode) >> 4 ];
                    pc += 2;
                break;

                case 0x0004:    // 8XY4: Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't
                    //console.log("VX += VX + VY");
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] + V[ (0x00F0 & opcode) >> 4 ];
                    V[ 0xF ] = ( V[ (0x0F00 & opcode) >> 8 ] & 0x100 ) >> 9;
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] & 0x00FF;
                    pc += 2;
                break;

                case 0x0005:    // 8XY5: VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't
                    //console.log("VX += VX - VY");
                    V[ (0x0F00 & opcode) >> 8 ] += 0x100;
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] - V[ (0x00F0 & opcode) >> 4 ];
                    V[ 0xF ] = (V[ (0x0F00 & opcode) >> 8 ] & 0x100) >> 9;
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] & 0x00FF;
                    pc += 2;
                break;

                case 0x0006:    // 8XY6: Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift
                    //console.log("VX >> 1");
                    V[ 0xF ] = V[ (0x0F00 & opcode) >> 8 ] & 0x1;
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] >> 1;
                    pc += 2;
                break;

                case 0x0007:    // 8XY7: Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't
                    //console.log("VX += VY - VX");
                    V[ (0x00F0 & opcode) >> 4 ] += 0x100;
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x00F0 & opcode) >> 4 ] - V[ (0x0F00 & opcode) >> 8 ];
                    V[ 0xF ] = (V[ (0x00F0 & opcode) >> 4 ] & 0x100) >> 9;
                    V[ (0x00F0 & opcode) >> 4 ] = V[ (0x00F0 & opcode) >> 4 ] & 0x00FF;
                    pc += 2;
                break;

                case 0x000E:    // 8XYE: Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift
                    //console.log("VX << 1");
                    V[ 0xF ] = V[ (0x0F00 & opcode) >> 8 ] & 0x80;
                    V[ (0x0F00 & opcode) >> 8 ] = V[ (0x0F00 & opcode) >> 8 ] << 1;
                    pc += 2;
                break;

                default:
                    //console.log("Unknown opcode: " + opcode.toString(16));
            }
        break;

        case 0x9000:    // Skips the next instruction if VX doesn't equal VY
            //console.log("VX: " + V[ (0x0F00 & opcode) >> 8 ].toString(16) + "; VY: " + V[ (0x00F0 & opcode) >> 4 ].toString(16) );
            if( V[ (0x0F00 & opcode) >> 8 ] != V[ (0x00F0 & opcode) >> 4 ] ){
                //console.log("skipped");
                pc += 4;
            }
            else{
                pc += 2;
            }
        break;

        case 0xA000:    // ANNN: sets I to the address NNN
            //console.log("I = " + ( opcode & 0x0FFF ).toString(16) );
            I = opcode & 0x0FFF;
            pc += 2;
        break;

        case 0xB000:    // BNNN: Jumps to the address NNN plus V0
            //console.log("jump " + ( (opcode & 0x0FFF) + V[0] ).toString(16) );
            pc = (opcode & 0x0FFF) + V[ 0 ];
        break;

        case 0xC000:    // CXNN: Sets VX to a random number & NN
            V[ (0x0F00 & opcode) >> 8 ] = ( Math.random() * 0x80 ) & ( opcode & 0x00FF );
            //console.log("random VX = " + V[ (0x0F00 & opcode) >> 8 ].toString(16) );
            pc += 2;
        break;

        case 0xD000:    // DXYN: Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels.
                        //       Each row of 8 pixels is read as bit-coded (with the most significant bit of each byte displayed on the left) starting from memory location I;
                        //       I value doesn't change after the execution of this instruction. 
                        //       As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 if that doesn't happen.
            //console.log("Draw");
            X = V[(opcode & 0x0F00) >> 8];
            Y = V[(opcode & 0x00F0) >> 4];
            height = opcode & 0x000F;

            V[0xF] = 0;
            for( hline = 0; hline < height; hline++ ){
                spriteRow = memoryView[ I + hline ];
                for( vline = 0; vline < 8; vline++ ){
                    //If the sprite specifies a difference at this pixel
                    if( spriteRow & (0x80 >> vline) ){
                        //Check if the bit is on, then flip it
                        if( pixels[ (Y + hline) * 64 + X + vline ] ){
                            V[0xF] = 1;
                            pixels[ (Y + hline) * 64 + X + vline ] = 0;
                        }
                        else{
                            pixels[ (Y + hline) * 64 + X + vline ] = 1;
                        }
                    }
                }
            }
            //console.log(V[0xF]);
            pc += 2;
        break;

        case 0xE000:    // E---: more decoding
            switch( opcode & 0x00FF ){

                case 0x009E:    // EX9E: Skips the next instruction if the key stored in VX is pressed
                    if( keys[ V[ (opcode & 0x0F00) >> 8 ] ] ){
                        //console.log("key " + V[ (opcode & 0x0F00) >> 8 ].toString(16) + " stored: skip");
                        pc += 4;
                    }
                    else{
                        pc += 2;
                    }
                break

                case 0x00A1:    // EXA1: Skips the next instruction if the key stored in VX isn't pressed
                    if( !keys[ V[ (opcode & 0x0F00) >> 8 ] ] ){
                        //console.log("key " + V[ (opcode & 0x0F00) >> 8 ].toString(16) + " not stored: skip");
                        pc += 4;
                    }
                    else{
                        pc += 2;
                    }
                break;

                default:
                    //console.log("Unknown opcode: " + opcode.toString(16));
            }
        break;

        case 0xF000:    // F000: more decoding
            switch( opcode & 0x00FF ){

                case 0x0007:    // FX07: Sets VX to the value of the delay timer
                    //console.log("VX = delay_timer");
                    V[ (0x0F00 & opcode) >> 8 ] = delay_timer;
                    pc += 2;
                break;

                case 0x000A:    // FX0A: A key press is awaited, and then stored in VX
                    console.log("This doesnt seem to work");
                    paused = true;
                    waitForKey();
                    pc += 2;
                break;

                case 0x0015:    // FX15: Sets the delay timer to VX
                    //console.log("delay_timer = VX");
                    delay_timer = V[ (0x0F00 & opcode) >> 8 ];
                    pc += 2;
                break;

                case 0x0018:    // FX19: Sets the sound timer to VX
                    //console.log("sound_timer = VX");
                    sound_timer = V[ (0x0F00 & opcode) >> 8 ];
                    pc += 2;
                break;

                case 0x001E:    // FX1E: Adds VX to I
                    //console.log("I = I + VX");
                    I += V[ (0x0F00 & opcode) >> 8 ];
                    I = I & 0x0FFF;
                    pc += 2;
                break;

                case 0x0029:    // FX29: Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font
                    //console.log("I = char location");
                    I = 0x50 + ( V[ (0x0F00 & opcode) >> 8 ] * 5 );
                    pc += 2;
                break;

                case 0x0033:    // FX33: Stores the Binary-coded decimal representation of VX, with 
                                //       the most significant of three digits at the address in I, 
                                //       the middle digit at I plus 1, 
                                //       and the least significant digit at I plus 2
                    //console.log("Store each decimal");
                    memoryView[I]     = Math.floor(V[(opcode & 0x0F00) >> 8] / 100);
                    memoryView[I + 1] = Math.floor((V[(opcode & 0x0F00) >> 8] / 10)) % 10;
                    memoryView[I + 2] = (V[(opcode & 0x0F00) >> 8] % 100) % 10;
                    pc += 2;
                break;

                case 0x0055:    // FX55: Stores V0 to VX in memory starting at address I
                    //console.log("store all registers in memory");
                    X = (opcode & 0x0F00) >> 8;
                    for( i = 0; i < X; i++ ){
                        memoryView[I+i] = V[i];
                    }
                    pc += 2;
                break;

                case 0x0065:    // FX65: Fills V0 to VX with values from memory starting at address I
                    //console.log("get all registers from memory");
                    X = (opcode & 0x0F00) >> 8;
                    for( i = 0; i < X; i++ ){
                        V[i] = memoryView[I+i];
                    }
                    pc += 2;
                break;

                default:
                    //console.log("Unknown opcode: " + opcode.toString(16));
            }
        break;

        default:
            //console.log("Unknown opcode: " + opcode.toString(16));
    }
}

function emulateCycle(){
    //Fetch opcode, instructions are 2 bytes long
    opcode = memoryView[pc] << 8 | memoryView[pc+1];

    console.log("memory[" + pc.toString(16) + "] == " + opcode.toString(16));
    //Decode and execute opcode
    decodeAndExecute( opcode );

    if( !paused ){
        //Update timers
        if( delay_timer > 0 ){
            delay_timer--;
        }
        if( sound_timer > 0 ){
            sound_timer--;
        }

        //Display
        display();
        
        //Get input

        //Execute next instruction
        setTimeout( emulateCycle, 1 );
    }
}

function emulateCycleSecondHalf(){

    paused = false;

    //Update timers
    if( delay_timer > 0 ){
        delay_timer--;
    }
    if( sound_timer > 0 ){
        sound_timer--;
    }

    //Display
    display();
    
    //Get input

    //Execute next instruction
    setTimeout( emulateCycle, 1 );
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

function gameSelected(){

    //Load the game into memory
    loadGame();
    console.log('beginning emulation');

    //Emulation loop
    emulateCycle();

}
