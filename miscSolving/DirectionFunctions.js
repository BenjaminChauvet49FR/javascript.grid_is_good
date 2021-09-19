// Used with solver only !
// If this was in the same file as parent "DirectionFunctions.js", the file wouldn't be loaded by editor since GeneralSolver wouldn't be known.

// Warning : forces the solver to have functions named xLength, yLength (already forced if the solver is geographic)

// ---------
// Test if direction exists (from a space)

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

// ---------
// Lists directions and/or coordinates around a space

// Around the space, returns coordinates and/or directions
GeneralSolver.prototype.existingNeighborsCoorsDirections = function(p_x, p_y) {
	return existingNeighborsCoorsDirections(p_x, p_y, this.xLength, this.yLength);
}

GeneralSolver.prototype.existingNeighborsCoors = function(p_x, p_y) {
	return existingNeighborsCoors(p_x, p_y, this.xLength, this.yLength);
}

GeneralSolver.prototype.existingNeighborsCoorsWithDiagonals = function(p_x, p_y) {
	var answer = [];
	KnownDirections.forEach(dir => {
		if (this.neighborExists(p_x, p_y, dir)) {
			answer.push({x : p_x + DeltaX[dir], y : p_y + DeltaY[dir]});
			if (this.neighborExists(p_x, p_y, TurningRightDirection[dir])) { // Supposes a rectangular grid !
				answer.push({x : p_x + DeltaX[dir] + DeltaX[TurningRightDirection[dir]], y : p_y + DeltaY[dir] + DeltaY[TurningRightDirection[dir]]});
			}
		}
	});
	return answer;
}

GeneralSolver.prototype.existingNeighborsDirections = function(p_x, p_y) {
	var answer = [];
	KnownDirections.forEach(dir => {
		if (this.neighborExists(p_x, p_y, dir)) {
			answer.push(dir);
		}
	});
	return answer;
}

// ----------
// Existences of coordinates

GeneralSolver.prototype.areCoordinatesInPuzzle = function(p_x, p_y) {
	return p_x >= 0 && p_y >= 0 && p_x < this.xLength && p_y < this.yLength;
}

GeneralSolver.prototype.testExistingCoordinate = function(coor, dir) {
	switch (dir) {
		case DIRECTION.LEFT : 
		case DIRECTION.UP : return coor >= 0; break;
		case DIRECTION.RIGHT : return coor < this.xLength; break;
		case DIRECTION.DOWN : return coor < this.yLength; break;
	}
}

GeneralSolver.prototype.testExistingCoordinates = function(x, y, dir) {
	switch (dir) {
		case DIRECTION.LEFT : return x >= 0; break;
		case DIRECTION.UP : return y >= 0; break;
		case DIRECTION.RIGHT : return x < this.xLength; break;
		case DIRECTION.DOWN : return y < this.yLength; break;
	}
}