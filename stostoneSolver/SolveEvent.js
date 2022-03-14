// Setup et simili-constructeurs

function SolveEvent(){}

const KIND = {
	SYMBOL : 1, // Classic yes/no 
	HEIGHT_STONE : 2, 
	// Supposed height in the stack of the highest row in a region (example : a region expands vertically from y=2 to y=5, and a stone in the stack has a yStack of 0 in y=3 (spaces with y=0,1,2 above have no stones) : height region is -1 ; it may be lower than 0 (but not higher than heightSize since it refers to the highest row)
	HEIGHT_DIFFERENCE : 3 // Difference between two 'height regions' of the region
}

SpaceEvent = function(p_x, p_y, p_symbol) {
	this.kind = KIND.SYMBOL;
	this.x = p_x;
	this.y = p_y;
	this.symbol = p_symbol;
}

SpaceEvent.prototype.copy = function() {
	return new SpaceEvent(this.x, this.y, this.symbol);
}

HeightStoneEvent = function(p_index, p_heightStoneYHighest) {
	this.kind = KIND.HEIGHT_STONE;
	this.heightStoneYHighest = p_heightStoneYHighest;
	this.index = p_index;
	this.outOfPass = true;
}

HeightStoneAuxEvent = function(p_y, p_yStone, p_region) {
	return new HeightStoneEvent(p_region.index, p_yStone - (p_y - p_region.yHighest));
}


// Height necessary to go from index1 to index2 - in the final event, from minimum index to maximum index
HeightDifferenceEvent = function(p_ir1, p_ir2, p_yDiff) {
	this.kind = KIND.HEIGHT_DIFFERENCE;
	this.indexMax = Math.max(p_ir1, p_ir2);
	this.indexMin = Math.min(p_ir1, p_ir2);
	this.yDelta = p_yDiff * (p_ir1 > p_ir2 ? 1 : -1);
	this.outOfPass = true;
}

// --------
// Interface

logRegionInfo = function(p_solver, p_index) {
	const space1 = p_solver.regions[p_index].spaces[0];
	return ( p_index + "(" + space1.x + "," + space1.y + ")" );
}

HeightDifferenceEvent.prototype.toLogString = function(p_solver) {
	const space1 = p_solver.regions[this.indexMax].spaces[0];
	const space2 = p_solver.regions[this.indexMin].spaces[0];
	return "[Diff. HSYH regions " + logRegionInfo(p_solver, this.indexMin) + " " + logRegionInfo(p_solver, this.indexMax) + "]";
}

SpaceEvent.prototype.toLogString = function() {
	return "["+this.x+","+this.y+" ("+this.symbol+")]";
}

HeightStoneEvent.prototype.toLogString = function(p_solver) {
	return "[Region " + logRegionInfo(p_solver, this.index) + " HSYH " +  this.heightStoneYHighest + "]";
}

function shouldBeLoggedEvent(p_event) {
	return (p_event.kind == KIND.SYMBOL);
}

