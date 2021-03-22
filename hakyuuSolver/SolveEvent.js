function SpaceAllowEvent(p_x, p_y, p_number, p_valid) {
	this.number = p_number;
	this.choice = p_valid;
	this.x = p_x;
	this.y = p_y;
}

SpaceAllowEvent.prototype.toString = function() {	
	return "[" + this.number + (this.choice ? "" : "X") + " " + this.x + "," + this.y + "]";
}

SpaceAllowEvent.prototype.copy = function() {
	return new SpaceAllowEvent(this.x, this.y, this.number, this.choice);
}