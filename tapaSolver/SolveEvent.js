function SpaceEvent(p_x, p_y, p_symbol) {
	this.symbol = p_symbol;
	this.coorX = p_x;
	this.coorY = p_y;
}

SpaceEvent.prototype.toLogString = function() {	
	return "["+this.symbol+" "+this.coorX+","+this.coorY+"]";
}

SpaceEvent.prototype.copy = function(){
	return new SpaceEvent(this.coorX, this.coorY, this.symbol);
}

SpaceEvent.prototype.opening = function() {
	return this.symbol;
}

SpaceEvent.prototype.x = function() {
	return this.coorX;
}

SpaceEvent.prototype.y = function() {
	return this.coorY;
}