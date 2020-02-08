//TODO Je suis sûr qu'il y a moyen de faire des énumérations.

//Intelligence part

STAR = 'O';
NO_STAR = 'X';
UNDECIDED = '-';

const RESULT = {
SUCCESS : 3,
ERROR : 1,
HARMLESS : 2
}

const COHERENCE ={SUCCESS:1,FAILURE:2};
const FAMILY ={REGION:1,ROW:2,COLUMN:3};

ROUND_X_COORDINATES = [-1,-1,-1,0,1,1,1,0];
ROUND_Y_COORDINATES = [-1,0,1,1,1,0,-1,-1];

//---------------------
//User interface part

ACTION_PASS_REGION = {id:1,caption:"Passer région"};
ACTION_PASS_ROW = {id:2,caption:"Passer ligne"};
ACTION_PASS_COLUMN = {id:3,caption:"Passer colonne"};
ACTION_PUT_STAR = {id:4,caption:"Placer une étoile"};
ACTION_PUT_NO_STAR = {id:5,caption:"Placer un X"};