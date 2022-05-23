GeneralSolver.prototype.callStateForItem = function(p_item) {
	const colourSuccess = '#008800'; // Note : these colours are not for canvas, so they don't count for ColourBank.
	const colourFailure = '#880000';
	const colourNeutral = '#000000';
	const colourKindaFailure = '#880066';
	const defaultString = "-";
	if (this.stateChangedSinceLastRefresh) {
		this.stateChangedSinceLastRefresh = false;
		const formerValue = p_item.innerHTML;
		switch (this.lastHappeningState) {
			case DEDUCTIONS_RESULT.SUCCESS : 
				p_item.innerHTML = "Déduction réussie"; 
				p_item.style.color = colourSuccess;
			break;
			case DEDUCTIONS_RESULT.HARMLESS : 
				p_item.innerHTML = "Déduction sans effet"; 
				p_item.style.color = colourNeutral;
			break;
			case DEDUCTIONS_RESULT.FAILURE : 
				p_item.innerHTML = "Déduction incorrecte"; 
				p_item.style.color = colourFailure;
			break;	
			case PASS_RESULT.SUCCESS : 
				p_item.innerHTML = "Passe réussie"; 
				p_item.style.color = colourSuccess;
			break;
			case PASS_RESULT.HARMLESS : 
				p_item.innerHTML = "Passe sans effet"; 
				p_item.style.color = colourNeutral;
			break;
			case PASS_RESULT.FAILURE : 
				p_item.innerHTML = "Echec de la passe"; 
				p_item.style.color = colourFailure;
			break;
			case GLOBAL_DEDUCTIONS_RESULT.SUCCESS : 
				p_item.innerHTML = "Déduction globale réussie"; 
				p_item.style.color = colourSuccess;
			break;
			case GLOBAL_DEDUCTIONS_RESULT.HARMLESS : 
				p_item.innerHTML = "Déduction globale sans effet"; 
				p_item.style.color = colourNeutral;
			break;
			case GLOBAL_DEDUCTIONS_RESULT.FAILURE : 
				p_item.innerHTML = "Echec de la déduction globale"; 
				p_item.style.color = colourFailure;
			break;
			case MULTIPASS_RESULT.SUCCESS : 
				p_item.innerHTML = "Multipasse réussie"; 
				p_item.style.color = colourSuccess;
			break;
			case MULTIPASS_RESULT.HARMLESS : 
				p_item.innerHTML = "Multipasse sans effet"; 
				p_item.style.color = colourNeutral;
			break;
			case MULTIPASS_RESULT.FAILURE : 
				p_item.innerHTML = "Echec de la multipasse"; 
				p_item.style.color = colourFailure;
			break;
			case RESOLUTION_RESULT.MULTIPLE : 
				p_item.innerHTML = "Solutions multiples"; // Note : to be used soon
				p_item.style.color = colourKindaFailure;
			break;
			case RESOLUTION_RESULT.NOT_FOUND : 
				p_item.innerHTML = "Abandon de la recherche"; // Note : to be used soon
				p_item.style.color = colourKindaFailure;
			break;
			case RESOLUTION_RESULT.SUCCESS : 
				p_item.innerHTML = "Puzzle résolu"; 
				p_item.style.color = colourSuccess;
			break;
			case RESOLUTION_RESULT.FAILURE : 
				p_item.innerHTML = "Echec de la résolution"; 
				p_item.style.color = colourFailure;
			break;
			case QUICKSTART_RESULT.SUCCESS : 
				p_item.innerHTML = "Démarrage rapide"; 
				p_item.style.color = colourSuccess;
			break;
			case QUICKSTART_RESULT.FAILURE : 
				p_item.innerHTML = "Ce puzzle ne peut être résolu ! (échec du démarrage rapide)"; 
				p_item.style.color = colourFailure;
			break;
			case QUICKSTART_RESULT.ALREADY_DONE : 
				p_item.innerHTML = "Démarrage rapide déjà fait"; 
				p_item.style.color = colourNeutral;
			break;
			
			case OTHER_RESULTS.CANCEL : 
				p_item.innerHTML = "Annulation"; 
				p_item.style.color = colourNeutral;
			break;
			default :
				p_item.innerHTML = defaultString; 
				p_item.style.color = colourSuccess;
			break;
		}
		// How to handle a new value
		if (p_item.innerHTML != defaultString && formerValue.startsWith(p_item.innerHTML)) {
			this.counterSameState ++;
			p_item.innerHTML += " (" + (this.counterSameState + 1) + ")";
		} else {
			this.counterSameState = 0;
		}
	}
}

// --------------------------------
// Manual logs

GeneralSolver.prototype.happenedEventsLogQuick = function() {
	return this.happenedEventsLog({quick : true});
}

GeneralSolver.prototype.happenedEventsLogComplete = function() {
	return this.happenedEventsLog({complete : true});
}

GeneralSolver.prototype.happenedEventsLog = function(p_options) {
	resultLog = "";
	const displayQuick = (p_options && p_options.quick);
	const displayComplete = (p_options && p_options.complete);
	this.happenedEventsSeries.forEach(eventSerie => {
		if (eventSerie.kind == SERIE_KIND.PASS) {
			resultLog += "Pass - " + eventSerie.label + " ";
		} else if (eventSerie.kind == SERIE_KIND.GLOBAL_DEDUCTION) {
			resultLog += "Global deduction - " + eventSerie.label + " ";
		} else if (eventSerie.kind == SERIE_KIND.QUICKSTART) {
			resultLog += "Quickstart - " + (
			(eventSerie.label && eventSerie.label != null && eventSerie.label != "") ? (eventSerie.label + " ") : "" );
		} else {
			resultLog += "Hypothesis - " + (displayQuick ? eventSerie.list[0] : "");
		} 
		if (!displayQuick) {
			for (var i = 0 ; i < eventSerie.list.length ; i++) {
				event_ = eventSerie.list[i];
				if (displayComplete || (eventSerie.kind == SERIE_KIND.HYPOTHESIS && i == 0) || shouldBeLoggedEvent(event_)) { // Note : shouldBeLoggedEvent is a reserved name now !						
					resultLog += event_.toLogString(this) + " ";
				}
			}
		}
		if (resultLog.charAt(resultLog.length - 2) == '-' && resultLog.charAt(resultLog.length - 1) == ' ') { // Scrap superfluous characters
			resultLog = resultLog.substring(0, resultLog.length-2);
		}
		resultLog += "\n";
	});
	console.log(resultLog); // If 'resultLog' is simply returned, hitting solver.happenedEventsLog() or its quick variation will keep the literal \n.
}

shouldBeLoggedEvent = function(p_event) {
	return true;
}
