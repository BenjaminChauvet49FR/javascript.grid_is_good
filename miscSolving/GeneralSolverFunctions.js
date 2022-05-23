// This file is used only for extra functions that are not "mainline" for the general solver

// p_listEventsToApply : the filled event list
// p_coors : must be an array with {x, y} items that represent the spaces
// p_methodValueSpace : method that from an (x, y) space returns a "value" that may be the undecided one. Usually a closure applied to a solver.
// p_undecidedValue : "state that will be filled
// p_methodEvent : method that from an (x, y) set returns an event with the "value to fill". 
GeneralSolver.prototype.deductionsFillingSetSpace = function(p_listEventsToApply, p_coors, p_methodValueSpace, p_undecidedValue, p_methodEvent) {
	p_coors.forEach(coors => {
		x = coors.x;
		y = coors.y;
		if (p_methodValueSpace(x, y) == p_undecidedValue) {
			p_listEventsToApply.push(p_methodEvent(x, y));
		}
	});
}

// Warning : must have xLength and yLength properties !
GeneralSolver.prototype.deductionsFillingColumn = function(p_listEventsToApply, p_x, p_methodValueSpace, p_undecidedValue, p_methodEvent) {
	for (var y = 0 ; y < this.yLength ; y++) {
		if (p_methodValueSpace(p_x, y) == p_undecidedValue) {
			p_listEventsToApply.push(p_methodEvent(p_x, y));
		}
	}
}

GeneralSolver.prototype.deductionsFillingRow = function(p_listEventsToApply, p_y, p_methodValueSpace, p_undecidedValue, p_methodEvent) {
	for (var x = 0 ; x < this.xLength ; x++) {
		if (p_methodValueSpace(x, p_y) == p_undecidedValue) {
			p_listEventsToApply.push(p_methodEvent(x, p_y));
		}
	}
}

GeneralSolver.prototype.deductionsFillingSurroundings = function(p_listEventsToApply, p_x, p_y, p_methodValueSpace, p_undecidedValue, p_methodEvent) {
	this.existingNeighborsCoorsDirections(p_x, p_y).forEach(coorsDir => {
		if (p_methodValueSpace(coorsDir.x, coorsDir.y) == p_undecidedValue) {
			p_listEventsToApply.push(p_methodEvent(coorsDir.x, coorsDir.y, coorsDir.direction)); // Adds coorsDir
		}
	});
}

/**
Gives all the 'accessible' spaces from p_startingSpaces
within a Manhattan distance of p_range
using the double entry true/false p_volcanicChecker.
Criteria of accessibility is p_isAccessibleMethod.
*/
GeneralSolver.prototype.spacesAccessiblesInRangeFromSetSpaces = function(p_startingSpaces, p_range, p_volcanicChecker, p_isAccessibleMethod) {
	p_volcanicChecker.clean();
	var resultCoors = [];
	var newsSpacesToExplore = p_startingSpaces;
	newsSpacesToExplore.forEach(coors => {		
		p_volcanicChecker.add(coors.x, coors.y);
	});
	var spacesFloorBelow;
	var height = p_range;
	var x, y, otherGuarded, x2, y2, guardedSpaces;
	while(newsSpacesToExplore.length > 0 && height >= 0) {
		spacesFloorBelow = [];
		newsSpacesToExplore.forEach(coors => {
			x = coors.x;
			y = coors.y;
			resultCoors.push({x : x, y : y});
			this.existingNeighborsCoors(x, y).forEach(coors2 => {
				x2 = coors2.x;
				y2 = coors2.y;
				if (p_isAccessibleMethod(x2, y2) && p_volcanicChecker.add(x2, y2)) {
					spacesFloorBelow.push({x : x2, y : y2});
				}
			});
		});
		newsSpacesToExplore = spacesFloorBelow;
		height--;
	}
	return resultCoors;
}

// Returns spaces closest from p_startingSpaces first. 
// It may be equal to spacesAccessiblesInRangeFromSetSpaces in fact
GeneralSolver.prototype.spacesAccessiblesInRangeFromSetSpacesClosestFirst = function(p_startingSpaces, p_range, p_volcanicChecker, p_isAccessibleMethod) {
	return this.spacesAccessiblesInRangeFromSetSpaces(p_startingSpaces, p_range, p_volcanicChecker, p_isAccessibleMethod);
}


