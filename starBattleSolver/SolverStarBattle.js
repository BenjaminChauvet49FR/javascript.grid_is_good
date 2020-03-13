function SolverStarBattle(p_wallArray,p_starNumber){
	this.construct(p_wallArray,p_starNumber);
}

SolverStarBattle.prototype.construct = function(p_wallArray,p_starNumber){ 
	this.answerGrid = [];
	this.spacesByRegion =  [];
	this.notPlacedYet = {regions:[],rows:[],columns:[]};
	this.happenedEvents = [];	
	this.wallGrid = new WallGrid(p_wallArray,p_wallArray.length,p_wallArray.length);
	this.regionGrid = this.wallGrid.toRegionGrid();
	this.xyLength = this.getWallGrid().length; //IMPORTANT : when copy-pasting this line to a non-square grid, make sure to replace ALL occurences by xLength and yLength
	this.listSpacesByRegion(); //spacesByRegion
	this.buildPossibilities(p_starNumber); //notPlacedYet
	this.buildAnswerGrid(); //answerGrid
	this.purifyAnswerGrid(); 
}

/**
Starts the answerGrid
*/
SolverStarBattle.prototype.buildAnswerGrid = function(){
	this.answerGrid = [];
	for(iy = 0; iy < this.xyLength ; iy++){
		this.answerGrid.push([]);
		for(ix = 0; ix < this.xyLength ; ix++){
			this.answerGrid[iy].push(SYMBOL.UNDECIDED);
		}
	}
}

/**
Puts Xs into the answerGrid corresponding to banned spaces 
Precondition : both spacesByRegion and notPlacedYet have been refreshed and answerGrid is ok.
*/
SolverStarBattle.prototype.purifyAnswerGrid = function(){
	//Removing banned spaces (hence the necessity to have things already updated)
	for(iy = 0; iy < this.xyLength ; iy++){
		for(ix = 0; ix < this.xyLength ; ix++){
			if (this.regionGrid[iy][ix] == BANNED){
				this.putNew(ix,iy,SYMBOL.NO_STAR);
			}
		}
	}
}

/**
Sets the list of spaces for each row and column (might be exportated)
Hyphothesis : all non-banned regions are numbered from 0 to n-1 ; banned spaces have lower-than-0 numbers
Exit : all spaces within a region are in reading order (top to bottom, then left to right)
*/
SolverStarBattle.prototype.listSpacesByRegion = function(){
	var ix,iy;
	var lastRegionNumber = 0;
	for(iy = 0;iy < this.xyLength;iy++){
		for(ix = 0;ix < this.xyLength;ix++){
			lastRegionNumber = Math.max(this.regionGrid[iy][ix],lastRegionNumber);
		}
	}
	
	this.spacesByRegion = [];
	for(var i=0;i<=lastRegionNumber;i++){
		this.spacesByRegion.push([]);
	}
	for(iy = 0;iy < this.xyLength;iy++){
		for(ix = 0;ix < this.xyLength;ix++){
			if(this.regionGrid[iy][ix] >= 0){
				this.spacesByRegion[this.regionGrid[iy][ix]].push({x:ix,y:iy});
			}
		}
	}
}

/**
Puts the number of remaining Stars (Os) and non-stars (Xs) in each region, row and column, assuming we start from scratch.
Precondition : this.spacesByRegion must be refreshed, since it will be needed for region.
*/
SolverStarBattle.prototype.buildPossibilities = function(p_numberStarsPer){
	this.notPlacedYet = {regions:[],rows:[],columns:[]};
	const complement = this.xyLength - p_numberStarsPer;
	for(var i=0;i<this.xyLength;i++){
		this.notPlacedYet.rows.push({Os:p_numberStarsPer,Xs:complement});
		this.notPlacedYet.columns.push({Os:p_numberStarsPer,Xs:complement});
	}
	for(var i=0;i<this.spacesByRegion.length;i++){
		this.notPlacedYet.regions.push({Os:p_numberStarsPer,Xs:this.spacesByRegion[i].length-p_numberStarsPer});
	}
}

//----------------------
//Getters (not setters, though)

