const CLUSTER_UNDECIDED = -1;
const CLUSTER_BANNED = -2;

// Patchwork Index = index in patchworkArray
// Actual index = deducted index (from patchworkList)
function ClusterManager(p_xLength, p_yLength) {
	this.patchworkArray = generateValueArray(p_xLength, p_yLength, CLUSTER_UNDECIDED); // Array of cluster indexes
	this.boundsArray = generateValueArray(p_xLength, p_yLength, null); // Array to where a patchwork index is linked to another one
	this.xLength = p_xLength;
	this.yLength = p_yLength;
	this.patchworkList = [];
	this.globalCheckerUnknownAroundSpaces = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
	this.privateCheckerUnknownAroundSpaces = new CheckCollectionDoubleEntry(this.xLength, this.yLength);
}

// Manipulating clusters
ClusterManager.prototype.index = function(p_x, p_y) { // Public
	return this.actualIndex(this.patchworkArray[p_y][p_x]);
}

ClusterManager.prototype.getCluster = function(p_x, p_y) { // Public 
	return this.patchworkList(this.patchworkArray[p_y][p_x]);
}

// Actual index (uses a while loop)
ClusterManager.prototype.actualIndex = function(p_patchworkIndex) {
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

// Offensive programming : 
// p_x, p_y must be in array AND, 
// most of all, this.patchworkArray[p_y][p_x] must be CLUSTER_UNDECIDED at start
ClusterManager.prototype.add = function(p_x, p_y) {
	var adjacentAIs = [];
	var actualIndex, dejaVu;
	existingNeighborsCoors(p_x, p_y, this.xLength, this.yLength).forEach(coors => {
		x = coors.x;
		y = coors.y;
		if (this.patchworkArray[y][x] >= 0) {
			actualIndex = this.index(x, y);
			dejaVu = false;
			for(var i = 0 ; i < adjacentAIs.length ; i++) {
				if (actualIndex == adjacentAIs[i]) {
					dejaVu = true;
					break;
				}
			}
			if (!dejaVu) {
				adjacentAIs.push(actualIndex);
			}
		}
	});
	// A new cluster appears
	if (adjacentAIs.length == 0) {
		const index = this.patchworkList.length;
		this.patchworkArray[p_y][p_x] = index;
		this.patchworkList.push({ // NEW ! This is where an element of 'patchworkList' is defined
			boundIndex : index, 
			indexRecipient : [], 
			spaces : [{x : p_x, y : p_y}],
			firstIndexUncheckedAggregatedSpaces : 0,
			unknownAroundSpaces : []
		});
	}
	
	// The space joins another cluster
	if (adjacentAIs.length >= 1) {
		const ti = adjacentAIs[0];
		this.patchworkArray[p_y][p_x] = ti; // ti = target index. Arbitrarly first of the 'actual indexes'.
		this.patchworkList[ti].spaces.push({x : p_x, y : p_y});
		this.boundsArray[p_y][p_x] = {target : ti, bounds : []};
		for (var i = 1 ; i < adjacentAIs.length ; i++) { 
			var ni = adjacentAIs[i];// ni = new index
			this.patchworkList[ni].boundIndex = ti;
			this.patchworkList[ti].indexRecipient.push(ni);
			this.boundsArray[p_y][p_x].bounds.push(ni);
		}
	}
}

ClusterManager.prototype.ban = function(p_x, p_y) {
	this.patchworkArray[p_y][p_x] = CLUSTER_BANNED;
}

/*function invalidateUnknownSpacesAroundData(p_patchworkPiece) {
	p_patchworkPiece.unknownAroundSpaces = [];
	p_patchworkPiece.firstIndexUncheckedAggregatedSpaces = 0; 
}*/

ClusterManager.prototype.invalidateUnknownSpacesAroundData = function(p_index) { // Inspirated by a similar mistake of recursion and actual indexes I also met in checkAdjacency.
	this.invalidateUnknownSpacesAroundData_aux(this.actualIndex(p_index));
}

ClusterManager.prototype.invalidateUnknownSpacesAroundData_aux = function(p_index) {
	const patchworkPiece = this.patchworkList[p_index];
	patchworkPiece.unknownAroundSpaces = [];
	patchworkPiece.firstIndexUncheckedAggregatedSpaces = 0;
	patchworkPiece.indexRecipient.forEach(indexRec => {
		this.invalidateUnknownSpacesAroundData_aux(indexRec);
	});
}

ClusterManager.prototype.undo = function(p_x, p_y) { // Must be performed in order reverse as do
	const formerPI = this.patchworkArray[p_y][p_x];
	this.patchworkArray[p_y][p_x] = CLUSTER_UNDECIDED;

	if (formerPI >= 0) { // It was a former space from cluster
	
		// Invalidate informations relative to adjacent spaces of this cluster (note : this considers that the cluster doesn't come alone)
		this.invalidateUnknownSpacesAroundData(formerPI); //Note : this method used not to be in prototype and used  to invalidate data for this cluster piece only. Could lead to quite disastrous results !
		
		// Detach clusters if it was the bond between clusters / destroy clusters if it was the only of its space
		this.patchworkList[formerPI].spaces.pop();
		if (this.patchworkList[formerPI].spaces.length == 0) {
			this.patchworkList.pop();
		}
		if (this.boundsArray[p_y][p_x] != null) {
			this.boundsArray[p_y][p_x].bounds.forEach(exNi => {
				this.patchworkList[exNi].boundIndex = exNi;
				var formerBound = this.patchworkList[formerPI].indexRecipient.pop();
				// Also, invalidate data, because you never know
					//invalidateUnknownSpacesAroundData(this.patchworkList[formerBound]); BIG ERROR ! During a pass, a datum wasn't invalidated on correct time !
				// I should have been way more radical with invalidation. (
			});
			this.boundsArray[p_y][p_x] = null;
		}
	} else { // It wasn't a former space from cluster 
		//invalidate informations adjacent ones
		var aroundPI;
		existingNeighborsCoors(p_x, p_y, this.xLength, this.yLength).forEach(coors => {
			aroundPI = this.patchworkArray[coors.y][coors.x];
			if (aroundPI >= 0) {				
				//invalidateUnknownSpacesAroundData(this.patchworkList[aroundPI]);
				this.invalidateUnknownSpacesAroundData(aroundPI);
			}
		});
	}
	
}

// -----------------
// Exploiting clusters 

// Offensive : space must be in a cluster
ClusterManager.prototype.sizeClusterSpace = function(p_x, p_y) { // Public
	return this.sizeCluster(this.patchworkArray[p_y][p_x]);
}

ClusterManager.prototype.sizeCluster = function(p_index) { // Public
	return this.sizeClusterAnnex(this.actualIndex(p_index));
}

ClusterManager.prototype.sizeClusterAnnex = function(p_index) {
	var answer = this.patchworkList[p_index].spaces.length;
	this.patchworkList[p_index].indexRecipient.forEach(index => {
		answer += this.sizeClusterAnnex(index);
	});
	return answer;
}

ClusterManager.prototype.unknownAroundSpacesClusterSpace = function(p_x, p_y) {
	return this.unknownAroundSpacesCluster(this.patchworkArray[p_y][p_x]);
}

ClusterManager.prototype.unknownAroundSpacesCluster = function(p_index) {
	this.globalCheckerUnknownAroundSpaces.clean();
	this.unknownAroundSpacesClusterAnnex(this.actualIndex(p_index));
	return this.globalCheckerUnknownAroundSpaces.list;
}

ClusterManager.prototype.unknownAroundSpacesClusterAnnex = function(p_index) {
	this.privateCheckerUnknownAroundSpaces.clean();
	var patchworkPiece = this.patchworkList[p_index];
	var coors, coors2, x, y, x2, y2;
	// Already unknown spaces : check'em
	patchworkPiece.unknownAroundSpaces.forEach(coors => {
		x = coors.x;
		y = coors.y;
		if (this.patchworkArray[y][x] == CLUSTER_UNDECIDED) {
			this.privateCheckerUnknownAroundSpaces.add(x, y); 
			this.globalCheckerUnknownAroundSpaces.add(x, y); 
		}
	});
	
	// Newly added spaces
	for (var is = patchworkPiece.firstIndexUncheckedAggregatedSpaces; is < patchworkPiece.spaces.length ; is++) { // Check all "newly aggregated" spaces
		coors = patchworkPiece.spaces[is];
		x = coors.x;
		y = coors.y;
		existingNeighborsCoors(x, y, this.xLength, this.yLength).forEach(coors2 => { 
			x2 = coors2.x;
			y2 = coors2.y;
			if (this.patchworkArray[y2][x2] == CLUSTER_UNDECIDED) {
				this.privateCheckerUnknownAroundSpaces.add(x2, y2); 
				this.globalCheckerUnknownAroundSpaces.add(x2, y2); 
			}
		});
	}
		
	// From now on we won't check the added spaces again
	patchworkPiece.firstIndexUncheckedAggregatedSpaces = patchworkPiece.spaces.length;
	
	// Update list of "already unknown spaces" for this cluster
	patchworkPiece.unknownAroundSpaces = [];
	this.privateCheckerUnknownAroundSpaces.list.forEach(coors => {
		patchworkPiece.unknownAroundSpaces.push({x : coors.x, y : coors.y});
	});
	
	patchworkPiece.indexRecipient.forEach(index => {		
		this.unknownAroundSpacesClusterAnnex(index);
	});
}

ClusterManager.prototype.spacesCluster = function(p_x, p_y) { // Public
	return this.spacesClusterAnnex(this.patchworkArray[p_y][p_x]);
}

ClusterManager.prototype.spaceClusterAnnex = function(p_index) {
	var answer = [];
	// TODO
	return answer;
}