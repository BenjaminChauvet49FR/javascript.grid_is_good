// This method is used only for extra functions that are not "mainline" for the general solver

// p_eventList : the filled event list
// p_coors : must be an array with {x, y} items that represent the spaces
// p_methodValueSpace : method that from an (x, y) space returns a "value" that may be the undecided one. Usually a closure applied to a solver.
// p_undecidedValue : "state that will be filled
// p_methodEvent : method that from an (x, y) set returns an event with the "value to fill". 
GeneralSolver.prototype.deductionsFillingSetSpace = function(p_eventList, p_coors, p_methodValueSpace, p_undecidedValue, p_methodEvent) {
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