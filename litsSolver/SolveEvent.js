const KIND_EVENT = {
	SPACE : 0,
	SHAPE : 1,
	SHAPE_REGION : 2,
	BAN_SHAPE_REGION : 3
}

function SpaceEvent(p_x, p_y, p_symbol) {
	this.kind = KIND_EVENT.SPACE;
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
	this.kind = KIND_EVENT.SHAPE;
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

ShapeEvent.prototype.evolveIntoSpaceEvent = function() {
	this.kind = KIND_EVENT.SPACE;
	this.symbol = ADJACENCY.NO;
}

// Methods necessary for transforming
ShapeEvent.prototype.x = function() {
	return this.coorX;
}

ShapeEvent.prototype.y = function() {
	return this.coorY;
}

ShapeEvent.prototype.opening = function() {
	return (this.kind == KIND_EVENT.SHAPE) ? ADJACENCY.UNDECIDED : ADJACENCY.NO;
}

// -----------
function ShapeRegionEvent(p_ir, p_shape) {
	this.kind = KIND_EVENT.SHAPE_REGION;
	this.shape = p_shape;
	this.region = p_ir;
}

ShapeRegionEvent.prototype.toLogString = function() {	
	return "[SR "+this.shape+" "+this.region+"]";
}

ShapeRegionEvent.prototype.copy = function() {
	return new ShapeRegionEvent(this.region, this.shape);
}

// -----------
function BanShapeRegionEvent(p_ir, p_shape) {
	this.kind = KIND_EVENT.BAN_SHAPE_REGION;
	this.shape = p_shape;
	this.region = p_ir;
}

BanShapeRegionEvent.prototype.toLogString = function() {	
	return "[SB "+this.shape+" "+this.region+"]";
}

BanShapeRegionEvent.prototype.copy = function() {
	return new BanShapeRegionEvent(this.region, this.shape);
}