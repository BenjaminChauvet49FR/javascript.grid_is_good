// No "kind" this time.

function SpaceEvent(p_x, p_y, p_symbol) {
	this.symbol = p_symbol;
	this.coorX = p_x;
	this.coorY = p_y;
}

SpaceEvent.prototype.toLogString = function() {	
	return "["+this.symbol+" "+this.coorX+","+this.coorY+"]";
}

SpaceEvent.prototype.copy = function() {
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

// -----------
function ShapeEvent(p_x, p_y, p_shape) { // Item indépendant de SpaceEvent, mais qui nécessite le constructeur new...
	this.shape = p_shape;
	this.coorX = p_x;
	this.coorY = p_y;
}

ShapeEvent.prototype.copy = function() {
	return new ShapeEvent(this.coorX, this.coorY, this.shape);
}

ShapeEvent.prototype.toLogString = function() {	
	return "[S"+this.shape+" "+this.coorX+","+this.coorY+"]";
}

ShapeEvent.prototype.opening = function() {
	return ADJACENCY.UNDECIDED; 
}

ShapeEvent.prototype.x = function() {
	return this.coorX;
}

ShapeEvent.prototype.y = function() {
	return this.coorY;
}

// -----------
function ShapeRegionEvent(p_ir, p_shape) {
	this.shape = p_shape;
	this.region = p_ir;
}

ShapeRegionEvent.prototype.toLogString = function() {	
	return "[SR "+this.shape+" "+this.region+"]";
}

ShapeRegionEvent.prototype.copy = function() {
	return new ShapeRegionEvent(this.region, this.shape);
}

ShapeRegionEvent.prototype.opening = function() {
	return ADJACENCY.UNDECIDED;
}