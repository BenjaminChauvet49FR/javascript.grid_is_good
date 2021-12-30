const KIND_EVENT = {
	SPACE : 0,
	SHAPE : 1,
	SHAPE_REGION : 2,
	BAN_SHAPE_REGION : 3
}

function SpaceEvent(p_x, p_y, p_symbol) {
	this.kind = KIND_EVENT.SPACE;
	this.symbol = p_symbol;
	this.x = p_x;
	this.y = p_y;
}

SpaceEvent.prototype.toLogString = function() {	
	return "["+this.symbol+" "+this.x+","+this.y+"]";
}

SpaceEvent.prototype.copy = function() {
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

// -----------
function ShapeEvent(p_x, p_y, p_shape) { // Item indépendant de SpaceEvent, mais qui nécessite le constructeur new...
	this.kind = KIND_EVENT.SHAPE;
	this.shape = p_shape;
	this.x = p_x;
	this.y = p_y;
}

ShapeEvent.prototype.copy = function() {
	return new ShapeEvent(this.x, this.y, this.shape);
}

ShapeEvent.prototype.toLogString = function() {	
	return "[S"+this.shape+" "+this.x+","+this.y+"]";
}

ShapeEvent.prototype.evolveIntoSpaceEvent = function() {
	this.kind = KIND_EVENT.SPACE;
	this.symbol = ADJACENCY.NO;
}

// Methods necessary for transforming
ShapeEvent.prototype.coordinateX = function() {
	return this.x;
}

ShapeEvent.prototype.coordinateY = function() {
	return this.y;
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