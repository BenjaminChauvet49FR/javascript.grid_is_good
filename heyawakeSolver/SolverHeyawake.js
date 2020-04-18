const NOT_FORCED = -1;
const NOT_RELEVANT = -1;
const FILLING = {YES :1,NO:2, UNDECIDED :0};
const RESULT = {
SUCCESS : 3,
ERROR : 1,
HARMLESS : 2
}
const EVENTLIST_KIND = {HYPOTHESIS:"H",PASS:"P"};

function SolverHeyawake(p_wallArray,p_numberGrid){
	this.construct(p_wallArray,p_numberGrid);
}

SolverHeyawake.prototype.construct = function(p_wallArray,p_numberGrid){
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.wallGrid = new WallGrid(p_wallArray,this.xLength,this.yLength); 
	this.regionGrid = this.wallGrid.toRegionGrid();
	this.answerGrid = [];
	this.stripGrid = [];
	this.horizontalStripes = [];
	this.verticalStripes = [];
	this.happenedEvents = [];
	var ix,iy;
	var lastRegionNumber = 0;
	
	
	// Initialize the required grids (notably answerGrid) and the number of regions
	for(iy = 0;iy < this.yLength;iy++){
		this.answerGrid.push([]);
		this.stripGrid.push([]);
		for(ix = 0;ix < this.xLength;ix++){
			lastRegionNumber = Math.max(this.regionGrid[iy][ix],lastRegionNumber);
			this.answerGrid[iy].push(FILLING.UNDECIDED);
			this.stripGrid[iy].push({leftMost:NOT_RELEVANT,horizIn:NOT_RELEVANT,rightMost:NOT_RELEVANT,topMost:NOT_RELEVANT,vertIn:NOT_RELEVANT,bottomMost:NOT_RELEVANT});
		}
	}
	this.regionsNumber = lastRegionNumber+1;
	
	// Blantly initialize data of regions
	var ir;
	this.regions = [];
	for(ir=0;ir<this.regionsNumber;ir++){
		this.regions.push({
			spaces : [],
			expectedNumberOfOsInRegion : NOT_FORCED,
			notPlacedYet : null,
			size : 0,
			horizontalInnerStripesIndexes : [],
			verticalInnerStripesIndexes : [] 
		});
	}
	
	// Now that region data are created : 
	// Initialize spaces by region + for those with a value, numbers of Os to place in notPlaced yet
	var number, region;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			ir = this.regionGrid[iy][ix];
			number = p_numberGrid[iy][ix];
			region = this.regions[ir];
			region.spaces.push({x:ix,y:iy});
			if (number != null){
				region.expectedNumberOfOsInRegion = number;
				region.notPlacedYet = {YESs : number};
			}
		}
	}
	
	// Initialize numbers of Xs to place (now that all region spaces are known)
	// Also initialize regions sizes for shortcut
	for(ir = 0;ir<this.regionsNumber;ir++){
		region = this.regions[ir];
		region.size = region.spaces.length;
		if (region.notPlacedYet != null){
			region.notPlacedYet.NOs = region.size-region.notPlacedYet.YESs;
		}
	}
	
	//And now, the stripes for Heyawake ! (ie the smallest series of contiguous aligned spaces that cross 2 borders)
	var endStrip;
	var indexStrip;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			//If it has a right boundary, draw an horizontal band to the right boundary if it exists.
			if (this.wallGrid.getWallR(ix,iy) == CLOSED){
				endStrip = ix+1;
				while (endStrip < this.xLength-1 && this.wallGrid.getState(endStrip+1,iy) != CLOSED && this.wallGrid.getWallR(endStrip,iy) != CLOSED){
					endStrip++;
				}
				endStrip++; 
				//Right now, endStrip corresponds to "the right of a boundary" or "a banned/out-of-bounds space"
				if (endStrip < this.xLength && this.wallGrid.getState(endStrip,iy) != CLOSED){
					//We met a true region boundary ? Fine, to work now !
					irInner = this.regionGrid[iy][ix+1]; //Region of the inner grid
					indexStrip = this.horizontalStripes.length;
					this.regions[irInner].horizontalInnerStripesIndexes.push(indexStrip);
					this.stripGrid[iy][ix].leftMost = indexStrip;
					this.stripGrid[iy][endStrip].rightMost = indexStrip;
					for(var ix2 = ix+1; ix2 < endStrip ; ix2++){
						this.stripGrid[iy][ix2].horizIn = indexStrip;
					}
					this.horizontalStripes.push({row:iy,xStart:ix,xEnd:endStrip, UNDEFs: endStrip-ix+1, YESs:0});
				}
			}
			//Same down.
			if (this.wallGrid.getWallD(ix,iy) == CLOSED){
				endStrip = iy+1;
				while (endStrip < this.yLength-1 && this.wallGrid.getState(ix,endStrip+1) != CLOSED && this.wallGrid.getWallD(ix,endStrip) != CLOSED){
					endStrip++;
				}
				endStrip++; 
				// ... "the bottom of a boundary" ... "a banned/out-of-bounds space"
				if (endStrip < this.yLength && this.wallGrid.getState(ix,endStrip) != CLOSED){
					irInner = this.regionGrid[iy+1][ix]; 
					indexStrip = this.verticalStripes.length;
					this.regions[irInner].verticalInnerStripesIndexes.push(indexStrip);
					this.stripGrid[iy][ix].topMost = indexStrip;
					this.stripGrid[endStrip][ix].bottomMost = indexStrip;
					for(var iy2 = iy+1; iy2 < endStrip ; iy2++){
						this.stripGrid[iy2][ix].vertIn = indexStrip;
					}
					this.verticalStripes.push({column:ix,yStart:iy,yEnd:endStrip, UNDEFs: endStrip-iy+1, YESs:0});
				}
			}
		}
	}
}

SolverHeyawake.prototype.expectedNumberInRegion = function(ir){
	return this.regions[ir].expectedNumberOfOsInRegion;
}

SolverHeyawake.prototype.getSpaceCoordinates = function(p_indexRegion,p_indexSpace){
	return this.regions[p_indexRegion].spaces[p_indexSpace];
}