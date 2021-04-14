// Methods that are used by many inputs

//--------------------
/**
A generic straightforward function
*/
function putActionElementClick(p_idElement, p_eventFunction) {
    document.getElementById(p_idElement).addEventListener('click', p_eventFunction);
}

//--------------------
/**
View the numbers of puzzle list
*/ 
// Warning : only properties of local storage that start with "puzzleNamedListToSort" are taken into consideration. Otherwise, local storage has to be looked into !
function viewPuzzleList(p_puzzleName) {
    var answer = "Préfixe : "+p_puzzleName+" \n";
    var numericListToSort = [];
	var puzzleNamedListToSort = [];
	var suffix, intToTest;
    const baseString = "grid_is_good_" + p_puzzleName; 
	var conditionalComma;
	var conditionalBackLine="\n";
    for (var i = 0, len = localStorage.length; i < len; i++) {
        var key = localStorage.key(i);
        if (key.startsWith(baseString)) {
			suffix = key.substring(baseString.length);
			//intToTest = parseInt(suffix); // Credits for NaN test : https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/isNaN 
            //if (!isNaN(intToTest)) { // By the way, "NaN" are produced by parseInt. Good to know for when solving.
				// MISTAKE : go here : https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
			if (!isNaN(suffix) && suffix != "") { // NB : isNaN("") == true, yet parseInt("") == NaN
				intToTest = parseInt(suffix);
				numericListToSort.push(intToTest);
			} else {
				puzzleNamedListToSort.push(suffix);
			}
        } 
    }
    numericListToSort = numericListToSort.sort(function (a, b) {
        return a - b;
    });
	if (numericListToSort.length > 0) {
		answer += "Valeurs numériques : "
		conditionalComma = "";
		for (var i = 0; i < numericListToSort.length; i++) {
			answer += (conditionalComma + numericListToSort[i]);
			conditionalComma = ", ";
		}
		conditionalBackLine = "\n";
	} 
	puzzleNamedListToSort = puzzleNamedListToSort.sort();
	if (puzzleNamedListToSort.length > 0) {
		answer += conditionalBackLine+"Valeurs non numériques : ";
		conditionalComma = "";
		var start = 0;
		if (puzzleNamedListToSort[0] == "") {// Since the 0 entry may be different, no need for a conditionalComma
			answer += "<valeur vide>"
			conditionalComma = ", ";
			start = 1;
		}
		for (var i = start; i < puzzleNamedListToSort.length; i++) {
			answer += (conditionalComma + puzzleNamedListToSort[i]);
			conditionalComma = ", ";
		}
		conditionalBackLine = "\n";
	} 
    alert(answer);
}

/** 
Loads a walled grid from local storage and its region grid (cf. super-function), updates intelligence, updates canvas
*/
loadAction = function(p_canvas, p_drawer, p_solver, p_puzzleName, p_name) {
	const localStorageName = getLocalStorageName(p_puzzleName, p_name);
	const loadedString = localStorage.getItem(localStorageName);
	if (loadedString) {
		loadPuzzle(p_canvas, p_drawer, p_solver, loadedString); // Constraint !!! Each puzzle must have a method with such a name !
	} else {
        alert("Le stockage local n'a pas de propriété nommée '" + localStorageName + "'.");
    }
}