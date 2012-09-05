//This is a chip-8 emulator
//Written by Jerry Schneider

var chip8 = chip8 || {};
//Load the fontset into memory at 0x50
chip8.loadFontset = function(){
    for( var i = 0; i < this.chip8_fontset.length; i++){
        this.memoryView[0x50 + i] = this.chip8_fontset[i];
    }
};

//Hardcoded fontset for the chip8
chip8.chip8_fontset = [
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

//Print debug messages if true
chip8.debug = false;

chip8.enableDebug = function( isEnabled ){
    this.debug = isEnabled;
    if( isEnabled ){
        for( var i = 0; i < this.V.length; i++ ){
            var regName = "V" + i.toString(16).toUpperCase();
            document.getElementById( regName ).innerHTML = regName + ": " + this.V[i];
        }
    }
};

chip8.paused = false;

chip8.pause = function( isPaused ){
    this.paused = isPaused;
    if( isPaused ){
       clearTimeout( this.tick );
    } 
    else{
        var _this = this;
        this.tick = setTimeout( function(){_this.emulateCycle()}, this.timeout );
    }
};

chip8.step = function(){
    if( this.paused ){
        this.emulateCycle();
    }
};

//The current opcode
chip8.opcode;

//The timeout between emulation cycles
chip8.timeout = 0;

//4k memory
// 0x000-0x1FF - Chip 8 interpreter (contains font set in emu)
// 0x050-0x0A0 - Used for the built in 4x5 pixel font set (0-F)
// 0x200-0xFFF - Program ROM and work RAM
chip8.memoryView = new Uint8Array(4096);

//Registers
chip8.V = new Uint8Array(16);

//Index register (upper 4 bits are unused)
chip8.I = 0;

//Program counter (upper 4 bits are unused)
chip8.pc = 0;

//Pixel Display
chip8.pixels = [];

//Timers which count down from X to 0 at 60hz
chip8.delay_timer = 0;
chip8.sound_timer = 0;

//16 frame stack
chip8.stack = new Uint8Array(16);
//Stack pointer
chip8.sp = 0;

//Key state
chip8.keys = new Uint8Array(16);

//If the display was updated
chip8.bDisplayUpdate = false;

//If the emulator is waiting for input
chip8.bWaitingForKey = false;

chip8.memoryInit = function(){
    //Init 16 8-bit registers
    for( var i = 0; i < 16; i++ ){
        this.V[i] = 0;
    }
    //Applications are expected to be loaded at 0x200
    this.pc = 0x200;
    
    //Clear memory
    this.opcode = 0;
    this.stack = [];
    this.sp = 0;
    this.I = 0;

    //Set all pixels to 0
    for( var k = 0; k < 64 * 32; k++ ){
        this.pixels[k] = false;
    }
    this.bDisplayUpdate = true;

    //Set all keys to unpressed
    for( var i = 0; i < 16; i++ ){
        this.keys[i] = 0;
    }
    this.bWaitingForKey = false;

    //Load Fontset
    this.loadFontset();
};

chip8.updateReg = function( reg, value ){
    this.V[reg] = value;
    if( this.debug ){
        var regName = "V" + reg.toString(16).toUpperCase();
        document.getElementById( regName ).innerHTML = regName + ": " + value;
    }
}

chip8.decodeAndExecute = function( opcode ){
    switch( opcode & 0xF000 ){

        case 0x0000:    // 0---: more decoding
            switch( opcode & 0x000F ){

                case 0x0000:    // 0x00E0: clear the screen
                    //console.log("cls");
                    for( var k = 0; k < this.pixels.length; k++ ){
                        this.pixels[k] = false;
                    }
                    this.bDisplayUpdate = true;
                    clearScreen();
                    this.pc += 2;
                break;

                case 0x000E:    // 0x00EE: return from a subroutine
                    //console.log("return from subroutine");
                    this.pc = this.stack[--this.sp] + 2;
                break;

                default:
                    console.log("Unknown opcode: " + opcode.toString(16));
            }
        break;

        case 0x1000:    // 1NNN: Jumps to address NNN
            //console.log("jump to " + (0x0FFF & opcode).toString(16));
            this.pc = 0x0FFF & opcode;
        break;

        case 0x2000:    // 2NNN: Calls subroutine at address NNN
            //console.log("call subroutine at " + (0x0FFF & opcode).toString(16));
            this.stack[this.sp++] = this.pc;
            this.pc = 0x0FFF & opcode;
        break;

        case 0x3000:    // 3XNN: Skips the next instrouction if VX equals NN
            //console.log("VX: " + V[ (0x0F00 & opcode) >> 8 ].toString(16) + "; NN: " + (0x00FF & opcode).toString(16) );
            if( this.V[ (0x0F00 & opcode) >> 8 ] === (0x00FF & opcode) ){
                this.pc += 4;
            }
            else{
                this.pc += 2;
            }
        break;

        case 0x4000:    // 4XNN: Skips the next instrouction if VX does not equal NN
            //console.log("VX: " + V[ (0x0F00 & opcode) >> 8 ].toString(16) + "; NN: " + (0x00FF & opcode).toString(16) );
            if( this.V[ (0x0F00 & opcode) >> 8 ] !== (0x00FF & opcode) ){
                //console.log("skipped");
                this.pc += 4;
            }
            else{
                this.pc += 2;
            }
        break;

        case 0x5000:    // 5XY0: Skips the next instrouction if VX equals VY
            //console.log("VX: " + V[ (0x0F00 & opcode) >> 8 ].toString(16) + "; VY: " + V[ (0x00F0 & opcode) >> 4 ].toString(16) );
            if( this.V[ (0x0F00 & opcode) >> 8 ] === this.V[ (0x00F0 & opcode) >> 4 ] ){
                //console.log("skipped");
                this.pc += 4;
            }
            else{
                this.pc += 2;
            }
        break;

        case 0x6000:    // 6XNN: Sets VX to NN
            //console.log("VX = " + (0x00FF & opcode).toString(16) );
            this.updateReg( (0x0F00 & opcode) >> 8, 0x00FF & opcode );
            this.pc += 2;
        break;

        case 0x7000:    // 7XNN: Adds NN to VX
            //console.log("VX += " + (0x00FF & opcode).toString(16) );
            this.updateReg( (0x0F00 & opcode) >> 8, (this.V[ (0x0F00 & opcode) >> 8 ] + (0x00FF & opcode)) & 0x00FF );
            this.pc += 2;
        break;

        case 0x8000:    // 8---: more decoding
            switch( opcode & 0x000F ){
                case 0x0000:    // 8XY0: Sets VX to the value of VY
                    this.updateReg( (0x0F00 & opcode) >> 8, this.V[ (0x00F0 & opcode) >> 4 ] );
                    this.pc += 2;
                break;

                case 0x0001:    // 8XY1: Sets VX to VX | VY
                    this.updateReg( (0x0F00 & opcode) >> 8, this.V[ (0x0F00 & opcode) >> 8 ] | this.V[ (0x00F0 & opcode) >> 4 ] );
                    this.pc += 2;
                break;

                case 0x0002:    // 8XY2: Sets VX to VX & VY
                    this.updateReg( (0x0F00 & opcode) >> 8, this.V[ (0x0F00 & opcode) >> 8 ] & this.V[ (0x00F0 & opcode) >> 4 ] );
                    this.pc += 2;
                break;

                case 0x0003:    // 8XY3: Sets VX to VX XOR VY
                    this.updateReg( (0x0F00 & opcode) >> 8, this.V[ (0x0F00 & opcode) >> 8 ] ^ this.V[ (0x00F0 & opcode) >> 4 ] );
                    this.pc += 2;
                break;

                case 0x0004:    // 8XY4: Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't
                    this.updateReg( 0xF, this.V[(0x0F00 & opcode) >> 8] + this.V[(0x00F0 & opcode) >> 4] > 0xFF ? 0x1 : 0x0 );
                    this.updateReg( (0x0F00 & opcode) >> 8, this.V[(0x0F00 & opcode) >> 8] + this.V[(0x00F0 & opcode) >> 4] & 0xFF );
                    this.pc += 2;
                break;

                case 0x0005:    // 8XY5: VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't
                    this.updateReg( 0xF, this.V[(0x0F00 & opcode) >> 8] >= this.V[(0x00F0 & opcode) >> 4] ? 0x1 : 0x0 );
                    this.updateReg( (0x0F00 & opcode) >> 8, this.V[(0x0F00 & opcode) >> 8] - this.V[(0x00F0 & opcode) >> 4] );
                    this.pc += 2;
                break;

                case 0x0006:    // 8XY6: Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift
                    this.updateReg( 0xF, this.V[ (0x0F00 & opcode) >> 8 ] & 0x1 );
                    this.updateReg( (0x0F00 & opcode) >> 8, this.V[ (0x0F00 & opcode) >> 8 ] >> 1 );
                    this.pc += 2;
                break;

                case 0x0007:    // 8XY7: Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't
                    this.updateReg( 0xF, this.V[(0x00F0 & opcode) >> 4] >= this.V[(0x0F00 & opcode) >> 8] ? 0x1 : 0x0 );
                    this.updateReg( (0x0F00 & opcode) >> 8, this.V[(0x00F0 & opcode) >> 4] - this.V[(0x0F00 & opcode) >> 8] );
                    this.pc += 2;
                break;

                case 0x000E:    // 8XYE: Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift
                    this.updateReg( 0xF, this.V[ (0x0F00 & opcode) >> 8 ] & 0x80 ? 0x1 : 0x0 );
                    this.updateReg( (0x0F00 & opcode) >> 8, this.V[ (0x0F00 & opcode) >> 8 ] << 1 );
                    this.pc += 2;
                break;

                default:
                    console.log("Unknown opcode: " + opcode.toString(16));
            }
        break;

        case 0x9000:    // Skips the next instruction if VX doesn't equal VY
            //console.log("VX: " + V[ (0x0F00 & opcode) >> 8 ].toString(16) + "; VY: " + V[ (0x00F0 & opcode) >> 4 ].toString(16) );
            if( this.V[ (0x0F00 & opcode) >> 8 ] !== this.V[ (0x00F0 & opcode) >> 4 ] ){
                //console.log("skipped");
                this.pc += 4;
            }
            else{
                this.pc += 2;
            }
        break;

        case 0xA000:    // ANNN: sets I to the address NNN
            //console.log("I = " + ( opcode & 0x0FFF ).toString(16) );
            this.I = opcode & 0x0FFF;
            this.pc += 2;
        break;

        case 0xB000:    // BNNN: Jumps to the address NNN plus V0
            //console.log("jump " + ( (opcode & 0x0FFF) + V[0] ).toString(16) );
            this.pc = (opcode & 0x0FFF) + this.V[ 0 ];
        break;

        case 0xC000:    // CXNN: Sets VX to a random number & NN
            this.updateReg( (0x0F00 & opcode) >> 8, ( Math.random() * 0x80 ) & ( opcode & 0x00FF ) );
            this.pc += 2;
        break;

        case 0xD000:    // DXYN: Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels.
                        //       Each row of 8 pixels is read as bit-coded (with the most significant bit of each byte displayed on the left) starting from memory location I;
                        //       I value doesn't change after the execution of this instruction. 
                        //       As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 if that doesn't happen.
            //console.log("Draw");
            var X = this.V[(opcode & 0x0F00) >> 8];
            var Y = this.V[(opcode & 0x00F0) >> 4];
            var spriteHeight = opcode & 0x000F;

            this.updateReg( 0xF, 0 );
            for( var hline = 0; hline < spriteHeight; hline++ ){
                var spriteRow = this.memoryView[ this.I + hline ];
                for( var vline = 0; vline < 8; vline++ ){
                    //If the sprite specifies a difference at this pixel
                    if( spriteRow & (0x80 >> vline) ){
                        var pixelIndex = ((Y + hline) * 64) %( 64*32 ) + (X + vline) % 64;
                        //flip the bit
                        var bit = !this.pixels[ pixelIndex ];
                        this.pixels[ pixelIndex ] = bit;
                        //update the display
                        drawPixel((X + vline) % 64, (Y + hline) % 32, bit);
                        this.bDisplayUpdate = true;
                        //if the bit was reset, set VF
                        bit || (this.updateReg( 0xF, 1 ) );
                    }
                }
            }
            this.pc += 2;
        break;

        case 0xE000:    // E---: more decoding
            switch( opcode & 0x00FF ){

                case 0x009E:    // EX9E: Skips the next instruction if the key stored in VX is pressed
                    if( this.keys[ this.V[ (opcode & 0x0F00) >> 8 ] ] ){
                        //console.log("key " + V[ (opcode & 0x0F00) >> 8 ].toString(16) + " stored: skip");
                        this.pc += 4;
                    }
                    else{
                        this.pc += 2;
                    }
                break;

                case 0x00A1:    // EXA1: Skips the next instruction if the key stored in VX isn't pressed
                    if( !this.keys[ this.V[ (opcode & 0x0F00) >> 8 ] ] ){
                        //console.log("key " + V[ (opcode & 0x0F00) >> 8 ].toString(16) + " not stored: skip");
                        this.pc += 4;
                    }
                    else{
                        this.pc += 2;
                    }
                break;

                default:
                    console.log("Unknown opcode: " + opcode.toString(16));
            }
        break;

        case 0xF000:    // F000: more decoding
            switch( opcode & 0x00FF ){

                case 0x0007:    // FX07: Sets VX to the value of the delay timer
                    this.updateReg( (0x0F00 & opcode) >> 8, this.delay_timer );
                    this.pc += 2;
                break;

                case 0x000A:    // FX0A: A key press is awaited, and then stored in VX
                    this.bWaitingForKey = true;
                break;

                case 0x0015:    // FX15: Sets the delay timer to VX
                    //console.log("delay_timer = VX");
                    this.delay_timer = this.V[ (0x0F00 & opcode) >> 8 ];
                    this.pc += 2;
                break;

                case 0x0018:    // FX19: Sets the sound timer to VX
                    //console.log("sound_timer = VX");
                    this.sound_timer = this.V[ (0x0F00 & opcode) >> 8 ];
                    this.pc += 2;
                break;

                case 0x001E:    // FX1E: Adds VX to I
                    //console.log("I = I + VX");
                    this.I += this.V[ (0x0F00 & opcode) >> 8 ];
                    if( this.I & 0xF000 ){
                        this.updateReg( 0xF, 1 );
                    }
                    else{
                        this.updateReg( 0xF, 0 );
                    }
                    this.I = this.I & 0x0FFF;
                    this.pc += 2;
                break;

                case 0x0029:    // FX29: Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font
                    //console.log("I = char location");
                    this.I = 0x50 + ( this.V[ (0x0F00 & opcode) >> 8 ] * 5 );
                    this.pc += 2;
                break;

                case 0x0033:    // FX33: Stores the Binary-coded decimal representation of VX, with 
                                //       the most significant of three digits at the address in I, 
                                //       the middle digit at I plus 1, 
                                //       and the least significant digit at I plus 2
                    //console.log("Store each decimal");
                    var VX = this.V[(opcode & 0x0F00) >> 8]
                    this.memoryView[this.I]     = Math.floor( VX / 100);
                    this.memoryView[this.I + 1] = Math.floor( VX / 10) % 10;
                    this.memoryView[this.I + 2] = VX % 10;
                    this.pc += 2;
                break;

                case 0x0055:    // FX55: Stores V0 to VX in memory starting at address I
                    //console.log("store all registers in memory");
                    X = (opcode & 0x0F00) >> 8;
                    for( var i = 0; i <= X; i++ ){
                        this.memoryView[this.I+i] = this.V[i];
                    }
                    this.pc += 2;
                break;

                case 0x0065:    // FX65: Fills V0 to VX with values from memory starting at address I
                    //console.log("get all registers from memory");
                    X = (opcode & 0x0F00) >> 8;
                    for( var i = 0; i <= X; i++ ){
                        this.updateReg( i, this.memoryView[this.I+i] );
                    }
                    this.pc += 2;
                break;

                default:
                    console.log("Unknown opcode: " + opcode.toString(16));
            }
        break;

        default:
            console.log("Unknown opcode: " + opcode.toString(16));
    }
};

chip8.fullRender = function(){
    for( var i = 0; i < this.pixels.length; i++ ){
        drawPixel( i % 64, Math.floor(i / 64), this.pixels[i]);
    }
};

chip8.emulateCycle = function(){
    //Fetch opcode, instructions are 2 bytes long
    //TODO: opcode is a free variable, AKA global
    //(we should sort out its dependents and make it local)
    opcode = this.memoryView[this.pc] << 8 | this.memoryView[this.pc+1];

    if(this.debug){
        console.log("memory[" + this.pc.toString(16) + "] === " + opcode.toString(16));
    }
    //Decode and execute opcode
    this.decodeAndExecute( opcode );

    if( !this.bWaitingForKey && !this.paused ){
        //Get input

        //Execute next instruction
        var _this = this;
        this.tick = setTimeout( function(){_this.emulateCycle()}, this.timeout );
    }
};

//TODO: Condense similar code with emulateCycle
chip8.emulateCycleSecondHalf = function( key ){
    //TODO: should only be called when bWaitingForKey is set anyway
    if(this.bWaitingForKey){
        this.updateReg( (0x0F00 & opcode) >> 8, key );
        this.pc += 2;
        this.bWaitingForKey = false;
    }
    
    if( !this.paused ){
        //Get input

        //Execute next instruction
        var _this = this;
        this.tick = setTimeout( function(){_this.emulateCycle()}, this.timeout );
    }
};

chip8.updateTimers = function(){
    //Update timers
    if( this.delay_timer > 0 ){
        this.delay_timer--;
        //Nothing happens here, it is a register than can be checked by the program
    }
    if( this.sound_timer > 0 ){
        this.sound_timer--;
        if( this.sound_timer !== 0 ){
            //TODO: Play a sound when timer is non-zero
        }
    }
};

chip8.setTimerRate = function(hz){
    clearInterval( this.event_timer );
    var _this = this;
    this.event_timer = setInterval( function(){_this.updateTimers()}, 1000 / hz );
};

//Load the game into the emulator memory
chip8.loadGame = function( romFile ){
    //Clear existing tick, memory, and screen
    clearTimeout( this.tick );
    this.memoryInit();
    clearScreen();

    //Load the game into memory
    if( typeof romFile === 'string' ){
        for( var i = 0; i < romFile.length; i++ ){
            this.memoryView[0x200 + i] = romFile.charCodeAt(i);
        }
    } else
    {
        for( var i = 0; i < romFile.byteLength; i++ ){
            this.memoryView[0x200 + i] = romFile[i];
        }
    }
    console.log('beginning emulation');

    //Emulation loop
    this.emulateCycle();
};