function standardAdjacencyEventString(p_x, p_y, p_adjacency, p_stringLabel) {
	if (!p_stringLabel) {
		p_stringLabel = "";
	} else {
		p_stringLabel += " ";
	}
	return "[" + p_stringLabel + LabelAdjacency[p_adjacency]+" "+p_x+","+p_y+"]";
}

// ----
// Fill spaces in rectangle

GeneralSolver.prototype.deductionsLastUndecided2x2ForRectangle = function(p_listEventsToApply, p_x, p_y, p_valueUndecided, p_valueNoRectangle, p_valueYesRectangle,p_spacesValueMethod, p_eventMethod) {
	if (this.getAnswer(p_x, p_y) == p_valueUndecided) {
		conclusions = [p_valueUndecided, p_valueUndecided, p_valueUndecided, p_valueUndecided];
		if (leftNeighborExists(p_x)) {
			if (upNeighborExists(p_y)) {
				conclusions[0] = this.conclusionLastUndecided2x2(p_x-1, p_y-1, p_x, p_y, p_valueUndecided, p_valueNoRectangle, p_valueYesRectangle, p_spacesValueMethod);
			}
			if (downNeighborExists(p_y, this.yLength)) {
				conclusions[1] = this.conclusionLastUndecided2x2(p_x-1, p_y+1, p_x, p_y, p_valueUndecided, p_valueNoRectangle, p_valueYesRectangle, p_spacesValueMethod);
			}
		}
		if (rightNeighborExists(p_x, this.xLength)) {
			if (upNeighborExists(p_y)) {
				conclusions[2] = this.conclusionLastUndecided2x2(p_x+1, p_y-1, p_x, p_y, p_valueUndecided, p_valueNoRectangle, p_valueYesRectangle, p_spacesValueMethod);
			}
			if (downNeighborExists(p_y, this.yLength)) {
				conclusions[3] = this.conclusionLastUndecided2x2(p_x+1, p_y+1, p_x, p_y, p_valueUndecided, p_valueNoRectangle, p_valueYesRectangle, p_spacesValueMethod);
			}
		}
		var square = conclusions[0];
		var ok = true;
		var i = 1;
		// All 4 conclusions can be UNDECIDED, YES or NO. There mustn't be both YES and NO among the 4, and if successful either YES or NO is chosen in priority over UNDECIDED.
		while (ok && i < 4) {
			ok = (square == p_valueUndecided) || (conclusions[i] == p_valueUndecided) || (conclusions[i] == square);
			if (conclusions[i] != p_valueUndecided) {
				square = conclusions[i];				
			}
			i++;
		}
		if (ok) {
			if (square != p_valueUndecided) {
				p_listEventsToApply.push(p_eventMethod(p_x, p_y, square)); 
			}
		} else {
			p_listEventsToApply.push(new FailureEvent()); 
		}
	}
}

// Tests how should be filled the last square (x2, y2) in a 2x2 square from the remaining 3 ones (x1y1, x1y2, x2y1) (all 4 squares exist in the grid - the x2, y2 is in an unknown state)
GeneralSolver.prototype.conclusionLastUndecided2x2 = function(p_x1, p_y1, p_x2, p_y2, p_valueUndecided, p_valueNoRectangle, p_valueYesRectangle, p_spacesValueMethod) {
	var count = 0;
	var atLeastOneUndecided = false; 
	var space1 = p_spacesValueMethod(p_x1, p_y1); 
	var space2 = p_spacesValueMethod(p_x2, p_y1);
	var space3 = p_spacesValueMethod(p_x1, p_y2);
	[space1, space2, space3].forEach(state => {// Possible optimization that involves removing "atLeastOneUndecided"
		if (state == p_valueUndecided) {
			atLeastOneUndecided = true;
		}
		if (state == FILLING.YES) {
			count++;
		}
	});
	if (!atLeastOneUndecided) {
		if (count == 3) {
			return p_valueYesRectangle;
		} else if (count == 2) {
			return p_valueNoRectangle;
		}
	}
	return p_valueUndecided;
}

