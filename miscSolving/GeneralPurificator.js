ACTION_PURIFICATION = {
	SUCCESS : 1,
	NO_EFFECT : 0
}

EQUAL_TO_SOLVER = "E"; // Not null, not a number. Used 

function GeneralPurificator() {} 

GeneralPurificator.prototype.generalConstruct = function() {
	this.indexPurificationList = []; // High warning : this list can grow indefinitely !
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
		if ((this.indexPurificationList.length > 0) && 
			this.methodsSetPurification.areOppositeIndexes(p_index, this.indexPurificationList[this.indexPurificationList.length-1]) ) {
			this.indexPurificationList.pop();
		} else {			
			this.indexPurificationList.push(p_index);
		}
	}
}

GeneralPurificator.prototype.undoPurification = function() {
	if (this.indexPurificationList.length > 0) {		
		const index = this.indexPurificationList.pop(); 
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