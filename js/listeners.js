/*
 * Listeners
 */

$(document).ready(function() {

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
    const id = cell.id;
    const type = rationalGrlModel.getType(id);
    if (isElement(type)) {
        rationalGrlModel.removeElement(id);
    } else if (isLink(type)) {
        rationalGrlModel.removeLink(id);
    }
});

Paper.on('blank:pointerup', function(e, x, y) {
    // ignore clicks outside the paper
    if (!isWithinBounds(x, y) || !currentlyAddingElement()) {
        return;
    }
    let type = insertTypeToElementType(CUR_INSERT_OPERATION);
    if (type == ElementType.UNKNOWN) {
        console.log('Cannot add element: unknown insert operation.');
    } else {
        ELEMENT_DETAILS = rationalGrlModel.getElement(addNewElementAt(x, y, type, type).id);
        if (type == ElementType.ARGUMENT) {
            showArgumentDetails();
        } else {
            showElementDetails();
        }
        resetState();
    }
});

Paper.on('cell:pointerclick', function(cellView, evt, x, y) {
    const id = cellView.model.id;
    ELEMENT_DETAILS = rationalGrlModel.elementIdMap[id];
    const type = rationalGrlModel.getType(id);
    if (type == ElementType.ARGUMENT) {
        showArgumentDetails();
    } else if (isElement(type)) {
        showElementDetails();
    }
});

Paper.on('cell:pointerdown', function(cellView, evt, x, y) {
    // If we are not adding a link, do nothing and allow the element to be dragged.
    if (!currentlyAddingLink()) {
        cellView.options.interactive = true;
        return;
    }

    // if we are adding a link, don't drag the element.
    cellView.options.interactive = false;

    // If we are adding a link, but it is not allowed from the current element, do nothing.
    if (!canStartLinkFromElement(cellView.model.attributes.type)) {
        return;
    }

    const link = createLink(insertTypeToLinkType(CUR_INSERT_OPERATION));
    link.set({
                'source': { id: cellView.model.id },
                'target': { x: x, y: y },
            })
            .addTo(Paper.model);



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

    sourceView.options.interactive = true;

    const sourceId = sourceView.model.id;
    const targetId = targetView.model.id;
    const link = createLink(insertTypeToLinkType(CUR_INSERT_OPERATION));
    link.set({
                source: { id: sourceId },
                target: { id: targetId },
                'connector': { name: 'rounded', args: { radius: 10 }}

            })
            .addTo(Paper.model);

    Graph.addCells([link]);
    rationalGrlModel.addLink(link.id, CUR_INSERT_OPERATION, sourceId, targetId, link);
    LINK_DETAILS = rationalGrlModel.getLink(link.id);
    LINE_TO_DRAG.remove();
    LINE_TO_DRAG = null;
    showLinkDetails();
    resetState();
});

Paper.on('link:pointerdown', function(cellView, evt) {
    if (cellView.model.isLink()) {
        LINK_DETAILS = rationalGrlModel.getLink(cellView.model.id);
        showLinkDetails();
    }
})


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
    }
});


// disable the default browser's context menu.
$(document).on('contextmenu', function (e) {
    return false;
});

$(ELEMENT_DETAILS_DIV).on("click", ".rename-button", function() {
    if (!ELEMENT_DETAILS) {
        console.log('Cannot rename element: No element set.');
        return;
    }
    const newName = $('.element-details-container .element-name-input').val();
    if (!newName || !newName.length) {
        alert('No name set for element!');
        return;
    }
    if (newName == ELEMENT_DETAILS.getName()) return;

    rationalGrlModel.rename(ELEMENT_DETAILS.id, newName);

    setNamingHistoryDiv(ELEMENT_DETAILS);
});

$(ELEMENT_DETAILS_DIV).on("click", ".critical-question-button", function() {
    // Create a new critical question and store it in a global variable, but don't assign
    // it to the element yet. Only do this once the question has been answered.
    // Don't create a new one if an answer exists already.
    const name = this.getAttribute('name');
    if (rationalGrlModel.elementHasAnswer(ELEMENT_DETAILS.id, name)) {
        CRITICAL_QUESTION_DETAILS = rationalGrlModel.getAnswer(ELEMENT_DETAILS.id, name);
    } else {
        CRITICAL_QUESTION_DETAILS = jQuery.extend(true, {},
            questionsDatabase.getQuestionByName(name));
    }
    showCriticalQuestionDetails();
});

$(LINK_DETAILS_DIV).on("click", ".critical-question-button", function() {
    // Create a new critical question and store it in a global variable, but don't assign
    // it to the element yet. Only do this once the question has been answered.
    // Don't create a new one if an answer exists already.
    const name = this.getAttribute('name');
    if (rationalGrlModel.elementHasAnswer(LINK_DETAILS.id, name)) {
        CRITICAL_QUESTION_DETAILS = rationalGrlModel.getAnswer(LINK_DETAILS.id, name);
    } else {
        CRITICAL_QUESTION_DETAILS = jQuery.extend(true, {},
            questionsDatabase.getQuestionByName(name));
    }
    showCriticalQuestionDetails();
});

$(QUESTION_DETAILS_DIV).on("click", ".answer-button", function() {
    // If the question has already been answered with the same answer, only update explanation.
    const curDiv = $(QUESTION_DETAILS_DIV);
    const element = ELEMENT_DETAILS || LINK_DETAILS;
    const cq = CRITICAL_QUESTION_DETAILS;
    const answer = curDiv.find('.answer-selector option:selected').text();
    const explanation = curDiv.find('.explanation-input').val();
    const elementName = curDiv.find('.element-input').val();

    if (rationalGrlModel.elementHasAnswer(element.id, cq.name, answer)) {
        cq.explanation = explanation;
    }  else {
        answerCriticalQuestion(element, cq, answer, explanation, elementName);
    }
});

$(QUESTION_DETAILS_DIV).on("click", ".back-button", function() {
    if (ELEMENT_DETAILS) showElementDetails();
    else showLinkDetails();
});

$(ARGUMENT_DETAILS_DIV).on("click", ".save-button", function() {
    const argument = ELEMENT_DETAILS;
    const container = $(ARGUMENT_DETAILS_DIV);
    argument.explanation = container.find('.explanation').val();

    rationalGrlModel.rename(argument.id, container.find('.name').val());
});

$('.decomposition-type-selector').on("selectmenuchange", function() {
    if (!this.value) return;
    ELEMENT_DETAILS.decompositionType = DecompositionType[this.value];
    rationalGrlModel.changeDecompositionTypeOf(ELEMENT_DETAILS.id, this.value);
});

$('.contribution-value-selector').on("selectmenuchange", function() {
    if (!this.value) return;
    LINK_DETAILS.contributionValue = ContributionValue[this.value];
    rationalGrlModel.getView(LINK_DETAILS.id).model.prop('labels/0/attrs/text/text', LINK_DETAILS.contributionValue);
});

$('.grl-export-button').on("click", function() {
    exportToGrl();
});

$( ".decomposition-type-selector" ).selectmenu();
$( ".answer-selector" ).selectmenu();
$( ".contribution-value-selector" ).selectmenu();

$(window).resize(function() {
    var canvas = $('#paper');
    Paper.setDimensions(canvas.width(), canvas.height());
});

});
