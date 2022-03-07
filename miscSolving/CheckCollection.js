// Item that combines an array (of values) and a list (of items whose value is different from default)
// When trying a new non-default value, the adding is also memorized in the list, but only if the value wasn't added before.

function CheckCollectionGeneric(p_size, p_defaultValue) {
	this.list = [];
	this.array = [];
	this.defaultValue = p_defaultValue;
	for (var i = 0; i < p_size ; i++) {
		this.array.push(this.defaultValue);
	}
}

CheckCollectionGeneric.prototype.addGeneric = function(p_arg, p_value) {
	if (this.array[p_arg] != p_value) {
		this.array[p_arg] = p_value;
		this.list.push(p_arg);
		return true;
	}
	return false;
}

CheckCollectionGeneric.prototype.clean = function() {
	this.list.forEach(i => {
		this.array[i] = this.defaultValue;
	});
	this.list = [];
}

function CheckCollection(p_size) {
	CheckCollectionGeneric.call(this, p_size, false);
}
CheckCollection.prototype = Object.create(CheckCollectionGeneric.prototype);
CheckCollection.prototype.constructor = CheckCollection;

CheckCollection.prototype.add = function(p_arg) {
	return this.addGeneric(p_arg, true);
}

// ------------------------
// Same but with 2 dimensions. Uses {x, y} items.
// Who knows, maybe "use generic" with other values instead of pure true/false will find some uses later ?

function CheckCollectionDoubleEntryGeneric(p_xLength, p_yLength, p_defaultValue) {
	this.list = [];
	this.defaultValue = p_defaultValue;
	this.array = [];
	for (var y = 0; y < p_yLength ; y++) {
		this.array.push([]);
		for (var x = 0 ; x < p_xLength ; x++) {
			this.array[y].push(this.defaultValue);
		}
	}
}

CheckCollectionDoubleEntryGeneric.prototype.addGeneric = function(p_x, p_y, p_value) {
	if (this.array[p_y][p_x] != p_value) {
		this.array[p_y][p_x] = p_value;
		this.list.push({x : p_x, y : p_y});
		return true;
	}
	return false;
}

CheckCollectionDoubleEntryGeneric.prototype.clean = function() {
	this.list.forEach(space => {
		this.array[space.y][space.x] = this.defaultValue;
	});
	this.list = [];
}

function CheckCollectionDoubleEntry(p_xLength, p_yLength) {
	CheckCollectionDoubleEntryGeneric.call(this, p_xLength, p_yLength, false);
}
CheckCollectionDoubleEntry.prototype = Object.create(CheckCollectionDoubleEntryGeneric.prototype);
CheckCollectionDoubleEntry.prototype.constructor = CheckCollectionDoubleEntry;

CheckCollectionDoubleEntry.prototype.add = function(p_x, p_y) {
	return this.addGeneric(p_x, p_y, true);
}

// Considers that one space that has been added should be removed before general clean.
CheckCollectionDoubleEntryGeneric.prototype.cleanOne = function(p_x, p_y) {
	this.array[p_y][p_x] = this.defaultValue;
}

// Make sure all coordinates in a list are unique.
CheckCollectionDoubleEntryGeneric.prototype.purifyListForUnicity = function() {
	this.list = sortUnicityList(this.list, 
		function(coors1, coors2) {return coors1.x == coors2.x && coors1.y == coors2.y},
		function(coors1, coors2) {var dy = coors1.y - coors2.y; if (dy != 0) {return dy} else { return coors1.x - coors2.x}}
	);
}

// ------------------------
// Same but with a 3rd dimension associated to directions. Uses {x, y, direction} items.

function CheckCollectionDoubleEntryDirectionalGeneric(p_xLength, p_yLength, p_defaultValue) {
	this.list = [];
	this.defaultValue = p_defaultValue;
	this.array = [];
	for (var y = 0; y < p_yLength ; y++) {
		this.array.push([]);
		for (var x = 0 ; x < p_xLength ; x++) {
			this.array[y].push([this.defaultValue, this.defaultValue, this.defaultValue, this.defaultValue]);
		}
	}
}

CheckCollectionDoubleEntryDirectionalGeneric.prototype.addGeneric = function(p_x, p_y, p_direction, p_value) {
	if (this.array[p_y][p_x][p_direction] != p_value) {
		this.array[p_y][p_x][p_direction] = p_value;
		this.list.push({x : p_x, y : p_y, direction : p_direction});
		return true;
	}
	return false;
}

CheckCollectionDoubleEntryDirectionalGeneric.prototype.clean = function() {
	this.list.forEach(spaceDir => {
		this.array[spaceDir.y][spaceDir.x][spaceDir.direction] = this.defaultValue;
	});
	this.list = [];
}

// Considers that one space that has been added should be removed before general clean.
CheckCollectionDoubleEntryDirectionalGeneric.prototype.cleanOne = function(p_x, p_y, p_dir) {
	this.array[p_y][p_x][p_dir] = this.defaultValue;
}

