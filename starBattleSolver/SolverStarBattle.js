// ---------------------
// A few constants

const STAR = {
	YES : 2,
	NO : 1,
	UNDECIDED : 0	
}

const stringStarArray = ['-', 'N', 'Y'];
function stringStar(p_star) {
	return stringStarArray[p_star];
}

const STAR_BATTLE_PASS_CATEGORY = {
	REGION : 1,
	ROW : 2,
	COLUMN : 3,
	CUSTOM : 4,
	AGGREGATED_SELECTION : 5
};

// ---------------------
// Setup

function SolverStarBattle(p_wallArray, p_starNumber) {
	GeneralSolver.call(this);
	this.construct(p_wallArray,p_starNumber);
}

SolverStarBattle.prototype = Object.create(GeneralSolver.prototype);
SolverStarBattle.prototype.constructor = SolverStarBattle;

function DummySolver() {
	return new SolverStarBattle(generateWallArray(1, 1), 1);
}

SolverStarBattle.prototype.construct = function(p_wallArray, p_starNumber) { 
	this.generalConstruct();
	this.numberStars = p_starNumber;
	this.answerArray = [];
	this.notPlacedYet = {regions:[], rows:[], columns:[]};
	this.happenedEventsSeries = [];	
	this.gridWall = WallGrid_data(p_wallArray);
	this.regionArray = this.gridWall.toRegionArray();
	this.spacesByRegion = listSpacesByRegion(this.regionArray);
	this.xyLength = p_wallArray.length; 
	this.xLength = this.xyLength; // Mandatory for some puzzles
	this.yLength = this.xyLength;
	
	this.methodsSetDeductions = new ApplyEventMethodPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodsSetPass = {comparisonMethod : comparing, copyMethod : copying,  argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsSetMultipass = {
		generatePassEventsMethod : generateEventsForRLCPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this),
		skipPassMethod : skipPassClosure(this)
	};
	this.setResolution = {
		quickStartEventsMethod : quickStartEventsClosure(this),
		searchSolutionMethod : searchClosure(this),
		isSolvedMethod : isSolvedClosure(this)
	}
	
	this.spacesToSelect = new CheckCollectionDoubleEntry(this.xyLength, this.xyLength);

	
	this.buildPossibilities(p_starNumber); //notPlacedYet
	this.buildAnswerArray(); //answerArray
	this.purifyAnswerArray(); 
}

/**
Puts the number of remaining Stars (Os) and non-stars (Xs) in each region, row and column, assuming we start from scratch.
Precondition : this.spacesByRegion must be refreshed, since it will be needed for region.
*/
SolverStarBattle.prototype.buildPossibilities = function(p_numberStarsPer) {
	this.notPlacedYet = {regions:[],rows:[],columns:[]};
	const complement = this.xyLength - p_numberStarsPer;
	for(var i=0 ; i<this.xyLength ; i++) {
		this.notPlacedYet.rows.push({Os : p_numberStarsPer, Xs : complement});
		this.notPlacedYet.columns.push({Os : p_numberStarsPer, Xs : complement});
	}
	for(var i=0; i < this.spacesByRegion.length;i++) {
		this.notPlacedYet.regions.push({Os:p_numberStarsPer, Xs:this.spacesByRegion[i].length-p_numberStarsPer});
	}
}

/**
Starts the answerArray
*/
SolverStarBattle.prototype.buildAnswerArray = function() {
	this.answerArray = [];
	for(iy = 0; iy < this.xyLength ; iy++){
		this.answerArray.push([]);
		for(ix = 0; ix < this.xyLength ; ix++){
			this.answerArray[iy].push(STAR.UNDECIDED);
		}
	}
}

/**
Puts Xs into the answerArray corresponding to banned spaces 
Precondition : both spacesByRegion and notPlacedYet have been refreshed and answerArray is ok.
*/
SolverStarBattle.prototype.purifyAnswerArray = function() {
	//Removing banned spaces (hence the necessity to have things already updated)
	for(iy = 0; iy < this.xyLength ; iy++) {
		for(ix = 0; ix < this.xyLength ; ix++) {
			if (this.regionArray[iy][ix] == WALLGRID.OUT_OF_REGIONS) {
				this.putNew(ix, iy, STAR.NO);
			}
		}
	}
}

//----------------------
// Misc methods (may be used for drawing and intelligence)

