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
    const canvas = $('#paper');
    return x > 0 && y > 0 && x < canvas.width() && y < canvas.height();
}

function nextId() { return ELEMENT_COUNTER++; }

function isArgument(type) {
    return type == ElementType.ARGUMENT;
}

function isElement(type) {
    return Object.values(ElementType).indexOf(type) > -1 && type != ElementType.UNKNOWN;
}

function isIntentionalElement(type) {
    return isElement(type) && !isArgument(type);
}

function isAttack(type) {
    return type == LinkType.ATTACK;
}

function isLink(type) {
    return Object.values(LinkType).indexOf(type) > -1 && type != LinkType.UNKNOWN;
}

function isIntentionalLink(type) {
    return isLink(type) && !isAttack(type);
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
    LINK_DETAILS = null;
    const element = ELEMENT_DETAILS;
    const detailsPane = $(ELEMENT_DETAILS_DIV);
    detailsPane.find('.element-name-input').val(element.getName());
    detailsPane.find('.element-type').html(element.type);
    const decompTypeClass = '.decomposition-type-row';
    const hasDecomposiiton = element.decompositionType;
    if (element.decompositionType) {
      const decompKey = getKeyByValue(DecompositionType, element.decompositionType);
      $('.decomposition-type-selector').val(decompKey);
      $('.decomposition-type-selector').selectmenu("refresh");
      detailsPane.find(decompTypeClass).show();
    } else {
      detailsPane.find(decompTypeClass).hide();
    }

    let criticalQuestionHtml = '<table>';
    for (const question of questionsDatabase.getQuestionsForType(element.type)) {
        const name = question.name;
        const questionReplaced = replaceQuestionForElement(question.question, element);
        if (rationalGrlModel.elementHasAnswer(element.id, name)) {
            const answer = rationalGrlModel.getAnswer(element.id, name).appliedAnswer;

            criticalQuestionHtml += '<tr><td>' + questionReplaced +
                ' <strong> (Answer: ' + answer + ')</strong></td><td><button type="button" ' +
                'class="critical-question-button ui-button ui-widget ui-corner-all" name="' +
                question.name + '">View existing answer</button></td>';
        } else {
            criticalQuestionHtml += '<tr><td>' + questionReplaced +
                '</td><td><button type="button" class="critical-question-button ui-button ui-widget ui-corner-all" name="' +
                question.name + '">Answer</button></td></tr>';
        }
    }
    criticalQuestionHtml += '</table>';
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
    if ((!ELEMENT_DETAILS && !LINK_DETAILS) || !CRITICAL_QUESTION_DETAILS) {
        console.error("Cannot show critical question details: No element or question selected");
        return;
    }
    const question = CRITICAL_QUESTION_DETAILS;
    const isAnswered = question.appliedAnswer != null;
    let element = ELEMENT_DETAILS ? ELEMENT_DETAILS : LINK_DETAILS;
    let questionReplaced = isLink(element.type) ?
                        replaceQuestionForLink(question.question, element)
                       : replaceQuestionForElement(question.question, element);
    question.question = questionReplaced;
    const detailsPane = $('.question-details-container');
    detailsPane.find('.element-name').html(element.getName());
    detailsPane.find('.critical-question').html(questionReplaced);
    detailsPane.find('.answer-selector option[value="answer-apply"]').text(question.answerApply);
    detailsPane.find('.answer-selector option[value="answer-dont-apply"]').html(question.answerDontApply);
    detailsPane.find('.explanation-input').val(question.explanation);

    const disabledValue = isAnswered ? 'disabled' : false;

    detailsPane.find('.answer-selector').selectmenu( "option", "disabled", isAnswered);
    detailsPane.find('.element-input').prop('disabled', disabledValue);
    detailsPane.find('.explanation-input').prop('disabled', disabledValue);

    const selectValue = isAnswered && question.appliedAnswer == question.answerApply? "answer-apply" : "answer-dont-apply";
    detailsPane.find('.answer-selector').val(selectValue);
    detailsPane.find('.answer-selector').selectmenu("refresh");

    if (isAnswered) {
        detailsPane.find('.answer-button').hide();
    } else {
        detailsPane.find('.answer-button').show();
    }

    if (isLink(element.type)) {
        detailsPane.find('.element-container').show();
        detailsPane.find('.element-input').val(question.addedElement);
    } else {
        detailsPane.find('.element-container').hide();
    }
    showDetailsDiv(QUESTION_DETAILS_DIV);
}

function answerCriticalQuestion(element, question, answer, explanation, elementName) {
    if ((!ELEMENT_DETAILS && !LINK_DETAILS) || !CRITICAL_QUESTION_DETAILS) {
        console.error("Cannot answer critical question: No element or question selected");
        return;
    }
    if (question.appliedAnswer == answer) return;
    if ((question.effect == CriticalQuestionEffect.INTRO_SOURCE || question.effect == CriticalQuestionEffect.INTRO_DEST) &&
        !elementName && answer != question.answerDontApply) {
      alert("Please enter an element name");
      return;
    }

    question.explanation = explanation;
    rationalGrlModel.answerQuestion(element.id, question, answer, elementName);

    if (answer != question.answerDontApply) {
        switch (question.effect) {
            case CriticalQuestionEffect.DISABLE:
              applyDisableEffect();
              break;
            case CriticalQuestionEffect.INTRO_SOURCE:
              applyIntroEffect(question.effect, elementName);
              break;
            case CriticalQuestionEffect.INTRO_DEST:
              applyIntroEffect(question.effect, elementName);
              break;
        }
    }
    CRITICAL_QUESTION_DETAILS = null;
    if (ELEMENT_DETAILS) showElementDetails();
    else showLinkDetails();
}

