/*const EVENT_KIND = {
	SPACE : 1,
	OTHER : 2
}*/

function SolveEvent(){

}

function SpaceEvent(p_x,p_y,p_symbol) {
	solveEvent = new SolveEvent();
	//solveEvent.kind = EVENT_KIND.SPACE;
	solveEvent.symbol = p_symbol;
	solveEvent.coorX = p_x;
	solveEvent.coorY = p_y;
	return solveEvent;
}

function ShapeEvent(p_x, p_y, p_shape) { // Item indépendant de SpaceEvent, mais qui nécessite le constructeur new...
	this.shape = p_shape;
	this.coorX = p_x;
	this.coorY = p_y;
}

SolveEvent.prototype.toString = function(){	
	return "["+this.symbol+" "+this.coorX+","+this.coorY+"]";
}

SolveEvent.prototype.copy = function(){
	return new SpaceEvent(this.coorX, this.coorY, this.symbol);
}

SolveEvent.prototype.opening = function() {
	return this.symbol;
}

SolveEvent.prototype.x = function() {
	return this.coorX;
}

SolveEvent.prototype.y = function() {
	return this.coorY;
}

ShapeEvent.prototype.toString = function(){	
	return "[S"+this.shape+" "+this.coorX+","+this.coorY+"]";
}

ShapeEvent.prototype.opening = function() {
	return SPACE.NOT_APPLICABLE; // TODO Un petit Typescript ?
}

ShapeEvent.prototype.x = function() {
	return this.coorX;
}

ShapeEvent.prototype.y = function() {
	return this.coorY;
}

ShapeEvent.prototype.copy = function() {
	return new ShapeEvent(this.coorX, this.coorY, this.shape);
}

