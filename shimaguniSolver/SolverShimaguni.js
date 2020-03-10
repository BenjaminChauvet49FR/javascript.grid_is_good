function SolverShimaguni(p_wallArray,p_numberGrid){
	this.construct(p_wallArray,p_numberGrid);
}

SolverShimaguni.prototype.construct = function(p_wallArray,p_numberGrid){
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.wallGrid = new WallGrid(p_wallArray,this.xLength,this.yLength); 
	this.regionGrid = this.wallGrid.toRegionGrid();
	this.answerGrid = [];
	this.clusterGrid = [];
	
	var ix,iy;
	var lastRegionNumber = 0;
	
	// Initialize answerGrid, clusterGrid and the number of regions
	for(iy = 0;iy < this.yLength;iy++){
		this.answerGrid.push([]);
		this.clusterGrid.push([]);
		for(ix = 0;ix < this.xLength;ix++){
			lastRegionNumber = Math.max(this.regionGrid[iy][ix],lastRegionNumber);
			this.answerGrid[iy].push(FILLING.UNDECIDED);
			this.clusterGrid[iy].push(0); // 0 = indice cluster par défaut. Au départ, tout est cluster. J'espère qu'on n'augmentera jamais la valeur par défaut...
		}
	}
	this.regionsNumber = lastRegionNumber+1;
	
	// Blantly initialize data of regions
	this.regions = [];
	this.contactTriangle = [];
	for(var i=0;i<this.regionsNumber;i++){
		this.regions.push({
			spaces : [],
			YES : 0,
			NOs : 0,
			UNDEFs : 0,
			size : 0,
			contact : [],
			possibleValues : [],
			minVal : 1,
			maxVal : 0,
			forcedVal : NOT_FORCED,
			freshClusters : true,
			clusters : [],
			indexClusterWithFill : CLUSTER_WITH_FILL.NOT_FOUND,
		});
		this.contactTriangle.push([]); //(Le triangle doit être ainsi : [], [10], [20,21], [30,31,32] ...)
		if(i > 1){
			this.contactTriangle.push([]);	
			for(var j=0;j<i;j++){
				this.contactTriangle[i].push(false);
			}
		}		
	}
	
	// Initialize data of regions spaces + contact between regions (triangle and region data)
	var ir,number;
	var iOtherR;
	var region;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			ir = this.regionGrid[iy][ix];
			number = p_numberGrid[iy][ix];
			this.regions[ir].spaces.push({x:ix,y:iy});
			if (number > 0){
				this.regions[ir].forcedVal = number;
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
	
	// Initialize data of all regions that are possible only now that spaces by region are known.
	for(var ir = 0;ir<this.regionsNumber;ir++){
		region = this.regions[ir];
		region.size = region.spaces.length;
		region.UNDEFs = region.size;
		region.YES = 0;
		region.NOs = 0;
		if (region.forcedVal == NOT_FORCED){
			region.minVal = 1; 
			region.maxVal = region.size;
			for(var is=0;is<region.size;is++){
				region.possibleValues.push(true);
			}
		}
		else{
			region.minVal = this.forcedValue(ir);
			region.maxVal = this.forcedValue(ir);
		}
		region.clustersList = [region.spaces.slice()];
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

SolverShimaguni.prototype.isPossibleValue = function(p_indexRegion,p_value){
	return this.regions[p_indexRegion].possibleValues[p_value-1];
}

SolverShimaguni.prototype.setPossibleValueTrue = function(p_indexRegion,p_value){
	this.regions[p_indexRegion].possibleValues[p_value-1] = true;
}

SolverShimaguni.prototype.setPossibleValueFalse = function(p_indexRegion,p_value){
	this.regions[p_indexRegion].possibleValues[p_value-1] = false;
}

// Contact
SolverShimaguni.prototype.getContact = function(i,j){return (j > i ? this.contactTriangle[j][i] : this.contactTriangle[i][j]);}

SolverShimaguni.prototype.validateContact = function(i,j){
	if (!this.getContact(i,j)){
		this.regions[i].contact.push(j);
		this.regions[j].contact.push(i);
		if (j>i) this.contactTriangle[j][i] = true;
			else this.contactTriangle[i][j] = true;
	}
}

//Getter : answer

SolverShimaguni.prototype.getAnswer = function(p_x,p_y){
	return this.answerGrid[p_y][p_x];
}

//--------------
// Emit 

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
		region.freshClusters = false;
		region.NOs++;
		region.UNDEFs--;
	}
	return RESULT.SUCCESS;
}


SolverShimaguni.prototype.banValue = function(p_indexRegion,p_value){
	var region = this.regions[p_indexRegion];
	if (region.spaces.length < p_value || !this.isPossibleValue(p_indexRegion,p_value)){
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
	return RESULT.SUCCESS;
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
	var introducedXsByRegion,introducedOsByRegion,raisedMinsByRegion;
	
	do{
		//Start a whole loop
		//Initializing everything that is appliable regionally
		introducedXsByRegion = initializeArrayList(this.regionsNumber);
		introducedOsByRegion = initializeArrayList(this.regionsNumber);
		raisedMinsByRegion = initializeArrayList(this.regionsNumber);
		
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
						tryToAddArrayListData(introducedOsByRegion,ir,{x:x,y:y});
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
						tryToAddArrayList(introducedXsByRegion,ir);
						var potentialOs = region.YES+region.UNDEFs;
						if (((potentialOs) == this.forcedValue(ir)) || 
							((potentialOs) == region.minVal)){
							eventsToApply = this.fillRegionWith(eventsToApply,ir,FILLING.YES);
							eventsToApply = this.banAllAdjacentsFromRegion(eventsToApply,ir,potentialOs);
						}//EVENEMENT DE REGION : Si la région est "morcelée", risque de devoir redécouper les clusters (et revoir les valeurs à bannir).
						//EVENEMENT DE REGION : Si potentialOs < la taille max, risque de devoir revoir les valeurs à bannir.
					}
				}
			} else { // Ban a value
				ir = currentEvent.indexRegion;
				tryToAddArrayList(raisedMinsByRegion,ir); //TODO nom à changer ? Même si logiquement on ne s'intéresse qu'aux minima qui diminuent car les clusters deviennent trop petits
				value = currentEvent.valueToBan;
				testBanNew = this.banValue(ir,value);
				if (testBanNew == RESULT.ERROR){
					ok = false;
					debugTryToPutNewGold("NOOOOO !");
				}
				if (testBanNew == RESULT.SUCCESS){ 
					region = this.regions[currentEvent.indexRegion];
					if (region.minVal == region.maxVal){//Ca y'est, une seule valeur possible !
						if ((region.YES + region.UNDEFs) == region.minVal){
							eventsToApply = this.fillRegionWith(eventsToApply,ir,FILLING.YES);
						}
						eventsToApply = this.banAllAdjacentsFromRegion(eventsToApply,ir,region.minVal);
					} //endif "one possible value"
				}
			}
		}while (eventsToApply.length > 0 && ok);
				
		introducedXsByRegion.list.forEach(ir => {
			region = this.regions[ir];
			//Updates clusters ; then ban clusters that don't contain a filled space
			if (!region.freshClusters){
				this.updateClustersRegion(ir);
				if (region.indexClusterWithFill == CLUSTER_WITH_FILL.MULTI){
					ok = false;
					debugTryToPutNewGold("NOOOOO ! (region "+ir+" has more than one cluster with filled space)");
				} else if (region.indexClusterWithFill != CLUSTER_WITH_FILL.NOT_FOUND){
					for(var ic = 0;ic < region.clusters; ic++){
						if (ic != region.indexClusterWithFill){
							region.clusters[ic].forEach(
								space => {eventsToApply.push(SolveEventPosition(space.x,space.y,FILLING.NO))}
							);
						}
					}
				}
			}
			//Put NOs in spaces that would have become too small
			// Also, find the max size of clusters
			var maxClusterSize = 0;
			region.clusters.forEach(listCluster => {
				if (listCluster.length < region.minVal){
					listCluster.forEach(space => {eventsToApply.push(SolveEventPosition(space.x,space.y,FILLING.NO))});
				}
				if (listCluster.length > maxClusterSize){
					maxClusterSize = listCluster.length;
				}
			});
			//Events to ban values between the actual max and the (max size of cluster + 1)
			for(var value = maxClusterSize+1;value <= region.maxVal;value++){
				eventsToApply.push(SolveEventValue(ir,value));
			}
		});
		//From this point to the end of the while loop, all clusters MUST be fresh AND max must be updated.
		
		introducedOsByRegion.list.forEach(introduced => {
			var ir = introduced.index;
			var region = this.regions[ir];
			// Warning : If this is our very first O placed (or several of 'em), "cluster with fill" may have not been found since the last time grid was clustered. 
			// Should be changed when strategy of reclustering is changed !
			var clusterBelong = (region.indexClusterWithFill == CLUSTER_WITH_FILL.NOT_FOUND) ? this.clusterGrid[introduced.y][introduced.x] : region.indexClusterWithFill;
			// Ban clusters that don't contain a filled space
			if (clusterBelong == CLUSTER_WITH_FILL.MULTI){
				ok = false;
				debugTryToPutNewGold("NOOOOO ! (region "+ir+" has more than one cluster with filled space)");
			} else{
				for(var ic = 0;ic < region.clusters.length; ic++){
					if (ic != clusterBelong){
						region.clusters[ic].forEach(
							space => {eventsToApply.push(SolveEventPosition(space.x,space.y,FILLING.NO))}
						);
					}
				}
			}
			//Events to ban values between the min and the (number of Os - 1)
			for(var value = region.minVal;value < region.YES;value++){
				eventsToApply.push(SolveEventValue(ir,value));
			}
		});
		
		//If the min has been raised, ban clusters that have become too small.
		raisedMinsByRegion.list.forEach(ir => {
			region = this.regions[ir];
			region.clusters.forEach(listCluster => {
				if (listCluster.length < region.minVal){
					listCluster.forEach(space => {eventsToApply.push(SolveEventPosition(space.x,space.y,FILLING.NO))});
				}
			});	
			//Peculiar case : no X has been added recently (so no too small clusters detected to ban) yet we have to fill a region with Os since we have that many spaces left.
			//Detected by Shimaguni 188.
			if ((region.minVal == region.maxVal) && (region.minVal == (region.size - region.NOs))){
				eventsToApply = this.fillRegionWith(eventsToApply,ir,FILLING.YES);
			}
		});
		
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

