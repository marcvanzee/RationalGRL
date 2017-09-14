/*
 * Listeners
 */

$('.sidebarElement').on('click', function(e) {
    $('body').css('cursor', 'crosshair');
    $('.sidebarElement').each(function(i, obj) {
        $(this).css('border', '0');
    });
    $(this).css('border', '1px solid red');
});

$('#softgoal').on('click', function(e){ CUR_INSERT_OPERATION = InsertOperation.SOFTGOAL; });
$('#goal').on('click', function(e){ CUR_INSERT_OPERATION = InsertOperation.GOAL; });
$('#task').on('click', function(e){ CUR_INSERT_OPERATION = InsertOperation.TASK; });
$('#resource').on('click', function(e){ CUR_INSERT_OPERATION = InsertOperation.RESOURCE; });
$('#argument').on('click', function(e){ CUR_INSERT_OPERATION = InsertOperation.ARGUMENT; });
$('#contribution').on('click', function(e){ CUR_INSERT_OPERATION = InsertOperation.CONTRIBUTION; });
$('#decomposition').on('click', function(e){ CUR_INSERT_OPERATION = InsertOperation.DECOMPOSITION; });
$('#dependency').on('click', function(e){ CUR_INSERT_OPERATION = InsertOperation.DEPENDENCY; });
$('#attack').on('click', function(e){ CUR_INSERT_OPERATION = InsertOperation.ATTACK; });

Graph.on('remove', function(cell, collection, opt) {
    if (cell instanceof joint.shapes.tm.Decomposition) {
      _.each(Graph.getElements(), function(el) {
        if (el instanceof joint.shapes.basic.Generic) {
            if (!_this.hasDecomposition(el)) {
                Paper.findViewByModel(el).setDecomposition('');
            }
        }
     });
    }
});

Paper.on('blank:pointerup', function(e, x, y) {
    // ignore clicks outside the paper
    if (!isWithinBounds(x, y) || !currentlyAddingElement()) {
        return;
    }
    var newElement;

    switch (CUR_INSERT_OPERATION) {
        case InsertOperation.SOFTGOAL:
            newElement = new joint.shapes.tm.Softgoal;
            break;
        case InsertOperation.GOAL:
            newElement = new joint.shapes.tm.Goal;
            break;
        case InsertOperation.TASK:
            newElement = new joint.shapes.tm.Task;
            break;
        case InsertOperation.RESOURCE:
            newElement = new joint.shapes.tm.Resource;
            break;
        case InsertOperation.ARGUMENT:
            newElement = new joint.shapes.tm.Argument;
            
    }
    newElement.position(Math.max(0,x-50), Math.max(0,y-30));
    Graph.addCells([newElement]);
    var newElementView = Paper.findViewByModel(newElement);
    newElementView.setLabel(CUR_INSERT_OPERATION + (ELEMENT_COUNTER++));

    resetState();
});

Paper.on('cell:pointerdblclick', function(cellView, evt, x, y) {
    console.log(cellView);
    $('#name').val(cellView.getLabel());
    $('#type').html(cellView.model.attributes.type);
    $('#details-pane').show();

});

Paper.on('cell:pointerdown', function(cellView, evt, x, y) {
    // If we are not adding a link, do nothing and allow the element to be dragged.
    if (!currentlyAddingLink()) return;

    // if we are adding a link, don't drag the element.
    cellView.options.interactive = false;

    // If we are adding a link, but it is not allowed from the current element, do nothing.
    if (!canStartLinkFromElement(cellView.model.attributes.type)) {
        return;
    }

    var link;
    switch (CUR_INSERT_OPERATION) {
        case InsertOperation.CONTRIBUTION: 
            link = new joint.shapes.tm.Contribution;
            break;
        case InsertOperation.DECOMPOSITION: 
            link = new joint.shapes.tm.Decomposition;
            break;
        case InsertOperation.DEPENDENCY:
            link = new joint.shapes.tm.Dependency;
            break;
        case InsertOperation.ATTACK:
            link = new joint.shapes.tm.Attack;

    }
    link.set({
                'source': { id: cellView.model.id },
                'target': { x: x, y: y }
            })
            .addTo(this.model);

    var linkView = link.findView(this);

    LINE_TO_DRAG = link;
    ELEMENT_TO_CONNECT = cellView;

    // initiate the linkView arrowhead movement
    linkView.startArrowheadMove('target');

    $(document).on({
        'mousemove.example': onDrag,
        'mouseup.example': onDragEnd
    }, {
        // shared data between listeners
        view: linkView,
        paper: this
    });

    function onDrag(evt) {
        // transform client to paper coordinates
        var p = evt.data.paper.snapToGrid({
            x: evt.clientX,
            y: evt.clientY
        });
        // manually execute the linkView mousemove handler
        evt.data.view.pointermove(evt, p.x, p.y);
    }

    function onDragEnd(evt) {
        $(document).off('.example');
    }
    
});

Paper.on('cell:pointerup', function(cellView, evt, x, y) {
    // Only do something if we are connecting an element with a link.
    if (!ELEMENT_TO_CONNECT || !LINE_TO_DRAG) return;

    var targetView = Paper.findViewsFromPoint({x: x, y: y})[0];
    var sourceView = ELEMENT_TO_CONNECT;

    if (!targetView || sourceView == targetView || linkExists(targetView, sourceView) ||
        !canEndLinkAtElement(targetView.model.attributes.type)) {
        _this.resetState();
        return;
    }
    if (CUR_INSERT_OPERATION == CUR_INSERT_OPERATION.DECOMPOSITION &&
        !hasDecomposition(sourceView.model)) {
         sourceView.setDecomposition('and');
    }
    sourceView.options.interactive = true;

    LINE_TO_DRAG.set({
            'target': { id: targetView.model.id }
    });
    LINE_TO_DRAG = null; // don't delete it
    resetState();
});

Paper.on('cell:pointermove', function (cellView, evt, x, y) {
    const bbox = cellView.getBBox();
    var constrained = false;

    var constrainedX = x;

    if (bbox.x <= 0) { constrainedX = x + GRID_SIZE; constrained = true }
    if (bbox.x + bbox.width >= WIDTH) { constrainedX = x - GRID_SIZE; constrained = true }

    var constrainedY = y;

    if (bbox.y <= 0) {  constrainedY = y + GRID_SIZE; constrained = true }
    if (bbox.y + bbox.height >= HEIGHT) { constrainedY = y - GRID_SIZE; constrained = true }

    //if you fire the event all the time you get a stack overflow
    if (constrained) { 
        cellView.pointermove(evt, constrainedX, constrainedY);
        cellView.setLabel('test'); 
    }
});


// disable the default browser's context menu.
$(document).on('contextmenu', function (e) {
    return false;
});