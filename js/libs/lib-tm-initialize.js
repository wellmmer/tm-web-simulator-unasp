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
};

$(document).ready(function() {
    $('#owl-demo').owlCarousel({
        navigation: true, // Show next and prev buttons
        slideSpeed: 300,
        paginationSpeed: 400,
        singleItem: true
            // "singleItem:true" is a shortcut for:
            // items : 1, 
            // itemsDesktop : false,
            // itemsDesktopSmall : false,
            // itemsTablet: false,
            // itemsMobile : false
    });
});