SolverStarBattle.prototype.getAnswer = function(p_x, p_y){return this.answerArray[p_y][p_x];}
SolverStarBattle.prototype.getRegion = function(p_x, p_y){return this.regionArray[p_y][p_x];}
SolverStarBattle.prototype.getRegionSpacesFromSpace = function(p_x, p_y){return this.spacesByRegion[this.regionArray[p_y][p_x]];} // Array of {x, y} items
SolverStarBattle.prototype.getFirstSpaceRegion = function(p_i){return this.spacesByRegion[p_i][0];}

//------------------
// Input methods 

SolverStarBattle.prototype.emitHypothesis = function(p_x, p_y, p_symbol) {
	this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol));
}

SolverStarBattle.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverStarBattle.prototype.emitPassRegion = function(p_indexRegion) {
	const generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.passEvents(generatedEvents, {family : STAR_BATTLE_PASS_CATEGORY.REGION, index : p_indexRegion}); 
}

SolverStarBattle.prototype.emitPassRow = function(p_y) {
	const generatedEvents = this.generateEventsForRowPass(p_y);
	this.passEvents(generatedEvents, {family : STAR_BATTLE_PASS_CATEGORY.ROW, index : p_y}); 
}

SolverStarBattle.prototype.emitPassColumn = function(p_x) {
	const generatedEvents = this.generateEventsForColumnPass(p_x);
	this.passEvents(generatedEvents, {family : STAR_BATTLE_PASS_CATEGORY.COLUMN, index : p_x}); 
}

SolverStarBattle.prototype.makeMultiPass = function() {	
	this.multiPass(this.methodsSetMultipass);
}

// The quickstart is truly quick since it consists of filling 1-size regions with stars. 
SolverStarBattle.prototype.makeQuickStart = function() { 
	this.quickStart();
}

SolverStarBattle.prototype.passSelectedSpaces = function(p_coorsList) {
	const eventsForPass = this.generateEventsForSpacesList(p_coorsList);
	return this.passEvents(eventsForPass, {family : STAR_BATTLE_PASS_CATEGORY.CUSTOM, numberSpaces : eventsForPass.length});
}

SolverStarBattle.prototype.makeResolution = function() { 
	this.resolve();
}

SolverStarBattle.prototype.makeResolutionAdvanced = function() {
	this.quickStart();
	this.setStateHappening(this.advancedSolution());
}

//------------------
// Doing and undoing

applyEventClosure = function(p_solver) {
	return function(eventToApply) {
		return p_solver.putNew(eventToApply.x, eventToApply.y, eventToApply.symbol);
	}
}

/**Tries to put a symbol into the space of a grid. 3 possibilities :
EVENT_RESULT.SUCCESS : it was indeed put into the grid ; the number of Os and Xs for this region, row and column are also updated.
EVENT_RESULT.HARMLESS : said symbol was either already put into that space OUT out of bounds beacuse of automatic operation. Don't change anything to the grid and remaining symbols
EVENT_RESULT.ERROR : there is a different symbol in that space. We have done a wrong hypothesis somewhere ! (or the grid was wrong at the basis !)
This is also used at grid start in order to put Xs in banned spaces, hence the check in the STAR.NO part.
*/
SolverStarBattle.prototype.putNew = function(p_x, p_y, p_symbol) {
	if (this.answerArray[p_y][p_x] == p_symbol) {
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerArray[p_y][p_x] == STAR.UNDECIDED){
		this.answerArray[p_y][p_x] = p_symbol;
		var indexRegion = this.getRegion(p_x,p_y);
		if (p_symbol == STAR.YES){
			this.notPlacedYet.regions[indexRegion].Os--;
			this.notPlacedYet.rows[p_y].Os--;
			this.notPlacedYet.columns[p_x].Os--;
		}
		if (p_symbol == STAR.NO){
			if (indexRegion >= 0){
				this.notPlacedYet.regions[indexRegion].Xs--;				
			}
			this.notPlacedYet.rows[p_y].Xs--;
			this.notPlacedYet.columns[p_x].Xs--;	
		}
		return EVENT_RESULT.SUCCESS;
	}
	if (this.answerArray[p_y][p_x] != p_symbol){
		autoLogDeduction("NOOOO !");
		return EVENT_RESULT.FAILURE;
	}
}