SolverStarBattle.prototype.getAnswer = function(p_x,p_y){
	return this.answerGrid[p_y][p_x];
}

SolverStarBattle.prototype.getWallGrid = function(){
	return this.wallGrid.array;
}

SolverStarBattle.prototype.getRegion = function(p_x,p_y){
	return this.regionGrid[p_y][p_x];
}

SolverStarBattle.prototype.getOsRemainRow = function(p_i){return this.notPlacedYet.rows[p_i].Os;}
SolverStarBattle.prototype.getOsRemainColumn = function(p_i){return this.notPlacedYet.columns[p_i].Os;}
SolverStarBattle.prototype.getOsRemainRegion = function(p_i){return this.notPlacedYet.regions[p_i].Os;}
SolverStarBattle.prototype.getXsRemainRow = function(p_i){return this.notPlacedYet.rows[p_i].Xs;}
SolverStarBattle.prototype.getXsRemainColumn = function(p_i){return this.notPlacedYet.columns[p_i].Xs;}
SolverStarBattle.prototype.getXsRemainRegion = function(p_i){return this.notPlacedYet.regions[p_i].Xs;}
SolverStarBattle.prototype.getFirstSpaceRegion = function(p_i){return this.spacesByRegion[p_i][0];}

//------------------
//Strategy management
/**
Admits that a star OR a no-star could be in this space...
*/
SolverStarBattle.prototype.emitHypothesis = function(p_x,p_y,p_symbol){
	var result = this.tryToPutNew(p_x,p_y,p_symbol);
	if (result != null && result.eventsApplied.length > 0){
		this.happenedEvents.push({kind:EVENTLIST_KIND.HYPOTHESIS,list:result.eventsApplied}); //TODO : une constante
		return {result:RESULT.SUCCESS,eventsApplied:result.eventsApplied};
	}
	return {result:RESULT.ERROR,eventsApplied:[]};
}

/**
Pass a region, row or column
*/
SolverStarBattle.prototype.passRegion = function(p_indexRegion){
	if (p_indexRegion < 0){
		debugHumanMisclick("Passing a negative region ");
		return; //A click might be made onto a wrong space.
	}
	
	
	//Building a copy of an array of coordinates with only the unoccuped spaces that are unnocupied before the test of the function
	var spacesToTestArray = [];
	var space;
	for(var i=0;i<this.spacesByRegion[p_indexRegion].length;i++){
		space = this.spacesByRegion[p_indexRegion][i];
		if (this.answerGrid[space.y][space.x] == SYMBOL.UNDECIDED){
			spacesToTestArray.push({x:space.x,y:space.y});
		}
	}
	function closure(p_dataNotPlacedYet,p_index){
		return function(){
			return (p_dataNotPlacedYet.regions[p_index].Os == 0);
		}
	}
	var answer = this.pass(spacesToTestArray,0,closure(this.notPlacedYet,p_indexRegion));
	return this.applyAnswerPass(answer);
}

SolverStarBattle.prototype.passRow = function(p_indexRow){
	var spacesToTestArray = [];
	for(var i=0;i<this.xyLength;i++){
		if (this.answerGrid[p_indexRow][i] == SYMBOL.UNDECIDED){
			spacesToTestArray.push({x:i,y:p_indexRow});
		}
	}
	function closure(p_dataNotPlacedYet,p_index){ //TODO maybe closures weren't even mandatory ! 
		return function(){
			return (p_dataNotPlacedYet.rows[p_index].Os == 0);
		}
	}
	var answer = this.pass(spacesToTestArray,0,closure(this.notPlacedYet,p_indexRow));
	return this.applyAnswerPass(answer);
}

SolverStarBattle.prototype.passColumn = function(p_indexColumn){
	var spacesToTestArray = [];
	for(var i=0;i<this.xyLength;i++){
		if (this.answerGrid[i][p_indexColumn] == SYMBOL.UNDECIDED){
			spacesToTestArray.push({x:p_indexColumn,y:i});
		}
	}
	function closure(p_dataNotPlacedYet,p_index){
		return function(){
			return (p_dataNotPlacedYet.columns[p_index].Os == 0);
		}
	}
	var answer = this.pass(spacesToTestArray,0,closure(this.notPlacedYet,p_indexColumn));
	return this.applyAnswerPass(answer);
}

