//Intelligence part

const SYMBOL ={
STAR : 'O',
NO_STAR : 'X',
UNDECIDED : '-'	
}

const RESULT = {
SUCCESS : 3,
ERROR : 1,
HARMLESS : 2
}

const EVENTLIST_KIND = {HYPOTHESIS:"H",PASS:"P"};
const FAMILY ={REGION:1,ROW:2,COLUMN:3};

ROUND_X_COORDINATES = [-1,-1,-1,0,1,1,1,0];
ROUND_Y_COORDINATES = [-1,0,1,1,1,0,-1,-1];