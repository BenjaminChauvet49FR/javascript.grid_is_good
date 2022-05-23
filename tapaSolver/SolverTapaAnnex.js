// Indexes shared among methods. It's truly easier not to have to managed them.
var tapaIndexes = [];
var tapaIntersector = [];

const TAPASS = {
	YES : 2,
	NO : 1,
	UNDECIDED : 0
}

function logTapaResult(p_array) {
	if (!p_array.length) {
		autoLogDebug(p_array);
		return;
	}
	var resultLog = "";
	p_array.forEach(tapass => {
		switch(tapass) {
			case TAPASS.YES : resultLog += "O"; break;
			case TAPASS.NO : resultLog += "X"; break;
			default : resultLog += "-"; break;
		}
	});
	autoLogDebug(resultLog);
}

function stringToTaparray(p_string) {
	var resultLog = [];
	for (var i = 0; i < p_string.length ; i++) {
		switch(p_string.charAt(i)) {
			case 'O' : resultLog.push(TAPASS.YES); break;
			case 'X' : resultLog.push(TAPASS.NO); break;
			default : resultLog.push(TAPASS.UNDECIDED); break;
		}
	}
	return resultLog;
}


// p_numbers : array of remaining number of [?, 1, 2, 3] and number >= 4 in position 4 (that can only appear once because it's Tapa)
// p_taparray = array of TAPASS values.
// Value returned : tapaIntersector, which is an array of all surrounding TAPA values, including already set ones
function tapass(p_numbers, p_taparray) {
	var rightMostNoO = p_taparray.length-1;
	while (rightMostNoO >= 0 && (p_taparray[rightMostNoO] == TAPASS.YES)) {
		rightMostNoO--;
	}
	if (rightMostNoO == -1) { // Rare case where the array is full of Os
		if (p_numbers[4] == 8) {
			return [];
		} else {			
			return DEDUCTIONS_RESULT.FAILURE;
		}
	}
	var consecutiveOs = p_taparray.length-1-rightMostNoO;
	
	tapaIndexes = [];
	tapaIntersector = DEDUCTIONS_RESULT.FAILURE;
	for (var i = 0 ; i < p_taparray.length ; i++) {
		if (p_taparray[i] == TAPASS.UNDECIDED) {
			tapaIndexes.push(i);
		}
	}
	tapassAnnex(p_numbers, p_taparray, 0, p_taparray[rightMostNoO] == TAPASS.NO, consecutiveOs);
	autoLogDebug(tapaIntersector);
	return tapaIntersector;
}

