var romFile;

function enableFileSelection(){
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }

    document.getElementById('files').addEventListener('change', handleFileSelect, false);
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var output = [];
    file = files[0];

    var fileReader = new FileReader();

    fileReader.onload = (function(theFile) {
        return function(e) {
            romFile = new Uint8Array(e.target.result, 0);
            gameSelected();
        };
    })(file);

    fileReader.readAsArrayBuffer(file);
}

