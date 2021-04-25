function SolverTheoryCluster() {
	GeneralSolver.call(this);
	this.construct(generateWallArray(1, 1));
}

SolverTheoryCluster.prototype = Object.create(GeneralSolver.prototype);
SolverTheoryCluster.prototype.constructor = SolverTheoryCluster;

SolverTheoryCluster.prototype.construct = function (p_wallArray) {
	this.generalConstruct();
    this.xLength = p_wallArray[0].length;
    this.yLength = p_wallArray.length;
    this.gridWall = WallGrid_data(p_wallArray);
    this.answerArray = [];
    this.bannedArray = [];
    this.makeItGeographical(this.xLength, this.yLength);
	
	// Artifical deductions
	this.artificialDeductionSpacesList = [];
	this.floatingGrid = [];
	for (iy = 0; iy < this.yLength; iy++) {
        this.floatingGrid.push([]);
        for (ix = 0; ix < this.xLength; ix++) {
            this.floatingGrid[iy].push(ADJACENCY.UNDECIDED);
        }
    }
	
	// Add answer grid, and purify it by the way
    for (iy = 0; iy < this.yLength; iy++) {
        this.answerArray.push([]);
        this.bannedArray.push([]);
        for (ix = 0; ix < this.xLength; ix++) {
			if (p_wallArray[iy][ix].state == WALLGRID.CLOSED) {
				this.answerArray[iy].push(ADJACENCY.NO);
				this.bannedArray[iy].push(true);
				this.addBannedSpace(ix, iy);
			} else {
				this.answerArray[iy].push(ADJACENCY.UNDECIDED);
				this.bannedArray[iy].push(false);
			}
        }
    }
}

//--------------------------------
// Practical methods

SolverTheoryCluster.prototype.getSpaceCoordinates = function (p_indexRegion, p_indexSpace) {
    return this.regions[p_indexRegion].spaces[p_indexSpace];
}

SolverTheoryCluster.prototype.getAnswer = function (p_x, p_y) {
    return this.answerArray[p_y][p_x];
}

SolverTheoryCluster.prototype.isBanned = function (p_x, p_y) {
	return this.bannedArray[p_y][p_x];
}

SolverTheoryCluster.prototype.getArtificialDeduction = function (p_x, p_y) {
    return this.floatingGrid[p_y][p_x];
}

//--------------------------------
// Input methods

SolverTheoryCluster.prototype.emitHypothesis = function (p_x, p_y, p_symbol) {
    if (this.floatingGrid[p_y][p_x] == ADJACENCY.UNDECIDED) {
		this.tryToPutNew(p_x, p_y, p_symbol);
	};
}

SolverTheoryCluster.prototype.emitArtificialDeduction = function (p_x, p_y, p_symbol) {
	if (this.floatingGrid[p_y][p_x] == ADJACENCY.UNDECIDED) {
		this.artificialDeductionSpacesList.push({x : p_x, y : p_y});
	}
	this.floatingGrid[p_y][p_x] = p_symbol;	
}

SolverTheoryCluster.prototype.discardDeductions = function () {
    this.artificialDeductionSpacesList.forEach(space => {
		this.floatingGrid[space.y][space.x] = ADJACENCY.UNDECIDED;
	});
	this.artificialDeductionSpacesList = [];
}

SolverTheoryCluster.prototype.undo = function(){
	this.undoToLastHypothesis(undoEventClosure(this));
}

//--------------------------------
// Doing and undoing

SolverTheoryCluster.prototype.putNew = function (p_x, p_y, p_symbol) {
    if ((p_x < 0) || (p_y < 0) || (p_x >= this.xLength) || (p_y >= this.yLength) || (this.answerArray[p_y][p_x] == p_symbol)) {
        return EVENT_RESULT.HARMLESS;
    }
    if (this.answerArray[p_y][p_x] != ADJACENCY.UNDECIDED) {
        return EVENT_RESULT.ERROR;
    }
    this.answerArray[p_y][p_x] = p_symbol;
    return EVENT_RESULT.SUCCESS;
}

/**
Closure for when we have to apply an event
*/
applyEventClosure = function(p_solver) {
	return function(eventToApply) {
		return p_solver.putNew(eventToApply.myX, eventToApply.myY, eventToApply.symbol);
	}
}

/**
Closure for when we have to undo an event (symetrical to applyEvent)
*/
undoEventClosure = function(p_solver) {
	return function(eventToApply) {
		p_solver.answerArray[eventToApply.myY][eventToApply.myX] = ADJACENCY.UNDECIDED;
	}
}


//------------------------
// Exchange between solver and geographical

/**
Closure that checks about whether a space should belong to the global adjacency or not. 
*/
adjacencyClosure = function (p_solver) {
    return function (p_x, p_y) {
        switch (p_solver.answerArray[p_y][p_x]) {
        case ADJACENCY.YES:
            return ADJACENCY.YES;
            break;
        case ADJACENCY.NO:
            return ADJACENCY.NO;
            break;
        default:
            return ADJACENCY.UNDECIDED;
            break;
        }
    }
};

/**
Transforms a geographical deduction (see dedicated class GeographicalDeduction) into an appropriate event (SolveEvent in our case)
*/
transformClosure = function (p_solver) {
    return function (p_geographicalDeduction) {
		return new SpaceEvent(p_geographicalDeduction.x, p_geographicalDeduction.y, p_geographicalDeduction.opening);
    }
};

//----------------
// Main function

SolverTheoryCluster.prototype.tryToPutNew = function (p_x, p_y, p_symbol) {
	methodPack = new ApplyEventMethodGeographicalPack(
		applyEventClosure(this),
		deductionsClosure(this),
		adjacencyClosure(this),
		transformClosure(this),
		undoEventClosure(this)
	);
	// If we directly passed methods and not closures, we would be stuck because "this" would refer to the Window object which of course doesn't define the properties we want, e.g. the properties of the solvers.
	// All the methods pass the solver as a parameter because they can't be prototyped by it (problem of "undefined" things). 
	this.tryToApplyHypothesis(new SpaceEvent(p_x, p_y, p_symbol), methodPack);
}

//----------------
// "Intelligence"
/**
Adds events that should be added to the p_listEventsToApply (they will be applied soon) in deduction from the p_eventBeingApplied
*/
deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		if (p_eventBeingApplied.p_symbol == ADJACENCY.YES) {
			console.log("Perform artificial deductions for 'open' space at " + p_eventBeingApplied.myX + " " + p_eventBeingApplied.myY);
		} else if (p_eventBeingApplied.p_symbol == ADJACENCY.NO) {
			console.log("Perform artificial deductions for 'closed' space at " + p_eventBeingApplied.myX + " " + p_eventBeingApplied.myY);
		}
		p_listEventsToApply = p_solver.artificialDeductionsList(p_listEventsToApply);
		return p_listEventsToApply; // never forget to return the list that was passed in argument (returning "p_solver.artificialDeductionSpacesList()" after having made it an argument-less function returns nothing past the 1st applied event otherwise ;) )
	}
}

SolverTheoryCluster.prototype.artificialDeductionsList = function (p_artificialDeductionSpacesList) {
	for (var i = 0; i < this.artificialDeductionSpacesList.length ; i++) {
		space = this.artificialDeductionSpacesList[i];
		p_artificialDeductionSpacesList.push(new SpaceEvent(space.x, space.y, this.floatingGrid[space.y][space.x]));		
	}
	this.discardDeductions();
	return p_artificialDeductionSpacesList;	
}
