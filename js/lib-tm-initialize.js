window.onload = function() {
    addState(0);

    stateBox = document.getElementById('stateArea');
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
};