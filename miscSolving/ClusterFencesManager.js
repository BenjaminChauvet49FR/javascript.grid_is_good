const CLUSTER_UNDECIDED = -1;
const TRIGGERED_OPEN_BIND = 12;
const TRIGGERED_CLUSTER_AGGREGATE = 11;
const TRIGGERED_OPEN_DOUBLE_CREATE = 10;
const TRIGGERED_CLOSED_DOUBLE_CREATION = 20;
const TRIGGERED_CLUSTER_ONE_CREATION = 21;

function ClusterFencesManager(p_fencesGrid) {
	this.xLength = p_fencesGrid.xLength;
	this.yLength = p_fencesGrid.yLength;
	this.patchworkArray = generateValueArray(this.xLength, this.yLength, CLUSTER_UNDECIDED); // Array of cluster indexes
	this.fencesGrid = p_fencesGrid;
	this.fenceEffectGrid = new FencesGrid(this.xLength, this.yLength); // What happened when a fence was open here ? 
	this.patchworkList = [];
	this.bindingEvents = [];
	this.globalCheckerUnknownAroundFences = new CheckCollectionDoubleEntryDirectional(this.xLength, this.yLength);
	this.privateCheckerUnknownAroundFences = new CheckCollectionDoubleEntryDirectional(this.xLength, this.yLength);
	this.checkerPatchworkList = null;
}


// Actual index (uses a while loop)
ClusterFencesManager.prototype.actualIndex = function(p_patchworkIndex) {
	var pwi = p_patchworkIndex;
	if (pwi < 0) {
		return pwi;
	} 
	var answer = this.patchworkList[pwi].boundIndex;
	while (answer != pwi) {
		pwi = answer;
		answer = this.patchworkList[answer].boundIndex;
	}
	return answer;
}

ClusterFencesManager.prototype.indexClusterBySpace = function(p_x, p_y) { // Just like all "bySpace" methods to come, this is... public !
	return this.actualIndex(this.patchworkArray[p_y][p_x]);
} 

// Note : because of "testLoneliness", this must be done AFTER setting the fence.
ClusterFencesManager.prototype.declareFence = function(p_xSpace, p_ySpace, p_dirFence, p_isOpen) {
	const x1 = p_xSpace;
	const y1 = p_ySpace;
	const x2 = x1 + DeltaX[p_dirFence];
	const y2 = y1 + DeltaY[p_dirFence]; // Note : sub-optimization (useless const declaration, except for confort)
	const index1 = this.patchworkArray[y1][x1];
	const index2 = this.patchworkArray[y2][x2];
	if (p_isOpen) {		
		if (index1 == CLUSTER_UNDECIDED) {
			if (index2 == CLUSTER_UNDECIDED) {
				// Create new cluster from an open fence
				const index = this.patchworkList.length;
				this.patchworkArray[y1][x1] = index;
				this.patchworkArray[y2][x2] = index;
				this.patchworkList.push({ // NEW ! This is where an element of 'patchworkList' is defined
					boundIndex : index, 
					indexRecipient : [], 
					spaces : [{x : x1, y : y1}, {x : x2, y : y2}],
					firstIndexUncheckedAggregatedSpaces : 0,
					unknownAroundFences : []
				});
				this.fenceEffectGrid.setFence(p_xSpace, p_ySpace, p_dirFence, TRIGGERED_OPEN_DOUBLE_CREATE);
			} else {
				// Add unknown x1,y1 to index2
				this.aggregateOneSpace(index2, x1, y1, p_dirFence);
			}
		} else if (index2 == CLUSTER_UNDECIDED) {
			// Add unknown x1,y1 to index2
			this.aggregateOneSpace(index1, x2, y2, OppositeDirection[p_dirFence]);
		} else {
			// Bind two indexes... or rather their actual indexes !
			const ai1 = this.actualIndex(index1);
			const ai2 = this.actualIndex(index2);
			if (ai1 != ai2) {
				 // Arbitrary : ai1 = master, ai2 = slave.
				this.patchworkList[ai2].boundIndex = ai1;
				this.patchworkList[ai1].indexRecipient.push(ai2);
				this.fenceEffectGrid.setFence(p_xSpace, p_ySpace, p_dirFence, TRIGGERED_OPEN_BIND);
				this.bindingEvents.push({master : ai1, slave : ai2});
			}
		}
	} else { 
		// Create mono-space clusters where spaces were undefined
		if (index1 == CLUSTER_UNDECIDED) {
			if (index2 == CLUSTER_UNDECIDED) {
				this.fenceEffectGrid.setFence(p_xSpace, p_ySpace, p_dirFence, TRIGGERED_CLOSED_DOUBLE_CREATION);
				this.bindingEvents.push({created : [x1, y1, x2, y2]});				
				this.createClusterMonospace(x1, y1);
				this.createClusterMonospace(x2, y2);
			} else {
				this.fenceEffectGrid.setFence(p_xSpace, p_ySpace, p_dirFence, TRIGGERED_CLUSTER_ONE_CREATION);
				this.bindingEvents.push({created : [x1, y1]});
				this.createClusterMonospace(x1, y1);
			}
		} else if (index2 == CLUSTER_UNDECIDED) {
			this.createClusterMonospace(x2, y2);
			this.fenceEffectGrid.setFence(p_xSpace, p_ySpace, p_dirFence, TRIGGERED_CLUSTER_ONE_CREATION);
			this.bindingEvents.push({created : [x2, y2]});
		}
	}
}

