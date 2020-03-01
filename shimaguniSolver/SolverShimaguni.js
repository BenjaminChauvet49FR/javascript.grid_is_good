function SolverShimaguni(p_wallArray,p_numberGrid){
	this.construct(p_wallArray,p_numberGrid);
}

SolverShimaguni.prototype.construct = function(p_wallArray,p_numberGrid){
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.wallGrid = new WallGrid(p_wallArray,this.xLength,this.yLength); 
	this.regionGrid = this.wallGrid.toRegionGrid();
	this.answerGrid = [];
	
	var ix,iy;
	var lastRegionNumber = 0;
	
	for(iy = 0;iy < this.yLength;iy++){
		this.answerGrid.push([]);
		for(ix = 0;ix < this.xLength;ix++){
			lastRegionNumber = Math.max(this.regionGrid[iy][ix],lastRegionNumber);
			this.answerGrid[iy].push(FILLING.UNDECIDED);
		}
	}
	
	this.regions = [];
	this.contactTriangle = [];
	for(var i=0;i<=lastRegionNumber;i++){
		this.regions.push({
			spaces : [],
			YES : 0,
			NOs : 0,
			UNDEFs : 0,
			contact : [],
			possibleValues : [],
			minVal : 1,
			maxVal : 0,
			forcedVal : NOT_FORCED
		});
		this.contactTriangle.push([]); //(Le triangle doit être ainsi : [], [10], [20,21], [30,31,32] ...)
		if(i > 1){
			this.contactTriangle.push([]);	
			for(var j=0;j<i;j++){
				this.contactTriangle[i].push(false);
			}
		}		
	}
	
	var ir,number;
	var iOtherR;
	var region;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			ir = this.regionGrid[iy][ix];
			number = p_numberGrid[iy][ix];
			this.regions[ir].spaces.push({x:ix,y:iy});
			region = this.regions[ir];
			if (number > 0){
				region.forcedVal = number;
			}
			if (iy < this.yLength-1){
				iOtherR = this.regionGrid[iy+1][ix];
				if (iOtherR != ir){
					this.validateContact(ir,iOtherR);
				}
			}			
			if (ix < this.xLength-1){
				iOtherR = this.regionGrid[iy][ix+1];
				if (iOtherR != ir){
					this.validateContact(ir,iOtherR);
				}
			}
		}
	}
	
	var regionSize;
	for(var i = 0;i<this.regions.length;i++){
		region = this.regions[i];
		regionSize = region.spaces.length;
		region.UNDEFs = regionSize;
		region.YES = 0;
		region.NOs = 0;
		if (region.forcedVal != NOT_FORCED){
			region.minVal = 1; 
			region.maxVal = regionSize;
			for(var ii=0;ii<regionSize;ii++){
				region.possibleValues.push(true);
			}
		}
		//MAJ les trucs du triangle peut-être ?
	}
	
	
}

const NOT_FORCED = -1;

SolverShimaguni.prototype.forcedValue = function(ir){
	return this.regions[ir].forcedVal;
}

SolverShimaguni.prototype.getSpaceCoordinates = function(p_indexRegion,p_indexSpace){
	return this.regions[p_indexRegion].spaces[p_indexSpace];
}

SolverShimaguni.prototype.getContact = function(i,j){return (j > i ? this.contactTriangle[j][i] : this.contactTriangle[i][j]);}
SolverShimaguni.prototype.validateContact = function(i,j){
	if (j>i) this.contactTriangle[j][i] = true;
		else this.contactTriangle[i][j] = true;
}


SolverShimaguni.prototype.getAnswer = function(p_x,p_y){
	return this.answerGrid[p_y][p_x];
}

SolverShimaguni.prototype.emitHypothesis = function(p_x,p_y,p_symbol){
	this.answerGrid[p_y][p_x] = p_symbol; 
}