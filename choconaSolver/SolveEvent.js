function SolveEvent(){

}

function SpaceEvent(p_x,p_y,p_symbol) {
	solveEvent = new SolveEvent();
	solveEvent.symbol = p_symbol;
	solveEvent.x = p_x;
	solveEvent.y = p_y;
	return solveEvent;
}

SolveEvent.prototype.toLogString = function(){	
	return "["+this.symbol+" "+this.x+","+this.y+"]";
}

SolveEvent.prototype.copy = function(){
	return new SpaceEvent(this.x, this.y, this.symbol);
}

SolveEvent.prototype.x = function() {
	return this.x;
}

SolveEvent.prototype.y = function() {
	return this.y;
}
