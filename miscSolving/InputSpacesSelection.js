const SPACE_SELECTION_INPUT = {
	NOT_SELECTED : 0, // High convention 0 == false : not selected in a boolean context !
	CORNER_SELECTED : 1,
	SELECTED : 2
}

InputSpacesSelection = function(p_xLength, p_yLength) {
	this.xLength = p_xLength;
	this.yLength = p_yLength;
	this.startSelectedSpaces(); // Defines this.array
	this.selectedCornerSpace = null,
	this.previousStateSelectedCornerSpace = null
}

// Note : not the same as the one found in Editorcore which is a bit more technical
// Custom pass space selection
InputSpacesSelection.prototype.triggerSpace = function(p_x, p_y) {
	if (this.selectedCornerSpace == null) {		
		this.previousStateSelectedCornerSpace = this.array[p_y][p_x];
		this.array[p_y][p_x] = SPACE_SELECTION_INPUT.CORNER_SELECTED;
		this.selectedCornerSpace = {x : p_x, y : p_y}
		return;
	} else {
		var x = this.selectedCornerSpace.x;
		var y = this.selectedCornerSpace.y;
		this.selectedCornerSpace = null;
		if (x == p_x && y == p_y) {
			if (this.previousStateSelectedCornerSpace == SPACE_SELECTION_INPUT.SELECTED) {
				this.array[p_y][p_x] = SPACE_SELECTION_INPUT.NOT_SELECTED;
			} else {
				this.array[p_y][p_x] = SPACE_SELECTION_INPUT.SELECTED;
			}
		} else {
			const xMin = Math.min(p_x, x);
			const xMax = Math.max(p_x, x);
			const yMin = Math.min(p_y, y);
			const yMax = Math.max(p_y, y);
			var allSelected = true;
			for (y = yMin ; y <= yMax ; y++) {
				for (x = xMin ; x <= xMax ; x++) {
					allSelected = (this.array[y][x] != SPACE_SELECTION_INPUT.NOT_SELECTED); 
					this.array[y][x] = SPACE_SELECTION_INPUT.NOT_SELECTED;
					if (!allSelected) {
						break;
					}
				}
				if (!allSelected) {
					break;
				}
			} 
			if (!allSelected) {
				for (y = yMin ; y <= yMax ; y++) {
					for (x = xMin ; x <= xMax ; x++) {
						this.array[y][x] = SPACE_SELECTION_INPUT.SELECTED;
					}
				}
			}
		}
	}
}

InputSpacesSelection.prototype.selectSpaceList = function(p_coorsList) {
	this.cancelCornerSelection();
	var allSelected = true;
	var coors;
	for (var i = 0 ; i < p_coorsList.length ; i++) {
		coors = p_coorsList[i];
		allSelected = (this.array[coors.y][coors.x] != SPACE_SELECTION_INPUT.NOT_SELECTED);
		if (!allSelected) {
			break;
		}
		this.array[coors.y][coors.x] = SPACE_SELECTION_INPUT.NOT_SELECTED;
	};
	if (!allSelected) {
		p_coorsList.forEach(coors => {
			this.array[coors.y][coors.x] = SPACE_SELECTION_INPUT.SELECTED;
		});
	}
}



InputSpacesSelection.prototype.restartSelectedSpaces = function(p_xLength, p_yLength) {
	if (p_xLength) {
		this.xLength = p_xLength;
	}
	if (p_yLength) {
		this.yLength = p_yLength;
	}
	this.startSelectedSpaces();
}

InputSpacesSelection.prototype.startSelectedSpaces = function() {
	this.array = generateValueArray(this.xLength, this.yLength, SPACE_SELECTION_INPUT.NOT_SELECTED);
	this.selectedSpace = null;
}

// ---
// Misc

InputSpacesSelection.prototype.cancelCornerSelection = function() {
	if (this.selectedCornerSpace != null) {		
		this.array[this.selectedCornerSpace.y][this.selectedCornerSpace.x] = this.previousStateSelectedCornerSpace;
		this.selectedCornerSpace = null;
	}
}

// ---
// To be used in closure in "draw in spaces" (drawTextInsideStandard2Dimensions)

InputSpacesSelection.prototype.getDrawingSelectionIndex = function(p_x, p_y, p_indexForSelected, p_indexForCornerSelected) {	
	if (this.array[p_y][p_x] == SPACE_SELECTION_INPUT.SELECTED) {
		return p_indexForSelected;
	} else if (this.array[p_y][p_x] == SPACE_SELECTION_INPUT.CORNER_SELECTED) {
		return p_indexForCornerSelected;
	}
	return -1; // High convention : a negative value is supposed to be the value for an empty space in drawSpaceContents2Dimensions
} 

// ---
// Getter

InputSpacesSelection.prototype.getSelectedSpacesList = function() {
	var answer = [];
	for (var iy = 0 ; iy < this.yLength ; iy++) {
		for (var ix = 0 ; ix < this.xLength ; ix++) {
			if (this.array[iy][ix] != SPACE_SELECTION_INPUT.NOT_SELECTED) {
				answer.push({x : ix, y : iy});
			}
		}
	}
	return answer;
}