// Adds space to indexed clusters
ClusterFencesManager.prototype.aggregateOneSpace = function(p_receivingIndex, p_x, p_y, p_dirFence) {
	this.patchworkArray[p_y][p_x] = p_receivingIndex;
	this.patchworkList[p_receivingIndex].spaces.push({x : p_x, y : p_y});
	this.fenceEffectGrid.setFence(p_x, p_y, p_dirFence, TRIGGERED_CLUSTER_AGGREGATE);
	this.bindingEvents.push({indexAggregating : p_receivingIndex, x : p_x, y : p_y});
}

ClusterFencesManager.prototype.createClusterMonospace = function(p_x, p_y) {
	const index = this.patchworkList.length;
	this.patchworkArray[p_y][p_x] = index;
	this.patchworkList.push({
		boundIndex : index, 
		indexRecipient : [], 
		spaces : [{x : p_x, y : p_y}],
		firstIndexUncheckedAggregatedSpaces : 0,
		unknownAroundFences : []
	});
}

// Note : Undo in reverse order assumption
ClusterFencesManager.prototype.declareUndoFence = function(p_xSpace, p_ySpace, p_dirFence, p_wasOpen) {
	const x1 = p_xSpace;
	const y1 = p_ySpace;
	const x2 = x1 + DeltaX[p_dirFence];
	const y2 = y1 + DeltaY[p_dirFence];
	const index1 = this.patchworkArray[y1][x1];
	const index2 = this.patchworkArray[y2][x2];
	if (index1 >= 0) {		
		invalidateUnknownAroundFencesData(this.patchworkList[index1]); // Justified to invalidate here : a fence that becomes unknown again, were it open or closed, invalidates the result.
	}
	if (index2 >= 0) {		
		invalidateUnknownAroundFencesData(this.patchworkList[index2]);
	}
	const wasTriggered = this.fenceEffectGrid.getFence(p_xSpace, p_ySpace, p_dirFence);
	this.fenceEffectGrid.setFence(p_xSpace, p_ySpace, p_dirFence, FENCE_STATE.UNDECIDED);
	if (p_wasOpen) {	
		if (wasTriggered == TRIGGERED_OPEN_BIND) {
			var bindingEvent = this.bindingEvents.pop();
			// Remember : master and slave indexes used to be "actual indexes"
			this.patchworkList[bindingEvent.master].indexRecipient.pop();
			this.patchworkList[bindingEvent.slave].boundIndex = bindingEvent.slave;
			invalidateUnknownAroundFencesData(this.patchworkList[bindingEvent.master]); //Note : Paranoia ? You never know !
			invalidateUnknownAroundFencesData(this.patchworkList[bindingEvent.slave]);
		} else if (wasTriggered == TRIGGERED_CLUSTER_AGGREGATE) {
			var bindingEvent = this.bindingEvents.pop();
			var patchworkPiece = this.patchworkList[bindingEvent.indexAggregating];
			const lastInsertedSpace = patchworkPiece.spaces.pop();
			this.patchworkArray[bindingEvent.y][bindingEvent.x] = CLUSTER_UNDECIDED;
		} else if (wasTriggered == TRIGGERED_OPEN_DOUBLE_CREATE) {
			// It was the creation of a 2-space cluster. Note that nothing was added to this.bindingEvents.
			const byeCluster = this.patchworkList.pop();
			var spaces = byeCluster.spaces;
			this.patchworkArray[spaces[0].y][spaces[0].x] = CLUSTER_UNDECIDED;
			this.patchworkArray[spaces[1].y][spaces[1].x] = CLUSTER_UNDECIDED;
		}
	} else { 
		if (wasTriggered == TRIGGERED_CLOSED_DOUBLE_CREATION) {
			var bindingEvent = this.bindingEvents.pop();
			var coors = bindingEvent.created;
			this.patchworkArray[coors[1]][coors[0]] = CLUSTER_UNDECIDED;
			this.patchworkArray[coors[3]][coors[2]] = CLUSTER_UNDECIDED;
			this.patchworkList.pop();
			this.patchworkList.pop();
		} else if (wasTriggered == TRIGGERED_CLUSTER_ONE_CREATION) {
			var bindingEvent = this.bindingEvents.pop();
			var coors = bindingEvent.created;
			this.patchworkArray[coors[1]][coors[0]] = CLUSTER_UNDECIDED;
			this.patchworkList.pop();
		}
	}
}


