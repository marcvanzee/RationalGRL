/**
* Global constants.
*/

// Constants.
const _this = this;
const HEIGHT = screen.height - 400;
const WIDTH = screen.width - 115;
const GRID_SIZE = 1;

const InsertOperation = {
    SOFTGOAL: 'Softgoal',
    GOAL: 'Goal',
    TASK: 'Task',
    RESOURCE: 'Resource',
    ARGUMENT: 'Argument',

    CONTRIBUTION: 'Contribution',
    DECOMPOSITION: 'Decomposition',
    DEPENDENCY: 'Dependency',
    ATTACK: 'Attack',

    NOTHING: 'Nothing'
};

// Aliases.
const Graph = new joint.dia.Graph;
const Paper = new joint.dia.Paper({
    el: $('#paper'),
    model: Graph,
    gridSize: GRID_SIZE,
    height: HEIGHT,
    width: WIDTH,
    linkPinning: false,
});

/**
 * Global variables.
 */
let VIEW_CURRENTLY_EDDITING = null;
let CUR_INSERT_OPERATION = InsertOperation.NOTHING;
let LINE_TO_DRAG = null;
let ELEMENT_TO_CONNECT = null;
let ELEMENT_DETAILS = null;
let LINK_DETAILS = null;
let CRITICAL_QUESTION_DETAILS = null;

let ELEMENT_DETAILS_DIV = '.element-details-container';
let QUESTION_DETAILS_DIV = '.question-details-container';
let LINK_DETAILS_DIV = '.link-details-container';
let ARGUMENT_DETAILS_DIV = '.argument-details-container';