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

// Below functions are mostly for editors and not solvers.
existingNeighborsDirections = function(p_x, p_y, p_xLength, p_yLength) {
	var resultDirs = [];
	if (leftNeighborExists(p_x)) {
		resultDirs.push(DIRECTION.LEFT);
	}
	if (upNeighborExists(p_y)) {
		resultDirs.push(DIRECTION.UP);
	}
	if (rightNeighborExists(p_x, p_xLength)) { 
		resultDirs.push(DIRECTION.RIGHT);
	}
	if (downNeighborExists(p_y, p_yLength)) {
		resultDirs.push(DIRECTION.DOWN);
	}
	return resultDirs;
}

existingNeighborsCoors = function(p_x, p_y, p_xLength, p_yLength) {
	var resultCoors = [];
	if (leftNeighborExists(p_x)) {
		resultCoors = [{x : p_x-1, y : p_y}];
	}
	if (upNeighborExists(p_y)) {
		resultCoors.push({x : p_x, y : p_y-1});
	}
	if (rightNeighborExists(p_x, p_xLength)) { // No reuse of the function below, sorry
		resultCoors.push({x : p_x+1, y : p_y});
	}
	if (downNeighborExists(p_y, p_yLength)) {
		resultCoors.push({x : p_x, y : p_y+1});
	}
	return resultCoors;
}

existingNeighborsCoorsDirections = function(p_x, p_y, p_xLength, p_yLength) {
	var resultCoorsDirs = [];
	if (leftNeighborExists(p_x)) {
		resultCoorsDirs = [{x : p_x-1, y : p_y, direction : DIRECTION.LEFT}];
	}
	if (upNeighborExists(p_y)) {
		resultCoorsDirs.push({x : p_x, y : p_y-1, direction : DIRECTION.UP});
	}
	if (rightNeighborExists(p_x, p_xLength)) { // No reuse of the function below, sorry
		resultCoorsDirs.push({x : p_x+1, y : p_y, direction : DIRECTION.RIGHT});
	}
	if (downNeighborExists(p_y, p_yLength)) {
		resultCoorsDirs.push({x : p_x, y : p_y+1, direction : DIRECTION.DOWN});
	}
	return resultCoorsDirs;
}

existingRDNeighborsCoorsDirections = function(p_x, p_y, p_xLength, p_yLength) {
	var resultCoorsDirs = [];
	if (rightNeighborExists(p_x, p_xLength)) {
		resultCoorsDirs.push({x : p_x+1, y : p_y, direction : DIRECTION.RIGHT});
	}
	if (downNeighborExists(p_y, p_yLength)) {
		resultCoorsDirs.push({x : p_x, y : p_y+1, direction : DIRECTION.DOWN});
	}
	return resultCoorsDirs;
}

// Now, only booleans
function neighborExists(p_x, p_y, p_xLength, p_yLength, p_dir) {
	switch (p_dir) {
		case DIRECTION.LEFT : return p_x > 0;
		case DIRECTION.UP : return p_y > 0;
		case DIRECTION.RIGHT : return p_x <= p_xLength - 2;
		case DIRECTION.DOWN : return p_y <= p_yLength - 2;
	}
}