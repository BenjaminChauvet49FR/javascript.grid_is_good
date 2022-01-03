ACTION_PURIFICATION = {
	SUCCESS : 1,
	NO_EFFECT : 0
}

EQUAL_TO_SOLVER = "E"; // Not null, not a number. Used to mean that a space (or whatever) in a purificator is "equal to its solver counterpart."

function GeneralPurificator() {} 

GeneralPurificator.prototype.generalConstruct = function() {
	this.actionIdPurificationList = []; // High warning : this list can grow indefinitely !
	this.isActive = true;
	this.methodsSetPurification = {
		applyMethod : function() {},
		undoMethod : function() {},
		areOppositeIndexes : function(p_indexA, p_indexB) {return false}
	}; // Needs to be overwritten !
}


GeneralPurificator.prototype.applyPurification = function(p_index) {
	const act = this.methodsSetPurification.applyMethod(p_index);
	if (act == ACTION_PURIFICATION.SUCCESS) {
		// Note : I tried to automatically remove adjacent opposite purify and depurify actions but see note in flush function
		this.actionIdPurificationList.push(p_index);
	}
	return act;
}

// Removes consecutive opposite purify and depurify actions
// I wanted to do it in applyPurification directly but it ends up being problematic with minimal puzzle search if right before starting the search we depurify a clue,
// as it works on piling and depiling purifications and the length of actionIdPurificationList.
// This is why flush became a method to call manually.
// TODO : since this is a manually called function, maybe it is possible to remove even more elements, since all it does is cleaning two consecutive elements. 
// And by the way : [A, B, -B, -A] becomes [A, -A] which means the flush may be applied again. 
GeneralPurificator.prototype.flush = function() {
	var i = this.actionIdPurificationList.length-1;
	while (i >= 1) {
		if (this.methodsSetPurification.areOppositeIndexes(this.actionIdPurificationList[i], this.actionIdPurificationList[i-1])) {
			this.actionIdPurificationList.splice(i-1, 2);
			i -=2;
		} else {
			i--;
		}
	}
}

GeneralPurificator.prototype.undoPurification = function() {
	if (this.actionIdPurificationList.length > 0) {		
		const index = this.actionIdPurificationList.pop(); 
		this.methodsSetPurification.undoMethod(index);
	}
}

// --------------
// Common input

GeneralPurificator.prototype.activate = function() {
	this.isActive = true;
}

GeneralPurificator.prototype.desactivate = function() {
	this.isActive = false;
}

// --------------
// Now, for minimal solvers

// The objective is, from a puzzle with one unique solution and a given set of degradable indications on this puzzle, which sets of deductions can be removed in a way that the obtained puzzles are "minimal".
// A puzzle is minimal if degrading any extra information, no matter which one would cause the puzzle to have at least two solutions.
// It is possible that the puzzle provided in this algorithm is already minimal, in which case the algorithm detects so.

// (Pre-condition : ) Given a puzzle with unique solution, tries to find all clues that are required so that the solution remains unique.
// These clues are given under "p_indexList", which is a list of indexes (numbers) to the indexes (clues) in this.listOfDegradableIndexes (initialized in findMinimalPuzzles)
// p_solver is the solver
// p_methodConstructSolver is the method useful to reload solver from purificator. It must only have the solver as argument ! 
GeneralPurificator.prototype.findNecessaryIndexes = function(p_indexListForMinimals, p_solver, p_methodConstructSolver) {
	var notRequiredIndexes = [];
	var allRequired = true;
	var tryToPurify;
	// For each index, purify the puzzle with this index if possible ; if it is, see if the new puzzle is minimal and depurify.
	p_indexListForMinimals.forEach(indexInLODI => {
		tryToPurify = this.applyPurification(this.listOfDegradableIndexes[indexInLODI].actionId);
		if (tryToPurify != ACTION_PURIFICATION.NO_EFFECT) {	
			p_methodConstructSolver(p_solver); // Note : removing any set of indications should keep the data of the solver valid. (e.g. Moonsun problem)
			if (p_solver.resolve(EXAMPLE_SPECIAL_OPTIONS_RESOLVE) != RESOLUTION_RESULT.MULTIPLE) {
				notRequiredIndexes.push(indexInLODI);
			}
			this.undoPurification();
		}
	});		
	// Note : if a declared non-minimal index has been purified in the previous step of findMinimalPuzzlesAux, it is possible that it cannot be purified anymore, hence the check (if tryToPurify...)
	return notRequiredIndexes; 
}