function invalidateUnknownAroundFencesData(p_patchworkPiece) {
	p_patchworkPiece.unknownAroundFences = [];
	p_patchworkPiece.firstIndexUncheckedAggregatedSpaces = 0;
}


// -----------------
// Exploiting clusters 

// Offensive : space must be in a cluster 
ClusterFencesManager.prototype.sizeClusterBySpace = function(p_x, p_y) { // Public
	return this.sizeCluster(this.patchworkArray[p_y][p_x]);
}

// Defensive version
ClusterFencesManager.prototype.sizeClusterBySpaceDefensive = function(p_x, p_y) { // Public
	const ip = this.patchworkArray[p_y][p_x];
	return (ip == CLUSTER_UNDECIDED ? 1 : this.sizeCluster(ip));
}

ClusterFencesManager.prototype.sizeCluster = function(p_index) { // Public
	return this.sizeClusterAnnex(this.actualIndex(p_index));
}

ClusterFencesManager.prototype.sizeClusterAnnex = function(p_index) {
	var answer = this.patchworkList[p_index].spaces.length;
	this.patchworkList[p_index].indexRecipient.forEach(index => {
		answer += this.sizeClusterAnnex(index);
	});
	return answer;
}

// Offensive : space must be in a cluster, too
ClusterFencesManager.prototype.unknownFencesClusterBySpace = function(p_x, p_y) { 
	return this.unknownAroundFencesCluster(this.patchworkArray[p_y][p_x]);
}

ClusterFencesManager.prototype.unknownFencesClusterBySpaceDefensive = function(p_x, p_y) { // Public
	const ip = this.patchworkArray[p_y][p_x];
	if (ip == CLUSTER_UNDECIDED) {
		var answer = [];
		existingNeighborsDirections(p_x, p_y, this.xLength, this.yLength).forEach(dir => {
			answer.push({x : p_x, y : p_y, direction : dir});
		});
		return answer;
	} else {
		return this.unknownAroundFencesCluster(ip);
	}
}

