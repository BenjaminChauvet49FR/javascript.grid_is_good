//Intelligence part

const FILLING ={
	YES : 'O',
	NO : 'X',
	UNDECIDED : '-'	
}

const RESULT = {
	SUCCESS : 3,
	ERROR : 1,
	HARMLESS : 2
}

const EVENTLIST_KIND = {HYPOTHESIS:"H",PASS:"P"};

ACTION_FILL_SPACE = {id:4,caption:"Remplir une case"};
ACTION_FILL_NO_SPACE = {id:5,caption:"Placer un X"};