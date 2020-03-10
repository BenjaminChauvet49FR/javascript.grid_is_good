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
	this.happenedEvents = [];
}

/**
Starts the answerGrid
*/
SolverStarBattle.prototype.buildAnswerGrid = function(){
	this.answerGrid = [];
	for(iy = 0; iy < this.xyLength ; iy++){
		this.answerGrid.push([]);
		for(ix = 0; ix < this.xyLength ; ix++){
			this.answerGrid[iy].push(UNDECIDED);
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
				this.putNew(ix,iy,NO_STAR);
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
	return this.wallGrid.array; //TODO à renommer ?
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
		this.happenedEvents.push(result.eventsApplied);
		return {result:RESULT.SUCCESS,eventsApplied:result.eventsApplied};
	}
	return {result:RESULT.FAILURE,eventsApplied:[]};
}

//------------------
//Pass strategy management

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
		if (this.answerGrid[space.y][space.x] == UNDECIDED){
			spacesToTestArray.push({x:space.x,y:space.y});
		}
	}
	function closure(p_dataNotPlacedYet,p_index){
		return function(){
			return (p_dataNotPlacedYet.regions[p_index].Os == 0);
		}
	}
	var answer = this.pass(spacesToTestArray,0,closure(this.notPlacedYet,p_indexRegion));
	if (answer.consistence == RESULT.SUCCESS && answer.eventsApplied.length > 0){
		this.happenedEvents.push(answer.eventsApplied);
		answer.eventsApplied.forEach(spaceEvent => {this.putNew(spaceEvent.x,spaceEvent.y,spaceEvent.symbol)});
	}
	return answer;
}

SolverStarBattle.prototype.passRow = function(p_indexRow){
	var spacesToTestArray = [];
	for(var i=0;i<this.xyLength;i++){
		if (this.answerGrid[p_indexRow][i] == UNDECIDED){
			spacesToTestArray.push({x:i,y:p_indexRow});
		}
	}
	function closure(p_dataNotPlacedYet,p_index){ //TODO maybe closures weren't even mandatory ! Anyway, let's see if they can work.
		return function(){
			return (p_dataNotPlacedYet.rows[p_index].Os == 0);
		}
	}
	var answer = this.pass(spacesToTestArray,0,closure(this.notPlacedYet,p_indexRow));
	if (answer.consistence == RESULT.SUCCESS && answer.eventsApplied.length > 0){
		this.happenedEvents.push(answer.eventsApplied);
		answer.eventsApplied.forEach(spaceEvent => {this.putNew(spaceEvent.x,spaceEvent.y,spaceEvent.symbol)});
	}
	return answer;
}

SolverStarBattle.prototype.passColumn = function(p_indexColumn){
	var spacesToTestArray = [];
	for(var i=0;i<this.xyLength;i++){
		if (this.answerGrid[i][p_indexColumn] == UNDECIDED){
			spacesToTestArray.push({x:p_indexColumn,y:i});
		}
	}
	function closure(p_dataNotPlacedYet,p_index){
		return function(){
			return (p_dataNotPlacedYet.columns[p_index].Os == 0);
		}
	}
	var answer = this.pass(spacesToTestArray,0,closure(this.notPlacedYet,p_indexColumn));
	if (answer.consistence == RESULT.SUCCESS && answer.eventsApplied.length > 0){
		this.happenedEvents.push(answer.eventsApplied);
		answer.eventsApplied.forEach(spaceEvent => {this.putNew(spaceEvent.x,spaceEvent.y,spaceEvent.symbol)});
	}
	return answer;
	
}

