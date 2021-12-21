// Which uses is this purificator for ? 
// This purificator should be used by any puzzle that :  
// 1) uses a "symbol array" grid (although it doesn't interact with a solver, it only manipulates data that should be provided to the solver)
// 2) has clues that may be neutralized by one click on the space and de-neutrealized by one click as well. For example, any puzzle that has numbered spaces and a "X", such as Akari, Canal view, Yajikabe, Yajilin...
	// This does not include Tapa since neutralizing Tapa would be replacing a digit by "?".
	// This does not include a puzzle that would have Os with digits, Os, Xs (TODO : do some kind of "forked" purificator, where it would be possible to degrade index on several levels, since this one is linear. It would include Tapa, by the way !
	// Does not include puzzles with margins (though this may change)
// Note : the symbol array doesn't have to include a possibility of X, and doesn't have to be a 'symbol grid' or 'number grid' stricto sensu. In fact its first uses was with Yajikabe (clues with arrows and numbers, and Xs) and Shugaku (clues numbers, and Xs)

	
// TODO : should be tried on puzzles with regions and indexes ? 
// Note : the 'moonsun' problem : removing all moons in a regions where moons are crossed will make the solution invalid. Additionally, it may even make the puzzle data invalid !

// ---------------------
// Setup
// p_symbolArray : the symbol array. Loaded at each new puzzle
// Think about using "configure" method with {blockedSymbol : "X" , isBlockedDegradable : true} for instance. Otherwise it won't work.

function PurificatorSymbolArray(p_symbolArray) {
	GeneralPurificator.call(this);
	this.construct(p_symbolArray);
}

PurificatorSymbolArray.prototype = Object.create(GeneralPurificator.prototype);
PurificatorSymbolArray.prototype.constructor = PurificatorSymbolArray;

function DummyPurificatorSymbolArray() {
	return new PurificatorSymbolArray(generateSymbolArray(1, 1));
}

// To be called after the purificator has been created !
PurificatorSymbolArray.prototype.configure = function(p_dataConfig) { 
	this.levelToSpace = [];
	if (p_dataConfig.isBlockedDegradable) {
		this.levelToSpace.push(null);
	}
	if (p_dataConfig.blockedSymbol) {
		this.levelToSpace.push(p_dataConfig.blockedSymbol);
	}
}

PurificatorSymbolArray.prototype.construct = function(p_symbolArray) { // Only called when the puzzle is loaded, so no data should be lost.
	this.generalConstruct();
	this.array = [];
	this.items = [];
	var degradableCount = 0;
	var found;
	for (var y = 0 ; y < p_symbolArray.length; y++) {
		this.array.push([]);
		for (var x = 0 ; x < p_symbolArray[0].length; x++) {
			if (p_symbolArray[y][x] != null) {
				degradableCount = 0; 
				while (degradableCount < this.levelToSpace.length && this.levelToSpace[degradableCount] != p_symbolArray[y][x]) {
					degradableCount++;
				}
				this.array[y].push(this.items.length);
				if (degradableCount == this.levelToSpace.length) {					
					this.items.push({x : x, y : y, originalClue : p_symbolArray[y][x], maxLevel : degradableCount, level : degradableCount});
				} else {
					this.items.push({x : x, y : y, maxLevel : degradableCount, level : degradableCount});
					// Note : some items may have a maxLevel of 0, meaning they can't be degraded, but depending on the puzzle this doesn't mean they are null. (Shugaku : X is at degraded level 0)
				}
			} else {
				this.array[y].push(null);
			}
		}
	}
	
	this.methodsSetPurification = {
		applyMethod : purifyClosure(this),
		undoMethod : undoPurifyClosure(this),
		areOppositeIndexes : areOppositeIndexesClosure(this)
	};
} 

// ---------------
// Doing and undoing

purifyClosure = function(p_purificator) {
	return function(p_index) {
		if (p_index.sign == -1) {			
			if (p_purificator.items[p_index.index].level > 0) { 
				p_purificator.items[p_index.index].level--;
				return ACTION_PURIFICATION.SUCCESS;
			}
		} else {
			if (p_purificator.items[p_index.index].level < p_purificator.items[p_index.index].maxLevel) {
				p_purificator.items[p_index.index].level++;
				return ACTION_PURIFICATION.SUCCESS;
			}
		}
		return ACTION_PURIFICATION.NO_EFFECT;		
	}
}

undoPurifyClosure = function(p_purificator) {
	return function(p_index) {
		p_purificator.items[p_index.index].level -= p_index.sign;
	}
}

areOppositeIndexesClosure = function(p_purificator) {
	return function(p_indexA, p_indexB) {		
		return (p_indexA.index == p_indexB.index) && (p_indexA.sign == -p_indexB.sign);
	}
}

// ---------------
// Restore puzzle data

PurificatorSymbolArray.prototype.alterateData = function(p_symbolArray) {
	this.items.forEach(item => {
		p_symbolArray[item.y][item.x] = this.getSpace(item.x, item.y);
	});
	return p_symbolArray;
}

PurificatorSymbolArray.prototype.recreateNewData = function() {
	return this.alterateData(generateSymbolArray(this.array[0].length, this.array.length)); // Note : yeah, no .xLength and yLength properties... yet !
}

// To keep the original grid visible.
PurificatorSymbolArray.prototype.recreateOriginalData = function() {
	p_symbolArray = generateSymbolArray(this.array[0].length, this.array.length);
	var maxLevel;
	this.items.forEach(item => {
		// Warning : the inside of this loop is partially duplicated with getSpace ! I could have created a method (getSpaceFromLevelAndOriginalClue (since we may need to know that clue) but it would have been kinda boring...)
		maxLevel = item.maxLevel;
		if (maxLevel < this.levelToSpace.length) { 
			p_symbolArray[item.y][item.x] = this.levelToSpace[maxLevel];
		} else {
			p_symbolArray[item.y][item.x] = item.originalClue; // For one time I had all clues have an originalClue so there were no if, but I changed my mind later.
		}
	});
	return p_symbolArray;
}

// ---------------
// Input

PurificatorSymbolArray.prototype.purify = function(p_x, p_y) {
	if (this.array[p_y][p_x] != null) {
		this.applyPurification({index : this.array[p_y][p_x], sign : -1});
	}
}

PurificatorSymbolArray.prototype.unpurify = function(p_x, p_y) {
	if (this.array[p_y][p_x] != null) {
		this.applyPurification({index : this.array[p_y][p_x], sign : +1});
	}
}

PurificatorSymbolArray.prototype.undo = function() {
	this.undoPurification();
}

// ---------------
// Getter

PurificatorSymbolArray.prototype.getSpace = function(p_x, p_y) {
	// How it works : depending on the degrading level, we return an empty space, a blocked symbol, a clue, or null if it was already null
	if (this.array[p_y][p_x] != null) {
		const level = this.items[this.array[p_y][p_x]].level;
		if (level < this.levelToSpace.length) {
			return this.levelToSpace[level];
		} else {
			return this.items[this.array[p_y][p_x]].originalClue;
		}
	}
	return null;
}

PurificatorSymbolArray.prototype.getPurificatorSpaceIfDifferent = function(p_x, p_y) {
	if (this.array[p_y][p_x] != null) {
		const item = this.items[this.array[p_y][p_x]];
		if (item.maxLevel != item.level) {
			return this.getSpace(p_x, p_y);
		}
	}
	return EQUAL_TO_SOLVER;
}

// ------------
// Misc

function DummyPurificatorSudoku() {
	return new PurificatorSymbolArray(generateSymbolArray(9, 9));
}