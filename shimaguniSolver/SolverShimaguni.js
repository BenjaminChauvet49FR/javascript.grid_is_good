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
	for(var ir = 0;ir<this.regions.length;ir++){
		region = this.regions[ir];
		regionSize = region.spaces.length;
		region.UNDEFs = regionSize;
		region.YES = 0;
		region.NOs = 0;
		if (region.forcedVal == NOT_FORCED){
			region.minVal = 1; 
			region.maxVal = regionSize;
			for(var is=0;is<regionSize;is++){
				region.possibleValues.push(true);
			}
		}
		else{
			region.minVal = this.forcedValue(ir);
			region.maxVal = this.forcedValue(ir);
		}
		//MAJ les trucs du triangle peut-être ?
	}
	
	
}

const NOT_FORCED = -1;

SolverShimaguni.prototype.getRegion = function(ix,iy){
	return this.regions[this.regionGrid[iy][ix]];
}

SolverShimaguni.prototype.getRegionIndex = function(ix,iy){
	return this.regionGrid[iy][ix];
}

SolverShimaguni.prototype.forcedValue = function(ir){
	return this.regions[ir].forcedVal;
}

SolverShimaguni.prototype.getSpaceCoordinates = function(p_indexRegion,p_indexSpace){
	return this.regions[p_indexRegion].spaces[p_indexSpace];
}

/*TODO : Warning ! Doesn't work on "forced values"*/
SolverShimaguni.prototype.isPossibleValue = function(p_indexRegion,p_value){
	return this.regions[p_indexRegion].possibleValues[p_value-1];
}

SolverShimaguni.prototype.setPossibleValueTrue = function(p_indexRegion,p_value){
	this.regions[p_indexRegion].possibleValues[p_value-1] = true;
}

SolverShimaguni.prototype.setPossibleValueFalse = function(p_indexRegion,p_value){
	this.regions[p_indexRegion].possibleValues[p_value-1] = false;
}


SolverShimaguni.prototype.getContact = function(i,j){return (j > i ? this.contactTriangle[j][i] : this.contactTriangle[i][j]);}

SolverShimaguni.prototype.validateContact = function(i,j){
	if (!this.getContact(i,j)){
		this.regions[i].contact.push(j);
		this.regions[j].contact.push(i);
		if (j>i) this.contactTriangle[j][i] = true;
			else this.contactTriangle[i][j] = true;
	}
}


SolverShimaguni.prototype.getAnswer = function(p_x,p_y){
	return this.answerGrid[p_y][p_x];
}

SolverShimaguni.prototype.emitHypothesis = function(p_x,p_y,p_symbol){
	return this.tryToPutNew(p_x,p_y,p_symbol);
}

//--------------
// Put new and try

SolverShimaguni.prototype.putNew = function(p_x,p_y,p_symbol){
	if (p_symbol == this.answerGrid[p_y][p_x]){
		return RESULT.HARMLESS;
	}
	if (this.answerGrid[p_y][p_x] != FILLING.UNDECIDED){
		return RESULT.ERROR;
	}
	var region = this.getRegion(p_x,p_y);
	this.answerGrid[p_y][p_x] = p_symbol;
	if (p_symbol == FILLING.YES){
		region.YES++;
		region.UNDEFs--;
	}
	else{
		region.NOs++;
		region.UNDEFs--;
	}
	return RESULT.SUCCESS;
}


SolverShimaguni.prototype.banValue = function(p_indexRegion,p_value){
	var region = this.regions[p_indexRegion];
	if (region.spaces.length < p_value){
		return RESULT.HARMLESS;
	}
	if (region.forcedValue == p_value){
		return RESULT.ERROR;
	}
	if (region.forcedValue > 0){
		return RESULT.HARMLESS;
	}
	var newMin = region.minVal;
	var newMax = region.maxVal;
	if (p_value == region.minVal){
		if (p_value == region.maxVal){
			return RESULT.ERROR;
		}
		do{
			newMin++;
		}while(!this.isPossibleValue(p_indexRegion,newMin));
	}
	if (p_value == region.maxVal){
		do{
			newMax--;
		}while(!this.isPossibleValue(p_indexRegion,newMax));
	}
	region.maxVal = newMax;
	region.minVal = newMin;
	this.setPossibleValueFalse(p_indexRegion,p_value);
}

SolverShimaguni.prototype.tryToPutNew = function(p_x,p_y,p_symbol){
	return this.tryToApplyEvent([SolveEventPosition(p_x,p_y,p_symbol)]);
}

SolverShimaguni.prototype.tryToBan = function(p_region,p_value){
	return this.tryToApplyEvent([SolveEventValue(p_region,p_value)]);
}