ClusterFencesManager.prototype.unknownAroundFencesCluster = function(p_index) {
	this.globalCheckerUnknownAroundFences.clean();
	this.unknownAroundFencesClusterAnnex(this.actualIndex(p_index));
	return this.globalCheckerUnknownAroundFences.list;
}

// Note : C/P from cluster manager, except we are looking for fences and not states. If some replacements are incorrect in naming, too bad. At least it should work...
ClusterFencesManager.prototype.unknownAroundFencesClusterAnnex = function(p_index) {
	this.privateCheckerUnknownAroundFences.clean();
	var patchworkPiece = this.patchworkList[p_index];
	var coors, coors2, x, y, x2, y2;
	// Already unknown fences : check'em
	patchworkPiece.unknownAroundFences.forEach(coorsDir => {
		x = coorsDir.x;
		y = coorsDir.y;
		dir = coorsDir.direction
		if (this.fencesGrid.getFence(x, y, dir) == FENCE_STATE.UNDECIDED) {
			this.privateCheckerUnknownAroundFences.add(x, y, dir); 
			this.globalCheckerUnknownAroundFences.add(x, y, dir); 
		}
	});
	
	// Newly added spaces
	for (var is = patchworkPiece.firstIndexUncheckedAggregatedSpaces; is < patchworkPiece.spaces.length ; is++) { // Check all "newly aggregated" spaces
		coors = patchworkPiece.spaces[is];
		x = coors.x;
		y = coors.y;
		existingNeighborsDirections(x, y, this.xLength, this.yLength).forEach(dir => { 
			if (this.fencesGrid.getFence(x, y, dir) == FENCE_STATE.UNDECIDED) {
				this.privateCheckerUnknownAroundFences.add(x, y, dir); 
				this.globalCheckerUnknownAroundFences.add(x, y, dir); 
			}
		});
	}
		
	// From now on we won't check the added spaces again
	patchworkPiece.firstIndexUncheckedAggregatedSpaces = patchworkPiece.spaces.length;
	
	// Update list of "already unknown fences" for this cluster
	patchworkPiece.unknownAroundFences = [];
	this.privateCheckerUnknownAroundFences.list.forEach(coorsDir => {
		patchworkPiece.unknownAroundFences.push({x : coorsDir.x, y : coorsDir.y, direction : coorsDir.direction});
	});
	
	patchworkPiece.indexRecipient.forEach(index => {		
		this.unknownAroundFencesClusterAnnex(index);
	});
}
// Note : beware that an "unknown fence" may be internal in a region, if the solver doesn't have a good policy of regionalism (e.g. separation in regions).

ClusterFencesManager.prototype.spacesClusterBySpace = function(p_x, p_y) { // Public
	if (this.patchworkArray[p_y][p_x] == CLUSTER_UNDECIDED) {
		return [{x : p_x, y : p_y}]
	}
	this.listSpaces = [];
	this.spacesClusterAnnexDo(this.actualIndex(this.patchworkArray[p_y][p_x]));
	return this.listSpaces;
}

ClusterFencesManager.prototype.spacesClusterAnnexDo = function(p_index) {
	this.patchworkList[p_index].spaces.forEach(coors => {		
		this.listSpaces.push({x : coors.x, y : coors.y});
	});
	this.patchworkList[p_index].indexRecipient.forEach(index => {
		this.spacesClusterAnnexDo(index);
	});
}


// ------------
// Running all the clusters 
// (warning : these functions work together ! Notably needsToBeCheckedClusterBySpace tests and modifies the value of the checker )

ClusterFencesManager.prototype.reinitializeClusterCheckers = function() {
	this.checkerPatchworkList = new CheckCollection(this.patchworkList.length);
}

// Note : no checks needed for spaces that happen not to belong to a cluster.
ClusterFencesManager.prototype.needsToBeCheckedClusterBySpace = function(p_x, p_y) {  
	return (this.patchworkArray[p_y][p_x] != CLUSTER_UNDECIDED) && this.checkerPatchworkList.add(this.actualIndex(this.patchworkArray[p_y][p_x]));
}