const EVENT_KIND = {
	SPACE : 1,
	OTHER : 2
}

function SolveEvent(){

}

function SpaceEvent(p_x,p_y,p_symbol){
	solveEvent = new SolveEvent();
	solveEvent.kind = EVENT_KIND.SPACE;
	solveEvent.symbol = p_symbol;
	solveEvent.coorX = p_x;
	solveEvent.coorY = p_y;
	return solveEvent;
}

SpaceEvent.prototype.toString = function(){	
	return "["+this.coorX+","+this.coorY+"] ("+this.symbol+")";
}

SpaceEvent.prototype.copy = function(){
	return new SpaceEvent(this.symbol,this.coorX,this.coorY);
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