function applyDisableEffect() {
    const element = ELEMENT_DETAILS;
    const view = rationalGrlModel.getView(element.id);
    const position = view.model.attributes.position;
    const argument = addNewElementAt(position.x + 50, position.y + 80,
                    ElementType.ARGUMENT, CRITICAL_QUESTION_DETAILS.name);
    rationalGrlModel.getElement(argument.id).explanation = CRITICAL_QUESTION_DETAILS.explanation;

    const link = createLink(LinkType.ATTACK);
    link.set({
        source: { id: argument.id },
        target: { id: element.id },
    });
    Graph.addCells([link]);

    rationalGrlModel.addLink(link.id, LinkType.ATTACK, argument.id, element.id, link);
    rationalGrlModel.linkArgumentToQuestion(argument.id, CRITICAL_QUESTION_DETAILS);
}

function applyIntroEffect(effect, elementName) {
    if ((effect != CriticalQuestionEffect.INTRO_SOURCE && effect != CriticalQuestionEffect.INTRO_DEST) ||
        !LINK_DETAILS || !elementName) {
      console.error("Can only apply intro effect when link and element name are set.");
      return;
    }
    const addSrc = (effect == CriticalQuestionEffect.INTRO_SOURCE);
    const link = LINK_DETAILS;

    const view = rationalGrlModel.getView(addSrc ? link.fromId : link.toId);
    const position = view.model.attributes.position;
    const newElement = addNewElementAt(position.x + 50, position.y + 80,
                    getType(view.model), elementName);

    const newLink = createLink(link.type);
    const newFromId = addSrc ? newElement.id : link.fromId;
    const newToId = addSrc ? link.toId : newElement.id;
    newLink.set({
        source: { id: newFromId },
        target: { id: newToId },
    });
    Graph.addCells([newLink]);

    rationalGrlModel.addLink(newLink.id, link.type, newFromId, newToId, newLink);
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
    const canvas = $('#paper');
    newGraphElement.position(Math.min(Math.max(0,x), canvas.width()-ELEMENT_WIDTH), 
                             Math.min(Math.max(0,y), canvas.height()-ELEMENT_HEIGHT));
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
    LINK_DETAILS = null;
    const argument = ELEMENT_DETAILS;
    const detailsPane = $(ARGUMENT_DETAILS_DIV);
    detailsPane.find('.name').val(argument.name);
    detailsPane.find('.explanation').val(argument.explanation);
    const questionHtml = detailsPane.find('.critical-question');

    const question = rationalGrlModel.getCriticalQuestionForArgument(argument.id);

    detailsPane.find('.explanation').prop("disabled", (question ? "disabled" : false));
    detailsPane.find('.critical-question').html(question ? question.question : "(None)");
    showDetailsDiv(ARGUMENT_DETAILS_DIV);
}

function showLinkDetails() {
    if (!LINK_DETAILS) {
        console.error("Cannot show link details: no link selected");
    }
    ELEMENT_DETAILS = null;
    const link = LINK_DETAILS;
    const detailsPane = $(LINK_DETAILS_DIV);
    const contrClass = '.contribution-value-row';
    detailsPane.find('.title').html('Link details (' + link.type + ')');
    detailsPane.find('.source').html(rationalGrlModel.getElement(link.fromId).getName());
    detailsPane.find('.target').html(rationalGrlModel.getElement(link.toId).getName());
    detailsPane.find(contrClass).hide();
    if (link.type == LinkType.CONTRIBUTION) {
        const contrKey = getKeyByValue(ContributionValue, link.contributionValue);
        $('.contribution-value-selector').val(contrKey).selectmenu("refresh");
        detailsPane.find(contrClass).show();
    }
    let criticalQuestionHtml = '<table>';
    for (const question of questionsDatabase.getQuestionsForType(link.type)) {
        const name = question.name;
        const srcType = rationalGrlModel.getElement(link.fromId).type.toLowerCase();
        const destType = rationalGrlModel.getElement(link.toId).type.toLowerCase();
        const questionReplaced = question.question.replace("#1", srcType).replace("#2", destType);
        if (rationalGrlModel.elementHasAnswer(link.id, name)) {
            const answer = rationalGrlModel.getAnswer(link.id, name).appliedAnswer;

            criticalQuestionHtml += '<tr><td>' + questionReplaced +
                ' <strong> (Answer: ' + answer + ')</strong></td><td><button type="button" ' +
                'class="critical-question-button ui-button ui-widget ui-corner-all" name="' +
                question.name + '">View existing answer</button></td></tr>';
        } else {
            criticalQuestionHtml += '<tr><td>' + questionReplaced +
                '</td><td><button type="button" class="critical-question-button ui-button ui-widget ui-corner-all" name="' +
                question.name + '">Answer</button></td></tr>';
        }
    }
    criticalQuestionHtml += '</table>';
    detailsPane.find('.critical-questions').html(criticalQuestionHtml || 'No questions found');

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

function replaceQuestionForLink(str, link) {
  if (!isLink(link.type)) {
    console.error("Cannot replace question for link: ", link, "is not a link");
    return '';
  }
  const srcType = rationalGrlModel.getElement(link.fromId).type.toLowerCase();
  const destType = rationalGrlModel.getElement(link.toId).type.toLowerCase();
  return str.replace("#1", srcType).replace("#2", destType);
}

function replaceQuestionForElement(str, element) {
  if (!isElement(element.type)) {
    console.error("Cannot replace question for element: ", element, "is not an element");
    return '';
  }
  return str.replace("#1", element.type.toLowerCase());
}