/**
When you want to remove a symbol from a space !
*/
undoEventClosure = function(p_solver) {
	return function(eventToUndo) {
		y = eventToUndo.y;
		x = eventToUndo.x;
		var indexRegion = p_solver.regionArray[y][x];
		var symbol = p_solver.answerArray[y][x];
		p_solver.answerArray[y][x] = STAR.UNDECIDED;
		autoLogDeduction("Removing the following : "+x+" "+y+" "+symbol);
		if (symbol == STAR.YES) {
			p_solver.notPlacedYet.regions[indexRegion].Os++;
			p_solver.notPlacedYet.rows[y].Os++;
			p_solver.notPlacedYet.columns[x].Os++;
		}
		if (symbol == STAR.NO) {
			p_solver.notPlacedYet.regions[indexRegion].Xs++;
			p_solver.notPlacedYet.rows[y].Xs++;
			p_solver.notPlacedYet.columns[x].Xs++;	
		}
	}
}

//--------------------------------

// Intelligence

/**
Tries to put a new symbol into a grid and then forces the filling of all stars and Xs that can be deduced logically without breaking the rules : 
-if a star is placed, all Xs around it
-if a star or an X is placed and it causes to have all the stars/Xs in that region/row/column deduced, fill this region/row/column with the missing symbols
-repeat until either new can be newly deduced (good, although this may be a wrong answer) or there is an absurd situation with two opposite symbols deduced in the same space (bad). 
If the end is successful, the list of spaces will be put into eventsApplied. But this doesn't mean they are all fine !
*/

closureSpace = function(p_solver) { return function(p_x, p_y) {return p_solver.answerArray[p_y][p_x]}}
closureEvent = function(p_state) { return function(p_x, p_y) {return new SpaceEvent(p_x, p_y, p_state)}}

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		x = p_eventBeingApplied.x;
		y = p_eventBeingApplied.y;
		symbol = p_eventBeingApplied.symbol;
		r = p_solver.getRegion(x,y); 
		if (symbol == STAR.YES) {
			//Add to all 7 neighbors (no one should be star if solved correctly)
			p_solver.existingNeighborsCoorsWithDiagonals(x, y).forEach(coors => {
				spaceEventToAdd = new SpaceEvent(coors.x, coors.y, STAR.NO);
				p_listEventsToApply.push(spaceEventToAdd);
				autoLogDeduction("Event pushed : "+spaceEventToAdd.toLogString());
			});
			if (p_solver.notPlacedYet.columns[x].Os == 0) {
				p_listEventsToApply = p_solver.deductionsFillingColumn(p_listEventsToApply, x, closureSpace(p_solver), STAR.UNDECIDED, closureEvent(STAR.NO));
			}
			if (p_solver.notPlacedYet.rows[y].Os == 0) {
				p_listEventsToApply = p_solver.deductionsFillingRow(p_listEventsToApply, y, closureSpace(p_solver), STAR.UNDECIDED, closureEvent(STAR.NO));
			}
			if (p_solver.notPlacedYet.regions[r].Os == 0) {
				p_listEventsToApply = p_solver.fillingSetSpaceDeductions(p_listEventsToApply, p_solver.spacesByRegion[r], closureSpace(p_solver), STAR.UNDECIDED, closureEvent(STAR.NO));
			}
		}
		if (symbol == STAR.NO) {
			if (p_solver.notPlacedYet.columns[x].Xs == 0) {
				p_listEventsToApply = p_solver.deductionsFillingColumn(p_listEventsToApply, x, closureSpace(p_solver), STAR.UNDECIDED, closureEvent(STAR.YES));
			}
			if (p_solver.notPlacedYet.rows[y].Xs == 0) {
				p_listEventsToApply = p_solver.deductionsFillingRow(p_listEventsToApply, y, closureSpace(p_solver), STAR.UNDECIDED, closureEvent(STAR.YES));
			}
			if (p_solver.notPlacedYet.regions[r].Xs == 0) {
				p_listEventsToApply = p_solver.fillingSetSpaceDeductions(p_listEventsToApply, p_solver.spacesByRegion[r], closureSpace(p_solver), STAR.UNDECIDED, closureEvent(STAR.YES));
			}
		}
		return p_listEventsToApply;
	}
}

//------------------
//Passing

generateEventsForRegionPassClosure = function(p_solver) {
	return function(p_indexRegion) {
		return p_solver.generateEventsForRegionPass(p_indexRegion);
	}
}

generateEventsForRegionRowClosure = function(p_solver) {
	return function(p_y) {
		return p_solver.generateEventsForRowPass(p_y);
	}
}

generateEventsForRegionColumnClosure = function(p_solver) {
	return function(p_x) {
		return p_solver.generateEventsForColumnPass(p_x);
	}
}

