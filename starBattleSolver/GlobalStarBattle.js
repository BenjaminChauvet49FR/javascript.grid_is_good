function GlobalStarBattle(p_wallGrid,p_starNumber){
	Global.call(this,1,1);
	this.loadGrid(p_wallGrid);
	this.answerGrid = [];
	this.spacesByRegion =  [];
	this.notPlacedYet = {regions:[],rows:[],columns:[]};
	this.happenedEvents = [];	
	this.loadIntelligence(p_starNumber); 
	//xyLength : size of the grids.
	//answerGrid : array(length, length) of int ; contains the desired answers (STAR,NO_STAR,UNDECIDED)
	//notPlacedYet : object{regions{Os,Xs},rows{Os,Xs},columns{Os,Xs}} ; contains the Os and Xs that are yet to be placed in each region (ordered by index), row or column (left to right, top to bottom)
	//spacesByRegion : array(length) of variable arrays of {x,y} ; returns the spaces contained in each region
	//happenedEvents : array of array(Event) ; contains an array of an array of events : for each supposed, the list of itself and all events that were forced by it.
}

GlobalStarBattle.prototype = new Global(1,1);
GlobalStarBattle.prototype.constructor = GlobalStarBattle;
// Credits : https://www.tutorialsteacher.com/javascript/inheritance-in-javascript

/**
Calls the function that launches the intelligence of the grid. Very important !
*/
GlobalStarBattle.prototype.loadIntelligence = function(p_starNumber){
	this.xyLength = this.wallGrid.length;
	this.listSpacesByRegion(); //spacesByRegion
	this.buildPossibilities(p_starNumber); //notPlacedYet
	this.buildAnswerGrid(); //answerGrid
	this.purifyAnswerGrid(); 
	this.happenedEvents = [];
}

