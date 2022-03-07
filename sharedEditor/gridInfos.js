// Constants for grids (saving + input)
// Used only in editor

const GRID_ID = {
    NUMBER_REGION: 'NR',
    NUMBER_SPACE: 'NS',
    DIGIT_X_SPACE: 'DXS',
    NUMBER_X_SPACE: 'NXS',
    DIGIT_QUESTION_SPACE: 'DQS',
    PEARL: 'P',
	YAJILIN_LIKE: 'YAJILIN', 
	YAJILIN_BLACK_WHITE: 'YAJBW', 
	TAPA: 'TAPA',
	SUDOKU: {
		CLASSIC_9x9 : 'SUDO9'
	},
	PLAYSTATION_SHAPES: 'PSH',
	GALAXIES: 'GAL',
	MOONSUN: 'MS',
	YAGIT: 'YG',
	KNOTS: 'KNOTS',
	OX: 'OX',
	WILDCARD: 'WILD',
	NUMBER_BLACK_WHITE: 'NBW'
}

const GRID_TRANSFORMATION = {
	ROTATE_CW : "RCW",
	ROTATE_CCW : "RCCW",
	ROTATE_UTURN : "RUT",
	MIRROR_HORIZONTAL : "MH",
	MIRROR_VERTICAL : "MV",
	RESIZE : "Rs"
}



function correspondsToSquarePuzzle(p_puzzleKind) {	
	return p_puzzleKind.squareGrid; // Note : may be undefined, but typically used in boolean context (if (...))
}

// Note : rather than direct affectations, a distinctin between true and false
function copySaveModeInto(p_start, p_destination) {
	p_destination.id = p_start.id;
	if (p_start.squareGrid) { 
		p_destination.squareGrid = true;
	} else {
		p_destination.squareGrid = false;
	}
}

const PUZZLES_KIND = {
	STAR_BATTLE : {id:0, squareGrid : true},
	WALLS_ONLY : {id:1},
	REGIONS_NUMERICAL_INDICATIONS : {id:2},
	NUMBERS_ONLY : {id:3},
	CURVING_ROAD : {id:4},
	MASYU : {id:5},
	REGIONS_NUMBERS : {id:6},
	NUMBERS_X_ONLY : {id:7},
	DIGITS_X_ONLY : {id:15},
	YAJILIN_LIKE : {id:8},
	STITCHES : {id:9},
	ONLY_ONE_NUMBER_LEFT_UP_SQUARE : {id:10, squareGrid : true},
	TAPA : {id:11},
	REGIONS_PLAYSTATION_SHAPES : {id:12},
	GALAXIES : {id:13},
	MOONSUN : {id:14}, // 15
	SUDOKU : {id:1001},
	YAGIT : {id:16},
	XS_AND_ONE_O_PER_REGION : {id:17},
	LINKS_ONLY : {id:8},
	YAJILIN_BLACK_WHITE : {id:18},
	NUMBER_BLACK_WHITE : {id:19},
	DIGITS_QUESTION_ONLY : {id:20},
}

const MARGIN_KIND = {
	NONE : {id : 0},
	NUMBERS_LEFT_UP : {id : 1, leftLength : 1, upLength : 1}
}