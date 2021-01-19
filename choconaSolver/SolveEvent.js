function SolveEvent(){

}

function SpaceEvent(p_x,p_y,p_symbol) {
	solveEvent = new SolveEvent();
	solveEvent.symbol = p_symbol;
	solveEvent.coorX = p_x;
	solveEvent.coorY = p_y;
	return solveEvent;
}

SolveEvent.prototype.toString = function(){	
	return "["+this.symbol+" "+this.coorX+","+this.coorY+"]";
}

SolveEvent.prototype.copy = function(){
	return new SpaceEvent(this.coorX, this.coorY, this.symbol);
}

SolveEvent.prototype.x = function() {
	return this.coorX;
}

SolveEvent.prototype.y = function() {
	return this.coorY;
}