/**
One pass
*/

SolverStarBattle.prototype.applyAnswerPass = function(p_answer){
	if (p_answer.consistence == RESULT.SUCCESS && p_answer.eventsApplied.length > 0){
		this.happenedEvents.push({kind:EVENTLIST_KIND.PASS,list:p_answer.eventsApplied});
		p_answer.eventsApplied.forEach(spaceEvent => {this.putNew(spaceEvent.x,spaceEvent.y,spaceEvent.symbol)});
	}
	return p_answer;
}

SolverStarBattle.prototype.pass = function(p_spacesToTest,p_indexFirstSpace,p_functionFinishedPass){
	if (p_functionFinishedPass()){
		return {consistence : RESULT.SUCCESS, eventsApplied: []}; //When performing a multipass, some passes can become useless since the corresponding row/column/region have been filled by previous passes.
	}
	var index = p_indexFirstSpace;
	while (this.answerGrid[p_spacesToTest[index].y][p_spacesToTest[index].x] != SYMBOL.UNDECIDED)
	{
		index++;
	}
	//We MUST find an index where space is undecided.
	var listO = null;
	var listX = null;
	var answerPut = this.tryToPutNew(p_spacesToTest[index].x,p_spacesToTest[index].y,SYMBOL.STAR);
	if (answerPut.consistence == RESULT.SUCCESS){
		if (p_functionFinishedPass()){
			listO = answerPut.eventsApplied;
			//listO = answerPut;
		}
		else{
			var answerPass = this.pass(p_spacesToTest,index+1,p_functionFinishedPass);
			//listO = this.pass(p_spacesToTest,index+1,p_functionFinishedPass);
			if (answerPass.consistence == RESULT.SUCCESS){
			//if (listO.consistence == RESULT.SUCCESS){
				listO = answerPass.eventsApplied.concat(answerPut.eventsApplied);
				//Array.prototype.push.apply(listO.eventsApplied,answerPut.eventsApplied);
			}
		}
		this.undoList(answerPut.eventsApplied.slice());
	}
	if ((listO == null) || (listO.length > 0)){
	//if ((listO == null) || (listO.eventsApplied.length > 0)){
		answerPut = this.tryToPutNew(p_spacesToTest[index].x,p_spacesToTest[index].y,SYMBOL.NO_STAR);
		if (answerPut.consistence == RESULT.SUCCESS){
			if (p_functionFinishedPass()){
				listX = answerPut.eventsApplied;
				//listX = answerPut;
			}
			else{
				var answerPass = this.pass(p_spacesToTest,index+1,p_functionFinishedPass);
				//listX = this.pass(p_spacesToTest,index+1,p_functionFinishedPass);
				if (answerPass.consistence == RESULT.SUCCESS){
				//if (listX.pass == RESULT.SUCCESS){
					listX = answerPass.eventsApplied.concat(answerPut.eventsApplied);
					//Array.prototype.push.apply(listX.eventsApplied,answerPut.eventsApplied);
				}
			}
			this.undoList(answerPut.eventsApplied.slice());
		}
	}
	var list;
	if (listO == null && listX == null){
		return {consistence : RESULT.ERROR, eventsApplied: []};
	}
	if (listO == null){
		return {consistence : RESULT.SUCCESS, eventsApplied: listX};
	}
	if (listX == null){
		return {consistence : RESULT.SUCCESS, eventsApplied: listO};
	}
	/*if (((listO == null) || (listO.consistence == RESULT.ERROR)) && ((listX == null) || (listX.consistence == RESULT.ERROR))){
		return {consistence : RESULT.ERROR, eventsApplied: []};
	}
	if ((listO == null) || (listO.consistence == RESULT.ERROR)){
		return {consistence : RESULT.SUCCESS, eventsApplied: listX.eventsApplied};
	}
	if ((listX == null) || (listX.consistence == RESULT.ERROR)){
		return {consistence : RESULT.SUCCESS, eventsApplied: listO.eventsApplied};
	}*/
	return {consistence:RESULT.SUCCESS, eventsApplied:intersect(listO.sort(compareSpaceEvents),listX.sort(compareSpaceEvents))};
	//return {consistence:RESULT.SUCCESS, eventsApplied:intersect(listO.eventsApplied.sort(compareSpaceEvents),listX.eventsApplied.sort(compareSpaceEvents))};
}

