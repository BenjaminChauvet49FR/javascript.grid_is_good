const SPACE_CHOICE = {
	YES : 2,
	NO : 0,
	UNDECIDED : 1
}

function SpaceChoice() {
	this.value = null;
}

SpaceNumeric.prototype = Object.create(SpaceChoice.prototype);
SpaceNumeric.prototype.constructor = SpaceChoice;

function SpaceNumeric(p_min, p_max) {
	SpaceChoice.call(this);
	this.offset = p_min;
	this.max = p_max;
	this.possibilities = [];
	this.numberPossibilities = p_max - p_min + 1;
	for (var i = 0; i < this.numberPossibilities; i++) {
		this.possibilities.push(SPACE_CHOICE.UNDECIDED);
	}
	this.value = null;
}

SpaceNumeric.prototype.selectPrivateIndex = function(p_number) {
	return p_number - this.offset;
}

/**
WARNING : offensive programming ! All controls are assumed to be already made !
*/
SpaceChoice.prototype.ban = function(p_number) {
	this.numberPossibilities--;
	this.possibilities[this.selectPrivateIndex(p_number)] = SPACE_CHOICE.NO;		
}

SpaceChoice.prototype.banIfNecessary = function(p_number) { // Except for this one !
	if (this.getState(p_number) == SPACE_CHOICE.UNDECIDED) {
		this.ban(p_number);
	}
}

SpaceChoice.prototype.unban = function(p_number) {
	this.numberPossibilities++;
	this.possibilities[this.selectPrivateIndex(p_number)] = SPACE_CHOICE.UNDECIDED;	
}

SpaceChoice.prototype.choose = function(p_number) {
	this.value = p_number;
	this.possibilities[this.selectPrivateIndex(p_number)] = SPACE_CHOICE.YES;	
}

SpaceChoice.prototype.unchoose = function(p_number) {
	this.value = null;
	this.possibilities[this.selectPrivateIndex(p_number)] = SPACE_CHOICE.UNDECIDED;
}

SpaceChoice.prototype.getValue = function() {
	return this.value;
}

SpaceChoice.prototype.getState = function(p_number) {
	return this.possibilities[this.selectPrivateIndex(p_number)];
}

SpaceChoice.prototype.noAvailableValue = function() {
	return this.numberPossibilities <= 0;
}

SpaceNumeric.prototype.getMin = function() {
	return this.offset;
}

SpaceNumeric.prototype.getMax = function() {
	return this.max;
}

SpaceNumeric.prototype.getOneLeft = function() {
	if (this.numberPossibilities == 1) {
		for (var number = this.offset ; number <= this.max ; number++) {
			if (this.possibilities[this.selectPrivateIndex(number)] != SPACE_CHOICE.NO) {
				return number;
			}
		}
	}
	return null;
}

SpaceNumericSelect.prototype = Object.create(SpaceChoice.prototype);
SpaceNumericSelect.prototype.constructor = SpaceChoice;

// Use similar to SpaceNumeric. It has sparse values (instead of values from min to max) and shoud NOT be used with SpaceSetNumeric.
// Important : values must be already sorted !!!
function SpaceNumericSelect(p_sortedArray) {
	SpaceChoice.call(this);
	this.sortedValues = p_sortedArray;
	this.possibilities = [];
	this.numberPossibilities = p_sortedArray.length;
	for (var i = 0; i < p_sortedArray.length; i++) {
		this.possibilities.push(SPACE_CHOICE.UNDECIDED);
	}
}

// Offensive : p_number MUST be present in the selection.
SpaceNumericSelect.prototype.selectPrivateIndex = function(p_number) {
	return getIndexInSortedArray(this.sortedValues, p_number);
}

SpaceNumericSelect.prototype.contains = function(p_number) {
	return this.selectPrivateIndex(p_number) != null;
}

// Test : 
// mySelect = new SpaceNumericSelect([0, 1, 2, 4, 8, 16, 17]);
// mySelect.selectPrivateIndex(16);
// mySelect.selectPrivateIndex(2);
// mySelect.selectPrivateIndex(4);
// mySelect.selectPrivateIndex(5);

SpaceNumericSelect.prototype.getOneLeft = function() {
	if (this.numberPossibilities == 1) {
		for (var i = 0 ; i < this.possibilities.length ; i++) {
			if (this.possibilities[i] != SPACE_CHOICE.NO) {
				return this.sortedValues[i];
			}
		}
	}
	return null;
}

SpaceNumericSelect.prototype.values = function() {
	return this.sortedValues;
}

SpaceNumericSelect.prototype.getSingleValue = function() {
	if (this.sortedValues.length != 1) {
		return null;
	}
	return this.sortedValues[0];
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