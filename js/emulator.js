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
chip8.memoryView = [];

//Registers
chip8.V = [];

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
chip8.stack = [];
//Stack pointer
chip8.sp = 0;

//Key state
chip8.keys = [];

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

chip8.opcodes = new Array()

chip8.opcodes[0x0000] = {
    sub: {
        0x0000: function( em, opcode ){ // 0x00E0: clear the screen
            //console.log("cls");
            for( var k = 0; k < em.pixels.length; k++ ){
                em.pixels[k] = false;
            }
            em.bDisplayUpdate = true;
            display.fill(0).flush();
            em.pc += 2;
            return true;
        },
        0x000E: function( em ,opcode ){ // 0x00EE: return from a subroutine
            //console.log("return from subroutine");
            em.pc = em.stack[--em.sp] + 2;
            return true;
        }
    },
    exec: function( em, opcode ){
        return this.sub[ opcode & 0x000F ]( em, opcode );
    }
}

chip8.opcodes[0x1000] = { // 1NNN: jumps to address NNN
    exec: function( em, opcode ){
        em.pc = 0x0FFF & opcode;
        return true;
    }
}

chip8.opcodes[0x2000] = {
    exec: function( em, opcode ){
        em.stack[em.sp++] = em.pc;
        em.pc = 0x0FFF & opcode;
        return true;
    }
}

chip8.opcodes[0x3000] = {
    exec: function( em, opcode ){
        if( em.V[ (0x0F00 & opcode) >> 8 ] === (0x00FF & opcode) ){
            em.pc += 4;
        }
        else{
            em.pc += 2;
        }
        return true;
    }
}

chip8.opcodes[0x4000] = {
    exec: function( em, opcode ){
        if( em.V[ (0x0F00 & opcode) >> 8 ] !== (0x00FF & opcode) ){
            //console.log("skipped");
            em.pc += 4;
        }
        else{
            em.pc += 2;
        }
        return true;
    }
}

chip8.opcodes[0x5000] = {
    exec: function( em, opcode ){
        if( em.V[ (0x0F00 & opcode) >> 8 ] === em.V[ (0x00F0 & opcode) >> 4 ] ){
            em.pc += 4;
        }
        else{
            em.pc += 2;
        }
        return true;
    }
}

chip8.opcodes[0x6000] = {
    exec: function( em, opcode ){
        em.updateReg( (0x0F00 & opcode) >> 8, 0x00FF & opcode );
        em.pc += 2;
        return true;
    }
}

chip8.opcodes[0x7000] = {
    exec: function( em, opcode ){
        em.updateReg( (0x0F00 & opcode) >> 8, (em.V[ (0x0F00 & opcode) >> 8 ] + (0x00FF & opcode)) & 0x00FF );
        em.pc += 2;
        return true;
    }
}

