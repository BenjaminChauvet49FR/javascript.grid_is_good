// Setup
const NOT_FORCED = -1;

function SolverShimaguni() {
	GeneralSolver.call(this);
    this.construct(generateWallArray(1, 1), []);
}

SolverShimaguni.prototype = Object.create(GeneralSolver.prototype);
SolverShimaguni.prototype.constructor = SolverShimaguni;

SolverShimaguni.prototype.construct = function(p_wallArray, p_indicationsRegions) {
	this.generalConstruct();
	this.xLength = p_wallArray[0].length;
	this.yLength = p_wallArray.length;
	this.gridWall = WallGrid_data(p_wallArray); 
	this.regionGrid = this.gridWall.toRegionGrid();
	this.answerGrid = [];
	this.clusterGrid = [];
	var ix,iy;
	var lastRegionNumber = 0;
	
	this.methodSetDeductions = new ApplyEventMethodNonAdjacentPack(
		applyEventClosure(this),
		deductionsClosure(this),
		undoEventClosure(this)
	);
	this.methodSetDeductions.addAbortAndFilters(abortClosure(this), [filterClustersClosure(this)]);
	this.methodSetPass = {comparisonMethod : compareSolveEvents, copyMethod : copying, argumentToLabelMethod : namingCategoryClosure(this)};
	this.methodsMultiPass = {
		generatePassEventsMethod : generateEventsForRegionPassClosure(this),
		orderPassArgumentsMethod : orderedListPassArgumentsClosure(this)
		//skipPassMethod : skipPassClosure(this)
	};
	
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
			freshClusters : false,
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
	var ir;
	var iOtherR;
	var region;
	for(iy = 0;iy < this.yLength;iy++){
		for(ix = 0;ix < this.xLength;ix++){
			ir = this.regionGrid[iy][ix];
			this.regions[ir].spaces.push({x:ix,y:iy});
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
	p_indicationsRegions.forEach(indic => {
		region = this.regions[indic.index];
		region.forcedVal = indic.value;
	});
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
		region.clusters = [region.spaces.slice()];
	}
	
	//For filtering
	this.introducedXsByRegion = initializeArrayList(this.regionsNumber);
	this.introducedOsByRegion = initializeArrayList(this.regionsNumber);
	this.raisedMinsByRegion = initializeArrayList(this.regionsNumber);
}

//--------------------------------

// Misc methods (may be used for drawing and intelligence)

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
// Input

SolverShimaguni.prototype.emitHypothesis = function(p_x,p_y,p_symbol){
	return this.tryToPutNew(p_x,p_y,p_symbol);
}

SolverShimaguni.prototype.undo = function() {
	this.undoToLastHypothesis(undoEventClosure(this));
}

SolverShimaguni.prototype.quickStart = function() {
	var space;
	this.initiateQuickStart();
	//First, ban all values adjacent to regions with forced values (or ones of size 1, it works as well).
	this.regions.forEach(region => {
		if (region.forcedVal > 0) {
			region.contact.forEach(irc => this.tryToBan(irc, region.forcedVal));
		}
		if (region.size == 1) {
			region.contact.forEach(irc => this.tryToBan(irc, 1));
		}
	});
	this.regions.forEach(region => {
		if((region.size == region.forcedVal) || (region.size == 1)) {
			region.spaces.forEach(space =>
				{this.emitHypothesis(space.x,space.y,FILLING.YES)}
			);
		}
	});
	this.terminateQuickStart();
}

SolverShimaguni.prototype.passRegion = function(p_indexRegion) {
	generatedEvents = this.generateEventsForRegionPass(p_indexRegion);
	this.passEvents(generatedEvents, this.methodSetDeductions, this.methodSetPass, p_indexRegion); 
}

SolverShimaguni.prototype.makeMultiPass = function() {
	this.multiPass(this.methodSetDeductions, this.methodSetPass, this.methodsMultiPass);
}

//--------------
// Central method

SolverShimaguni.prototype.tryToPutNew = function(p_x, p_y, p_symbol) {
	this.tryToApplyHypothesis(SolveEventPosition(p_x, p_y, p_symbol), this.methodSetDeductions);
}

SolverShimaguni.prototype.tryToBan = function(p_region, p_value) {
	this.tryToApplyHypothesis(SolveEventValue(p_region, p_value), this.methodSetDeductions);
}

//--------------------------------
// Doing and undoing

applyEventClosure = function(p_solver) {
	return function(p_solveEvent) {
		if (p_solveEvent.kind == KIND.SYMBOL){
			return p_solver.putNew(p_solveEvent.x,p_solveEvent.y, p_solveEvent.symbol);
		} else {
			return p_solver.banValue(p_solveEvent.indexRegion, p_solveEvent.valueToBan);
		}
	}
}

SolverShimaguni.prototype.putNew = function(p_x,p_y,p_symbol) {
	if (p_symbol == this.answerGrid[p_y][p_x]){
		return EVENT_RESULT.HARMLESS;
	}
	if (this.answerGrid[p_y][p_x] != FILLING.UNDECIDED){
		return EVENT_RESULT.FAILURE;
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
	return EVENT_RESULT.SUCCESS;
}


SolverShimaguni.prototype.banValue = function(p_indexRegion,p_value){
	var region = this.regions[p_indexRegion];
	if (region.spaces.length < p_value || !this.isPossibleValue(p_indexRegion,p_value)){
		return EVENT_RESULT.HARMLESS;
	}
	if (region.forcedValue == p_value){
		return EVENT_RESULT.FAILURE;
	}
	if (region.forcedValue > 0){
		return EVENT_RESULT.HARMLESS;
	}
	var newMin = region.minVal;
	var newMax = region.maxVal;
	if (p_value == region.minVal){
		if (p_value == region.maxVal){
			return EVENT_RESULT.FAILURE;
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
	return EVENT_RESULT.SUCCESS;
}

undoEventClosure = function(p_solver) {
	return function(p_eventToUndo) {
		if (p_eventToUndo.kind == KIND.SYMBOL){
			p_solver.undoSymbolEvent(p_eventToUndo);
		}
		else{
			p_solver.undoValueEvent(p_eventToUndo);
		}
	}
}

SolverShimaguni.prototype.undoSymbolEvent = function(p_event){
	const region = this.regions[this.regionGrid[p_event.y][p_event.x]];
	region.freshClusters = false;
	this.answerGrid[p_event.y][p_event.x] = FILLING.UNDECIDED;
	if (p_event.symbol == FILLING.YES){
		region.YES--;
		region.UNDEFs++;
	}
	else{
		region.NOs--;
		region.UNDEFs++;
	}
}

SolverShimaguni.prototype.undoValueEvent = function(p_event) {
	const region = this.regions[p_event.indexRegion];
	this.setPossibleValueTrue(p_event.indexRegion,p_event.valueToBan);
	if (p_event.valueToBan < region.minVal) {
		region.minVal = p_event.valueToBan;
	}
	if (p_event.valueToBan > region.maxVal) {
		region.maxVal = p_event.valueToBan;
	}
}

//-------------------------------- 
// Deductions

deductionsClosure = function (p_solver) {
	return function(p_listEventsToApply, p_eventBeingApplied) {
		if (p_eventBeingApplied.kind == KIND.SYMBOL) {
			//Put symbol into space
			x = p_eventBeingApplied.x;
			y = p_eventBeingApplied.y;
			symbol = p_eventBeingApplied.symbol;
			ir = p_solver.getRegionIndex(x,y);
			region = p_solver.regions[ir];
			if (symbol == FILLING.YES) {
				tryToAddArrayListData(p_solver.introducedOsByRegion,ir,{x:x,y:y});
				if (x>0 && (p_solver.getRegionIndex(x-1,y) != ir)){
					p_listEventsToApply.push(SolveEventPosition(x-1,y,FILLING.NO));
				}if (x<p_solver.xLength-1 && (p_solver.getRegionIndex(x+1,y) != ir)){
					p_listEventsToApply.push(SolveEventPosition(x+1,y,FILLING.NO));
				}if (y>0 && (p_solver.getRegionIndex(x,y-1) != ir)){
					p_listEventsToApply.push(SolveEventPosition(x,y-1,FILLING.NO));
				}if (y<p_solver.yLength-1 && (p_solver.getRegionIndex(x,y+1) != ir)){
					p_listEventsToApply.push(SolveEventPosition(x,y+1,FILLING.NO));
				}
				if ((region.YES == p_solver.forcedValue(ir)) || (region.YES == region.maxVal)){
					region.spaces.forEach(space=>{
						if(p_solver.answerGrid[space.y][space.x] ==  FILLING.UNDECIDED){
							p_listEventsToApply.push(SolveEventPosition(space.x,space.y,FILLING.NO));
					}});
					region.contact.forEach(irc => p_listEventsToApply.push(SolveEventValue(irc,region.YES)));
				}
			}
			if (symbol == FILLING.NO) {
				tryToAddArrayList(p_solver.introducedXsByRegion,ir);
				var potentialOs = region.YES+region.UNDEFs;
				if (((potentialOs) == p_solver.forcedValue(ir)) || 
					((potentialOs) == region.minVal)){
					p_listEventsToApply = p_solver.fillRegionWith(p_listEventsToApply,ir,FILLING.YES);
					p_listEventsToApply = p_solver.banAllAdjacentsFromRegion(p_listEventsToApply,ir,potentialOs);
				}//EVENEMENT DE REGION : Si la région est "morcelée", risque de devoir redécouper les clusters (et revoir les valeurs à bannir).
				//EVENEMENT DE REGION : Si potentialOs < la taille max, risque de devoir revoir les valeurs à bannir.
			}		
		} else { // Ban a value
			ir = p_eventBeingApplied.indexRegion;
			tryToAddArrayList(p_solver.raisedMinsByRegion,ir); 
			region = p_solver.regions[p_eventBeingApplied.indexRegion];
			if (region.minVal == region.maxVal){//Ca y'est, une seule valeur possible !
				if ((region.YES + region.UNDEFs) == region.minVal){
					p_listEventsToApply = p_solver.fillRegionWith(p_listEventsToApply,ir,FILLING.YES);
				}
				p_listEventsToApply = p_solver.banAllAdjacentsFromRegion(p_listEventsToApply,ir,region.minVal);
			} //endif "one possible value"
		}
		return p_listEventsToApply;
	}
}

//From this point to the end of the while loop, all clusters MUST be fresh AND max must be updated.
filterClustersClosure = function(p_solver) {
	return function() {
		var eventsToApply = [];
		var ok = true;
		
		p_solver.introducedXsByRegion.list.forEach(ir => {
			region = p_solver.regions[ir];
			//Updates clusters ; then ban clusters that don't contain a filled space
			if (!region.freshClusters){
				p_solver.updateClustersRegion(ir);
				if (region.indexClusterWithFill == CLUSTER_WITH_FILL.MULTI){
					ok = false;
					autoLogTryToPutNewGold("NOOOOO ! (region "+ir+" has more than one cluster with filled space)");
				} else if (region.indexClusterWithFill != CLUSTER_WITH_FILL.NOT_FOUND){
					for(var ic = 0;ic < region.clusters.length; ic++){
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
		
		if (!ok) {
			return EVENT_RESULT.FAILURE;
		}
		
		p_solver.introducedOsByRegion.list.forEach(introduced => {
			var ir = introduced.index;
			var region = p_solver.regions[ir];
			if (!region.freshClusters){
				p_solver.updateClustersRegion(ir);
			}
			// If this is our very first O placed (or several of 'em) in this region, an update is mandatory so a "cluster with fill" is found.
			var clusterBelong = (region.indexClusterWithFill == CLUSTER_WITH_FILL.NOT_FOUND) ? p_solver.clusterGrid[introduced.y][introduced.x] : region.indexClusterWithFill;
			//var clusterBelong = region.indexClusterWithFill;
			// Ban clusters that don't contain a filled space
			if (clusterBelong == CLUSTER_WITH_FILL.MULTI){
				ok = false;
				autoLogTryToPutNewGold("NOOOOO ! (region "+ir+" has more than one cluster with filled space)");
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
		
		if (!ok) {
			return EVENT_RESULT.FAILURE;
		}
		
		//From this point to the end of the filter function, all clusters MUST be fresh AND max must be updated.
		
		//If the min has been raised, ban clusters that have become too small.
		p_solver.raisedMinsByRegion.list.forEach(ir => {
			region = p_solver.regions[ir];
			if (!region.freshClusters){
				p_solver.updateClustersRegion(ir); // Okay ; there MAY be situations where the minimum of a region has to be raised without an O or a X put in (because smaller values are banned due to being present in surrounding regions) and the clusters are still outdated (because of Os and Xs put here in previous passes)
			} // So... let's update !
			region.clusters.forEach(listCluster => {
				if (listCluster.length < region.minVal){
					listCluster.forEach(space => {eventsToApply.push(SolveEventPosition(space.x,space.y,FILLING.NO))});
				}
			});	
			//Peculiar case : no X has been added recently (so no too small clusters detected to ban) yet we have to fill a region with Os since we have that many spaces left.
			//Detected by Shimaguni 188.
			if ((region.minVal == region.maxVal) && (region.minVal == (region.size - region.NOs))){
				eventsToApply = p_solver.fillRegionWith(eventsToApply,ir,FILLING.YES);
			}
		});
		
		p_solver.cleanByRegionLists();
		
		if (ok) {
			return eventsToApply;
		} else {
			return EVENT_RESULT.FAILURE;
		}
	}
}

abortClosure = function(p_solver) {
	return function() {
		p_solver.cleanByRegionLists();
	}
}

SolverShimaguni.prototype.cleanByRegionLists = function() {
	this.introducedXsByRegion = initializeArrayList(this.regionsNumber);
	this.introducedOsByRegion = initializeArrayList(this.regionsNumber);
	this.raisedMinsByRegion = initializeArrayList(this.regionsNumber);
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
			if (region.indexClusterWithFill == CLUSTER_WITH_FILL.NOT_FOUND){
				region.indexClusterWithFill = indexClusterNow;
			} else if (region.indexClusterWithFill != indexClusterNow){
				region.indexClusterWithFill = CLUSTER_WITH_FILL.MULTI;
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

// Some ArrayList methods

//TODO Maybe a class should be done of it... or maybe not.
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

//Note : "index" is an injected field for data.
function tryToAddArrayListData(p_arrayList,p_index,p_data){
	if (!p_arrayList.array[p_index]){
		var data = p_data;
		data.index = p_index;
		p_arrayList.list.push(data);
		p_arrayList.array[p_index] = true;
	}
}

// ---------------------
// Pass methods

generateEventsForRegionPassClosure = function(p_solver) {
	return function(p_indexRegion) {
		return p_solver.generateEventsForRegionPass(p_indexRegion);
	}
}

SolverShimaguni.prototype.generateEventsForRegionPass = function(p_indexRegion) {
	var eventList = [];
	this.regions[p_indexRegion].spaces.forEach(space => {
		if (this.answerGrid[space.y][space.x] == FILLING.UNDECIDED) { // It would still be correct, albeit useless, to pass already filled spaces
			eventList.push([SolveEventPosition(space.x, space.y, FILLING.YES), SolveEventPosition(space.x, space.y, FILLING.NO)]);
		}			 
	});
	return eventList;
}

copying = function(p_event) {
	return p_event.copy();
}

/**
Compares two space events for sorting (left is "superior" : 1 ; right is "superior" : -1)
*/
function compareSolveEvents(p_spaceEvent1, p_spaceEvent2) {
	if (p_spaceEvent1.kind != p_spaceEvent2.kind){
		return p_spaceEvent1.kind-p_spaceEvent2.kind;
	}
	if (p_spaceEvent1.kind == KIND.SYMBOL) {
		if (p_spaceEvent1.y < p_spaceEvent2.y)
			return -1;
		if ((p_spaceEvent1.y > p_spaceEvent2.y) || (p_spaceEvent1.x > p_spaceEvent2.x))
			return 1;
		if (p_spaceEvent1.x < p_spaceEvent2.x)
			return -1;
		const c1 = (p_spaceEvent1.symbol == FILLING.YES ? 1 : 0);
		const c2 = (p_spaceEvent2.symbol == FILLING.YES ? 1 : 0); // Works because only two values are admitted
		return c1-c2; // IF COMPARISON OF STATES IS FORGOTTEN, THE INTERSECTION OF TWO CORRECT EVENT LISTS IS INCORRECT DURING PASSES.
	} else {
		if (p_spaceEvent1.indexRegion < p_spaceEvent2.indexRegion)
			return -1;
		if ((p_spaceEvent1.indexRegion > p_spaceEvent2.indexRegion) || (p_spaceEvent1.valueToBan > p_spaceEvent2.valueToBan))
			return 1;
		if (p_spaceEvent1.valueToBan < p_spaceEvent2.valueToBan)
			return -1;
		return 0;
	}
}

function namingCategoryClosure(p_solver) {
	return function (p_indexRegion) {
		const firstSpaceRegion = p_solver.getSpaceCoordinates(p_indexRegion, 0);
		return "Region "+ p_indexRegion + " (" + firstSpaceRegion.x +" "+ firstSpaceRegion.y + ")"; 
	}
}


// ---------------------
// Multipass methods

orderedListPassArgumentsClosure = function(p_solver) {
	return function() {
		var indexList = [];
		var values = [];
		for (var i = 0; i < p_solver.regions.length ; i++) {
			if (p_solver.regions[i].UNDEFs > 0) {
				indexList.push(i);
			}
		}
		indexList.sort(function(p_i1, p_i2) {
			return p_solver.regions[p_i1].UNDEFs-p_solver.regions[p_i2].UNDEFs;
		});
		return indexList;
	}
}