const CLUSTER_WITH_FILL= {
	NOT_FOUND:-1,
	MULTI:-2
}
const NOT_CLUSTERED = -1;

/**
Draws all clusters of a region that needs to be updated ; alters region ; returns the cluster that contains an O... should be only one .
The "index cluster with fill" of the region becomes the index of the cluster that is filled (if there is only one), multi (if there are several) or "not found" (if there are none)
*/
SolverShimaguni.prototype.updateClustersRegion = function(p_indexRegion){
	var region = this.regions[p_indexRegion];
	region.spaces.forEach(space => {this.clusterGrid[space.y][space.x] = NOT_CLUSTERED}); 
	region.indexClusterWithFill = CLUSTER_WITH_FILL.NOT_FOUND;
	var clustersList = [];
	var oneCluster;
	var indexClusterNow;
	region.spaces.forEach(space => {
		oneCluster = this.fillCluster(space.x,space.y,p_indexRegion,clustersList.length);
		if (oneCluster.length > 0){
			clustersList.push(oneCluster);
		}
		if (this.answerGrid[space.y][space.x] == FILLING.YES){
			indexClusterNow = this.clusterGrid[space.y][space.x];
			if (this.indexClusterWithFill == CLUSTER_WITH_FILL.NOT_FOUND){
				this.indexClusterWithFill = indexClusterNow;
			}else if (this.indexClusterWithFill != indexClusterNow){
				this.indexClusterWithFill = CLUSTER_WITH_FILL.MULTI;
				return;
			}
		}
	});
	region.freshClusters = true;
	region.clusters = clustersList;
}

