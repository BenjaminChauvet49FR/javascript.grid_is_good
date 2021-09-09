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
	var answer = [];
	if (leftNeighborExists(p_x)) {
		answer.push(DIRECTION.LEFT);
	}
	if (upNeighborExists(p_y)) {
		answer.push(DIRECTION.UP);
	}
	if (rightNeighborExists(p_x, p_xLength)) { 
		answer.push(DIRECTION.RIGHT);
	}
	if (downNeighborExists(p_y, p_yLength)) {
		answer.push(DIRECTION.DOWN);
	}
	return answer;
}

existingNeighborsCoorsDirections = function(p_x, p_y, p_xLength, p_yLength) {
	var answer = [];
	if (leftNeighborExists(p_x)) {
		answer = [{x : p_x-1, y : p_y, direction : DIRECTION.LEFT}];
	}
	if (upNeighborExists(p_y)) {
		answer.push({x : p_x, y : p_y-1, direction : DIRECTION.UP});
	}
	if (rightNeighborExists(p_x, p_xLength)) { // No reuse of the function below, sorry
		answer.push({x : p_x+1, y : p_y, direction : DIRECTION.RIGHT});
	}
	if (downNeighborExists(p_y, p_yLength)) {
		answer.push({x : p_x, y : p_y+1, direction : DIRECTION.DOWN});
	}
	return answer;
}

existingRDNeighborsCoorsDirections = function(p_x, p_y, p_xLength, p_yLength) {
	var answer = [];
	if (rightNeighborExists(p_x, p_xLength)) {
		answer.push({x : p_x+1, y : p_y, direction : DIRECTION.RIGHT});
	}
	if (downNeighborExists(p_y, p_yLength)) {
		answer.push({x : p_x, y : p_y+1, direction : DIRECTION.DOWN});
	}
	return answer;
}