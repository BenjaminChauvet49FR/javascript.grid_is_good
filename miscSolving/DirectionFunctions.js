function leftNeighborExists(p_x) {
	return p_x > 0;
}

function upNeighborExists(p_y) {
	return p_y > 0;
}

function rightNeighborExists(p_x, p_limit) {
	return p_x <= p_limit - 2;
}

function downNeighborExists(p_y, p_limit) {
	return p_y <= p_limit - 2;
}

// Warning : forces the solver to have functions named xLength, yLength (already forced if the solver is geographic
GeneralSolver.prototype.neighborExists = function(p_x, p_y, p_dir) {
	switch (p_dir) {
		case DIRECTION.LEFT : return leftNeighborExists(p_x); break;
		case DIRECTION.UP : return upNeighborExists(p_y); break;
		case DIRECTION.RIGHT : return rightNeighborExists(p_x, this.xLength); break;
		case DIRECTION.DOWN : return downNeighborExists(p_y, this.yLength); break;
	}
}

GeneralSolver.prototype.distantNeighborExists = function(p_x, p_y, p_dist, p_dir) {
	switch (p_dir) {
		case DIRECTION.LEFT : return p_x >= p_dist; break;
		case DIRECTION.UP : return p_y >= p_dist; break;
		case DIRECTION.RIGHT : return p_x + p_dist < this.xLength; break;
		case DIRECTION.DOWN : return p_y + p_dist < this.yLength; break;
	}
}