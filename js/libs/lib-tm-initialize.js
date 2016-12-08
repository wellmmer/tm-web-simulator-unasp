window.onload = function() {
    addState(0);
    stateBox = document.getElementById('initialState');
    stateBox.onchange = stateBoxUpdate(stateBox);
    stateBox.addEventListener('input', function() {
        stateBoxUpdate(stateBox);
    });
    tapeBox = document.getElementById('tape');
    tapeBox.onchange = tapeBoxUpdate(stateBox);
    tapeBox.addEventListener('input', function() {
        tapeBoxUpdate(tapeBox);
    });
    stateBoxUpdate(stateBox);
    tapeBoxUpdate(tapeBox);
    drawTuringMachine();

    if (window.location.search != "") {
        // SetStatusMessage("Loading saved machine...");
        LoadFromCloud(window.location.search.substring(1));
        window.history.replaceState(null, "", window.location.pathname); /* Remove query string from URL */
    }
    // else {
    // 	LoadSampleProgram( 'palindrome', 'Default program', true );
    // 	SetStatusMessage( 'Load or write a Turing machine program and click Run!' );
    // }
};

$(document).ready(function() {
    $('.carousel').carousel({
        interval: false
    });
});