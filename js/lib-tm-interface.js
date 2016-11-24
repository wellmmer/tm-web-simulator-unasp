var states = 0;

function addState(n) {
    var div = document.createElement('div');
    var stateBox = document.createElement('div');
    div.setAttribute('class', 'stateBox');
    stateBox.setAttribute('id', 'stateBox-' + n + '-data');
    div.setAttribute('id', 'stateBox-' + n);

    var transTable = document.createElement('table');
    transTable.innerHTML = '<tr><td><b>Atual</b></td><td><b>></b></td><td><b>Novo</b></td><td><b>q?</b></td><td><b>{< , >}</b></td></tr>';
    stateBox.appendChild(transTable);
    transTable.setAttribute('id', 'transTable-' + n);
    transTable.setAttribute('class', 'transTable');

    div.innerHTML = '<b>Estado: </b>q' + n;
    var removeStateButton = document.createElement('button');
    removeStateButton.setAttribute('class', 'removeStateButton btn btn-red');
    removeStateButton.innerHTML = '<b>Remover Estado</b>';
    removeStateButton.onclick = function() {
        removeState(n);
        removeStateBoxElement(div);
    };

    var addTransitionButton = document.createElement('button');
    addTransitionButton.setAttribute('class', 'addTransitionButton btn btn-orange');
    addTransitionButton.innerHTML = '<b>Adicionar Transição</b>';
    addTransitionButton.onclick = function() {
        addTransition(n);
    };

    document.getElementById('stateBoxes').appendChild(div);
    div.appendChild(removeStateButton);
    div.appendChild(stateBox);
    div.appendChild(addTransitionButton);
    addTransition(n);

    if (n == states) {
        states += 1;
    };

    return stateBox;
};

function addTransition(n) {
    var transTable = document.getElementById('transTable-' + n);
    var tableRow = transTable.insertRow(-1);

    var charSeen = document.createElement('input');
    charSeen.setAttribute('class', 'dataArea');
    charSeen.onchange = limitLength(charSeen);
    charSeen.addEventListener('input', function() {
        if (!((n + '_' + charSeen.value) in ruleSet)) {
            charSeen.disabled = true;
            limitLength(charSeen);
            addRule(charSeen);
        } else {
            charSeen.value = '';
        };
    });
    tableRow.insertCell(0).appendChild(charSeen);
    tableRow.insertCell(1);

    var charNext = document.createElement('input');
    charNext.onchange = limitLength(charNext);
    charNext.addEventListener('input', function() {
        limitLength(charNext);
        addRule(charNext);
    });
    charNext.setAttribute('class', 'dataArea');
    tableRow.insertCell(2).appendChild(charNext);

    var stateNext = document.createElement('input');
    stateNext.setAttribute('class', 'dataArea');
    stateNext.addEventListener('input', function() { addRule(stateNext); });
    tableRow.insertCell(3).appendChild(stateNext);

    var dirNext = document.createElement('input');
    dirNext.setAttribute('class', 'dataArea');
    dirNext.onchange = limitLength(dirNext);
    dirNext.addEventListener('input', function() {
        limitLength(dirNext);
        addRule(dirNext);
    });
    tableRow.insertCell(4).appendChild(dirNext);

    var removeTransButton = document.createElement('button');
    removeTransButton.setAttribute('class', 'removeTransButton btn btn-red');
    removeTransButton.innerHTML = '<b>Remover</b>';
    removeTransButton.onclick = function() {
        removeRule(removeTransButton);
        removeTransitionElement(tableRow);
    };
    tableRow.insertCell(5).appendChild(removeTransButton);

    transTable.appendChild(tableRow);
    return tableRow;
};

function limitLength(element) {
    if (element.value.length > 1) {
        element.value = element.value.substring(element.value.length - 1, element.value.length);
    };
};

