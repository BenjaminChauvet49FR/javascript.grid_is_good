// Setup et simili-constructeurs

function SolveEvent(){}

const KIND = {
	SYMBOL:1,
	VALUE:2
}

function SolveEventPosition(p_x,p_y,p_symbol){
	var solve = new SolveEvent();
	solve.setupSymbol(p_x,p_y,p_symbol);
	return solve;
}

function SolveEventValue(p_index,p_val){
	var solve = new SolveEvent();
	solve.setupValue(p_index,p_val);
	return solve;
}

SolveEvent.prototype.setupSymbol = function(p_x,p_y,p_symbol){
	this.kind = KIND.SYMBOL;
	this.x = p_x;
	this.y = p_y;
	this.symbol = p_symbol;
}

SolveEvent.prototype.setupValue = function(p_index,p_val){
	this.kind = KIND.VALUE;
	this.valueToBan = p_val;
	this.indexRegion = p_index;
}

//

SolveEvent.prototype.toString = function(){	
	if (this.kind == KIND.SYMBOL){
		return "["+this.x+","+this.y+"] ("+this.symbol+")";
	}
	else{
		return "[Reg. "+this.indexRegion+" X"+this.valueToBan+"]";
	}
}

SolveEvent.prototype.copy = function(){
	var se = new SolveEvent();
	if (this.kind == KIND.SYMBOL){
		se.setupSymbol(this.x,this.y,this.symbol);
		return se;
	}
	else{
		se.setupValue(this.indexRegion, this.valueToBan);
		return se;
	}
}