//------------------
//Multipass strategy

/**
Passes all regions/rows/columns in the order of size until no deduction can be done anymore.
Warning : if something wrong is found, everything will be deleted until the new pass ! (TODO : this behavior seems like it can be changed)
*/
SolverStarBattle.prototype.multiPass = function(){
	var anyModification = false;
	var ok = true;
	var familiesToPass; //The list of all regions, lists and columns to pass.
	var family;
	var bilanPass;
	var indexFamily;
	do{
		//Initialize the families to pass and sort it
		familiesToPass = [];
		for(indexFamily=0;indexFamily<this.xyLength;indexFamily++){
			if (this.notPlacedYet.regions[indexFamily].Os > 0){
				familiesToPass.push({familyKind : FAMILY.REGION, id:indexFamily, remains : this.notPlacedYet.regions[indexFamily].Os + this.notPlacedYet.regions[indexFamily].Xs});
			}				
			if (this.notPlacedYet.rows[indexFamily].Os > 0){
				familiesToPass.push({familyKind : FAMILY.ROW, id:indexFamily, remains : this.notPlacedYet.rows[indexFamily].Os + this.notPlacedYet.rows[indexFamily].Xs});
			}
			if (this.notPlacedYet.columns[indexFamily].Os > 0){
				familiesToPass.push({familyKind : FAMILY.COLUMN, id:indexFamily, remains : this.notPlacedYet.columns[indexFamily].Os + this.notPlacedYet.columns[indexFamily].Xs});
			}
		}
		familiesToPass.sort(function(a,b){return (a.remains-b.remains)});
		
		//Perform the passes
		anyModification = false;
		indexFamily = 0;
		while(indexFamily < familiesToPass.length && ok){
			family = familiesToPass[indexFamily];
			switch(family.familyKind){
				case FAMILY.ROW: bilanPass = this.passRow(family.id);break;
				case FAMILY.COLUMN: bilanPass = this.passColumn(family.id);break;
				case FAMILY.REGION: bilanPass = this.passRegion(family.id);break;
			}
			if (bilanPass.consistence == RESULT.ERROR){
				ok = false;
				this.undoToLastHypothesis();
			}
			if (bilanPass.consistence == RESULT.SUCCESS && bilanPass.eventsApplied.length > 0){
				anyModification = true;
			}
			indexFamily++;
		}
	} while(ok && anyModification);
	if (ok)
		return RESULT.SUCCESS;
	else
		return RESULT.ERROR;
}

//------------------
//General solve strategy
SolverStarBattle.prototype.generalSolve = function(){
	//this.quickStart() //Pas de quickStart pour SternenSchlacht !
	const numberEventsB4MultiPass = this.happenedEvents.length;
	var multipass = this.multiPass();
	var mistake = (multipass == RESULT.ERROR);
	if (!mistake){
		function puzzleSolved(p_dataNotPlacedYet){
			return function(){
				var compteur = 0;
				while(compteur < p_dataNotPlacedYet.regions.length && p_dataNotPlacedYet.regions[compteur].Os == 0){
					compteur++;
				}
				return (compteur == p_dataNotPlacedYet.regions.length);
			}
		}
		var puzzleSolvedTest = puzzleSolved(this.notPlacedYet);
		if (!puzzleSolvedTest()){
			mistake = (this.solveByHypothesis(puzzleSolvedTest) == RESULT.ERROR);
		}
	}
	if (mistake){
		while (this.happenedEvents.length > numberEventsB4MultiPass){
			this.undoToLastHypothesis();
		}
		this.undoToLastHypothesis();
	}
}

