/**
Purpose : like LoopSolver, except the loop contains regions ; it must pass through each of them exactly once.
And at least one space in each region.
*/

// -------
// Consts 

LOOP_REGION_UNDEFINED = -1;

// -------
// Setup

RegionLoopSolver.prototype = Object.create(LoopSolver.prototype);

function RegionLoopSolver() { 
	LoopSolver.call(this);
}

RegionLoopSolver.prototype.constructor = RegionLoopSolver;

RegionLoopSolver.prototype.regionLoopSolverConstruct = function(p_wallArray) {
	this.loopSolverConstruct(p_wallArray, {}); // Le pack de méthodes sera complété.
	this.gridWall = WallGrid_data(p_wallArray);
	this.borders = []; // Triangular array of borders
	//this.bordersEdgesIndexes = []; // Array that gives spaces that share edges with regions border, giving the index of these edges in this region [y][x][dir]
	this.regionGrid = this.gridWall.toRegionGrid();
	this.regions = [];

	var ix,iy;
	var lastRegionNumber = 0;
	
	// Number of regions // + this.bordersEdgesIndexes
	for(iy = 0; iy < this.yLength; iy++) {
		//this.bordersEdgesIndexes.push([]);
		for(ix = 0; ix < this.xLength; ix++) {
			lastRegionNumber = Math.max(this.regionGrid[iy][ix], lastRegionNumber);
			//this.bordersEdgesIndexes[ix].push({});
		}
	}
	
	// Region defintion
	for(var i=0 ; i<=lastRegionNumber ; i++) {
		this.regions.push( {
			spaces : [],
			size : 0,
			neighboringRegions : [],
			linkedRegions : [],
			oppositeLinkedRegions : LOOP_REGION_UNDEFINED,
			index : i
		});
	}
	
	// Spaces in each region
	for(iy = 0;iy < this.yLength;iy++) {
		for(ix = 0;ix < this.xLength;ix++) {
			if(this.regionGrid[iy][ix] >= 0) {
				this.regions[this.regionGrid[iy][ix]].spaces.push({x:ix, y:iy});
			}
		}
	}
	
	// Part specific for RegionLoopSolver
	this.defineBorders(); // initialize this.borders 
	this.buildBorders(); // fills this.borders with interesting data
}

RegionLoopSolver.prototype.constructor = RegionLoopSolver;

// Contact between regions. Triangular array where column indexes are lower than row indexes.
RegionLoopSolver.buildContacts = function(p_i1, p_i2) {
	this.contactsRegion = [];
	for (var i = 0; i < this.regions.length ; i++) {
		this.contactsRegion.push([]);
		for (var j = 0; j < i ; j++) {
			this.contactsRegion[i].push(false);
		}
	}
}


// If properties "state" "edgesClosed" "edgesLinked" are undefined, this "borders" entry remain untouched as the border between regions i and j doesn't exist.
// borders[i1][i2].length can be called as a shortcut of borders[i1][i2].edges.length too.
RegionLoopSolver.prototype.defineBorders = function() {
	for (var i = 0; i < this.regions.length ; i++) {
		this.borders.push([]);
		for (var j = 0; j < i ; j++) {
			this.borders[i].push({
				edges : []
			});
		}
	}
}

RegionLoopSolver.prototype.buildBorders = function() {
	var x, y, dx, dy, ir, dr, region;
	for(var ir = 0;ir < this.regions.length ; ir++) {
		region = this.regions[ir];
		region.size = region.spaces.length;
		region.index = ir;
		for(is = 0; is < region.size; is++) {
			space = region.spaces[is];
			x = space.x;
			y = space.y;
			LoopKnownDirections.forEach(dir => {
				if (this.neighborExists(x, y, dir)) {
					dx = x + DeltaX[dir];
					dy = y + DeltaY[dir];
					dr = this.getRegionIndex(dx, dy);
					if ((ir > dr) && (dr != WALLGRID.OUT_OF_REGIONS)) { // ir > dr test so a region doesn't get added twice.
						//Warning : name 'borders' of the array written here to optimize efficiency.
						//l = this.borders[ir][dr].edges.length;
						this.borders[ir][dr].edges.push({
							x : dx, 
							y : dy, 
							dir : OppositeDirection[dir]
						}); 
						//this.bordersEdgesIndexes[y][x][dir] = l;
						//=this.bordersEdgesIndexes[dy][dx][OppositeDirection[dir]] = l;
					}
				}
			});
		}
	}
	
	for(ir = 1; ir < this.regions.length ; ir++) {
		for(dr = 0; dr < ir; dr++) {
			this.borders[ir][dr].length = this.borders[ir][dr].edges.length; // WARNING : "length" might be an incorrect word, but since it is about a border...
		}
	}
	
	for(ir = 1; ir < this.regions.length ; ir++) {
		for(dr = 0; dr < ir; dr++) {
			if (this.areRegionsAdjacent(ir, dr)) {
				this.borders[ir][dr].state = LOOP_STATE.UNDECIDED;
				this.borders[ir][dr].edgesClosed = 0;
				this.borders[ir][dr].edgesLinked = 0;
				this.regions[ir].neighboringRegions.push(dr);
				this.regions[dr].neighboringRegions.push(ir);
			}
		}
	} 
	//						this.borders[ir][dr].state = LOOP_STATE.UNDECIDED;

}

RegionLoopSolver.prototype.getContact = function(p_i1, p_i2) {
	if (p_i2 > p_i1) {
		return this.getContact(p_i2, p_i1);
	} else {
		return this.contact[p_i1][p_i2];
	}
}

RegionLoopSolver.prototype.setContact = function(p_i1, p_i2) {
	if (p_i2 > p_i1) {
		this.getContact(p_i2, p_i1);
	} else {
		this.contact[p_i1][p_i2] = true;
	}
}

// ---------------------------
// Getters

RegionLoopSolver.prototype.getRegionIndex = function(p_x, p_y) {
	return this.regionGrid[p_y][p_x];
}

RegionLoopSolver.prototype.getRegion = function(p_x, p_y) {
	if (y || y == 0) {
		return this.regions[this.regionGrid[p_y][p_x]];
	} else {
		return this.regions[p_x];
	}
}

// Return the item border. A list of edges that symbolize the separation of 2 regions.
RegionLoopSolver.prototype.getBorder = function (p_i1, p_i2) {
	if (p_i2 > p_i1) {
		return this.getBorder(p_i2, p_i1);
	} else {
		return this.borders[p_i1][p_i2];
	}
}

// Necessites that p_i1 > p_i2
RegionLoopSolver.prototype.areRegionsAdjacent = function(p_i1, p_i2) {
	return this.borders[p_i1][p_i2].length > 0;
}

// Equivalent of areRegionsAdjacent except it makes sure it is callable re
RegionLoopSolver.prototype.areRegionsAdjacentSafe = function(p_i1, p_i2) {
	if (p_i2 > p_i1) {
		return this.borders[p_i2][p_i1].length > 0;
	} else {
		return this.borders[p_i1][p_i2].length > 0;
	}
}