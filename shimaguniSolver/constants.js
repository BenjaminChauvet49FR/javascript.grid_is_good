//Intelligence part

const FILLING ={
	YES : 'Y',
	NO : 'N',
	UNDECIDED : '-'
}

const RESULT = {
SUCCESS : 3,
ERROR : 1,
HARMLESS : 2
}

const EVENTLIST_KIND = {HYPOTHESIS:"H",PASS:"P"};

const DIAGONAL_X_COORDINATES = [-1,1,-1,1];
const DIAGONAL_Y_COORDINATES = [-1,-1,1,1];

const DIRECTION = {LEFT:0,UP:1,RIGHT:2,DOWN:3};
const DIRECTION_X_COORDINATES = [-1,0,1,0]; //MUST follow left/up/right/down because of code usage !
const DIRECTION_Y_COORDINATES = [0,-1,0,1]; //Same.