function addRule(ta) {
    var cells = ta.parentNode.parentNode.childNodes;
    var stateBox = ta.parentNode.parentNode.parentNode.parentNode.parentNode;
    var state = stateBox.getAttribute('id').substring(stateBox.getAttribute('id').indexOf('-') + 1);
    var charSeen = cells[0].childNodes[0].value;
    var charNext = cells[2].childNodes[0].value;
    var stateNext = cells[3].childNodes[0].value;

    if (stateNext == 'A' || stateNext == 'a') {
        stateNext = -1;
    };

    if (stateNext == 'R' || stateNext == 'r') {
        stateNext = -2;
    };

    var dirNext = cells[4].childNodes[0].value;

    ruleSet[state + "_" + charSeen] = [charNext, stateNext, dirNext];
    console.log(ruleSet);
};

function removeRule(ta) {
    var cells = ta.parentNode.parentNode.childNodes;
    var stateBox = ta.parentNode.parentNode.parentNode.parentNode.parentNode;
    var state = stateBox.getAttribute('id').substring(stateBox.getAttribute('id').indexOf('-') + 1);
    var charSeen = cells[0].childNodes[0].value.substring(0, 1);

    ruleSet.removeItem(state + '_' + charSeen);
    console.log(ruleSet);
};

function removeState(n) {
    for (var k in ruleSet) {
        if (k.substring(0, k.indexOf('_')) == n + '') {
            ruleSet.removeItem(k);
        };
    };
    console.log(ruleSet);
};

function playButton() {
    playMachine();
    drawTuringMachine();
};

function stepByStepButton() {
    stepByStep();
    drawTuringMachine();
};

function stopButton() {
    stopMachine();
    drawTuringMachine();
};

function resetButton() {
    resetMachine();
    drawTuringMachine();
};

function stateMachine() {
    state = document.getElementById('stateArea').value;
};

function removeStateBoxElement(tableRow) {
    tableRow.parentNode.removeChild(tableRow);
};

function removeTransitionElement(tableRow) {
    tableRow.parentNode.removeChild(tableRow);
};

function stateBoxUpdate(x) {
    currentState = document.getElementById('stateArea').value;
};

function tapeBoxUpdate(x) {
    tape = document.getElementById('tape').value;
};

function clearStateBoxes() {
    document.getElementById('stateBoxes').innerHTML = '';
    states = 0;
    addState(0);
};

function newMachine() {
    clearRules();
    clearStateBoxes();
    resetMachine();
    drawTuringMachine();
};

function loadMachine() {
    newMachine();
    var stateInitial = document.getElementById('tmTextCode').value;
    readMachineCoding(stateInitial);

    document.getElementById('stateArea').value = currentState;
    document.getElementById('tape').value = tape;

    populateTransitionsEditor();
    drawTuringMachine();
};

function saveMachine() {
    resetMachine();
    document.getElementById('tmTextCode').value = outputMachineCoding();
    drawTuringMachine();
};

function populateTransitionsEditor() {
    for (var k in ruleSet) {
        if (k.indexOf('_') > 0) {
            // Montando a tupla {Estado Atual, Símbolo Lido, Próximo Símbolo, Próximo Estado, Próximo Direção}
            addToState = k.substring(0, k.indexOf('_'));
            addCharSeen = k.substring(k.indexOf('_') + 1);
            addNextChar = ruleSet[k][0];
            addNextState = ruleSet[k][1];
            addNextDir = ruleSet[k][2];

            // Se não houver um elemento para receber o estado definido, criar um...
            stateBox = document.getElementById('stateBox-' + addToState);
            if (stateBox == null) {
                stateBox = addState(addToState);
            };

            // Criar uma linha para a m-configuração...
            tr = addTransition(addToState);
            tr.cells[0].childNodes[0].value = addCharSeen;
            tr.cells[2].childNodes[0].value = addNextChar;
            tr.cells[3].childNodes[0].value = addNextState;
            tr.cells[4].childNodes[0].value = addNextDir;
        };
    };
};