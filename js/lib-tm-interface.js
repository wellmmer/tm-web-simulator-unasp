var states = 0;

function addState(n) {
    var div = document.createElement('div');
    var stateBox = document.createElement('div');
    div.setAttribute('class', 'stateBox');
    stateBox.setAttribute('id', 'stateBox-' + n + '-data');
    div.setAttribute('id', 'stateBox-' + n);

    var transTable = document.createElement('table');
    transTable.innerHTML = '<tr> <td><b>Valor</b></td> <td><b>></b></td> <td><b>Valor</b></td> <td><b>Estado</b></td> <td><b>{DIR,ESQ}</b></td></tr>';
    stateBox.appendChild(transTable);
    transTable.setAttribute('id', 'transTable-' + n);
    transTable.setAttribute('class', 'transTable');

    div.innerHTML = '<b>State: </b>q' + n;
    var removeState = document.createElement('button');
    removeState.setAttribute('class', 'removeStateButton btn btn-red');
    removeState.innerHTML = '<b>Remover Estado</b>';
    removeState.onclick = function() {
        removeState(n);
        removeStateBoxElement(div);
    };

    var addTransitionButton = document.createElement('button');
    addTransitionButton.setAttribute('class', 'addTransitionButton btn btn-orange');
    addTransitionButton.innerHTML = '<b>Adicionar Transição</b>';
    addTransitionButton.onclick = function() {
        addTransition(n);
    };

    var addTransitionButtonTop = document.createElement('button');
    addTransitionButtonTop.setAttribute('class', 'addTransitionButtonTop btn btn-blue');
    addTransitionButtonTop.innerHTML = '<b>Adicionar Transição</b>';
    addTransitionButtonTop.onclick = function() {
        addTransition(n);
    };

    document.getElementById('stateBoxes').appendChild(div);
    div.appendChild(removeState);
    div.appendChild(addTransitionButtonTop);
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

    var charSeen = document.createElement('textarea');
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

    var charNext = document.createElement('textarea');
    charNext.onchange = limitLength(charNext);
    charNext.addEventListener('input', function() {
        limitLength(charNext);
        addRule(charNext);
    });
    charNext.setAttribute('class', 'dataArea');
    tableRow.insertCell(2).appendChild(charNext);

    var stateNext = document.createElement('textarea');
    stateNext.setAttribute('class', 'dataArea');
    stateNext.addEventListener('input', function() { addRule(stateNext); });
    tableRow.insertCell(3).appendChild(stateNext);

    var dirNext = document.createElement('textarea');
    dirNext.setAttribute('class', 'dataArea');
    dirNext.onchange = limitLength(dirNext);
    dirNext.addEventListener('input', function() {
        limitLength(dirNext);
        addRule(dirNext);
    });
    tableRow.insertCell(4).appendChild(dirNext);

    var removeState = document.createElement('button');
    removeState.setAttribute('class', 'removeStateButton btn btn-red');
    removeState.innerHTML = '<b>Remover</b>';
    removeState.onclick = function() {
        removeRule(removeState);
        removeTransitionElement(tableRow);
    };
    tableRow.insertCell(5).appendChild(removeState);

    transTable.appendChild(tableRow);
    return tableRow;
};

function limitLength(textArea) {
    if (textArea.value.length > 1) {
        textArea.value = textArea.value.substring(textArea.value.length - 1, textArea.value.length);
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

            //TODO: Seria bom haver uma checagem para se há transições duplicadas dentro do estado...

            // Criar uma linha para a m-configuração...
            tr = addTransition(addToState);
            tr.cells[0].childNodes[0].value = addCharSeen;
            tr.cells[2].childNodes[0].value = addNextChar;
            tr.cells[3].childNodes[0].value = addNextState;
            tr.cells[4].childNodes[0].value = addNextDir;
        };
    };
};