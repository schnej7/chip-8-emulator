//var romFile;

function enableFileSelection(){
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }

    document.getElementById('files').onchange = handleFileSelect;
};

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    var file = files[0];

    var fileReader = new FileReader();

    fileReader.onload = (function(theFile) {
        return function(e) {
            var romFile = new Uint8Array(e.target.result, 0);
            chip8.loadGame( romFile );
        };
    })(file);

    fileReader.readAsArrayBuffer(file);
};

function populateDropdown(){
    var gamesDropdown = document.getElementById('games');
    for( var game in roms ){
        var option = document.createElement('option');
        option.text = game;
        option.value = game;
        gamesDropdown.add( option, null );
    }
    gamesDropdown.onchange = function(){
        chip8.loadGame( atob( roms[gamesDropdown.value] ) );
    };
};