generateEventsForRLCPassClosure = function(p_solver) {
	return function(p_indexAndFamily) {
		switch (p_indexAndFamily.family) {
			case STAR_BATTLE_PASS_CATEGORY.ROW : return p_solver.generateEventsForRowPass(p_indexAndFamily.index); break;
			case STAR_BATTLE_PASS_CATEGORY.COLUMN : return p_solver.generateEventsForColumnPass(p_indexAndFamily.index); break;
			case STAR_BATTLE_PASS_CATEGORY.REGION : return p_solver.generateEventsForRegionPass(p_indexAndFamily.index); break;
		}
		return [];
	}
}

SolverStarBattle.prototype.generateEventsForRegionPass = function(p_indexRegion) {
	return this.generateEventsForSpacesList(this.spacesByRegion[p_indexRegion]);
}

SolverStarBattle.prototype.generateEventsForRowPass = function(p_y) {
	var eventList = [];
	for (var x = 0; x < this.xyLength ; x++) {
		if (this.answerArray[p_y][x] == STAR.UNDECIDED) { 
			eventList.push([new SpaceEvent(x, p_y, STAR.YES), new SpaceEvent(x, p_y, STAR.NO)]);
		}
	}
	return eventList;
}

SolverStarBattle.prototype.generateEventsForColumnPass = function(p_x) {
	var eventList = [];
	for (var y = 0; y < this.xyLength ; y++) {
		if (this.answerArray[y][p_x] == STAR.UNDECIDED) { 
			eventList.push([new SpaceEvent(p_x, y, STAR.YES), new SpaceEvent(p_x, y, STAR.NO)]);
		}
	}
	return eventList;
}

SolverStarBattle.prototype.generateEventsForSpacesList = function(p_coorsList) {
	var eventList = [];
	p_coorsList.forEach(space => {
		if (this.answerArray[space.y][space.x] == STAR.UNDECIDED) { 
			eventList.push([new SpaceEvent(space.x, space.y, STAR.YES), new SpaceEvent(space.x, space.y, STAR.NO)]);
		}			 
	});
	return eventList;
}

copying = function(p_event) {
	return p_event.copy();
}

comparing = function(p_event1, p_event2) {
	return commonComparison([[p_event1.y, p_event1.x, p_event1.symbol],
	[p_event2.y, p_event2.x, p_event2.symbol]]);
}

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var iafList = [];
		for (var i = 0; i < p_solver.spacesByRegion.length ; i++) {
			iafList.push({index : i, family : STAR_BATTLE_PASS_CATEGORY.REGION}); // , value : p_solver.notPlacedYet.regions[i]
		} 
		for (var i = 0; i < p_solver.xyLength ; i++) {
			iafList.push({index : i, family : STAR_BATTLE_PASS_CATEGORY.ROW}); //, value : p_solver.notPlacedYet.rows[i]
			iafList.push({index : i, family : STAR_BATTLE_PASS_CATEGORY.COLUMN}); //, value : p_solver.notPlacedYet.columns[i]
		}
		iafList.sort(function(p_iaf1, p_iaf2) {
			return p_solver.uncertainity(p_iaf1)-p_solver.uncertainity(p_iaf2); // TODO too lazy to improve it like it is on the other solvers. 
		});
		return iafList;
	}
}

SolverStarBattle.prototype.getNotPlacedYetSet = function(p_indexAndFamily) {
	switch (p_indexAndFamily.family) {
		case STAR_BATTLE_PASS_CATEGORY.ROW : return this.notPlacedYet.rows[p_indexAndFamily.index];
		case STAR_BATTLE_PASS_CATEGORY.COLUMN : return this.notPlacedYet.columns[p_indexAndFamily.index];
		case STAR_BATTLE_PASS_CATEGORY.REGION : return this.notPlacedYet.regions[p_indexAndFamily.index];
	}
}

SolverStarBattle.prototype.uncertainity = function(p_iaf) {
	return this.getNotPlacedYetSet(p_iaf).Xs - this.getNotPlacedYetSet(p_iaf).Os*2;
}

skipPassClosure = function(p_solver) {
	return function (p_iaf) {
		return p_solver.uncertainity(p_iaf) > 5; // Arbitrary value
	}
}