// Precondition : p_taparray is not full of Os.
// No spaces that are left to p_indexToPass in p_taparray are undecided.
function tapassAnnex(p_numbers, p_taparray, p_indexToPass, p_closedRight, p_consecutiveOs) {
	var numbers = p_numbers.slice();
	var taparray = p_taparray.slice();
	// If we have too many consecutive Os according to the remaining numbers, it's a failure
	// IMPORTANT : skip this phase if all the remaining spaces from p_taparray onwards are Os (either already counted or to close the loop
	var indexOfSpaces = p_indexToPass;
	while (indexOfSpaces < taparray.length && taparray[indexOfSpaces] == TAPASS.YES) {
		indexOfSpaces++;
	}
	if ((indexOfSpaces < taparray.length) && p_consecutiveOs > 0) { // Bogus case otherwise : [0,1,0,0,1] -OOO-OXO
		if (numbers[4] < p_consecutiveOs && numbers[0] == 0) 
	    { 
			if (p_consecutiveOs > 3) {				
				return DEDUCTIONS_RESULT.FAILURE;
			}
			if (numbers[3] == 0) {
				if (p_consecutiveOs == 3) {
					return DEDUCTIONS_RESULT.FAILURE;
				}
				if (numbers[2] == 0) {
					if (p_consecutiveOs == 2 || numbers[1] == 0) {
						return DEDUCTIONS_RESULT.FAILURE;
					}
				}
			}
		}
	}
	// If we have reached the end, it's time to return. Let's make sure all the tapa chains, and only them, have been found, before returning an empty list.
	if (p_indexToPass == taparray.length) {
		var numberOsLastChain = 0;
		// Manage the last chain (that has not been closed yet) if there is any
		if (!p_closedRight) {
			var rightMostNoO = taparray.length - 1;
			while(rightMostNoO >= 0 && taparray[rightMostNoO] == TAPASS.YES) {
				rightMostNoO--;
			}
			var leftMostNoO = 0;			
			while(leftMostNoO < taparray.length && taparray[leftMostNoO] == TAPASS.YES) {
				leftMostNoO++;
			}
			numberOsLastChain = taparray.length - 1 - rightMostNoO + leftMostNoO;
			numbers = closeTheNumber(numbers, numberOsLastChain);
			if (numbers == DEDUCTIONS_RESULT.FAILURE) {
				return DEDUCTIONS_RESULT.FAILURE;
			}
		}
		
		// All chains have been managed. Are all at 0 ? Time to check !
		for (var i = 0 ; i <= 4 ; i++) {
			if (numbers[i] != 0) {
				return DEDUCTIONS_RESULT.FAILURE;
			}
		}
		
		// A successful array !
		intersectWinningCombination(taparray);
		//logTapaResult(taparray);
		//autoLogDebug("Common : ");
		//logTapaResult(tapaIntersector);
		return [];
	}
	// Our space isn't decided yet !
	if (taparray[p_indexToPass] != TAPASS.UNDECIDED) {
		if (taparray[p_indexToPass] == TAPASS.YES) {
			return tapassAnnex(numbers, taparray, p_indexToPass+1, p_closedRight, p_consecutiveOs+1);
		} else {
			// First X from the left, there were only Os before. (and maybe from the right too)
			var stillOpen = false;
			if (p_consecutiveOs >= p_indexToPass) {
				stillOpen = true;
				if (p_closedRight) { 
					stillOpen = false;
				}
			}
			if (!stillOpen) {
				// It's time to count this tapa chain !
				numbers = closeTheNumber(numbers, p_consecutiveOs);
				if (numbers == DEDUCTIONS_RESULT.FAILURE) {
					return DEDUCTIONS_RESULT.FAILURE;
				}
			}
			return tapassAnnex(numbers, taparray, p_indexToPass+1, p_closedRight, 0);
		}
	}
	// Now the true pass spirit !
	// Adding a YES and seeing the possibilities
	taparray[p_indexToPass] = TAPASS.YES;
	tapassAnnex(numbers, taparray, p_indexToPass + 1, p_closedRight, p_consecutiveOs + 1);
	if (tapaIntersector == EVENT_RESULT.HARMLESS) {
		return [];
	}
	
	// Adding a NO and seeing the possibilities
	taparray[p_indexToPass] = TAPASS.NO;
	var stillOpen = false;
	if (p_consecutiveOs >= p_indexToPass) {
		stillOpen = true;
		if (p_closedRight) { 
			stillOpen = false;
		}
	}
	if (!stillOpen) {
		// It's time to count this tapa chain !
		numbers = closeTheNumber(numbers, p_consecutiveOs);
		if (numbers == DEDUCTIONS_RESULT.FAILURE) {
			return DEDUCTIONS_RESULT.FAILURE;
		}
	}	
	tapassAnnex(numbers, taparray, p_indexToPass + 1, p_closedRight, 0);
	if (tapaIntersector == EVENT_RESULT.HARMLESS) {
		return [];
	}
	return [];
}

// Tests : 
// tapass([0, 1, 1, 0, 0], stringToTaparray("XOXOOXXX"))
// tapass([0, 1, 2, 0, 0], stringToTaparray("XOXOOXOO"))
// tapass([0, 1, 0, 0, 1], stringToTaparray("OOXXOXOO"))
// tapass([0, 2, 1, 0, 0], stringToTaparray("OO------"))

function closeTheNumber(p_numbers, p_numberToClose) {
	if (p_numberToClose >= 4) { 
		if (p_numbers[4] == p_numberToClose) {
			p_numbers[4] = 0;
		} else if (p_numbers[0] == 0) {
			return DEDUCTIONS_RESULT.FAILURE;
		} else {
			p_numbers[0]--;
		}
	} 
	if (p_numberToClose >= 1 && p_numberToClose <= 3) {
		if (p_numbers[p_numberToClose] == 0 && p_numbers[0] > 0) {
			p_numbers[0]--;
		} else if (p_numbers[p_numberToClose] == 0) {
			return DEDUCTIONS_RESULT.FAILURE;
		} else {
			p_numbers[p_numberToClose]--;
		}
	}
	return p_numbers;
}

// p_fullTaparray = full tapa array resulting of a "winning combination"
function intersectWinningCombination(p_fullTaparray) {
	if (tapaIntersector == DEDUCTIONS_RESULT.FAILURE) {
		tapaIntersector = p_fullTaparray;
		return;
	} 
	var atLeastOne = false;
	var index;
	tapaIndexes.forEach(index => {
		if (tapaIntersector[index] != p_fullTaparray[index]) {
			tapaIntersector[index] = TAPASS.UNDECIDED
		}
		if (tapaIntersector[index] != TAPASS.UNDECIDED) {
			atLeastOne = true;
		}
	});
	if (!atLeastOne) {
		tapaIntersector = EVENT_RESULT.HARMLESS;
	}
}