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

const COHERENCE ={SUCCESS:1,FAILURE:2};
const DIAGONAL_X_COORDINATES = [-1,1,-1,1];
const DIAGONAL_Y_COORDINATES = [-1,-1,1,1];

const DIRECTION = {LEFT:0,UP:1,RIGHT:2,DOWN:3};
const DIRECTION_X_COORDINATES = [-1,0,1,0]; //MUST follow left/up/right/down because of code usage !
const DIRECTION_Y_COORDINATES = [0,-1,0,1]; //Same.

//---------------------
//User interface part

ACTION_PASS_REGION = {id:1,caption:"Passer région"};
ACTION_FILL_SPACE = {id:2,caption:"Colorier case"};
ACTION_PUT_NO_FILL = {id:3,caption:"Placer un X"};