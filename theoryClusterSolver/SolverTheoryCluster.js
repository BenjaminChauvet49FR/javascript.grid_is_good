/*const NOT_FORCED = -1;
const NOT_RELEVANT = -1;
const SPACE = {
    OPEN: 'O',
    CLOSED: 'C',
    UNDECIDED: '-'
};
const RESULT = {
    SUCCESS: 3,
    ERROR: 1,
    HARMLESS: 2
}*/

function SolverTheoryCluster() {
    this.constructForReal(generateWallArray(1,1),generateSymbolArray(1,1));
}


SolverTheoryCluster.prototype.constructForReal = function (p_wallArray, p_numberGrid) {	
	this.construct(p_wallArray, p_numberGrid); //551551 Méthode à rebaptiser "initializeConstruct"
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
	this.clusterInvolvedSolver.tryToApply(
		new SpaceEvent(p_x, p_y, p_symbol),
		applyEventMethod(this),
		deductionsMethod(this),
		adjacencyClosure(this.answerGrid),
		transformMethod(this),
		undoEventMethod(this) 
	);
}

/**
Closure for when we have to apply an event
*/
//SolverTheoryCluster.prototype.applyEventMethod = function(p_solver) {
applyEventMethod = function(p_solver) {
	return function(eventToApply) {
		return p_solver.putNew(eventToApply.myX, eventToApply.myY, eventToApply.symbol);
	}
}

/**
Closure for when we have to undo an event (symetrical to apply)
*/
undoEventMethod = function(p_solver) {
	return function(eventToApply) {
		p_solver.answerGrid[eventToApply.myY][eventToApply.myX] = SPACE.UNDECIDED;
	}
}

/**
Adds events that should be added to the p_listEventsToApply (they will be applied soon) in deduction from the p_eventBeingApplied
*/
deductionsMethod = function (p_solver) {
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
Closure that checks about adjacencies
*/
adjacencyClosure = function (p_grid) {
    return function (p_x, p_y) {
        switch (p_grid[p_y][p_x]) {
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
    //If not for a closure, adjacencyCheck wouldn't be able to access the grid because "this.answerGrid" is undefined for the Window object.
};

/**
Transforms a geographical deduction into an appropriate event
*/
transformMethod = function (p_solver) {
    return function (p_geographicalDeduction) {
		return new SpaceEvent(p_geographicalDeduction.x, p_geographicalDeduction.y, p_geographicalDeduction.opening);
    }
    //If not for a closure, adjacencyCheck wouldn't be able to access the grid because "this.answerGrid" is undefined for the Window object.
};

/**
Used by outside !
 */
SolverTheoryCluster.prototype.undoToLastHypothesis = function () {
    this.clusterInvolvedSolver.undoToLastHypothesis(undoEventMethod(this));
}