chip8.opcodes[0x8000] = {
    sub: {
        0x0000: function( em, opcode ){
            em.updateReg( (0x0F00 & opcode) >> 8, em.V[ (0x00F0 & opcode) >> 4 ] );
            em.pc += 2;
            return true;
        },
        0x0001: function( em, opcode ){
            em.updateReg( (0x0F00 & opcode) >> 8, em.V[ (0x0F00 & opcode) >> 8 ] | em.V[ (0x00F0 & opcode) >> 4 ] );
            em.pc += 2;
            return true;
        },
        0x0002: function( em ,opcode ){
            em.updateReg( (0x0F00 & opcode) >> 8, em.V[ (0x0F00 & opcode) >> 8 ] & em.V[ (0x00F0 & opcode) >> 4 ] );
            em.pc += 2;
            return true;
        },
        0x0003: function( em ,opcode ){
            em.updateReg( (0x0F00 & opcode) >> 8, em.V[ (0x0F00 & opcode) >> 8 ] ^ em.V[ (0x00F0 & opcode) >> 4 ] );
            em.pc += 2;
            return true;
        },
        0x0004: function( em ,opcode ){
            em.updateReg( (0x0F00 & opcode) >> 8, em.V[ (0x0F00 & opcode) >> 8 ] + em.V[ (0x00F0 & opcode) >> 4 ] );
            em.updateReg( 0xF, ( em.V[ (0x0F00 & opcode) >> 8 ] & 0x100 ) >> 8 );
            em.updateReg( (0x0F00 & opcode) >> 8, em.V[ (0x0F00 & opcode) >> 8 ] & 0x00FF );
            em.pc += 2;
            return true;
        },
        0x0005: function( em ,opcode ){
            em.updateReg( (0x0F00 & opcode) >> 8, em.V[ (0x0F00 & opcode) >> 8 ] + 0x100 );
            em.updateReg( (0x0F00 & opcode) >> 8, em.V[ (0x0F00 & opcode) >> 8 ] - em.V[ (0x00F0 & opcode) >> 4 ] );
            em.updateReg( 0xF, (em.V[ (0x0F00 & opcode) >> 8 ] & 0x100) >> 8 );
            em.updateReg( (0x0F00 & opcode) >> 8, em.V[ (0x0F00 & opcode) >> 8 ] & 0x00FF );
            em.pc += 2;
            return true;
        },
        0x0006: function( em ,opcode ){
            em.updateReg( 0xF, em.V[ (0x0F00 & opcode) >> 8 ] & 0x1 );
            em.updateReg( (0x0F00 & opcode) >> 8, em.V[ (0x0F00 & opcode) >> 8 ] >> 1 );
            em.pc += 2;
            return true;
        },
        0x0007: function( em ,opcode ){
            em.updateReg( (0x00F0 & opcode) >> 4, em.V[ (0x00F0 & opcode) >> 4 ] + 0x100 );
            em.updateReg( (0x0F00 & opcode) >> 8, em.V[ (0x00F0 & opcode) >> 4 ] - em.V[ (0x0F00 & opcode) >> 8 ] );
            em.updateReg( 0xF, (em.V[ (0x00F0 & opcode) >> 4 ] & 0x100) >> 8 );
            em.updateReg( (0x00F0 & opcode) >> 4, em.V[ (0x00F0 & opcode) >> 4 ] & 0x00FF );
            em.pc += 2;
            return true;
        },
        0x000E: function( em ,opcode ){
            em.updateReg( 0xF, em.V[ (0x0F00 & opcode) >> 8 ] & 0x80 ? 0x1 : 0x0 );
            em.updateReg( (0x0F00 & opcode) >> 8, em.V[ (0x0F00 & opcode) >> 8 ] << 1 );
            em.pc += 2;
            return true;
        }
    },
    exec: function( em, opcode ){
        return this.sub[0x000F & opcode]( em, opcode );
    }
}

chip8.opcodes[0x9000] = {
    exec: function( em, opcode ){
        if( em.V[ (0x0F00 & opcode) >> 8 ] !== em.V[ (0x00F0 & opcode) >> 4 ] ){
            em.pc += 4;
        }
        else{
            em.pc += 2;
        }
        return true;
    }
}

chip8.opcodes[0xA000] = {
    exec: function( em, opcode ){
        em.I = opcode & 0x0FFF;
        em.pc += 2;
        return true;
    }
}

chip8.opcodes[0xB000] = {
    exec: function( em, opcode ){
        em.pc = (opcode & 0x0FFF) + em.V[ 0 ];
        return true;
    }
}

chip8.opcodes[0xC000] = {
    exec: function( em, opcode ){
        em.updateReg( (0x0F00 & opcode) >> 8, ( Math.random() * 0x80 ) & ( opcode & 0x00FF ) );
        em.pc += 2;
        return true;
    }
}

