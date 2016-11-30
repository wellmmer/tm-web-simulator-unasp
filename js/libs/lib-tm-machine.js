var ruleSet = {};

var currentState = 0;

var tape = '';

var head = 0;

var timeSpeed = null;

function drawTuringMachine() {
    if (currentState == -1) {
        line0 = '<b>Resultado: </b>' + '<font color="#008E21"><b>APROVADO!</b></font>';
        stopMachine();
    } else if (currentState < -1) {
        line0 = '<b>Resultado: </b>' + '<font color="#FE0000"><b>REJEITADO!</b></font>';
        stopMachine();
    } else line0 = '<b>Estado Atual: </b>q' + currentState + '  <b>Posição do Leitor: </b>' + head + 'º';

    i = 0;
    line1 = '';
    while (i < head) {
        line1 += '=';
        i += 1;
    }
    line1 += '@';
    line2 = tape;

    tmAnimation = document.getElementById('tmAnimation');
    tmAnimation.innerHTML = line0 + '<br><br>' + line1 + '<br>' + line2 + '<br>';
};

function playMachine() {
    stopMachine();
    timeSpeed = setInterval(function() {
        stepByStep();
        drawTuringMachine();
    }, 50);
};

function stopMachine() {
    clearInterval(timeSpeed);
};

function stepByStep() {
    // Quando ultrapassar o tamanho da string de entrada...
    while (tape.length <= head + 1) {
        tape += ' ';
    };

    // Lê o valor da célula atual da fita e guarda no array de regras...
    currentChar = tape.charAt(head);
    nextStep = ruleSet[currentState + '_' + currentChar];

    if (nextStep == null || head < 0) {
        currentState = -2;
        return;
    };

    // Atualiza o valor da célula atual lida pelo leitor da máquina...
    tape = tape.substring(0, head) + nextStep[0] + tape.substring(head + 1);

    // Usa a regra guardada para atualizar o estado atual...
    dir = nextStep[1];
    if (dir == 'a' || dir == 'A') {
        currentState = -1;
    } else if (dir == 'r' || dir == 'R') {
        currentState = -2;
    } else {
        currentState = nextStep[1];
    };

    // Atualiza a posição do leitor da máquina baseado na direção...
    if (nextStep[2] == '>') {
        head += 1;
    };

    if (nextStep[2] == '<') {
        head -= 1;
    };
};

function resetMachine() {
    currentState = document.getElementById('stateArea').value;
    tape = document.getElementById('tape').value;
    head = 0;
};

function clearRules() {
    ruleSet = {};
};

function readMachineCoding(tmTextCode) {
    currentState = tmTextCode.substring(0, tmTextCode.indexOf('\n'));
    tmTextCode = tmTextCode.substring(tmTextCode.indexOf('\n') + 1);

    tape = tmTextCode.substring(0, tmTextCode.indexOf('\n'));
    tmTextCode = tmTextCode.substring(tmTextCode.indexOf('\n') + 1);

    while (tmTextCode.length > 2) {
        var currentTransition = [];
        currentTransition.push(tmTextCode.substring(0, tmTextCode.indexOf(',')));
        tmTextCode = tmTextCode.substring(tmTextCode.indexOf(',') + 1);

        currentTransition.push(tmTextCode.substring(0, tmTextCode.indexOf(',')));
        tmTextCode = tmTextCode.substring(tmTextCode.indexOf(',') + 1);

        currentTransition.push(tmTextCode.substring(0, tmTextCode.indexOf(',')));
        tmTextCode = tmTextCode.substring(tmTextCode.indexOf(',') + 1);

        currentTransition.push(tmTextCode.substring(0, tmTextCode.indexOf(',')));
        tmTextCode = tmTextCode.substring(tmTextCode.indexOf(',') + 1);

        currentTransition.push(tmTextCode.substring(0, tmTextCode.indexOf(',')));
        tmTextCode = tmTextCode.substring(tmTextCode.indexOf(',') + 2);

        ruleSet[currentTransition[0] + '_' + currentTransition[1]] = [currentTransition[2], currentTransition[3], currentTransition[4]];
    };
};

function outputMachineCoding() {
    var aux = currentState + '\n' + tape + '\n';
    for (var k in ruleSet) {
        if (k.indexOf('_') > 0) {
            aux += k.substring(0, k.indexOf('_')) + ',';
            aux += k.substring(k.indexOf('_') + 1) + ',';
            aux += ruleSet[k][0] + ',';
            aux += ruleSet[k][1] + ',';
            aux += ruleSet[k][2] + ',\n';
        };
    };
    return aux;
};