namingCategoryClosure = function(p_solver) {
	return function(p_indexAndFamily) {
		var item;
		const index = p_indexAndFamily.index;
		switch (p_indexAndFamily.family) {
			case STAR_BATTLE_PASS_CATEGORY.REGION : return "Region "+ index + " (" + p_solver.getFirstSpaceRegion(index).x +","+ p_solver.getFirstSpaceRegion(index).y + ")"; break;
			case STAR_BATTLE_PASS_CATEGORY.ROW : return "Row " + index; break;
			case STAR_BATTLE_PASS_CATEGORY.COLUMN : return "Column " + index; break;
			case STAR_BATTLE_PASS_CATEGORY.CUSTOM : return "Selection " + p_indexAndFamily.numberSpaces + " space" + (p_indexAndFamily.numberSpaces > 1 ? "s" : ""); break;
			case STAR_BATTLE_PASS_CATEGORY.AGGREGATED_SELECTION :
				var answer = "Aggregated selection of spaces ";
				p_indexAndFamily.listSelectedIndexes.forEach(selectionElt => {
					item = selectionElt.item;
					switch (item.family) {
						case STAR_BATTLE_PASS_CATEGORY.ROW : answer += "Row."+item.index;break;
						case STAR_BATTLE_PASS_CATEGORY.REGION : answer += "Reg."+item.index+ "(" + p_solver.getFirstSpaceRegion(item.index).x +","+ p_solver.getFirstSpaceRegion(item.index).y + ")";break;
						case STAR_BATTLE_PASS_CATEGORY.COLUMN : answer += "Col."+item.index;break;
					}
					answer += "(+"+selectionElt.countNewSpaces+")" + " ";
				});
			return answer;
			default : return "";
		}
	}
}

//--------------
// Quickstart and resolution

quickStartEventsClosure = function(p_solver) {
	return function() {
		var answer = [{quickStartLabel : "Star battle"}];
		p_solver.spacesByRegion.forEach(sbr => {
			if (sbr.length == 1) {			
				answer.push(new SpaceEvent(sbr[0].x, sbr[0].y, STAR.YES));
			}
		});
		return answer;
	}
}

SolverStarBattle.prototype.isSolved = function() {
	for (var y = 0 ; y < this.yLength ; y++) {
		if (this.notPlacedYet.columns[y].Os != 0) {
			return false;
		}
	}
	return true;
}

function isSolvedClosure(p_solver) {
	return function() {
		return p_solver.isSolved();
	}
}

function searchClosure(p_solver) {
	return function() {
		var mp = p_solver.multiPass(p_solver.methodsSetMultipass);
		if (mp == MULTIPASS_RESULT.FAILURE) {
			return RESOLUTION_RESULT.FAILURE;
		}			
		if (p_solver.isSolved()) {		
			return RESOLUTION_RESULT.SUCCESS;
		}		
	
		// Find index with the most solutions
		var indexesForSolution = [];
		var nbDeductions;
		for (solveX = 0 ; solveX < p_solver.xLength ; solveX++) { // x and y are somehow modified by tryToApplyHypothesis...
			for (solveY = 0 ; solveY < p_solver.yLength ; solveY++) {
				if (p_solver.answerArray[solveY][solveX] == STAR.UNDECIDED) {
					p_solver.tryToApplyHypothesis(new SpaceEvent(solveX, solveY, STAR.YES)); 
					nbDeductions = p_solver.numberOfRelevantDeductionsSinceLastHypothesis();
					indexesForSolution.push({x : solveX, y : solveY, nbd : nbDeductions});
					p_solver.undoToLastHypothesis();				
				}
			}
		}
		indexesForSolution.sort(function(index1, index2) {return commonComparison([index2.nbd, index1.y, index1.x], [index1.nbd, index2.y, index2.x])});
		
		// And this is where things go crazy...
		
		// Sort elements.
		// If we find things worth deducing, deduce them.
		// Otherwise...
		
		var indexForSolution; // Analogic index ! 
		var bestIndex = null;

		var answerForSolution;
		var nbRelevants;
		var tryAgain;
		
		var newPlannedForcedEvents = [];
		const symbols = [STAR.YES, STAR.NO];
		var satisfied = false;
		
		const maxIndexTolerated = Math.min(40, indexesForSolution.length);// Index numeric !
		var is = 0;
		while (!satisfied) {
			indexForSolution = indexesForSolution[is];
			for (var j = 0 ; j < 2 ; j++) {
				const symbol = symbols[j];				
				p_solver.tryToApplyHypothesis(new SpaceEvent(indexForSolution.x, indexForSolution.y, symbol)); // Should not fail because stuff above didn't detect it. (but may still be wrong)
				var mp = p_solver.multiPass(p_solver.methodsSetMultipass);
				if (p_solver.isSolved()) {	// Stuff was enough to solve puzzle
					return RESOLUTION_RESULT.SUCCESS;
				} else if (mp != MULTIPASS_RESULT.FAILURE) {
					if (newPlannedForcedEvents.length == 0) {
						nbRelevants = p_solver.numberOfRelevantDeductionsSinceLastHypothesis();
						if (bestIndex == null || (bestIndex.nbRel < nbRelevants)) {
							bestIndex = {x : indexForSolution.x, y : indexForSolution.y, nbRel : nbRelevants, symbol : symbol};
						}
					}
					p_solver.undoToLastHypothesis(); 
				} else { // Failed multipass
					p_solver.undoToLastHypothesis();
					newPlannedForcedEvents.push(new SpaceEvent(indexForSolution.x, indexForSolution.y, oppositeSymbol(symbol)));
				}
			}
			satisfied = (newPlannedForcedEvents.length > indexesForSolution.length/4 || (bestIndex != null && bestIndex.nbRel > indexesForSolution.length/4) || (is == maxIndexTolerated));
			is++;
		}
		
		// We got new deductions. Let's apply them and retry.
		if (newPlannedForcedEvents.length > 0) {
			var tryOne;
			for (var i = 0 ; i < newPlannedForcedEvents.length ; i++) {
				tryOne = p_solver.tryToApplyHypothesis(newPlannedForcedEvents[i]);
				if (tryOne == DEDUCTIONS_RESULT.FAILURE) {
					return RESOLUTION_RESULT.FAILURE;
				}
			}
			return searchClosure(p_solver)();
		}
		
		// We could NOT be satisfied and got no new deductions ? Well... recursion time !
		return p_solver.tryAllPossibilities([
			new SpaceEvent(bestIndex.x, bestIndex.y, bestIndex.symbol),
			new SpaceEvent(bestIndex.x, bestIndex.y, oppositeSymbol(bestIndex.symbol))
		]);
	}
}