chip8.opcodes[0xD000] = {
    exec: function( em, opcode ){
        var X = em.V[(opcode & 0x0F00) >> 8];
        var Y = em.V[(opcode & 0x00F0) >> 4];
        var spriteHeight = opcode & 0x000F;

        em.updateReg( 0xF, 0 );
        for( var hline = 0; hline < spriteHeight; hline++ ){
            var spriteRow = em.memoryView[ em.I + hline ];
            for( var vline = 0; vline < 8; vline++ ){
                //If the sprite specifies a difference at this pixel
                if( spriteRow & (0x80 >> vline) ){
                    var pixelIndex = ((Y + hline) * 64) %( 64*32 ) + (X + vline) % 64;
                    //flip the bit
                    var bit = !em.pixels[ pixelIndex ];
                    em.pixels[ pixelIndex ] = bit;
                    //update the display
                    display.setPixel((X + vline) % 64, (Y + hline) % 32, bit?1:0);
                    //if the bit was reset, set VF
                    bit || (em.updateReg( 0xF, 1 ) );
                }
            }
        }
        display.flush( X, Y, 8, spriteHeight );
        em.pc += 2;
        return true;
    }
}

chip8.opcodes[0xE000] = {
    sub: {
        0x009E: function( em, opcode ){
            if( em.keys[ em.V[ (opcode & 0x0F00) >> 8 ] ] ){
                em.pc += 4;
            }
            else{
                em.pc += 2;
            }
            return true;
        },
        0x00A1: function( em, opcode ){
            if( !em.keys[ em.V[ (opcode & 0x0F00) >> 8 ] ] ){
                em.pc += 4;
            }
            else{
                em.pc += 2;
            }
            return true;
        }
    },
    exec: function( em, opcode ){
        return this.sub[ 0x00FF & opcode ]( em, opcode );
    }
}

chip8.opcodes[0xF000] = {
    sub: {
        0x0007: function( em, opcode ){
            em.updateReg( (0x0F00 & opcode) >> 8, em.delay_timer );
            em.pc += 2;
            return true;
        },
        0x000A: function( em, opcode ){
            em.bWaitingForKey = true;
            return true;
        },
        0x0015: function( em, opcode ){
            em.delay_timer = em.V[ (0x0F00 & opcode) >> 8 ];
            em.pc += 2;
            return true;
        },
        0x0018: function( em, opcode ){
            em.sound_timer = em.V[ (0x0F00 & opcode) >> 8 ];
            em.pc += 2;
            return true;
        },
        0x001E: function( em, opcode ){
            em.I += em.V[ (0x0F00 & opcode) >> 8 ];
            if( em.I & 0xF000 ){
                em.updateReg( 0xF, 1 );
            }
            else{
                em.updateReg( 0xF, 0 );
            }
            em.I = em.I & 0x0FFF;
            em.pc += 2;
            return true;
        },
        0x0029: function( em, opcode ){
            em.I = 0x50 + ( em.V[ (0x0F00 & opcode) >> 8 ] * 5 );
            em.pc += 2;
            return true;
        },
        0x0033: function( em, opcode ){
            var VX = em.V[(opcode & 0x0F00) >> 8]
            em.memoryView[em.I]     = Math.floor( VX / 100);
            em.memoryView[em.I + 1] = Math.floor( VX / 10) % 10;
            em.memoryView[em.I + 2] = VX % 10;
            em.pc += 2;
            return true;
        },
        0x0055: function( em, opcode ){
            X = (opcode & 0x0F00) >> 8;
            for( var i = 0; i <= X; i++ ){
                em.memoryView[em.I+i] = em.V[i];
            }
            em.pc += 2;
            return true;
        },
        0x0065: function( em, opcode ){
            X = (opcode & 0x0F00) >> 8;
            for( var i = 0; i <= X; i++ ){
                em.updateReg( i, em.memoryView[em.I+i] );
            }
            em.pc += 2;
            return true;
        },
    },
    exec: function( em, opcode ){
        return this.sub[ 0x00FF & opcode ]( em, opcode );
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
    !!this.opcodes[0xF000 & opcode] && this.opcodes[0xF000 & opcode].exec(this, opcode) || console.log("Unknown Opcode! " + opcode.toString(16));

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
    display.fill(0).flush();

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
