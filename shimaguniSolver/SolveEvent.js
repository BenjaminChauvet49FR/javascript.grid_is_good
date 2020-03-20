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
		se.setupValue(this.valueToBan,this.indexRegion);
		return se;
	}
}

/**
Compares two space events for sorting (left is "superior" : 1 ; right is "superior" : -1)
*/
function compareSolveEvents(p_spaceEvent1,p_spaceEvent2){
	if (p_spaceEvent1.kind != p_spaceEvent2.kind){
		return p_spaceEvent1.kind-p_spaceEvent2.kind;
	}
	if (p_spaceEvent1 == KIND.SYMBOL){
		if (p_spaceEvent1.y < p_spaceEvent2.y)
			return -1;
		if ((p_spaceEvent1.y > p_spaceEvent2.y) || (p_spaceEvent1.x > p_spaceEvent2.x))
			return 1;
		if (p_spaceEvent1.x < p_spaceEvent2.x)
			return -1;
		return 0;	
	} else {
		if (p_spaceEvent1.indexRegion < p_spaceEvent2.indexRegion)
			return -1;
		if ((p_spaceEvent1.indexRegion > p_spaceEvent2.indexRegion) || (p_spaceEvent1.valueToBan > p_spaceEvent2.valueToBan))
			return 1;
		if (p_spaceEvent1.valueToBan < p_spaceEvent2.valueToBan)
			return -1;
		return 0;
	}
}

/**
Returns the sorted list of the intersection of two sorted space event lists 
*/
function intersect(p_spaceEventSortedList1,p_spaceEventSortedList2){
	var index1 = 0;
	var index2 = 0;
	var comparison;
	var answer = [];
	while ((index1 < p_spaceEventSortedList1.length) && (index2 < p_spaceEventSortedList2.length)){
		comparison = compareSolveEvents(p_spaceEventSortedList1[index1],p_spaceEventSortedList2[index2]);
		switch(comparison){
			// left-hand side superior ? Raise right index. (and vice-versa)
			case 1: index2++;break; 
			case -1: index1++;break;
			case 0:
				if (p_spaceEventSortedList1[index1].symbol == p_spaceEventSortedList2[index2].symbol){
					answer.push(p_spaceEventSortedList1[index1].copy());			
				}
				index1++;
				index2++;
			break;
		}
	}
	return answer;
}