SolverStarBattle.prototype.pass = function(p_spacesToTest,p_indexFirstSpace,p_functionFinishedPass){
	if (p_functionFinishedPass()){
		return {consistence : RESULT.SUCCESS, eventsApplied: []}; //When performing a multipass, some passes can become useless since the corresponding row/column/region have been filled by previous passes.
	}
	var index = p_indexFirstSpace;
	while (this.answerGrid[p_spacesToTest[index].y][p_spacesToTest[index].x] != UNDECIDED)
	{
		index++;
	}
	//We MUST find an index where space is undecided.
	var listO = null;
	var listX = null;
	var answerPut = this.tryToPutNew(p_spacesToTest[index].x,p_spacesToTest[index].y,STAR);
	if (answerPut.coherence == COHERENCE.SUCCESS){
		if (p_functionFinishedPass()){
			listO = answerPut.eventsApplied;
		}
		else{
			var answerPass = this.pass(p_spacesToTest,index+1,p_functionFinishedPass);
			if (answerPass.consistence == RESULT.SUCCESS){
				listO = answerPass.eventsApplied.concat(answerPut.eventsApplied);
			}
		}
		this.undoList(answerPut.eventsApplied.slice());
	}
	if ((listO == null) || (listO.length > 0)){
		answerPut = this.tryToPutNew(p_spacesToTest[index].x,p_spacesToTest[index].y,NO_STAR);
		if (answerPut.coherence == COHERENCE.SUCCESS){
			if (p_functionFinishedPass()){
				listX = answerPut.eventsApplied;
			}
			else{
				var answerPass = this.pass(p_spacesToTest,index+1,p_functionFinishedPass);
				if (answerPass.consistence == RESULT.SUCCESS){
					listX = answerPass.eventsApplied.concat(answerPut.eventsApplied);
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
	return {consistence:RESULT.SUCCESS, eventsApplied:intersect(listO.sort(compareSpaceEvents),listX.sort(compareSpaceEvents))};
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
	var i;
	do{
		//Initialize the families to pass and sort it
		familiesToPass = [];
		for(i=0;i<this.xyLength;i++){
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
		
		//Perform the passes
		anyModification = false;
		for(i=0;i<familiesToPass.length;i++){
			family = familiesToPass[i];
			switch(family.familyKind){
				case FAMILY.ROW: bilanPass = this.passRow(family.id);break;
				case FAMILY.COLUMN: bilanPass = this.passColumn(family.id);break;
				case FAMILY.REGION: bilanPass = this.passRegion(family.id);break;
			}
			if (bilanPass.consistence == RESULT.ERROR){
				ok = false;
				this.massUndo();
				return;
			}
			if (bilanPass.consistence == RESULT.SUCCESS && bilanPass.eventsApplied.length > 0){
				anyModification = true;
			}
		}
	} while(ok && anyModification);
	if (ok)
		return RESULT.SUCCESS;
	else
		return RESULT.ERROR;
}

//------------------
//Autosolve strategy (at random...)
SolverStarBattle.prototype.generalSolve = function(){
	//Perform an autopass.
		//It works and clears the puzzle : return "SUCCESS"
		//It doesn't work : return "FAILURE"
		//It works but doesn't clear the puzzle : 
			// Randomly picks a O into a space of the non-full region with the largest O/X ratio 
				// It works and clears the puzzle : return "SUCCESS"
				// It works but doesn't clear the puzzle : repeat the process and call the result.
				// It doesn't work : 
					//Puts an X instead
					// It works : either SUCCESS or repeat the process and call the result. It fails : FAILURE.
	/*var answerPass, answerHypothesis, answer;
	var answerPass = this.multiPass();
	if (answerPass == RESULT.ERROR){
		return RESULT.ERROR;
	}
	var indexRegion = -1;
	var highestRatio;
	var remainingOs;
	var ratio;
	var DEBUGTOTAL = 0;
	for(var ir=0;ir<this.xyLength;ir++){
		remainingOs = this.notPlacedYet.regions[ir].Os;
		if (remainingOs > 0){
			ratio = remainingOs/this.notPlacedYet.regions[ir].Xs;			
			if ((indexRegion == -1) || (ratio > highestRatio)){
				highestRatio = ratio;
				indexRegion = ir;
			}
		}
		DEBUGTOTAL+= remainingOs+this.notPlacedYet.regions[ir].Xs;
	}
	console.log(" YAAAAY ! Merci de l'info ! DEBUGTOTAL = "+DEBUGTOTAL);
	if (indexRegion == -1){
		console.log("This is it ! Well played !");
		return RESULT.SUCCESS;
	}
	else{
		var indexSpace = 0;
		var spacesOfThisRegion = this.spacesByRegion[indexRegion];
		var spaceCoordinates = spacesOfThisRegion[indexSpace];
		while(this.answerGrid[spaceCoordinates.y][spaceCoordinates.x] != UNDECIDED){
			indexSpace++;
			spaceCoordinates = spacesOfThisRegion[indexSpace];
		}
		
		//Try with an O
		answerHypothesis = this.emitHypothesis(spaceCoordinates.x,spaceCoordinates.y,STAR);
		if (answerHypothesis.result == RESULT.SUCCESS){
			answer=this.generalSolve();
		}
		if (answer == RESULT.SUCCESS){
			console.log("This is it ! Well done !");
			return RESULT.SUCCESS;
		}
		this.undoList(answerHypothesis.eventsApplied);

		//Try with an X ?
		answerHypothesis = this.emitHypothesis(spaceCoordinates.x,spaceCoordinates.y,NO_STAR);
		if (answerHypothesis.result == RESULT.SUCCESS){
			return this.generalSolve();
		}
		this.undoList(answerHypothesis.eventsApplied);
		return RESULT.ERROR;
		
	}*/
	
}

//------------------
//Putting symbols into spaces. 

/**Tries to put a symbol into the space of a grid. 3 possibilities :
RESULT.SUCCESS : it was indeed put into the grid ; the number of Os and Xs for this region, row and column are also updated.
RESULT.HARMLESS : said symbol was either already put into that space OUT out of bounds beacuse of automatic operation. Don't change anything to the grid and remaining symbols
ERROR : there is a different symbol in that space. We have done a wrong hypothesis somewhere ! (or the grid was wrong at the basis !)
This is also used at grid start in order to put Xs in banned spaces, hence the check in the NO_STAR part.
*/
SolverStarBattle.prototype.putNew = function(p_x,p_y,p_symbol){
	if ((p_x < 0) || (p_x >= this.xyLength) || (p_y < 0) || (p_y >= this.xyLength) || 
	(this.answerGrid[p_y][p_x] == p_symbol)){
		return RESULT.HARMLESS;
	}
	if (this.answerGrid[p_y][p_x] == UNDECIDED){
		this.answerGrid[p_y][p_x] = p_symbol;
		var indexRegion = this.getRegion(p_x,p_y);
		if (p_symbol == STAR){
			this.notPlacedYet.regions[indexRegion].Os--;
			this.notPlacedYet.rows[p_y].Os--;
			this.notPlacedYet.columns[p_x].Os--;
		}
		if (p_symbol == NO_STAR){
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
	this.answerGrid[p_y][p_x] = UNDECIDED;
	debugTryToPutNew("Removing the following : "+p_x+" "+p_y+" "+symbol);
	if (symbol == STAR){
		this.notPlacedYet.regions[indexRegion].Os++;
		this.notPlacedYet.rows[p_y].Os++;
		this.notPlacedYet.columns[p_x].Os++;
	}
	if (symbol == NO_STAR){
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
	
	if (this.answerGrid[p_y][p_x] != UNDECIDED){
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
			if (symbol == STAR){
				//Add to all 7 neighbors (no one should be star if solved correctly)
				for(roundi=0;roundi<=7;roundi++){
					spaceEventToAdd = new SpaceEvent(NO_STAR,x+ROUND_X_COORDINATES[roundi],y+ROUND_Y_COORDINATES[roundi]);
					eventsToAdd.push(spaceEventToAdd);
					debugTryToPutNew("Event pushed : "+spaceEventToAdd.toString());
				}
				//Final alert on column : fill the missing spaces in the column 
				if (this.notPlacedYet.columns[x].Os == 0){
					for(yi=0;yi<this.xyLength;yi++){
						//there may be stars already, hence the (if UNDECIDED) guard
						if (this.answerGrid[yi][x] == UNDECIDED){
							spaceEventToAdd = new SpaceEvent(NO_STAR,x,yi);
							eventsToAdd.push(spaceEventToAdd);
							debugTryToPutNew("Event pushed : "+spaceEventToAdd.toString()); 
						}
					}
				}
				//Final alert on row
				if (this.notPlacedYet.rows[y].Os == 0){
					for(xi=0;xi<this.xyLength;xi++){
						if (this.answerGrid[y][xi] == UNDECIDED){
							spaceEventToAdd = new SpaceEvent(NO_STAR,xi,y);
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
						if (this.answerGrid[spaceInRegion.y][spaceInRegion.x] == UNDECIDED){
							spaceEventToAdd = new SpaceEvent(NO_STAR,spaceInRegion.x,spaceInRegion.y);
							eventsToAdd.push(spaceEventToAdd);
							debugTryToPutNew("Event pushed : "+spaceEventToAdd.toString());
						}
					}
				}
			}
			if (symbol == NO_STAR){
				//Final alert on column : fill the missing spaces in the column 
				if (this.notPlacedYet.columns[x].Xs == 0){
					for(yi=0;yi<this.xyLength;yi++){
						//there may be stars already, hence the (if UNDECIDED) guard
						if (this.answerGrid[yi][x] == UNDECIDED){
							spaceEventToAdd = new SpaceEvent(STAR,x,yi);
							eventsToAdd.push(spaceEventToAdd);
							debugTryToPutNew("Event pushed : "+spaceEventToAdd.toString());
						}
					}
				}
				//Final alert on row
				if (this.notPlacedYet.rows[y].Xs == 0){
					for(xi=0;xi<this.xyLength;xi++){
						if (this.answerGrid[y][xi] == UNDECIDED){
							spaceEventToAdd = new SpaceEvent(STAR,xi,y);
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
						if (this.answerGrid[spaceInRegion.y][spaceInRegion.x] == UNDECIDED){
							spaceEventToAdd = new SpaceEvent(STAR,spaceInRegion.x,spaceInRegion.y);
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
		return {eventsApplied:[],coherence:COHERENCE.FAILURE};
	} 
	
	//Actually it's fine !
	else{
		debugTryToPutNew("Yes !-----------------"); 
		return {eventsApplied:eventsApplied,coherence:COHERENCE.SUCCESS};
	}
}

/**
Cancel the last list of events since the last "non-deducted" space. TODO : change this name.
*/
SolverStarBattle.prototype.massUndo = function(){
	if (this.happenedEvents.length == 0)
		return;	
	var spaceEventsListToUndo = this.happenedEvents.pop();
	this.undoList(spaceEventsListToUndo);
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
			answer+=eventList[0].toString()+"\n";
		});
	}
	else{
		this.happenedEvents.forEach(function(eventList){
			eventList.forEach(function(spaceEvent){
				answer+=spaceEvent.toString()+"\n" 
			});
			answer+="--------\n";
		});
	}
	return answer;
}