SolverStarBattle.prototype.solveByHypothesis = function(p_puzzleSolvedTest){
	//1) select the good space
	//Initialize the families to pass and sort it // TODO sort the functions...
	var familiesToPass = [];
	for(var i=0;i<this.xyLength;i++){
		if (this.notPlacedYet.regions[i].Os > 0){
			familiesToPass.push({familyKind : FAMILY.REGION, id:i, remains : this.notPlacedYet.regions[i].Os + this.notPlacedYet.regions[i].Xs});
		}				
		if (this.notPlacedYet.rows[i].Os > 0){
			familiesToPass.push({familyKind : FAMILY.ROW, id:i, remains : this.notPlacedYet.rows[i].Os + this.notPlacedYet.rows[i].Xs});
		}
		if (this.notPlacedYet.columns[i].Os > 0){
			familiesToPass.push({familyKind : FAMILY.COLUMN, id:i, remains : this.notPlacedYet.columns[i].Os + this.notPlacedYet.columns[i].Xs});
		}
	}
	familiesToPass.sort(function(a,b){return (a.remains-b.remains)});
	var foundSpace = false;
	var indexFamily = 0;
	var space = null;
	var kind;
	var indexRLC;
	var regionSpaces;
	var family;
	while (space == null){
		family = familiesToPass[indexFamily];
		kind = family.familyKind;
		indexRLC = family.id;
		switch(kind){			
			case(FAMILY.ROW) :
				indexSpace = 0;
				while(indexSpace < this.xyLength && this.answerGrid[indexRLC][indexSpace] != SYMBOL.UNDECIDED){
					indexSpace++;
				}
				if (indexSpace < this.xyLength){
					space = {x:indexSpace,y:indexRLC};
				}
			break;
			case(FAMILY.COLUMN) :
				indexSpace = 0;
				while(indexSpace < this.xyLength && this.answerGrid[indexSpace][indexRLC] != SYMBOL.UNDECIDED){
					indexSpace++;
				}
				if (indexSpace < this.xyLength){
					space = {x:indexRLC,y:indexSpace};
				}
			break;
			case(FAMILY.REGION) :
				indexSpace = 0;
				regionSpaces = this.spacesByRegion[indexRLC];
				while(indexSpace < this.xyLength && this.answerGrid[regionSpaces[indexSpace].y][regionSpaces[indexSpace].x] != SYMBOL.UNDECIDED){
					indexSpace++;
				}
				if (indexSpace < this.xyLength){
					space = regionSpaces[indexSpace];
				}
			break;
		}
		indexFamily++;
	}
	
	var hypothesis;
	var listEvents = this.tryToPutNew(space.x,space.y,SYMBOL.STAR);
	if (listEvents.consistence == RESULT.SUCCESS){
		//this.happenedEvents.push({kind:EVENTLIST_KIND.HYPOTHESIS,list:listEvents.eventsApplied});
		hypothesis = this.afterTheHypothesis(p_puzzleSolvedTest,listEvents.eventsApplied.length,space);
		if (hypothesis == RESULT.SUCCESS){
			return RESULT.SUCCESS;
		}
		else{
			//this.happenedEvents.pop();
			this.undoList(listEvents.eventsApplied);
		}
	}
	listEvents = this.tryToPutNew(space.x,space.y,SYMBOL.NO_STAR);
	if (listEvents.consistence == RESULT.SUCCESS){
		//this.happenedEvents.push({kind:EVENTLIST_KIND.HYPOTHESIS,list:listEvents.eventsApplied});
		hypothesis = this.afterTheHypothesis(p_puzzleSolvedTest,listEvents.eventsApplied.length,space);
		if (hypothesis == RESULT.SUCCESS){
			return RESULT.SUCCESS;
		}
		else{
			//this.happenedEvents.pop();
			this.undoList(listEvents.eventsApplied);
		}
	}
	return RESULT.FAILURE;
}

