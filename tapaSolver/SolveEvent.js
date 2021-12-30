function SpaceEvent(p_x, p_y, p_symbol) {
	this.symbol = p_symbol;
	this.x = p_x;
	this.y = p_y;
}

SpaceEvent.prototype.toLogString = function() {	
	return "["+this.symbol+" "+this.x+","+this.y+"]";
}

SpaceEvent.prototype.copy = function(){
	return new SpaceEvent(this.x, this.y, this.symbol);
}

SpaceEvent.prototype.opening = function() {
	return this.symbol;
}

SpaceEvent.prototype.coordinateX = function() {
	return this.x;
}

SpaceEvent.prototype.coordinateY = function() {
	return this.y;
}