//Looks for all unclustered spaces, updates them to the value and returns the list of spaces updated.
// [] if no cluster (we try to cluster a space with an X or an already clustered space)
SolverShimaguni.prototype.fillCluster = function(p_x,p_y,p_indexRegion,p_value){
	var listUpdatedSpaces = [];
	var listSpacesToUpdate = [{x:p_x,y:p_y}];
	var space,x,y;
	do{
		space = listSpacesToUpdate.pop();
		x = space.x;
		y = space.y;
		if (this.clusterGrid[y][x] == NOT_CLUSTERED && this.regionGrid[y][x] == p_indexRegion && this.answerGrid[y][x] != FILLING.NO){
			this.clusterGrid[y][x] = p_value;
			listUpdatedSpaces.push(space);
			if (y > 0){
				listSpacesToUpdate.push({x:x,y:y-1});
			}
			if (x > 0){
				listSpacesToUpdate.push({x:x-1,y:y});
			}
			if (x < this.xLength-1){
				listSpacesToUpdate.push({x:x+1,y:y});
			}
			if (y < this.yLength-1){
				listSpacesToUpdate.push({x:x,y:y+1});
			}
		}
	} while(listSpacesToUpdate.length != 0);
	return listUpdatedSpaces;
}

/**
Rushes the spaces as big as their size and bans values adjacent to the forced regions
*/
SolverShimaguni.prototype.quickStart = function(){
	var space;
	//First, ban all values adjacent to regions with forced values (or ones of size 1, it works as well).
	this.regions.forEach(region => {
		if (region.forcedVal > 0){
			region.contact.forEach(irc => this.tryToBan(irc,region.forcedVal));
		}
		if (region.size == 1){
			region.contact.forEach(irc => this.tryToBan(irc,1));
		}
	});
	this.regions.forEach(region => {
		if((region.size == region.forcedVal) || (region.size == 1)){
			region.spaces.forEach(space =>
				{this.emitHypothesis(space.x,space.y,FILLING.YES)}
			);
		}
	});
}







//TODO en faire une classe, peut-être... (array : vaut true si un élément est présent. list : liste des index des éléments à true)
function initializeArrayList(p_length){
	var array = [];
	for(var i=0;i<p_length;i++){
		array.push(false);
	}
	return{array:array,list:[]};
}

function tryToAddArrayList(p_arrayList,p_index){
	if (!p_arrayList.array[p_index]){
		p_arrayList.list.push(p_index);
		p_arrayList.array[p_index] = true;
	}
}

//TODO : mélanger index et données en forçant le champ "ir", on a vu mieux. Mais j'ai trouvé cette solution à l'arrache...
function tryToAddArrayListData(p_arrayList,p_index,p_data){
	if (!p_arrayList.array[p_index]){
		var data = p_data;
		data.index = p_index;
		p_arrayList.list.push(data);
		p_arrayList.array[p_index] = true;
	}
}