SolverStarBattle.prototype.afterTheHypothesis = function(p_puzzleSolvedTest,p_numberNewEvents,p_space){
	if (p_puzzleSolvedTest()){
		return RESULT.SUCCESS;
	}
	const numberEventsB4MultiPass = this.happenedEvents.length;
	var ok = true;
	/*var resultMultiPass;
	var resultPass;
	var lengthEvents = 0;
	if (p_numberNewEvents > 15){
		resultMultiPass = this.multiPass();
		ok = (resultMultiPass == RESULT.SUCCESS);
	} else if (p_numberNewEvents > 8){
		resultPass = this.passRegion(p_space.y);
		if (resultPass.consistence == RESULT.SUCCESS){
			lengthEvents += resultPass.eventList.length;
			resultPass.consistence = this.passRow(p_space.y);			
			if (resultPass == RESULT.SUCCESS){
				lengthEvents += resultPass.eventList.length;
				resultPass.consistence = this.passColumn(p_space.y);
				if (resultPass == RESULT.SUCCESS){
					lengthEvents += resultPass.events.length;
					if (lengthEvents > this.xyLength){
						resultMultiPass = this.multiPass();
						ok = (resultMultiPass == RESULT.SUCCESS); 
					}
				}
			}
		}
	} */
	if (ok){
		if (p_puzzleSolvedTest()){
			return RESULT.SUCCESS;
		}
		else if (this.solveByHypothesis(p_puzzleSolvedTest) == RESULT.SUCCESS){
			return RESULT.SUCCESS;
		}
	}
	while (this.happenedEvents.length > numberEventsB4MultiPass){
		this.undoToLastHypothesis();
	}
	this.undoToLastHypothesis();	
	return RESULT.FAILURE;
}




//------------------
//Putting symbols into spaces. 

/**Tries to put a symbol into the space of a grid. 3 possibilities :
RESULT.SUCCESS : it was indeed put into the grid ; the number of Os and Xs for this region, row and column are also updated.
RESULT.HARMLESS : said symbol was either already put into that space OUT out of bounds beacuse of automatic operation. Don't change anything to the grid and remaining symbols
ERROR : there is a different symbol in that space. We have done a wrong hypothesis somewhere ! (or the grid was wrong at the basis !)
This is also used at grid start in order to put Xs in banned spaces, hence the check in the SYMBOL.NO_STAR part.
*/
SolverStarBattle.prototype.putNew = function(p_x,p_y,p_symbol){
	if ((p_x < 0) || (p_x >= this.xyLength) || (p_y < 0) || (p_y >= this.xyLength) || 
	(this.answerGrid[p_y][p_x] == p_symbol)){
		return RESULT.HARMLESS;
	}
	if (this.answerGrid[p_y][p_x] == SYMBOL.UNDECIDED){
		this.answerGrid[p_y][p_x] = p_symbol;
		var indexRegion = this.getRegion(p_x,p_y);
		if (p_symbol == SYMBOL.STAR){
			this.notPlacedYet.regions[indexRegion].Os--;
			this.notPlacedYet.rows[p_y].Os--;
			this.notPlacedYet.columns[p_x].Os--;
		}
		if (p_symbol == SYMBOL.NO_STAR){
			if (indexRegion >= 0){
				this.notPlacedYet.regions[indexRegion].Xs--;				
			}
			this.notPlacedYet.rows[p_y].Xs--;
			this.notPlacedYet.columns[p_x].Xs--;	
		}
		return RESULT.SUCCESS;
	}
	if (this.answerGrid[p_y][p_x] != p_symbol){
		debugTryToPutNew("NOOOO !");
		return RESULT.ERROR;
	}


}

/**
When you want to remove a symbol from a space !
*/
SolverStarBattle.prototype.remove = function(p_x,p_y){
	var indexRegion = this.regionGrid[p_y][p_x];
	var symbol = this.answerGrid[p_y][p_x];
	this.answerGrid[p_y][p_x] = SYMBOL.UNDECIDED;
	debugTryToPutNew("Removing the following : "+p_x+" "+p_y+" "+symbol);
	if (symbol == SYMBOL.STAR){
		this.notPlacedYet.regions[indexRegion].Os++;
		this.notPlacedYet.rows[p_y].Os++;
		this.notPlacedYet.columns[p_x].Os++;
	}
	if (symbol == SYMBOL.NO_STAR){
		this.notPlacedYet.regions[indexRegion].Xs++;
		this.notPlacedYet.rows[p_y].Xs++;
		this.notPlacedYet.columns[p_x].Xs++;	
	}

}


