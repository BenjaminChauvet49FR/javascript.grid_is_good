const TAPA_INDEX_NOT_FOUND = -1;

// ALL classic valid Tapa combinations, ordered. No one is forgotten !
// (otherwise they should be added at the end to avoid getting in trouble with already saved puzzles)
const TAPA_COMBINATIONS = [
"0", // They may be needed, sometimes... well they are gonna be eliminated by Quickstart
"1",
"2",
"3",
"4",
"5",
"6",
"7",
"8", 
"?",
"11",
"21",
"22",
"31",
"32",
"33",
"41",
"42",
"51",
"1?",
"2?",
"3?",
"4?",
"5?", // Redundant with "51"
"??",
"111",
"211",
"221",
"311",
"11?",
"21?",
"22?", // Redundant with "221"
"31?", // Redundant with "311"
"1??",
"2??",
"3??", // Redundant with "311"
"???",
"1111",
"111?", // I doubt this one and the ones below will ever appear in a grid.
"11??",
"1???",
"????"
];

function indexTapaCombination(p_clue) {
	var i = 0;
	while (i < TAPA_COMBINATIONS.length && TAPA_COMBINATIONS[i] != p_clue) {
		i++;
	}
	if (i == TAPA_COMBINATIONS.length) {
		return TAPA_INDEX_NOT_FOUND;
	}
	return i;
}

function sortTapaCluesInGrid(p_array) {
	for (var iy = 0 ; iy < p_array.length ; iy++) {
		for (var ix = 0 ; ix < p_array[iy].length ; ix++) {
			if (p_array[iy][ix] != null) {
				p_array[iy][ix] = sortedTapaClueString(p_array[iy][ix]);
			}
		}
	}
}

function sortedTapaClueString(p_string) {
	var arrayChars = [];
	for (var i = 0 ; i < p_string.length ; i++) {
		arrayChars.push(p_string.charAt(i));
	}
	arrayChars.sort(function(a, b) { 
		if (a == b) return 0;
		if (a == "?") return 1;
		if (b == "?") return -1;
		if (a < b) return 1;
		if (a > b) return -1;
		return 0;
	});
	var clue = "";
	arrayChars.forEach(c => {
		clue += c;
	});
	return clue;
}


