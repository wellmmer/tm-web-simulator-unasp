var ruleSet = {};

var currentState = 0;

var tape = '';

var head = 0;

var timeSpeed = null;

function drawTuringMachine() {
    if (currentState == -1) {
        line0 = '<span class="glyphicon glyphicon-map-marker" aria-hidden="true"></span><b> Estado Atual: </b>qA' + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="glyphicon glyphicon-eye-close" aria-hidden="true"></span><b> Posição do Leitor: </b>' + head + 'º';
    } else if (currentState == -2) {
        line0 = '<span class="glyphicon glyphicon-map-marker" aria-hidden="true"></span><b> Estado Atual: </b>qR' + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="glyphicon glyphicon-eye-close" aria-hidden="true"></span><b> Posição do Leitor: </b>' + head + 'º';
    } else {
        line0 = '<span class="glyphicon glyphicon-map-marker" aria-hidden="true"></span><b> Estado Atual: </b>q' + currentState + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="glyphicon glyphicon-eye-close" aria-hidden="true"></span><b> Posição do Leitor: </b>' + head + 'º';
    };

    if (currentState == -1) {
        line1 = '<span class="glyphicon glyphicon-edit" aria-hidden="true"></span><b> Resultado: </b>' + '<span class="glyphicon glyphicon-thumbs-up" aria-hidden="true"></span><font color="#449d44"><b> ACEITA</b></font>';
        stopMachine();
    } else if (currentState < -1) {
        line1 = '<span class="glyphicon glyphicon-edit" aria-hidden="true"></span><b> Resultado: </b>' + '<span class="glyphicon glyphicon-thumbs-down" aria-hidden="true"></span><font color="#c9302c"><b> REJEITA</b></font>';
        stopMachine();
    } else {
        if ((tape != '' || tape != null) && head != 0) {
            line1 = '<span class="glyphicon glyphicon-edit" aria-hidden="true"></span><b> Resultado: </b>' + '<span class="glyphicon glyphicon-search" aria-hidden="true"></span><font color="#286090"><b> ANALISANDO...</b></font>';
        } else {
            line1 = '<span class="glyphicon glyphicon-edit" aria-hidden="true"></span><b> Resultado: </b>' + '<span class="glyphicon glyphicon-hourglass" aria-hidden="true"></span><font color="#286090"><b> ...</b></font>';
        };
    };

    i = 0;
    line2 = '';
    while (i < head) {
        line2 += '&nbsp;';
        i += 1;
    };
    line2 += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="glyphicon glyphicon-eye-open" aria-hidden="true"></span>';

    line3 = '<span class="glyphicon glyphicon-barcode" aria-hidden="true"></span><b> Fita</b>: ' + tape;

    tmAnimation = document.getElementById('tmAnimation');
    tmAnimation.innerHTML = line0 + '<br><br>' + line1 + '<br><br>' + line2 + '<br>' + line3;
};

function playMachine() {
    stopMachine();
    timeSpeed = setInterval(function() {
        stepByStep();
        drawTuringMachine();
    }, 500);
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
    currentState = document.getElementById('initialState').value;
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