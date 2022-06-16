LOOP_PASS_CATEGORY.PEARLY = -1;

generateEventsForPassClosure = function (p_solver) {
	return function (p_indexFamily) {
		return p_solver.passPearlDynamic(p_indexFamily.x, p_indexFamily.y);
	}
}

LoopSolver.prototype.passPearlDynamic = function(p_x, p_y) {
	var listEventsChoice = [];
	var min, max;
	KnownDirections.forEach(dir => {
		min = this.getMin(p_x, p_y, dir);
		max = this.getMax(p_x, p_y, dir);
		for (i = min; i < max ; i++) {
			listEventsChoice.push([new LinkEvent(p_x + i*DeltaX[dir], p_y + i*DeltaY[dir], dir, LOOP_STATE.LINKED), 
			new LinkEvent(p_x + i*DeltaX[dir], p_y + i*DeltaY[dir], dir, LOOP_STATE.CLOSED)]);
		}
	});
	return listEventsChoice; 
}

orderedListPassArgumentsClosureSolverPearly = function(p_solver) {
	return function() {
		var listIndexesPass = [];
		p_solver.pearlCoors.forEach(coors => {
			listIndexesPass.push({category : LOOP_PASS_CATEGORY.PEARLY, x : coors.x, y : coors.y});
		});
		return listIndexesPass;
	}
}

namingCategoryPassClosure = function(p_solver) {
	return function(p_passIndex) {
		const x = p_passIndex.x;
		const y = p_passIndex.y;
		return "Pearl dynamic " + p_solver.clueGrid.get(x, y) + " " + x + "," + y;
	}
}