/**
Tries to put a new symbol into a grid and then forces the filling of all stars and Xs that can be deduced logically without breaking the rules : 
-if a star is placed, all Xs around it
-if a star or an X is placed and it causes to have all the stars/Xs in that region/row/column deduced, fill this region/row/column with the missing symbols
-repeat until either new can be newly deduced (good, although this may be a wrong answer) or there is an absurd situation with two opposite symbols deduced in the same space (bad). 

BIG WARNING : if the end is successful, the list of spaces will be put into eventsApplied. But this doesn't mean they are all fine !
*/
//TODO : do something about big warning !
SolverStarBattle.prototype.tryToPutNew = function(p_x,p_y,p_symbol){
	
	if (this.answerGrid[p_y][p_x] != SYMBOL.UNDECIDED){
		debugHumanMisclick("Trying to put "+p_symbol+" at "+p_x+","+p_y+" ; there is already "+this.answerGrid[p_y][p_x]+" in this place !");
		return null;
	}
	
	var eventsToAdd = [new SpaceEvent(p_symbol,p_x,p_y)];
	var eventsApplied = [];
	var ok = true;
	var putNewResult;
	var spaceEventToApply;
	var spaceEventToAdd;
	var x,y,r,symbol,xi,yi,roundi;
	while ((eventsToAdd.length > 0) && ok){ 
		spaceEventToApply = eventsToAdd.pop();
		x = spaceEventToApply.x;
		y = spaceEventToApply.y;
		symbol = spaceEventToApply.symbol;
		debugTryToPutNew("Now let's try to add : "+spaceEventToApply.toString());
		putNewResult = this.putNew(x, y,symbol);
		ok = (putNewResult != RESULT.ERROR);
		if (putNewResult == RESULT.SUCCESS){
			r = this.getRegion(x,y); //(y,x) might be out of bounds, if so the putNewResult isn't supposed to be RESULT.SUCCESS. Hence the check only here.
			if (symbol == SYMBOL.STAR){
				//Add to all 7 neighbors (no one should be star if solved correctly)
				for(roundi=0;roundi<=7;roundi++){
					spaceEventToAdd = new SpaceEvent(SYMBOL.NO_STAR,x+ROUND_X_COORDINATES[roundi],y+ROUND_Y_COORDINATES[roundi]);
					eventsToAdd.push(spaceEventToAdd);
					debugTryToPutNew("Event pushed : "+spaceEventToAdd.toString());
				}
				//Final alert on column : fill the missing spaces in the column 
				if (this.notPlacedYet.columns[x].Os == 0){
					for(yi=0;yi<this.xyLength;yi++){
						//there may be stars already, hence the (if SYMBOL.UNDECIDED) guard
						if (this.answerGrid[yi][x] == SYMBOL.UNDECIDED){
							spaceEventToAdd = new SpaceEvent(SYMBOL.NO_STAR,x,yi);
							eventsToAdd.push(spaceEventToAdd);
							debugTryToPutNew("Event pushed : "+spaceEventToAdd.toString()); 
						}
					}
				}
				//Final alert on row
				if (this.notPlacedYet.rows[y].Os == 0){
					for(xi=0;xi<this.xyLength;xi++){
						if (this.answerGrid[y][xi] == SYMBOL.UNDECIDED){
							spaceEventToAdd = new SpaceEvent(SYMBOL.NO_STAR,xi,y);
							eventsToAdd.push(spaceEventToAdd);
							debugTryToPutNew("Event pushed : "+spaceEventToAdd.toString());
						}
					}
				}
				//Final alert on region
				if (this.notPlacedYet.regions[r].Os == 0){
					var spaceInRegion;
					for(var si=0;si< this.spacesByRegion[r].length;si++){
						spaceInRegion = this.spacesByRegion[r][si];
						if (this.answerGrid[spaceInRegion.y][spaceInRegion.x] == SYMBOL.UNDECIDED){
							spaceEventToAdd = new SpaceEvent(SYMBOL.NO_STAR,spaceInRegion.x,spaceInRegion.y);
							eventsToAdd.push(spaceEventToAdd);
							debugTryToPutNew("Event pushed : "+spaceEventToAdd.toString());
						}
					}
				}
			}
			if (symbol == SYMBOL.NO_STAR){
				//Final alert on column : fill the missing spaces in the column 
				if (this.notPlacedYet.columns[x].Xs == 0){
					for(yi=0;yi<this.xyLength;yi++){
						//there may be stars already, hence the (if SYMBOL.UNDECIDED) guard
						if (this.answerGrid[yi][x] == SYMBOL.UNDECIDED){
							spaceEventToAdd = new SpaceEvent(SYMBOL.STAR,x,yi);
							eventsToAdd.push(spaceEventToAdd);
							debugTryToPutNew("Event pushed : "+spaceEventToAdd.toString());
						}
					}
				}
				//Final alert on row
				if (this.notPlacedYet.rows[y].Xs == 0){
					for(xi=0;xi<this.xyLength;xi++){
						if (this.answerGrid[y][xi] == SYMBOL.UNDECIDED){
							spaceEventToAdd = new SpaceEvent(SYMBOL.STAR,xi,y);
							eventsToAdd.push(spaceEventToAdd);
							debugTryToPutNew("Event pushed : "+spaceEventToAdd.toString());
						}
					}
				}
				//Final alert on region
				if (this.notPlacedYet.regions[r].Xs == 0){
					var spaceInRegion;
					for(var si=0;si< this.spacesByRegion[r].length;si++){
						spaceInRegion = this.spacesByRegion[r][si];
						if (this.answerGrid[spaceInRegion.y][spaceInRegion.x] == SYMBOL.UNDECIDED){
							spaceEventToAdd = new SpaceEvent(SYMBOL.STAR,spaceInRegion.x,spaceInRegion.y);
							eventsToAdd.push(spaceEventToAdd);
							debugTryToPutNew("Event pushed : "+spaceEventToAdd.toString());
						}
					}
				}
			}
			eventsApplied.push(spaceEventToApply);
		} // if RESULT.SUCCESS
	}
	
	//Mistakes were made, we should undo everything 
	if (!ok){
		this.undoList(eventsApplied);
		return {eventsApplied:[],consistence:RESULT.ERROR};
	} 
	
	//Actually it's fine !
	else{
		debugTryToPutNew("Yes !-----------------"); 
		return {eventsApplied:eventsApplied,consistence:RESULT.SUCCESS};
	}
}