function CheckCollectionDoubleEntryDirectional(p_xLength, p_yLength) {
	CheckCollectionDoubleEntryDirectionalGeneric.call(this, p_xLength, p_yLength, false);
}
CheckCollectionDoubleEntryDirectional.prototype = Object.create(CheckCollectionDoubleEntryDirectionalGeneric.prototype);
CheckCollectionDoubleEntryDirectional.prototype.constructor = CheckCollectionDoubleEntryDirectional;

CheckCollectionDoubleEntryDirectional.prototype.add = function(p_x, p_y, p_dir) {
	return this.addGeneric(p_x, p_y, p_dir, true);
}

// ------------------------
// Same but with a 3rd dimension associated to fences. Uses {x, y, direction} items.

function CheckCollectionDoubleEntryFencesGeneric(p_xLength, p_yLength, p_defaultValue) {
	this.listRD = []; // Note : "listRD" and not list like most users to remember that only "right" and "down" directions can be contained here
	this.defaultValue = p_defaultValue;
	this.arrayH = [];
	this.arrayV = [];
	for (var y = 0; y < p_yLength ; y++) {
		this.arrayH.push([]);
		for (var x = 0 ; x < p_xLength-1 ; x++) {
			this.arrayH[y].push(this.defaultValue);
		}
	}
	for (var y = 0; y < p_yLength-1  ; y++) {
		this.arrayV.push([]);
		for (var x = 0 ; x < p_xLength; x++) {
			this.arrayV[y].push(this.defaultValue);
		}
	}
}

CheckCollectionDoubleEntryFencesGeneric.prototype.addGeneric = function(p_x, p_y, p_direction, p_value) {
	switch(p_direction) {
		case DIRECTION.LEFT : 
			if (this.arrayH[p_y][p_x-1] != p_value) {
				this.arrayH[p_y][p_x-1] = p_value;
				this.listRD.push({x : p_x-1, y : p_y, direction : DIRECTION.RIGHT}); 
			} break;
		case DIRECTION.UP : 
			if (this.arrayV[p_y-1][p_x] != p_value) {
				this.arrayV[p_y-1][p_x] = p_value;
				this.listRD.push({x : p_x, y : p_y-1, direction : DIRECTION.DOWN}); 
			} break;
		case DIRECTION.RIGHT : 
			if (this.arrayH[p_y][p_x] != p_value) {
				this.arrayH[p_y][p_x] = p_value;
				this.listRD.push({x : p_x, y : p_y, direction : DIRECTION.RIGHT}); 
			} break;
		case DIRECTION.DOWN : 
			if (this.arrayV[p_y][p_x] != p_value) {
				this.arrayV[p_y][p_x] = p_value;
				this.listRD.push({x : p_x, y : p_y, direction : DIRECTION.DOWN}); 
			} break;
	}
}

CheckCollectionDoubleEntryFencesGeneric.prototype.get = function(p_x, p_y, p_direction) {
	switch(p_direction) {
		case DIRECTION_RIGHT : return this.arrayH[p_y][p_x]; break;
		case DIRECTION_DOWN : return this.arrayV[p_y][p_x]; break;		
		default : return null; // Note : not supposed to happen since we read data that have been added to listRD
	}
}

CheckCollectionDoubleEntryFencesGeneric.prototype.clean = function() {
	this.listRD.forEach(spaceDir => {
		if (spaceDir.direction == DIRECTION.DOWN) {
			this.arrayV[spaceDir.y][spaceDir.x] = this.defaultValue;
		} else {			
			this.arrayH[spaceDir.y][spaceDir.x] = this.defaultValue;
		}
	});
	this.listRD = [];
}

// Considers that one space that has been added should be removed before general clean.
CheckCollectionDoubleEntryFencesGeneric.prototype.cleanOne = function(p_x, p_y, p_dir) {
	switch(p_direction) {
		case DIRECTION.LEFT : this.arrayH[p_y][p_x-1] = this.defaultValue; break;
		case DIRECTION.UP : this.arrayV[p_y-1][p_x] = this.defaultValue; break;
		case DIRECTION.RIGHT : this.arrayH[p_y][p_x] = p_value; break;
		case DIRECTION.DOWN : this.arrayV[p_y][p_x] = p_value; break;
	}
}

function CheckCollectionDoubleEntryFences(p_xLength, p_yLength) {
	CheckCollectionDoubleEntryFencesGeneric.call(this, p_xLength, p_yLength, false);
}
CheckCollectionDoubleEntryFences.prototype = Object.create(CheckCollectionDoubleEntryFencesGeneric.prototype);
CheckCollectionDoubleEntryFences.prototype.constructor = CheckCollectionDoubleEntryFences;

CheckCollectionDoubleEntryFences.prototype.add = function(p_x, p_y, p_dir) {
	return this.addGeneric(p_x, p_y, p_dir, true);
}