const CHOICE_EVENT_KIND = 'kc'; 

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

// Interfacing 
SpaceNumeric.prototype.remainingSeveralPossibilitiesToString = function(p_withSpaceChar) {
	if (this.value != null) {
		return null;
	}
	var result = "";
	const potentialSpace = (p_withSpaceChar ? " " : "");
	var activeSpace = "";
	for (var i = this.offset ; i <= this.max ; i++) {
		if (this.possibilities[this.selectPrivateIndex(i)]) {
			result += (activeSpace + i);
			activeSpace = potentialSpace;
		}	
	}
	return result;
}

SpaceNumericSelect.prototype = Object.create(SpaceChoice.prototype);
SpaceNumericSelect.prototype.constructor = SpaceChoice;

// Use similar to SpaceNumeric. It has sparse values (instead of values from min to max) and shoud NOT be used with NumericSpacesSetAccountant.
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
NumericSpacesSetAccountant = function(p_notPlacedYet, p_minValue, p_maxValue, p_numberValues) {
	this.min = p_minValue;
	this.max = p_maxValue;
	this.notPlacedYet = [];
	this.notBannedYet = [];
	for (var nb = this.min ; nb <= this.max ; nb++) {
		this.notPlacedYet.push(p_notPlacedYet[nb - this.min]);
		this.notBannedYet.push(p_numberValues - this.notPlacedYet[nb - this.min]);
	}  
}

NumericSpacesSetAccountant.prototype.warnPlaced = function(p_number) {
	this.notPlacedYet[p_number - this.min]--;
}

NumericSpacesSetAccountant.prototype.unwarnPlaced = function(p_number) {
	this.notPlacedYet[p_number - this.min]++;
}

NumericSpacesSetAccountant.prototype.warnBanned = function(p_number) {
	this.notBannedYet[p_number - this.min]--;
}

NumericSpacesSetAccountant.prototype.unwarnBanned = function(p_number) {
	this.notBannedYet[p_number - this.min]++;
}

NumericSpacesSetAccountant.prototype.getNotPlacedYet = function(p_number) {
	return this.notPlacedYet[p_number - this.min];
}

NumericSpacesSetAccountant.prototype.getNotBannedYet = function(p_number) {
	return this.notBannedYet[p_number - this.min];
}

// ================================================


function ChoiceEvent(p_x, p_y, p_number, p_valid) {
	this.kind = CHOICE_EVENT_KIND;
	this.number = p_number;
	this.choice = p_valid;
	this.x = p_x;
	this.y = p_y;
}

ChoiceEvent.prototype.toLogString = function() {	
	return "[" + this.number + (this.choice ? "" : "X") + " " + this.x + "," + this.y + "]";
}

ChoiceEvent.prototype.copy = function() {
	return new ChoiceEvent(this.x, this.y, this.number, this.choice);
}

// Will likely be overridden by solvers !
shouldBeLoggedEvent = function(p_event) {
	return (p_event.choice);
}

// ------------------------

deductionsTestOneLeft = function(p_listEventsToApply, p_array, p_x, p_y) {
	const justOne = p_array[p_y][p_x].getOneLeft();
	if (justOne != null) {
		p_listEventsToApply.push(new ChoiceEvent(p_x, p_y, justOne, true));
	}
}

deductionsExcludeOthersNumeric = function(p_listEventsToApply, p_numericSpaceArray, p_x, p_y, p_chosenValue) {
	var numericSpace = p_numericSpaceArray[p_y][p_x];
	for (var i = numericSpace.offset ; i <= numericSpace.max ; i++) {
		if (p_chosenValue != i) {			
			p_listEventsToApply.push(new ChoiceEvent(p_x, p_y, i, false));
		}
	}
}

// Returns EVENT_RESULT value.
testNumericSpaceChoice = function(p_numericSpaceArray, p_x, p_y, p_value, p_choice) { 
	if (p_value > p_numericSpaceArray[p_y][p_x].getMax()) {
		return p_choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
	}
	const currentNumber = p_numericSpaceArray[p_y][p_x].getValue(); 
	if (p_choice && (currentNumber != null) && (p_value != currentNumber)) {
		return EVENT_RESULT.FAILURE;
	}
	const currentState = (p_numericSpaceArray[p_y][p_x].getState(p_value));
	if (currentState == SPACE_CHOICE.YES) {
		return p_choice ? EVENT_RESULT.HARMLESS : EVENT_RESULT.FAILURE;
	} else if (currentState == SPACE_CHOICE.NO) {
		return p_choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
	} 
	return EVENT_RESULT.SUCCESS;
}

// Tests when there is no symbol left in a space set (typically a region of grid), empty all the other possibilities.
// Important : to be used in a deduction when a symbol is  (immediately after an application, not in a filter)
deductionsAlertNoneLeftInSpaceSet = function(p_listEventsToApply, p_NumericSpacesSetAccountant, p_symbol, p_spacesList, p_numericSpacesArray) {
	deductionsAlertLeftInSpaceSetPrivate(p_listEventsToApply, p_symbol, p_spacesList, p_numericSpacesArray, p_NumericSpacesSetAccountant.getNotPlacedYet(p_symbol), p_NumericSpacesSetAccountant.getNotBannedYet(p_symbol), false); 
}

deductionsAlertRemainingPossibilitiesInSpaceSet = function(p_listEventsToApply, p_NumericSpacesSetAccountant, p_symbol, p_spacesList, p_numericSpacesArray) {
	deductionsAlertLeftInSpaceSetPrivate(p_listEventsToApply, p_symbol, p_spacesList, p_numericSpacesArray, p_NumericSpacesSetAccountant.getNotBannedYet(p_symbol), p_NumericSpacesSetAccountant.getNotPlacedYet(p_symbol), true);
}

deductionsAlertLeftInSpaceSetPrivate = function(p_listEventsToApply, p_symbol, p_spacesList, p_numericSpacesArray, p_nullVariable, p_positiveVariable, p_choiceBool) {
	if ((p_nullVariable == 0) && (p_positiveVariable > 0)) {
		var spaceCount = 0;
		p_spacesList.forEach(coors => {
			x = coors.x;
			y = coors.y;
			if (p_numericSpacesArray[y][x].getState(p_symbol) == SPACE_CHOICE.UNDECIDED) {
				p_listEventsToApply.push(new ChoiceEvent(x, y, p_symbol, p_choiceBool));
				spaceCount++;
			}
		});
		if (spaceCount != p_positiveVariable) {
			p_listEventsToApply.push(new FailureEvent()); 
		}
	}	
}

testNumericSelectSpaceChoice = function(p_choiceArray, p_x, p_y, p_index, p_choice) {	
	if (!p_choiceArray[p_y][p_x].contains(p_index)) {
		return p_choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
	}
	const currentState = (p_choiceArray[p_y][p_x].getState(p_index));
	if (currentState == SPACE_CHOICE.YES) {
		return p_choice ? EVENT_RESULT.HARMLESS : EVENT_RESULT.FAILURE;
	} else if (currentState == SPACE_CHOICE.NO) {
		return p_choice ? EVENT_RESULT.FAILURE : EVENT_RESULT.HARMLESS;
	} 
	return EVENT_RESULT.SUCCESS;
}
		
deductionsExcludeOthersNumericSelect = function(p_listEventsToApply, p_numericSelectArray, p_x, p_y, p_index) { 
	p_numericSelectArray[p_y][p_x].values().forEach(index2 => { 
		if (index2 != p_index) {
			p_listEventsToApply.push(new ChoiceEvent(p_x, p_y, index2, false));
		}
	});
}