function SpaceEvent(p_x, p_y, p_symbol) {
	this.symbol = p_symbol;
	this.x = p_x;
	this.y = p_y;
}

SpaceEvent.prototype.copy = function() {
	return new SpaceEvent(this.x, this.y, this.symbol);
}

SpaceEvent.prototype.toString = function() {	
	return "[" + this.symbol + " " + this.x  + "," + this.y + "]";
}