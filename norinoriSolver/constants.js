//TODO Je suis sûr qu'il y a moyen de faire des énumérations.

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
/*const FAMILY ={REGION:1,ROW:2,COLUMN:3};

ROUND_X_COORDINATES = [-1,-1,-1,0,1,1,1,0];
ROUND_Y_COORDINATES = [-1,0,1,1,1,0,-1,-1];*/

//---------------------
//User interface part

ACTION_PASS_REGION = {id:1,caption:"Passer région"};
ACTION_FILL_SPACE = {id:2,caption:"Colorier case"};
ACTION_PUT_NO_FILL = {id:3,caption:"Placer un X"};