/**
Starts the answerGrid
*/
GlobalStarBattle.prototype.buildAnswerGrid = function(){
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
GlobalStarBattle.prototype.purifyAnswerGrid = function(){
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
GlobalStarBattle.prototype.listSpacesByRegion = function(){
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
GlobalStarBattle.prototype.buildPossibilities = function(p_numberStarsPer){
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

GlobalStarBattle.prototype.getAnswer = function(p_x,p_y){
	return this.answerGrid[p_y][p_x];
}

GlobalStarBattle.prototype.getOsRemainRow = function(p_i){return this.notPlacedYet.rows[p_i].Os;}
GlobalStarBattle.prototype.getOsRemainColumn = function(p_i){return this.notPlacedYet.columns[p_i].Os;}
GlobalStarBattle.prototype.getOsRemainRegion = function(p_i){return this.notPlacedYet.regions[p_i].Os;}
GlobalStarBattle.prototype.getXsRemainRow = function(p_i){return this.notPlacedYet.rows[p_i].Xs;}
GlobalStarBattle.prototype.getXsRemainColumn = function(p_i){return this.notPlacedYet.columns[p_i].Xs;}
GlobalStarBattle.prototype.getXsRemainRegion = function(p_i){return this.notPlacedYet.regions[p_i].Xs;}
GlobalStarBattle.prototype.getFirstSpaceRegion = function(p_i){return this.spacesByRegion[p_i][0];}

//------------------
//Strategy management
/**
Admits that a star OR a no-star could be in this space...
*/
GlobalStarBattle.prototype.emitHypothesis = function(p_x,p_y,p_symbol){
	var result = this.tryToPutNew(p_x,p_y,p_symbol);
	if (result != null && result.eventsApplied.length > 0){
		this.happenedEvents.push(result.eventsApplied);
		return {result:RESULT.SUCCESS,eventsApplied:result.eventsApplied};
	}
	return {result:RESULT.FAILURE,eventsApplied:[]};
}

//------------------
//Pass strategy management (warning : heavy code)

/**
Prepares and applies the pass for a region
*/
GlobalStarBattle.prototype.passRegion = function(p_indexRegion){
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
	
	//These variables aren't supposed to be used outside of "passRegion" and "tryToFillThatSpace", hence they aren't mentioned elsewhere
	//TODO : well, what if later I want to make "passes into passes" (e.g. passing a region while passing another one) ? 
	this.pass = {
		certitudes : null,
		spacesToTestArray : spacesToTestArray,
		family : {kind:FAMILY.REGION,index:p_indexRegion}
	};
	return this.goForThePass();
}

/**
Prepares and applies the pass for a row (same as above)
*/
GlobalStarBattle.prototype.passRow = function(p_indexRow){

	var spacesToTestArray = [];
	for(var i=0;i<this.xyLength;i++){
		if (this.answerGrid[p_indexRow][i] == UNDECIDED){
			spacesToTestArray.push({x:i,y:p_indexRow});
		}
	}
	
	this.pass = {
		certitudes : null,
		spacesToTestArray : spacesToTestArray,
		family : {kind:FAMILY.ROW,index:p_indexRow}
	};
	return this.goForThePass();
}

/**
Prepares and applies the pass for a column (same as above)
*/
GlobalStarBattle.prototype.passColumn = function(p_indexColumn){

	var spacesToTestArray = [];
	for(var i=0;i<this.xyLength;i++){
		if (this.answerGrid[i][p_indexColumn] == UNDECIDED){
			spacesToTestArray.push({x:p_indexColumn,y:i});
		}
	}
	
	this.pass = {
		certitudes : null,
		spacesToTestArray : spacesToTestArray,
		family : {kind:FAMILY.COLUMN,index:p_indexColumn}
	};
	return this.goForThePass();
}

/**
Tries all coherent combinations of spaces in this region/row/column and saves the common denominator of all admitted combinations.
Also warns if there is NO valid combination !
*/
GlobalStarBattle.prototype.goForThePass = function(){
	
	if (this.pass.spacesToTestArray.length == 0){
		debugHumanMisclick("Doing a pass on a region/row/column that is already finished !");
		return {result:RESULT.HARMLESS};
	}
	
	this.tryToFillThatSpace(0,[]);
	if (this.pass.certitudes != null){
		if (this.pass.certitudes.length > 0){
			debugPass("We have got certitudes !");
			var spaceEvent;
			for(var i=0;i<this.pass.certitudes.length;i++){
				spaceEvent = this.pass.certitudes[i];
				this.putNew(spaceEvent.x,spaceEvent.y,spaceEvent.symbol);
			}
			if(this.happenedEvents.length > 0){
				this.happenedEvents[this.happenedEvents.length-1] = this.happenedEvents[this.happenedEvents.length-1].concat(this.pass.certitudes);//It is some sort of deduction, you know. Hence the concatenation to the last sequence of "happenedEvents"
			}
			else{
				this.happenedEvents.push(this.pass.certitudes); //If the list was empty, maybe we can set this as a good start.
			}
		}
		else{
			debugPass("Unfortunately, this pass lead to nothing");
		}
		return {result:RESULT.SUCCESS, numberNewEvents:this.pass.certitudes.length};
	}
	else{
		alertPass("This pass allowed us to see that something went WRONG !");
		return {result:RESULT.ERROR};
	}
}

/**
	Recursively tries to put stars or crosses into specific spaces in a region (from first to last according to the order of p_spacesToTestArray) 
	
	AND updates certitudes accordingly. 
	PREREQUISTED :
		-Within this region, all spaces prior to the (p_indexToTry) in the order of (p_spacesToTestArray), must be defined AND the space from (p_indexToTry) mustn't be.
		E.G. if (p_indexToTry = 3), we should have (spaces 0,1,2 of p_spacesToTestArray) already defined, either by test or by deduction.
*/
GlobalStarBattle.prototype.tryToFillThatSpace = function(p_indexToTry,p_eventsPassedInPreviousCalls){
	/*
	Puts a star, puts Space events in "resultPlacing" and sees what happens next :
		-All stars are placed within this region : great, it's one possibility ! Let's update "certitudes" with the "p_eventsPassedInUpperCalls::resultPlacing".
		-An incoherent situation has happened : too bad. Anyway, everything will be cancelled. 
		-A coherent situation has happened but there are still stars to place : 
			-First, let's see the first available space index (FASI). It MUST exist, otherwise, it means all stars have already been placed.
			-call(FASI,copy(p_eventsPassedInUpperCalls::resultPlacing),1ASIndex)
	Cancels the Space events in "resultPlacing"
	Puts a cross, puts Space events in "resultPlacing" and sees what happens next :
		(same as above)
	Cancels the Space events in "resultPlacing"
	
	
	
	Looking for the next available space (if we had (p_indexToTry = 1) and (spaces 2,3) were occupied but not (space 4), then that index is (space 4)... 
	If there are none (p_indexToTry = 1, spaces (2,3,4,5) are all occupied by this star we just set : NAS inexistant.
	*/
	const xToTest = this.pass.spacesToTestArray[p_indexToTry].x;
	const yToTest = this.pass.spacesToTestArray[p_indexToTry].y;

	//TODO : si "certitude est vide" on arrête tout !
	
	var resultPlacing = this.tryToPutNew(xToTest,yToTest,STAR); 
	if (resultPlacing.coherence == COHERENCE.SUCCESS){
		this.goAfterCoherentDeduction(p_indexToTry,resultPlacing.eventsApplied,p_eventsPassedInPreviousCalls);
	}
	resultPlacing = this.tryToPutNew(xToTest,yToTest,NO_STAR); 
	if (resultPlacing.coherence == COHERENCE.SUCCESS){
		this.goAfterCoherentDeduction(p_indexToTry,resultPlacing.eventsApplied,p_eventsPassedInPreviousCalls);
	}
	
}

/**
Performs what comes after a coherent deduction : either the row/column/region is full and it's time to update "certitudes" OR it itsn't and it should be continued.
And don't forget to undo the events after !
*/
GlobalStarBattle.prototype.goAfterCoherentDeduction = function(p_indexSuccessfullyTried,p_listAppliedEvents, p_eventsPassedInPreviousCalls){
	if (this.testFull()) //The desired region/row/column is full ? Okay !
		this.updateCertitudes(p_listAppliedEvents.concat(p_eventsPassedInPreviousCalls)); //Update the list of "things that are certain"
	else{
		//Look for the first index of available space (there MUST be one) then call the function
		var nextSpace;
		var nextIndex = p_indexSuccessfullyTried;
		do{
			nextIndex++;
			nextSpace = this.pass.spacesToTestArray[nextIndex];
		}while(this.answerGrid[nextSpace.y][nextSpace.x] != UNDECIDED);
		this.tryToFillThatSpace(nextIndex, p_listAppliedEvents.concat(p_eventsPassedInPreviousCalls));
	}
	this.undoList(p_listAppliedEvents);
}

/**
Tests whether the concerned family (row/column/region) is full (e.g. remaining stars and Xs are at 0)
*/
GlobalStarBattle.prototype.testFull = function(){
	//Assumption : if the number of remaining Os in a family is to 0, then so should be the remaining Xs.
	switch(this.pass.family.kind){
		case FAMILY.REGION:return (this.notPlacedYet.regions[this.pass.family.index].Os == 0);break;
		case FAMILY.ROW:return (this.notPlacedYet.rows[this.pass.family.index].Os == 0);break;
		case FAMILY.COLUMN:return (this.notPlacedYet.columns[this.pass.family.index].Os == 0);break;
	}
}


GlobalStarBattle.prototype.updateCertitudes = function(p_eventsApplied){
	if (this.pass.certitudes == null){
		this.pass.certitudes = p_eventsApplied.sort(compareSpaceEvents);
	}
	else{
		var sortedEventsApplied = p_eventsApplied.sort(compareSpaceEvents);
		this.pass.certitudes = interSortedSpaceEventList(sortedEventsApplied,this.pass.certitudes);
	}
}

//------------------
//Multipass strategy

/**
Passes all regions/rows/columns in the order of size until no deduction can be done anymore.
Warning : if something wrong is found, everything will be deleted until the new pass ! (TODO : this behavior seems like it can be changed)
*/
GlobalStarBattle.prototype.multiPass = function(){
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
			if (bilanPass.result == RESULT.ERROR){
				ok = false;
				this.massUndo();
				return;
			}
			if (bilanPass.result == RESULT.SUCCESS && bilanPass.numberNewEvents > 0){
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
GlobalStarBattle.prototype.generalSolve = function(){
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
GlobalStarBattle.prototype.putNew = function(p_x,p_y,p_symbol){
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
GlobalStarBattle.prototype.remove = function(p_x,p_y){
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
GlobalStarBattle.prototype.tryToPutNew = function(p_x,p_y,p_symbol){
	
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
GlobalStarBattle.prototype.massUndo = function(){
	if (this.happenedEvents.length == 0)
		return;	
	var spaceEventsListToUndo = this.happenedEvents.pop();
	this.undoList(spaceEventsListToUndo);
} 

/**
Cancels a list of events passed in argument
*/
GlobalStarBattle.prototype.undoList = function(p_list){
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
GlobalStarBattle.prototype.happenedEventsToString = function(p_onlyAssumed){
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