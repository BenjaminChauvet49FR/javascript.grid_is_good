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

function CheckCollectionDoubleEntryDirectional(p_xLength, p_yLength) {
	CheckCollectionDoubleEntryDirectionalGeneric.call(this, p_xLength, p_yLength, false);
}
CheckCollectionDoubleEntryDirectional.prototype = Object.create(CheckCollectionDoubleEntryDirectionalGeneric.prototype);
CheckCollectionDoubleEntryDirectional.prototype.constructor = CheckCollectionDoubleEntryDirectional;

CheckCollectionDoubleEntryDirectional.prototype.add = function(p_x, p_y, p_dir) {
	return this.addGeneric(p_x, p_y, p_dir, true);
}

// Considers that one space that has been added should be removed before general clean.
CheckCollectionDoubleEntryDirectional.prototype.cleanOne = function(p_x, p_y, p_dir) {
	this.array[p_y][p_x][p_dir] = this.defaultValue;
}


// ------------------------
// Same as "double entry" but it deals with new spaces. (may be useless ...)
/*
function CheckCollectionPropagationDoubleEntry(p_xLength, p_yLength) {
	CheckCollectionDoubleEntry.call(p_xLength, p_yLength);
	this.newList = [];
}

CheckCollectionPropagationDoubleEntry.prototype = Object.create(GeneralSolver.prototype);
CheckCollectionPropagationDoubleEntry.prototype.constructor = CheckCollectionDoubleEntry;

CheckCollectionPropagationDoubleEntry.prototype.addToPropagation = function(p_x, p_y) {
	ok = this.add(p_x, p_y);
	if (ok) {
		this.newList.push({x : ix, y : iy});
	}
	return ok;
}

CheckCollectionPropagationDoubleEntry.prototype.hasStillNews = function() {
	return (this.newList.length > 0);
}

CheckCollectionPropagationDoubleEntry.prototype.pushOneLeft = function() {
	if (this.newList.length > 0) {
		return this.newList.pop();
	}
	return null;
}*/