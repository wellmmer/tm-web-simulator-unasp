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

    /* Alessio Atzeni - Simple Tooltip w/ jQuery Only Text */

    /* Fonte: http://www.alessioatzeni.com/blog/simple-tooltip-with-jquery-only-text/ */
    $('.masterTooltip').hover(function() {
        /* Flutuar sobre o elemento */
        var title = $(this).attr('title');
        $(this).data('tipText', title).removeAttr('title');
        $('<p class="tooltip"></p>')
            .text(title)
            .appendTo('body')
            .fadeIn('slow');
    }, function() {
        /* Flutuar fora no elemento */
        $(this).attr('title', $(this).data('tipText'));
        $('.tooltip').remove();
    }).mousemove(function(e) {
        var mousex = e.pageX + 20; /* Obtém X coordinates */
        var mousey = e.pageY + 10; /* Obtém Y coordinates */
        $('.tooltip')
            .css({ top: mousey, left: mousex })
    });
});