function oppositeSymbol(p_symbol) {
	if (p_symbol == STAR.YES) 
		return STAR.NO;
	else
		return STAR.YES;
}

//--------------
// It's "to string" time !

function answerArrayToString(p_grid) {
	for(yi = 0;yi < p_grid.length ; yi++) {
		row = "";
		for(xi=0 ; xi < p_grid.length ; xi++) {
			row += p_grid[yi][xi];
		}
		console.log(row);
	}
}

//--------------
// Another solution

SolverStarBattle.prototype.advancedSolution = function() {
	var mp, as;
	this.researchStartDate = new Date(); // Research starts before multipass, to be honest, rather than QS. The resolution time may matter too but choices have to be made.
	this.researchSuccessfulAggregatedPasses = 0;
	while (true) {		
		mp = this.multiPass(this.methodsSetMultipass);
		if (mp == MULTIPASS_RESULT.FAILURE) {
			return RESOLUTION_RESULT.FAILURE;
		}			
		if (this.isSolved()) {		
			return RESOLUTION_RESULT.SUCCESS;
		}
		as = this.accumulativeSolution();
		if (as != RESOLUTION_RESULT.SEARCHING) {
			return as;
		}
		if (this.isSolved()) {		
			return RESOLUTION_RESULT.SUCCESS;
		}
	}
}


