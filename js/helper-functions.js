/**
 * Helper functions
 */

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

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

function isGraphIE(element) {
    return element == 'tm.Task' || element == 'tm.Goal' || element == 'tm.Resource' || element == 'tm.Softgoal';
}

function isGraphArgument(element) {
    return element == 'tm.Argument';
}

function isGraphElement(element) {
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
    if (currentlyAddingAttack() && isGraphArgument(element)) return true;
    if (currentlyAddingIELink() && isGraphIE(element)) return true;
    return false;
}

function canEndLinkAtElement(element) {
    if (currentlyAddingAttack() && (isGraphArgument(element) || isGraphIE(element))) return true;
    if (currentlyAddingIELink() && isGraphIE(element)) return true;
    return false;
}

function isWithinBounds(x, y) {
    return x > 0 && y > 0 && x < WIDTH && y < HEIGHT;
}

function nextId() { return ELEMENT_COUNTER++; }

function isArgument(type) { 
    return type == ElementType.ARGUMENT;
}

function isElement(type) { 
    return Object.values(ElementType).indexOf(type) > -1 && type != ElementType.UNKNOWN;
}

function isAttack(type) {
    return type = LinkType.ATTACK;
}

function isLink(type) { 
    return Object.values(LinkType).indexOf(type) > -1 && LinkType.UNKNOWN;
}

function getType(graphElement) {
    if (!graphElement || !graphElement.attributes) return ElementType.UNKNOWN;
    switch (graphElement.attributes.type) {
        case 'tm.Contribution': return LinkType.CONTRIBUTION;
        case 'tm.Decomposition': return LinkType.DECOMPOSITION;
        case 'tm.Dependency': return LinkType.DEPENDENCY;
        case 'tm.Attack': return LinkType.ATTACK;
        case 'tm.Softgoal': return ElementType.SOFTGOAL;
        case 'tm.Goal': return ElementType.GOAL;
        case 'tm.Task': return ElementType.TASK;
        case 'tm.Resource': return ElementType.RESOURCE;
        case 'tm.Argument': return ElementType.ARGUMENT;
        default: return ElementType.UNKNOWN;
    }
}

function insertTypeToLinkType(type) {
    switch (type) {
        case InsertOperation.CONTRIBUTION: return LinkType.CONTRIBUTION;
        case InsertOperation.DEPENDENCY: return LinkType.DEPENDENCY;
        case InsertOperation.DECOMPOSITION: return LinkType.DECOMPOSITION;
        case InsertOperation.ATTACK: return LinkType.ATTACK;
        default: return LinkType.UNKNOWN;
    }
}

function insertTypeToElementType(type) {
    switch (type) {
        case InsertOperation.SOFTGOAL: return ElementType.SOFTGOAL;
        case InsertOperation.GOAL: return ElementType.GOAL;
        case InsertOperation.TASK: return ElementType.TASK;
        case InsertOperation.RESOURCE: return ElementType.RESOURCE;
        case InsertOperation.ARGUMENT: return ElementType.ARGUMENT;
        default: return ElementType.UNKNOWN;
    }
}

function showElementDetails() {
    if (!ELEMENT_DETAILS) {
        console.error("Cannot show element details: No element selected");
        return;
    }
    const element = ELEMENT_DETAILS;
    const detailsPane = $(ELEMENT_DETAILS_DIV);
    detailsPane.find('.element-name-input').val(element.getName());
    detailsPane.find('.element-type').html(element.type);
    let criticalQuestionHtml = '';
    for (const question of questionsDatabase.getQuestionsForType(element.type)) {
        const name = question.name;
        if (rationalGrlModel.elementHasAnswer(element.id, name)) {
            criticalQuestionHtml += '' + question.question + 
                ' <strong> (Answered)</strong> <button type="button" class="critical-question-button" name="' + 
                question.name + '">View existing answer</button><br>';
        } else {
            criticalQuestionHtml += '' + question.question + 
                ' <button type="button" class="critical-question-button" name="' + 
                question.name + '">Answer</button><br>';
        }
    }
    detailsPane.find('.critical-questions').html(criticalQuestionHtml || 'No questions found');
    setNamingHistoryDiv(element);
    showDetailsDiv(ELEMENT_DETAILS_DIV);
}

function hideAllDetailsDivs() {
    [ELEMENT_DETAILS_DIV, QUESTION_DETAILS_DIV, ARGUMENT_DETAILS_DIV, LINK_DETAILS_DIV].forEach(div => {
        $(div).hide();
    });
}

function showDetailsDiv(divElement) {
    hideAllDetailsDivs();
    $(divElement).show();
}

function setNamingHistoryDiv(element) {
    $('.element-details-container .naming-history').html(element.names.join(' > '));
}

function showCriticalQuestionDetails() {
    if (!ELEMENT_DETAILS || !CRITICAL_QUESTION_DETAILS) {
        console.error("Cannot show critical question details: No element or question selected");
        return;
    }
    const element = ELEMENT_DETAILS;
    const question = CRITICAL_QUESTION_DETAILS;
    const detailsPane = $('.question-details-container');
    detailsPane.find('.element-name').html(element.getName());
    detailsPane.find('.critical-question').html(question.question);
    detailsPane.find('.answer').html(question.answer);
    detailsPane.find('.explanation-input').val(question.explanation);
    showDetailsDiv(QUESTION_DETAILS_DIV);
}

