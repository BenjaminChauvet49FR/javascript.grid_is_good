const SPACE_CHOICE = {
	YES : 2,
	NO : 0,
	UNDECIDED : 1
}

function SpaceNumeric(p_min, p_max) {
	this.offset = p_min;
	this.max = p_max;
	this.possibilities = [];
	this.numberPossibilities = p_max - p_min + 1;
	for (var i = 0; i < this.numberPossibilities; i++) {
		this.possibilities.push(SPACE_CHOICE.UNDECIDED);
	}
	this.value = null;
}

/**
WARNING : offensive programming ! All controls are assumed to be already made !
*/
SpaceNumeric.prototype.ban = function(p_number) {
	this.numberPossibilities--;
	this.possibilities[p_number - this.offset] = SPACE_CHOICE.NO;		
}

SpaceNumeric.prototype.banIfNecessary = function(p_number) { // Except for this one !
	if (this.getState(p_number) == SPACE_CHOICE.UNDECIDED) {
		this.ban(p_number);
	}
}

SpaceNumeric.prototype.unban = function(p_number) {
	this.numberPossibilities++;
	this.possibilities[p_number - this.offset] = SPACE_CHOICE.UNDECIDED;	
}

SpaceNumeric.prototype.choose = function(p_number) {
	this.value = p_number;
	this.possibilities[p_number - this.offset] = SPACE_CHOICE.YES;	
}

SpaceNumeric.prototype.unchoose = function(p_number) {
	this.value = null;
	this.possibilities[p_number - this.offset] = SPACE_CHOICE.UNDECIDED;
}

SpaceNumeric.prototype.getValue = function() {
	return this.value;
}

SpaceNumeric.prototype.getMin = function() {
	return this.offset;
}

SpaceNumeric.prototype.getMax = function() {
	return this.max;
}


SpaceNumeric.prototype.getState = function(p_number) {
	return this.possibilities[p_number - this.offset];
}

SpaceNumeric.prototype.getOneLeft = function() {
	if (this.numberPossibilities == 1) {
		for (var number = this.offset ; number <= this.max ; number++) {
			if (this.possibilities[number - this.offset] != SPACE_CHOICE.NO) {
				return number;
			}
		}
	}
	return null;
}

// ================================================

/**
Defines a set of "not placed numbers" (indexes from 0 to (nb different values minus 1), values from min to max).
In entry : a list of SpaceNumeric ; a list of number of "number of times each value has yet to be placed from min to max" ; the min ; the max
*/
SpaceSetNumeric = function(p_setupNumericSpaces, p_notPlacedYet, p_min, p_max) {
	this.min = p_min;
	this.max = p_max;
	this.notPlacedYet = [];
	this.notBannedYet = [];
	for (var nb = p_min ; nb <= p_max ; nb++) {
		this.notPlacedYet.push(p_notPlacedYet[nb - this.min]);
		this.notBannedYet.push(p_setupNumericSpaces.length - this.notPlacedYet[nb - this.min]);
		p_setupNumericSpaces.forEach(numericSpace => {
			switch(numericSpace.getState(nb)) {
				case SPACE_CHOICE.NO : this.notBannedYet[nb - this.min]--; break;
				case SPACE_CHOICE.YES : this.notPlacedYet[nb - this.min]--; break;
			}
		});
	}
}

SpaceSetNumeric.prototype.warnPlaced = function(p_number) {
	this.notPlacedYet[p_number - this.min]--;
}

SpaceSetNumeric.prototype.unwarnPlaced = function(p_number) {
	this.notPlacedYet[p_number - this.min]++;
}

SpaceSetNumeric.prototype.warnBanned = function(p_number) {
	this.notBannedYet[p_number - this.min]--;
}

SpaceSetNumeric.prototype.unwarnBanned = function(p_number) {
	this.notBannedYet[p_number - this.min]++;
}

SpaceSetNumeric.prototype.getNotPlacedYet = function(p_number) {
	return this.notPlacedYet[p_number - this.min];
}

SpaceSetNumeric.prototype.getNotBannedYet = function(p_number) {
	return this.notBannedYet[p_number - this.min];
}