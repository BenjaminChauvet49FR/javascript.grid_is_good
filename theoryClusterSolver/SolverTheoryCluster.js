function SolverTheoryCluster() {
    this.construct(generateWallArray(1,1),generateSymbolArray(1,1));
}

SolverTheoryCluster.prototype.construct = function (p_wallArray, p_numberGrid) {
    this.xLength = p_wallArray[0].length;
    this.yLength = p_wallArray.length;
    this.wallGrid = WallGrid_data(p_wallArray);
    this.answerGrid = [];
    this.clusterInvolvedSolver = new ClusterInvolvedSolver(this.xLength, this.yLength);

    // Initialize the required grids (notably answerGrid) and the number of regions
    for (iy = 0; iy < this.yLength; iy++) {
        this.answerGrid.push([]);
        for (ix = 0; ix < this.xLength; ix++) {
            this.answerGrid[iy].push(SPACE.UNDECIDED);
        }
    }

    //IMPORTANT : Purification not performed yet !
}

SolverTheoryCluster.prototype.getSpaceCoordinates = function (p_indexRegion, p_indexSpace) {
    return this.regions[p_indexRegion].spaces[p_indexSpace];
}

SolverTheoryCluster.prototype.getAnswer = function (p_x, p_y) {
    return this.answerGrid[p_y][p_x];
}

//--------------------------------
SolverTheoryCluster.prototype.emitHypothesis = function (p_x, p_y, p_symbol) {
    this.tryToPutNew(p_x, p_y, p_symbol);
}

//--------------------------------

SolverTheoryCluster.prototype.putNew = function (p_x, p_y, p_symbol) {
    if ((p_x < 0) || (p_y < 0) || (p_x >= this.xLength) || (p_y >= this.yLength) || (this.answerGrid[p_y][p_x] == p_symbol)) {
        return RESULT.HARMLESS;
    }
    if (this.answerGrid[p_y][p_x] != SPACE.UNDECIDED) {
        return RESULT.ERROR;
    }
    this.answerGrid[p_y][p_x] = p_symbol;
    return RESULT.SUCCESS;
}

SolverTheoryCluster.prototype.tryToPutNew = function (p_x, p_y, p_symbol) {
	// If we directly passed methods and not closures, we would be stuck because "this" would refer to the Window object which of course doesn't define the properties we want, e.g. the properties of the solvers.
	// All the methods pass the solver as a parameter because they can't be prototyped by it (problem of "undefined" things). 
	this.clusterInvolvedSolver.tryToApply(
		new SpaceEvent(p_x, p_y, p_symbol),
		applyEventClosure(this),
		deductionsClosure(this),
		adjacencyClosure(this),
		transformClosure(this),
		undoEventClosure(this) 
	);
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
		p_solver.answerGrid[eventToApply.myY][eventToApply.myX] = SPACE.UNDECIDED;
	}
}

/**
Adds events that should be added to the p_listEventsToApply (they will be applied soon) in deduction from the p_eventBeingApplied
*/
deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		if (p_eventBeingApplied.p_symbol == SPACE.OPEN) {
			console.log("Perform deductions for 'open' space at " + p_eventBeingApplied.myX + " " + p_eventBeingApplied.myY);
		} else if (p_eventBeingApplied.p_symbol == SPACE.CLOSED) {
			console.log("Perform deductions for 'closed' space at " + p_eventBeingApplied.myX + " " + p_eventBeingApplied.myY);
		}
		return p_listEventsToApply;
	}
}

/**
Closure that checks about whether a space should belong to the global adjacency or not. 
*/
adjacencyClosure = function (p_solver) {
    return function (p_x, p_y) {
        switch (p_solver.answerGrid[p_y][p_x]) {
        case SPACE.OPEN:
            return ADJACENCY.YES;
            break;
        case SPACE.CLOSED:
            return ADJACENCY.NO;
            break;
        default:
            return ADJACENCY.UNDEFINED;
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

/**
Used by outside ! //TODO quand on harmonisera les noms des méthodes...
 */
SolverTheoryCluster.prototype.undoToLastHypothesis = function () {
    this.clusterInvolvedSolver.undoToLastHypothesis(undoEventClosure(this));
}