function answerCriticalQuestion() {
    if (!ELEMENT_DETAILS || !CRITICAL_QUESTION_DETAILS) {
        console.error("Cannot answer critical question: No element or question selected");
        return;
    }
    const element = ELEMENT_DETAILS;
    const question = CRITICAL_QUESTION_DETAILS;
    question.explanation = $('.question-details-container .explanation-input').val();
    rationalGrlModel.answerQuestion(element.id, question);

    switch (question.effect) {
        case CriticalQuestionEffect.DISABLE:
          applyDisableEffect();
          break;
        case CriticalQuestionEffect.INTRO_SOURCE:
          console.error("Intro source effect is not yet supported");
          break;
        case CriticalQuestionEffect.INTRO_DEST:
          console.error("Intro dest effect is not yet supported");
          break;
    }
    CRITICAL_QUESTION_DETAILS = null;
    showElementDetails();
}

function applyDisableEffect() {
    const element = ELEMENT_DETAILS;
    const view = rationalGrlModel.getView(element.id);
    const position = view.model.attributes.position;
    const argument = addNewElementAt(position.x + 100, position.y + 150, 
                    ElementType.ARGUMENT, CRITICAL_QUESTION_DETAILS.name);

    const link = createLink(LinkType.ATTACK);
    link.set({
        source: { id: argument.id },
        target: { id: element.id },
    });
    Graph.addCells([link]);

    rationalGrlModel.addLink(link.id, InsertOperation.ATTACK, argument.id, element.id, link);
    rationalGrlModel.linkArgumentToQuestion(argument.id, CRITICAL_QUESTION_DETAILS.name);
}

function addNewElementAt(x, y, type, name) {
    var newGraphElement;

    switch (type) {
        case ElementType.SOFTGOAL:
            newGraphElement = new joint.shapes.tm.Softgoal;
            break;
        case ElementType.GOAL:
            newGraphElement = new joint.shapes.tm.Goal;
            break;
        case ElementType.TASK:
            newGraphElement = new joint.shapes.tm.Task;
            break;
        case ElementType.RESOURCE:
            newGraphElement = new joint.shapes.tm.Resource;
            break;
        case ElementType.ARGUMENT:
            newGraphElement = new joint.shapes.tm.Argument;
    }
    newGraphElement.position(Math.max(0,x-50), Math.max(0,y-30));
    Graph.addCells([newGraphElement]);
    rationalGrlModel.addElement(newGraphElement, name);

    return newGraphElement;
}

// We don't have a function to add the link, since links may be added
// in various way (e.g., by connecting two elements or to a specific (x,y)
// location).
function createLink(type) {
    switch (type) {
        case LinkType.CONTRIBUTION: return new joint.shapes.tm.Contribution;
        case LinkType.DECOMPOSITION: return new joint.shapes.tm.Decomposition;
        case LinkType.DEPENDENCY: return new joint.shapes.tm.Dependency;
        case LinkType.ATTACK: return new joint.shapes.tm.Attack;
        default: 
            console.error('Cannot create link: unknown type', type);
            return null;
    }
}

function showArgumentDetails() {
    if (!ELEMENT_DETAILS || 
            rationalGrlModel.getType(ELEMENT_DETAILS.id) != ElementType.ARGUMENT) {
        console.error("Cannot show argument details: No element selected");
        return;
    }
    const argument = ELEMENT_DETAILS;
    const detailsPane = $(ARGUMENT_DETAILS_DIV);
    detailsPane.find('.name').val(argument.name);
    detailsPane.find('.explanation').val(argument.explanation);
    const questionHtml = detailsPane.find('.critical-question');

    const questionName = rationalGrlModel.getCriticalQuestionForArgument(argument.id);
    if (!questionName) {
        questionHtml.html('(None)');
    } else {
        const question = questionsDatabase.getQuestionByName(questionName);
        questionHtml.html(question.question + ' (' + question.name + ')');
    } 
    showDetailsDiv(ARGUMENT_DETAILS_DIV);
}

function showLinkDetails() {
    if (!LINK_DETAILS) {
        console.error("Cannot show link details: no link selected");
    }
    const link = LINK_DETAILS;
    const detailsPane = $(LINK_DETAILS_DIV);
    const decompTypeClass = '.decomposition-type-row';
    const contrClass = '.contribution-value-row';
    detailsPane.find('.title').html('Link details (' + link.type + ')');
    detailsPane.find('.source').html(rationalGrlModel.getElement(link.fromId).getName());
    detailsPane.find('.target').html(rationalGrlModel.getElement(link.toId).getName());
    detailsPane.find(contrClass).hide();
    detailsPane.find(decompTypeClass).hide();
    switch (link.type) {
      case LinkType.CONTRIBUTION:
        const contrKey = getKeyByValue(ContributionValue, link.contributionValue);
        $('.contribution-value-selector').val(contrKey).change();
        detailsPane.find(contrClass).show();
        break;
      case LinkType.DECOMPOSITION:
        const decompKey = getKeyByValue(DecompositionType, link.decompositionType);
        $('.decomposition-type-selector').val(decompKey).change();
        detailsPane.find(decompTypeClass).show();
        break;
    }
    showDetailsDiv(LINK_DETAILS_DIV);
}

function defaultLinkMarkup() {
    return [
            '<path class="connection" stroke="black" d="M 0 0 0 0"/>',
            '<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
            '<path class="marker-target" fill="black" stroke="black" d="M 0 0 0 0"/>',
            '<path class="connection-wrap" d="M 0 0 0 0"/>',
            '<g class="labels"/>',
            '<g class="marker-vertices"/>',
            '<g class="link-tools"/>'
        ].join('')
}