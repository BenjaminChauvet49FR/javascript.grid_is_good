// Constants for grids (saving + input)
// Used only in editor

const GRID_ID = {
    NUMBER_REGION: 'NR',
    NUMBER_SPACE: 'NS',
    DIGIT_X_SPACE: 'DXS',
    PEARL: 'P',
	YAJILIN_LIKE: 'YAJILIN', 
	TAPA: 'TAPA',
	SUDOKU: {
		CLASSIC_9x9 : 'SUDO9'
	},
	PLAYSTATION_SHAPES: 'PSH'
}

const GRID_TRANSFORMATION = {
	ROTATE_CW : "RCW",
	ROTATE_CCW : "RCCW",
	ROTATE_UTURN : "RUT",
	MIRROR_HORIZONTAL : "MH",
	MIRROR_VERTICAL : "MV",
	RESIZE : "Rs"
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
	YAJILIN_LIKE : {id:8},
	WALLS_ONLY_ONE_NUMBER_LEFT_UP : {id:9},
	ONLY_ONE_NUMBER_LEFT_UP_SQUARE : {id:10, squareGrid : true},
	TAPA : {id:11},
	REGIONS_PLAYSTATION_SHAPES : {id:12},
	GRAND_TOUR : {id:99102},
	SUDOKU : {id:1001}
}

const MARGIN_KIND = {
	NONE : {id : 0},
	NUMBERS_LEFT_UP : {id : 1, leftLength : 1, upLength : 1}
}