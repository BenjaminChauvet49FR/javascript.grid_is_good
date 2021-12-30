function SpaceEvent(p_x, p_y, p_symbol) {
	this.symbol = p_symbol;
	this.x = p_x;
	this.y = p_y;
}

SpaceEvent.prototype.coordinateX = function() {
	return this.x;
}

SpaceEvent.prototype.coordinateY = function() {
	return this.y;
}

SpaceEvent.prototype.opening = function() {
	return this.symbol;
}

SpaceEvent.prototype.copy = function() {
	return new SpaceEvent(this.x, this.y, this.symbol);
}

// ---------------
// Interface

SpaceEvent.prototype.toLogString = function(){	
	return "["+LabelAdjacency[this.symbol]+" "+this.x+","+this.y+"]";
}