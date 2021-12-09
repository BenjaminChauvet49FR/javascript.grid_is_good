// This method is used only for extra functions that are not "mainline" for the general solver

// p_eventList : the filled event list
// p_coors : must be an array with {x, y} items that represent the spaces
// p_methodValueSpace : method that from an (x, y) space returns a "value" that may be the undecided one. Usually a closure applied to a solver.
// p_undecidedValue : "state that will be filled
// p_methodEvent : method that from an (x, y) set returns an event with the "value to fill". 
GeneralSolver.prototype.fillingSetSpaceDeductions = function(p_eventList, p_coors, p_methodValueSpace, p_undecidedValue, p_methodEvent) {
	p_coors.forEach(coors => {
		x = coors.x;
		y = coors.y;
		if (p_methodValueSpace(x, y) == p_undecidedValue) {
			p_eventList.push(p_methodEvent(x, y));
		}
	});
	return p_eventList;
}

// Warning : must have xLength and yLength properties !
GeneralSolver.prototype.deductionsFillingColumn = function(p_eventList, p_x, p_methodValueSpace, p_undecidedValue, p_methodEvent) {
	for (var y = 0 ; y < this.yLength ; y++) {
		if (p_methodValueSpace(p_x, y) == p_undecidedValue) {
			p_eventList.push(p_methodEvent(p_x, y));
		}
	}
	return p_eventList;
}

GeneralSolver.prototype.deductionsFillingRow = function(p_eventList, p_y, p_methodValueSpace, p_undecidedValue, p_methodEvent) {
	for (var x = 0 ; x < this.xLength ; x++) {
		if (p_methodValueSpace(x, p_y) == p_undecidedValue) {
			p_eventList.push(p_methodEvent(x, p_y));
		}
	}
	return p_eventList;
}

GeneralSolver.prototype.deductionsFillingSurroundings = function(p_eventList, p_x, p_y, p_methodValueSpace, p_undecidedValue, p_methodEvent) {
	this.existingNeighborsCoorsDirections(p_x, p_y).forEach(coorsDir => {
		if (p_methodValueSpace(coorsDir.x, coorsDir.y) == p_undecidedValue) {
			p_eventList.push(p_methodEvent(coorsDir.x, coorsDir.y, coorsDir.direction)); // Adds coorsDir
		}
	});
	return p_eventList;
}

/**
Gives all the 'accessible' spaces from p_startingSpaces
within a Manhattan distance of p_range
using the double entry true/false p_volcanicChecker.
Criteria of accessibility is p_isAccessibleMethod.
*/
GeneralSolver.prototype.spacesAccessiblesInRangeFromSetSpaces = function(p_startingSpaces, p_range, p_volcanicChecker, p_isAccessibleMethod) {
	p_volcanicChecker.clean();
	var answer = [];
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
			answer.push({x : x, y : y});
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
	return answer;
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