SolverShimaguni.prototype.tryToApplyEvent = function(p_singletonEvent){
	var eventsToApply = p_singletonEvent;
	var regionalEventsToAdd = [];
	var currentEvent;
	var testPutNew,testBanNew;
	var kind,value,ir,x,y,symbol;
	var ok = true;
	var region;
	do{
		do{
			currentEvent = eventsToApply.pop();
			debugTryToPutNewGold("Trying to apply : "+currentEvent.toString());
			if (currentEvent.kind == KIND.SYMBOL ){ //Put symbol into space
				x = currentEvent.x;
				y = currentEvent.y;
				symbol = currentEvent.symbol;
				testPutNew = this.putNew(x,y,symbol);
				if (testPutNew == RESULT.ERROR){
					ok = false;
					debugTryToPutNewGold("NOOOOO !");
				}
				if (testPutNew == RESULT.SUCCESS){
					ir = this.getRegionIndex(x,y);
					region = this.regions[ir];
					if (symbol == FILLING.YES){
						if (x>0 && (this.getRegionIndex(x-1,y) != ir)){
							eventsToApply.push(SolveEventPosition(x-1,y,FILLING.NO));
						}if (x<this.xLength-1 && (this.getRegionIndex(x+1,y) != ir)){
							eventsToApply.push(SolveEventPosition(x+1,y,FILLING.NO));
						}if (y>0 && (this.getRegionIndex(x,y-1) != ir)){
							eventsToApply.push(SolveEventPosition(x,y-1,FILLING.NO));
						}if (y<this.yLength-1 && (this.getRegionIndex(x,y+1) != ir)){
							eventsToApply.push(SolveEventPosition(x,y+1,FILLING.NO));
						}
						if ((region.YES == this.forcedValue(ir)) || (region.YES == region.maxVal)){
							region.spaces.forEach(space=>{
								if(this.answerGrid[space.y][space.x] ==  FILLING.UNDECIDED){
									eventsToApply.push(SolveEventPosition(space.x,space.y,FILLING.NO));
							}});
							region.contact.forEach(irc => eventsToApply.push(SolveEventValue(irc,region.YES)));
						}
					}
					if (symbol == FILLING.NO){
						var potentialOs = region.YES+region.UNDEFs;
						if (((potentialOs) == this.forcedValue(ir)) || 
							((potentialOs) == region.minVal)){
							eventsToApply = this.fillRegionWith(eventsToApply,ir,FILLING.YES);
							eventsToApply = this.banAllAdjacentsFromRegion(eventsToApply,ir,potentialOs);
						}//EVENEMENT DE REGION : Si la région est "morcelée", risque de devoir redécouper les clusters (et revoir les valeurs à bannir).
						//EVENEMENT DE REGION : Si potentialOs < la taille max, risque de devoir revoir les valeurs à bannir.
						if (potentialOs == region.maxVal-1){
							eventsToApply.push(SolveEventValue(ir,region.maxVal)); //This event will be applied immediatly after, right ?
						}
					}
				}
			} else { // Ban a value
				ir = currentEvent.indexRegion;
				value = currentEvent.valueToBan;
				testBanNew = this.banValue(ir,value);
				if (testBanNew == RESULT.ERROR){
					ok = false;
					debugTryToPutNewGold("NOOOOO !");
				}
				if (testBanNew == RESULT.SUCCESS){
					region = this.regions[indexRegion];
					if (region.minVal == region.maxVal){//Ca y'est, une seule valeur possible !
						if ((region.YES + region.UNDEFs) == region.minVal){
							eventsToApply = this.fillRegionWith(eventsToApply,ir,FILLING.YES);
						}
						eventsToApply = this.banAllAdjacentsFromRegion(eventsToApply,ir,region.minVal);
					} //endif "one possible value"
				}
			}
		}while (eventsToApply.length > 0 && ok);
		
		while(regionalEventsToAdd.length > 0 && ok){

		}					
	} while (eventsToApply.length > 0 && ok);
	if (!ok){
		//Annuler 
	}
	
	
}

/**
Returns a list of planned events : plans to fill the remaining undecided spaces in the region. 
*/
SolverShimaguni.prototype.fillRegionWith = function(p_eventsToApply, p_indexRegion, p_symbol){
	var region = this.regions[p_indexRegion];
	region.spaces.forEach(space => {
		if (this.answerGrid[space.y][space.x] == FILLING.UNDECIDED){
			p_eventsToApply.push(SolveEventPosition(space.x,space.y,p_symbol));
		}
	});
	return p_eventsToApply;
}

SolverShimaguni.prototype.banAllAdjacentsFromRegion = function(p_eventsToApply, p_indexRegion, p_valueToBan){
	this.regions[p_indexRegion].contact.forEach(irc => {
		p_eventsToApply.push(SolveEventValue(irc,p_valueToBan));
	});
	return p_eventsToApply;
}



/**
Rushes the spaces as big as their size and bans values adjacent to the forced regions
*/
SolverShimaguni.prototype.quickStart = function(){
	var space;
	this.regions.forEach(region => {
		if((region.spaces.length == region.forcedVal) || (region.spaces.length == 1)){
			region.spaces.forEach(space =>
				{this.emitHypothesis(space.x,space.y,FILLING.YES)}
			);
		}
		if (region.forcedVal > 0){
			region.contact.forEach(irc => this.banValue(irc,region.forcedVal));
		}
	});
}