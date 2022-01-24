//Offensive !
LoopSolver.prototype.getNumber = function(p_x, p_y) {
	return this.dataArray[p_y][p_x].number;
}

LoopSolver.prototype.hasPearl = function(p_x, p_y) {
	return this.dataArray[p_y][p_x].pearl != null;
}

LoopSolver.prototype.getMax = function(p_x, p_y, p_dir) {
	return this.dataArray[p_y][p_x].maxes[p_dir];
}

LoopSolver.prototype.setMax = function(p_x, p_y, p_dir, p_value) {
	this.dataArray[p_y][p_x].maxes[p_dir] = p_value;
}

LoopSolver.prototype.getMin = function(p_x, p_y, p_dir) {
	return this.dataArray[p_y][p_x].mins[p_dir];
}

LoopSolver.prototype.setMin = function(p_x, p_y, p_dir, p_value) {
	this.dataArray[p_y][p_x].mins[p_dir] = p_value;
}
