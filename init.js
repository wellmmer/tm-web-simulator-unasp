window.onload = function() {
    addEstado(0);

    estadoBox = document.getElementById("estadoArea");
    estadoBox.onchange = estadoBoxUpdate(estadoBox);
    estadoBox.addEventListener('input', function() {
        estadoBoxUpdate(estadoBox);
    });

    fitaBox = document.getElementById("tape");
    fitaBox.onchange = fitaBoxUpdate(estadoBox);
    fitaBox.addEventListener('input', function() {
        fitaBoxUpdate(fitaBox);
    });

    estadoBoxUpdate(estadoBox);
    fitaBoxUpdate(fitaBox);
    desenharMaquina();
};