// Accumulation of spaces into a selection that should be passed.
SolverStarBattle.prototype.accumulativeSolution = function() {
	// Maybe the list of ordered events is already updated, maybe not. Depends on the upper-level algorithm. Anyway, re-performing an ordered list should not be too much. 
	var orderedList = orderedListPassArgumentsClosure(this)();
	this.spacesToSelect.clean();
	this.addNewSpacesInSelection(this.spacesToSelect, orderedList[0]);
	
	var listIndexes = [{item : orderedList[0], countNewSpaces : this.spacesToSelect.list.length}];
	var ok = true;
	var inProgress = false; // Should be "solved" but... 
	var full = false;
	var eventsForPass, p, numberNewSpaces;
	var minPickIndex = 1;
	var maxPickIndex = 10;
	var itemFewerAddedSpaces;
	var countCandidateSpaces = 10;
	var consecutiveIncreases;
	var latestDate = this.researchStartDate;
	do {
		consecutiveIncreases = 0;
		// Aggregate spaces in selection 'till we have enough
		while (consecutiveIncreases < 3 && countCandidateSpaces > this.spacesToSelect.list.length && !full) { 
			// First and foremost, the minimal index ! // minPickIndex = 1st row/region/column which is not completely full.  
			countUndecidedMPI = this.countNewSpacesInSelection(this.spacesToSelect, orderedList[minPickIndex]);
			while (countUndecidedMPI == 0 && !full) {
				minPickIndex++;
				if (maxPickIndex < orderedList.length) {				
					maxPickIndex++;
				}
				if (minPickIndex == orderedList.length) { 
					// All undecided spaces are already in selection... and since we should have made a pass at this point, it means a pass doesn't allow a new deduction.
					full = true; 
				} else {					
					countUndecidedMPI = this.countNewSpacesInSelection(this.spacesToSelect, orderedList[minPickIndex]);
				}
			}		
			// Now, "minPickIndex" is the first (numeric) index in the list orderedList that corresponds to a row/column/reg. with at least 1 unknown space to be aggregated.
			if (!full) { // if this is left unchecked, we can have minPickIndex equal to the size of the list, which is forbidden.
				itemFewerAddedSpaces = {index : minPickIndex, countNewSpaces : countUndecidedMPI} 
				
				// Now onto the selection ! Choose an "item" (row, region or column) whose undecided spaces must be aggregated. It must contain at least one newly aggregated space.
				for (var pi = minPickIndex+1 ; pi < maxPickIndex ; pi++) {
					countUndecided = this.countNewSpacesInSelection(this.spacesToSelect, orderedList[pi]);
					if (countUndecided < itemFewerAddedSpaces.countNewSpaces && countUndecided > 0) {
						itemFewerAddedSpaces.index = pi;
						itemFewerAddedSpaces.countNewSpaces = countUndecided;
					}
					if (countUndecided == 1) {
						break;
					}
				}
				// Item selected. Let's aggregate into selection.		
				listIndexes.push({item : orderedList[itemFewerAddedSpaces.index], countNewSpaces : itemFewerAddedSpaces.countNewSpaces});
				console.log(itemFewerAddedSpaces.index);
				this.addNewSpacesInSelection(this.spacesToSelect, orderedList[itemFewerAddedSpaces.index]); 
				//console.log(" eventually selected --- " + orderedList[itemFewerAddedSpaces.index].family + "-" + orderedList[itemFewerAddedSpaces.index].index + " ; answer " + itemFewerAddedSpaces.countNewSpaces);
				// Note : Difficulty I met = what it took to have the correct "count" value (now stored in countNewSpaces). In reality, some variables were misnamed -names were really confusing, and were likely reinitialized in the wrong place within this method.
				// Yet, the correct item was picked, or seemed to be. Anyway, it works fine now.
				consecutiveIncreases++;
			}
		}			
		while (countCandidateSpaces <= this.spacesToSelect.list.length) {
			countCandidateSpaces += 5;
		}
		// Optionnal increase, but I like it.
		/*if (maxPickIndex < orderedList.length) {				
			maxPickIndex++;
		} */	
		if (new Date() - latestDate > 5000) {		// This log limits the risk of messages to fall !	
			latestDate = new Date();
			console.log("Number of selected spaces for aggregated pass : " + this.spacesToSelect.list.length + " ; number of successful aggregared passes : " + this.researchSuccessfulAggregatedPasses + " ; ms since the starting date : " + (latestDate - this.researchStartDate) + ")"); 
		} // I guess this is necessary to prevent the puzzle to complain about no answer but at least it allows to give some information about the progression. And the time elapsed too. Actually, what takes the most time is a pass.
		var eventsForPass = this.generateEventsForSpacesList(this.spacesToSelect.list);
		p = this.passEvents(eventsForPass, {family : STAR_BATTLE_PASS_CATEGORY.AGGREGATED_SELECTION, listSelectedIndexes : listIndexes.slice()});
		if (p == PASS_RESULT.FAILURE) {
			ok = false;
		} else if (p == PASS_RESULT.SUCCESS) {
			inProgress = true;
			this.researchSuccessfulAggregatedPasses++;
		}
		
	} while (ok && !inProgress && !full);
	if (ok) {		
		if (full && !inProgress) {
			return RESOLUTION_RESULT.MULTIPLE; // WARNING : this one hasn't been tested.
		} else {			
			return RESOLUTION_RESULT.SEARCHING;
		}
	} else {
		return RESOLUTION_RESULT.FAILURE;
	}
} 

SolverStarBattle.prototype.addNewSpacesInSelection = function(p_checker, p_indexAndFamily) {
	this.newSpacesToBeAdded(p_checker, p_indexAndFamily, true);
}

