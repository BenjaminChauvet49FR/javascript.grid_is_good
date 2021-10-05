// Note : right now this is a set of methods but later this may become a standing class.

GeneralSolver.prototype.makeItGeographical = function(p_xLength, p_yLength) {
	this.xLength = p_xLength;
	this.yLength = p_yLength;
	this.atLeastOneOpen = false;
    this.adjacencyLimitGrid = createAdjacencyLimitGrid(this.xLength, this.yLength);
    this.adjacencyLimitSpacesList = [];
	this.bannedSpacesList = [];
}

// Mandatory for puzzle with banned spaces ! To be called on every banned space when setting up puzzle.
GeneralSolver.prototype.addBannedSpace = function(p_x, p_y) {
	this.bannedSpacesList.push({x : p_x, y : p_y});
}

// -----------------------
// Some deduction methods

GeneralSolver.prototype.alert2x2Areas = function(p_listEvents, p_methodSet, p_x, p_y) {
	isOccupiedMethod = isOccupiedClosure(p_methodSet.adjacencyMethod);
	retrieveGDMethod = p_methodSet.retrieveGeographicalDeductionMethod;
	if (p_x > 0) {
		if (isOccupiedMethod(p_x-1, p_y)) { // Left space occupied ? Check spaces above / below
			if (p_y > 0) {
				p_listEvents = duelOccupation(p_listEvents, isOccupiedMethod, retrieveGDMethod, p_x-1, p_y-1, p_x, p_y-1);
			}
			if (p_y <= this.yLength-2) {
				p_listEvents = duelOccupation(p_listEvents, isOccupiedMethod, retrieveGDMethod, p_x-1, p_y+1, p_x, p_y+1);
			}
		} else { // Left space unoccupied : check if spaces above/below are occupied.
			if (((p_y > 0) && (isOccupiedMethod(p_x-1, p_y-1)) && isOccupiedMethod(p_x, p_y-1)) ||
				((p_y <= this.yLength-2) && (isOccupiedMethod(p_x-1, p_y+1)) && isOccupiedMethod(p_x, p_y+1))) {
				p_listEvents.push(retrieveGDMethod({x : p_x-1, y : p_y, opening : ADJACENCY.NO}));
			} 
		}
	}
	if (p_x <= this.xLength-2) {
		if (isOccupiedMethod(p_x+1, p_y)) { // Right space occupied ? Check spaces above / below
			if (p_y > 0) {
				p_listEvents = duelOccupation(p_listEvents, isOccupiedMethod, retrieveGDMethod, p_x+1, p_y-1, p_x, p_y-1);
			}
			if (p_y <= this.yLength-2) {
				p_listEvents = duelOccupation(p_listEvents, isOccupiedMethod, retrieveGDMethod, p_x+1, p_y+1, p_x, p_y+1);
			}
		} else { // Right space unoccupied : check if spaces above/below are occupied.
			if (((p_y > 0) && (isOccupiedMethod(p_x+1, p_y-1)) && isOccupiedMethod(p_x, p_y-1)) ||
				((p_y <= this.yLength-2) && (isOccupiedMethod(p_x+1, p_y+1)) && isOccupiedMethod(p_x, p_y+1))) {
				p_listEvents.push(retrieveGDMethod({x : p_x+1, y : p_y, opening : ADJACENCY.NO}));
			} 
		}
	}
	return p_listEvents;
}

duelOccupation = function(p_listEvents, p_isOccupiedMethod, p_retrieveGDMethod, p_x1, p_y1, p_x2, p_y2) {
	if (p_isOccupiedMethod(p_x1, p_y1)) {
		p_listEvents.push(p_retrieveGDMethod({x : p_x2, y : p_y2, opening : ADJACENCY.NO}));
	} 
	if (p_isOccupiedMethod(p_x2, p_y2)) {
		p_listEvents.push(p_retrieveGDMethod({x : p_x1, y : p_y1, opening : ADJACENCY.NO}));
	} 
	return p_listEvents;
}

isOccupiedClosure = function(p_methodOpening) {
	return function(p_x, p_y) {
		return (p_methodOpening(p_x, p_y) == ADJACENCY.YES);
	}
}

// ---------------
// GeographicalDeduction - the object utilised by the adjacency checker.

function GeographicalDeduction(p_x, p_y, p_opening) {
	this.opening = p_opening;
	this.x = p_x;
	this.y = p_y;
}

GeographicalDeduction.prototype.toLogString = function() {	
	return "[GD "+this.x+","+this.y+"] ("+this.opening+")";
}

