// Smartness for puzzles with "2 black spaces that cannot be adjacent" (Yajilin, Koburin, Regionalin)

LoopSolver.prototype.deductionsTryAndCloseBeforeAndAfter2Closed = function(p_listEventsToApply, p_x, p_y) {
	KnownDirections.forEach(dir => {
		if (this.getClosedEdges(p_x, p_y) == 2) {
			if (this.neighborExists(p_x, p_y, dir) && this.getLink(p_x, p_y, dir) != LOOP_STATE.CLOSED) {
				p_listEventsToApply.push(new SpaceEvent(p_x + DeltaX[dir], p_y + DeltaY[dir], LOOP_STATE.LINKED));
			}
		}
	});
}

LoopSolver.prototype.deductionsQSBeforeAndAfter2Closed = function(p_listQSEvents) { // and not p_listEventsToApply
	for (var y = 0 ; y < this.yLength ; y++) {
		for (var x = 0 ; x < this.xLength ; x++) {
			if (!this.isBanned(x, y)) {
				this.deductionsTryAndCloseBeforeAndAfter2Closed(p_listQSEvents, x, y);
			}
		}
	}
}