SolverStarBattle.prototype.countNewSpacesInSelection = function(p_checker, p_indexAndFamily) {
	return this.newSpacesToBeAdded(p_checker, p_indexAndFamily, false);
}

SolverStarBattle.prototype.newSpacesToBeAdded = function(p_checker, p_indexAndFamily, p_addMode) {
	var x, y;
	var count = 0;
	switch (p_indexAndFamily.family) {
			case STAR_BATTLE_PASS_CATEGORY.REGION : 
				if (p_addMode) {
					this.spacesByRegion[p_indexAndFamily.index].forEach(coors => {
						x = coors.x;
						y = coors.y;
						if (this.answerArray[y][x] == STAR.UNDECIDED) {						
							p_checker.add(x, y); 
						}
					});
				} else {					
					this.spacesByRegion[p_indexAndFamily.index].forEach(coors => {
						x = coors.x;
						y = coors.y;
						if (!p_checker.array[y][x] && this.answerArray[y][x] == STAR.UNDECIDED) {						
							count++; 
						}
					});
				}
				break;
			case STAR_BATTLE_PASS_CATEGORY.ROW : 
				y = p_indexAndFamily.index;
				if (p_addMode) {
					for (var x = 0 ; x < this.xyLength ; x++) {					
						if (this.answerArray[y][x] == STAR.UNDECIDED) {						
							p_checker.add(x, y); 
						}
					}
				} else {					
					for (var x = 0 ; x < this.xyLength ; x++) {					
						if (!p_checker.array[y][x] && this.answerArray[y][x] == STAR.UNDECIDED) {						
							count++;
						}
					}
				}
				break;
			case STAR_BATTLE_PASS_CATEGORY.COLUMN :
				x = p_indexAndFamily.index;
				if (p_addMode) {
					for (var y = 0 ; y < this.xyLength ; y++) {					
						if (this.answerArray[y][x] == STAR.UNDECIDED) {						
							p_checker.add(x, y); 
						}
					}
				} else {					
					for (var y = 0 ; y < this.xyLength ; y++) {					
						if (!p_checker.array[y][x] && this.answerArray[y][x] == STAR.UNDECIDED) {						
							count++;
						}
					}
				}
				break;
	}
	// console.log(" examining index " + p_indexAndFamily.family + "-" + p_indexAndFamily.index + " ; answer " + count);
	return count;
}






// This one was a naive failure.
/*SolverStarBattle.prototype.getSolution = function() {
	var mp = this.multiPass(this.methodsSetMultipass);
	if (mp == MULTIPASS_RESULT.FAILURE) {
		return RESOLUTION_RESULT.FAILURE;
	}			
	if (this.isSolved()) {		
		return RESOLUTION_RESULT.SUCCESS;
	}
	// this; // Maybe it is already updated, maybe not. Depends on the generic implementation. Anyway, re-performing a orderedList should not be too much. 
	var orderedList = orderedListPassArgumentsClosure(this)();
	if (orderedList.length == 1) { // Only one row/region/column after multipass and you just cannot pass it : multiple solutions ! 
		return RESOLUTION_RESULT.MULTIPLE;
	}
	this.addNewSpacesInSelection(this.spacesToSelect, orderedList[0]);
	this.addNewSpacesInSelection(this.spacesToSelect, orderedList[1]);
	var listItemsForSolution = [orderedList[0], orderedList[1]];
	var ok = true;
	var inProgress = false; // Should be "solved" but... 
	var full = false;
	var i = 2;
	var eventsForPass, p, numberNewSpaces;
	do {
		numberNewSpaces = this.addNewSpacesInSelection(this.spacesToSelect, orderedList[i]);
		i++;
		if (numberNewSpaces == 0) {
			continue;
		}
		var eventsForPass = this.generateEventsForSpacesList(this.spacesToSelect.list);
		p = this.passEvents(eventsForPass, {family : STAR_BATTLE_PASS_CATEGORY.CUSTOM, numberSpaces : eventsForPass.length});
		if (p == PASS_RESULT.FAILURE) {
			ok = false;
		} else if (p == PASS_RESULT.SUCCESS) {
			inProgress = true;
		}
		// Si au moins une case a été ajoutée : 
		// this.push(listItemsForSolution())
	} while (ok && !inProgress && i < orderedList.length);
	if (ok) {		
		return RESOLUTION_RESULT.SUCCESS;
	} else {
		return RESOLUTION_RESULT.FAILURE;
	}
} */