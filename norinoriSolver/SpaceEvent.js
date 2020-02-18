function SpaceEvent(p_symbol,p_x,p_y){
	this.symbol = p_symbol;
	this.x = p_x;
	this.y = p_y;
}

SpaceEvent.prototype.toString = function(){	
	return "["+this.x+","+this.y+"] ("+this.symbol+")";
}

SpaceEvent.prototype.copy = function(){
	return new SpaceEvent(this.symbol,this.x,this.y);
}

/**
Compares two space events for sorting (left is "superior" : 1 ; right is "superior" : -1)
*/
function compareSpaceEvents(p_spaceEvent1,p_spaceEvent2){
	if (p_spaceEvent1.y < p_spaceEvent2.y)
		return -1;
	if ((p_spaceEvent1.y > p_spaceEvent2.y) || (p_spaceEvent1.x > p_spaceEvent2.x))
		return 1;
	if (p_spaceEvent1.x < p_spaceEvent2.x)
		return -1;
	return 0;
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
		comparison = compareSpaceEvents(p_spaceEventSortedList1[index1],p_spaceEventSortedList2[index2]);
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

function concat(p_list1,p_list2){
	p_list1.forEach(evt => {p_list2.push(evt)});
}