/**
Cancel the last list of events since the last "non-deducted" space.
*/
SolverStarBattle.prototype.undoToLastHypothesis = function(){
	if (this.happenedEvents.length == 0)
		return;	
	var spaceEventsListToUndo;
	//The last list of events to undo must come either from an hypothesis 
	do{
		spaceEventsListToUndo = this.happenedEvents.pop();
		this.undoList(spaceEventsListToUndo.list);
	}while(spaceEventsListToUndo.kind != EVENTLIST_KIND.HYPOTHESIS && this.happenedEvents.length > 0);
} 

/**
Cancels a list of events passed in argument
*/
SolverStarBattle.prototype.undoList = function(p_list){
	console.log("We are going to undo a list of : "+p_list.length);
	var spaceEventToUndo;
	while (p_list.length !=0){
		spaceEventToUndo = p_list.pop();
		this.remove(spaceEventToUndo.x,spaceEventToUndo.y);
	}
}

//--------------
// It's "to string" time !

function answerGridToString(p_grid){
	for(yi=0;yi<p_grid.length;yi++){
		row = "";
		for(xi=0;xi<p_grid.length;xi++){
			row+=p_grid[yi][xi];
		}
		console.log(row);
	}
}

/**
Returns the events to the text
p_onlyAssumed : true if only the assumed events should be written.
*/
SolverStarBattle.prototype.happenedEventsToString = function(p_onlyAssumed){
	var ei,li;
	var answer = "";
	if (p_onlyAssumed){
		this.happenedEvents.forEach(function(eventList){
			if (eventList.kind == EVENTLIST_KIND.HYPOTHESIS){
				answer+=eventList.list[0].toString()+"\n";				
			}
		});
	}
	else{
		this.happenedEvents.forEach(function(eventList){
			answer+=eventList.kind+"\n";
			eventList.list.forEach(function(spaceEvent){
				answer+=spaceEvent.toString()+"\n" 
			});
			answer+="--------\n";
		});
	}
	return answer;
}