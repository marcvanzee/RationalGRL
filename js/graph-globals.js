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

const DISABLE_COLOR = '#AAAAAA';
const ENABLE_COLOR = '#000000';
const OUT_COLOR = '#f54242';

const ELEMENT_WIDTH = 120;
const ELEMENT_HEIGHT = 40;

const ElementType = {
  SOFTGOAL: 'Softgoal',
  GOAL: 'Goal',
  TASK: 'Task',
  RESOURCE: 'Resource',
  ARGUMENT: 'Argument',
  UNKNOWN: 'Unknown',
};

const LinkType = {
  CONTRIBUTION: 'Contribution',
  DECOMPOSITION: 'Decomposition',
  DEPENDENCY: 'Dependency',
  ATTACK: 'Attack',
  UNKNOWN: 'Unknown',
};

const DecompositionType = {
  AND: "and",
  OR: "or",
  XOR: "xor",
};

const ContributionValue = {
  BREAK: "Break (---)",
  SOME_NEGATIVE: "Some negative (--)",
  HURT: "Hurt (-)",
  UNKNOWN: "Unknown",
  HELP: "Help (+)",
  SOME_POSITIVE: "Some positive (++)",
  MAKE: "Make (+++)",
};

const ElementAcceptStatus = {
  IN: 'Accepted',
  OUT: 'Rejected',
  UNDECIDED: 'Undecided',
};

const CriticalQuestionEffect = {
  INTRO_SOURCE: 'Intro Source',
  INTRO_DEST: 'Intro Dest',
  INTRO_LINK: 'Intro Link',
  DISABLE: 'Disable',
};