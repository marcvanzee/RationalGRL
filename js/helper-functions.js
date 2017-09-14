/**
 * Helper functions
 */

function currentlyAddingIE() {
    const insertOp = CUR_INSERT_OPERATION;
    return insertOp == InsertOperation.SOFTGOAL ||
            insertOp == InsertOperation.GOAL ||
            insertOp == InsertOperation.TASK || 
            insertOp == InsertOperation.RESOURCE ||
            insertOp == InsertOperation.ACTOR;
}

function currentlyAddingArgument() {
    return CUR_INSERT_OPERATION == InsertOperation.ARGUMENT;
}

function currentlyAddingElement() {
    return currentlyAddingIE() || currentlyAddingArgument();
}

function currentlyAddingIELink() {
    const insertOp = CUR_INSERT_OPERATION;
    return insertOp == InsertOperation.CONTRIBUTION ||
            insertOp == InsertOperation.DECOMPOSITION ||
            insertOp == InsertOperation.DEPENDENCY;
}

function currentlyAddingAttack() {
    return CUR_INSERT_OPERATION == InsertOperation.ATTACK;
}

function currentlyAddingLink() {
    return currentlyAddingIELink() || currentlyAddingAttack();
}

function isIE(element) {
    return element == 'tm.Task' || element == 'tm.Goal' || element == 'tm.Resource' || element == 'tm.Softgoal';
}

function isArgument(element) {
    return element == 'tm.Argument';
}

function isElement(element) {
    return isIE(element) || isArgument(element);
}

function resetState() {
    $('body').css('cursor', 'default');
    CUR_INSERT_OPERATION = InsertOperation.NOTHING;
    ELEMENT_TO_CONNECT = null;
    $('.sidebarElement').each(function(i, obj) {
        $(this).css('border', '0');
    });
    if (LINE_TO_DRAG != null) {
        LINE_TO_DRAG.remove();
    }
}

function linkExists(el1, el2) {
    if (el1 == null || el2 == null) { return false; }
    var links = Graph.getConnectedLinks(el1.model);
    
    var returnValue = false;
    _.each(links, function(link) {
        if (link.get('source').id == el2.model.id || link.get('target').id == el2.model.id) {
            returnValue = true;
        }
    });
    return returnValue;
}

function isRightClick(event) {
    var rightclick;
    if (!event) var event = window.event;
    if (event.which) rightclick = (event.which == 3);
    else if (event.button) rightclick = (event.button == 2);
    return rightclick;
}

function hasDecomposition(model) {
    var links = Graph.getConnectedLinks(model, { outbound: true });
    var hasDecomposiiton = false;
    _.each(links, function(link) {
        if (link instanceof joint.shapes.tm.Decomposition) {
            hasDecomposiiton = true;
        }
    });
    return hasDecomposiiton;
}

function canStartLinkFromElement(element) {
    if (currentlyAddingAttack() && isArgument(element)) return true;
    if (currentlyAddingIELink() && isIE(element)) return true;
    return false;
}

function canEndLinkAtElement(element) {
    if (currentlyAddingAttack() && (isArgument(element) || isIE(element))) return true;
    if (currentlyAddingIELink() && isIE(element)) return true;
    return false;
}

function isWithinBounds(x, y) {
    return x > 0 && y > 0 && x < WIDTH && y < HEIGHT;
}