// Starting point of "findMinimalPuzzlesAux".
// This method assumes that : 
// Each index of "p_indexList" should be purified at least once by this.listOfDegradableIndexes
// p_methodConstructSolver allows to update the solver from this purificator. See use in findNecessaryIndexes.
GeneralPurificator.prototype.findMinimalPuzzles = function(p_indexList, p_solver, p_methodConstructSolver) {
	p_methodConstructSolver(p_solver);
	if (p_solver.resolve(EXAMPLE_SPECIAL_OPTIONS_RESOLVE) == RESOLUTION_RESULT.MULTIPLE) {
		window.alert("Ce puzzle est à solutions multiples.");
		p_methodConstructSolver(p_solver); // Back to how it used to be. Also see note of display graphic bug below.
		return;
	}
	
	
	this.sumUpMinimals = [];
	this.listOfDegradableIndexes = [];
	var indexListForMinimals = [];
	for (var i = 0 ; i < p_indexList.length ; i++) {
		indexListForMinimals.push(i);
		this.listOfDegradableIndexes.push({actionId : p_indexList[i], numberDegradations : 0});
	}
	this.findMinimalPuzzlesAux(0, indexListForMinimals, p_solver, p_methodConstructSolver);
	
	// Finally...
	var extraString = "";
	p_methodConstructSolver(p_solver); // Back to how it used to be.
	// Note : display graphic bug. Purified clues (digits, arrows) disappear, only the purification marks (crosses, full-colored squares) remain.
	// I need to use "p_purificator.recreateOriginalData()" to correct it (see purificator symbol array) but it requires to create a method, to pass it to the input... later !
	
	// Now the summary (interfacing !) :
	if (this.sumUpMinimals.length == 1 && this.sumUpMinimals[0].length == 0) {
		extraString = "\nCe puzzle est minimal.";
	}	
	window.alert("Fin de la purification.\nNombre de puzzles minimaux trouvés : " + this.sumUpMinimals.length + extraString); 
	// TODO : something other than an alert ? Change the sentence ?
}

// Pre-condition : p_indexListForMinimals is sorted in ascending order. Puzzle has an unique solution.
// Is it minimal ?
GeneralPurificator.prototype.findMinimalPuzzlesAux = function(p_minimalIndexNotTried, p_indexListForMinimals, p_solver, p_methodConstructSolver) {
	// First, make the list of "minimal puzzles" from this one. Only look for indexes that may be "not minimal" (or not required).
	const notRequiredIndexes = this.findNecessaryIndexes(p_indexListForMinimals, p_solver, p_methodConstructSolver);
	if (notRequiredIndexes.length == 0) {
		// If all indexes are minimal : this is a minimal puzzle. Add it to the sum up.
		var newMinimalSet = [];
		var degradableIndex;
		var string = "";
		for (var indexInLODI = 0 ; indexInLODI < this.listOfDegradableIndexes.length ; indexInLODI++) {
			degradableIndex = this.listOfDegradableIndexes[indexInLODI];
			if (degradableIndex.numberDegradations > 0) {
				newMinimalSet.push({numberDegradations : degradableIndex.numberDegradations, 
					actionId : degradableIndex.actionId}); 
			}			
		}
		this.sumUpMinimals.push(newMinimalSet);
	} else {
		// At least one non-minimal index : look for each of them what if it is purified to the max and how do indexes ranged after in the this.listOfDegradableIndexes order react
		var indexInLODI, indexInNRI; // LODI, NRI = names of arrays
		var canAdvance, purificationStatus;
		for (indexInNRI = 0 ; indexInNRI < notRequiredIndexes.length ; indexInNRI++) {
			indexInLODI = notRequiredIndexes[indexInNRI]; 
			if (indexInLODI >= p_minimalIndexNotTried) {
				purificationStatus = this.applyPurification(this.listOfDegradableIndexes[indexInLODI].actionId);
				if (purificationStatus != ACTION_PURIFICATION.NO_EFFECT) {
					this.listOfDegradableIndexes[indexInLODI].numberDegradations++;
					if (p_solver.resolve(EXAMPLE_SPECIAL_OPTIONS_RESOLVE) != RESOLUTION_RESULT.MULTIPLE) {
						this.findMinimalPuzzlesAux(indexInLODI, notRequiredIndexes, p_solver, p_methodConstructSolver);
					}
					this.undoPurification();
					this.listOfDegradableIndexes[indexInLODI].numberDegradations--;
				} 				
			}
		}
	}
}

// ------------
// Interfacing

GeneralPurificator.prototype.logMinimalSets = function() {
	var string;
	this.sumUpMinimals.forEach(minimalSet => {
		string = "";
		minimalSet.forEach(minimalItem => {
			string += "[" + this.toLogMinimalSetString(minimalItem.actionId) + " ("+minimalItem.numberDegradations+")]"
		});
		console.log(string + "\n");
	});
}

// Generic log method to log a degradation action in "minimal action sets".
// Note : unlike "actions" we don't care about logging about the way of actions (degradating or regradating) since only degradating here.
GeneralPurificator.prototype.toLogMinimalSetString = function(p_actionId) {
	return "SBO"; // Should be overridden (if used)
}