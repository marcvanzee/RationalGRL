/**
* Global constants.
*/

// Constants.
const _this = this;
const HEIGHT = 400;
const WIDTH = 900;
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
    interactive: {
        vertexAdd: false
    },
    linkPinning: false
});

/**
 * Global variables.
 */
let VIEW_CURRENTLY_EDDITING = null;
let CUR_INSERT_OPERATION = InsertOperation.NOTHING;
let LINE_TO_DRAG = null;
let ELEMENT_TO_CONNECT = null;