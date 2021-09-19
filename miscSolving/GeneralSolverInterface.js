GeneralSolver.prototype.callStateForItem = function(p_item) {
	const colorSuccess = "#008800";
	const colorFailure = "#880000";
	const colorNeutral = "#000000";
	const defaultString = "-";
	if (this.stateChangedSinceLastRefresh) {
		this.stateChangedSinceLastRefresh = false;
		const formerValue = p_item.innerHTML;
		switch (this.lastHappeningState) {
			case DEDUCTIONS_RESULT.SUCCESS : 
				p_item.innerHTML = "Déduction réussie"; 
				p_item.style.color = colorSuccess;
			break;
			case DEDUCTIONS_RESULT.HARMLESS : 
				p_item.innerHTML = "Déduction sans effet"; 
				p_item.style.color = colorNeutral;
			break;
			case DEDUCTIONS_RESULT.FAILURE : 
				p_item.innerHTML = "Déduction incorrecte"; 
				p_item.style.color = colorFailure;
			break;	
			case PASS_RESULT.SUCCESS : 
				p_item.innerHTML = "Passe réussie"; 
				p_item.style.color = colorSuccess;
			break;
			case PASS_RESULT.HARMLESS : 
				p_item.innerHTML = "Passe sans effet"; 
				p_item.style.color = colorNeutral;
			break;
			case PASS_RESULT.FAILURE : 
				p_item.innerHTML = "Echec de la passe"; 
				p_item.style.color = colorFailure;
			break;
			case GLOBAL_DEDUCTIONS_RESULT.SUCCESS : 
				p_item.innerHTML = "Déduction globale réussie"; 
				p_item.style.color = colorSuccess;
			break;
			case GLOBAL_DEDUCTIONS_RESULT.HARMLESS : 
				p_item.innerHTML = "Déduction globale sans effet"; 
				p_item.style.color = colorNeutral;
			break;
			case GLOBAL_DEDUCTIONS_RESULT.FAILURE : 
				p_item.innerHTML = "Echec de la déduction globale"; 
				p_item.style.color = colorFailure;
			break;
			case MULTIPASS_RESULT.SUCCESS : 
				p_item.innerHTML = "Multipasse réussie"; 
				p_item.style.color = colorSuccess;
			break;
			case MULTIPASS_RESULT.HARMLESS : 
				p_item.innerHTML = "Multipasse sans effet"; 
				p_item.style.color = colorNeutral;
			break;
			case MULTIPASS_RESULT.FAILURE : 
				p_item.innerHTML = "Echec de la multipasse"; 
				p_item.style.color = colorFailure;
			break;
			case OTHER_RESULTS.CANCEL : 
				p_item.innerHTML = "Annulation"; 
				p_item.style.color = colorNeutral;
			break;
			case OTHER_RESULTS.QUICKSTART : 
				p_item.innerHTML = "Démarrage rapide"; 
				p_item.style.color = colorSuccess;
			break;
			default :
				p_item.innerHTML = defaultString; 
				p_item.style.color = colorSuccess;
			break;
		}
		// How to handle a new value
		if (p_item.innerHTML != defaultString && formerValue.startsWith(p_item.innerHTML)) {
			this.counterSameState += 1;
			p_item.innerHTML += " (" + (this.counterSameState + 1) + ")";
		} else {
			this.counterSameState = 0;
		}
	}
}