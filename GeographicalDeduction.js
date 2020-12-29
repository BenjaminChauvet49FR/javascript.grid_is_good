function GeographicalDeduction(p_x,p_y,p_opening) {
	this.opening = p_opening;
	this.x = p_x;
	this.y = p_y;
}

GeographicalDeduction.prototype.toString = function() {	
	return "["+this.x+","+this.y+"] ("+this.opening+")";
}