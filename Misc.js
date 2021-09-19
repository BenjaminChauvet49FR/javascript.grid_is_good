// Intersection of two integer lists with ascending values
function intersectAscendingValues(p_sortedValues1, p_sortedValues2) {
	var answer = [];
	var i1 = 0;
	var i2 = 0;
	var val1, val2;
	while (i1 < p_sortedValues1.length && i2 < p_sortedValues2.length) {
		val1 = p_sortedValues1[i1];
		val2 = p_sortedValues2[i2];
		if (val1 == val2) {
			answer.push(val1);
			i1++;
			i2++;
		} else if (val1 < val2) {
			i1++;
		} else {
			i2++;
		}
	}
	return answer;
}

// If a sorted list contains an integer
function getIndexInSortedArray(p_array, p_number) {
	var iMin = 0;
	var iMax = p_array.length-1;
	while (iMin < iMax) {
		iMed = Math.floor((iMin + iMax) / 2);
		if (p_array[iMed] == p_number) {
			return iMed;
		} else if (p_array[iMed] < p_number) {
			iMin = iMed+1;
		} else {
			iMax = iMed-1;
		}
	}
	return (p_array[iMin] == p_number) ? iMin : null;
}

// Array of values 0 to n (included)
function numericSequenceArray(p_min, p_max, p_incr) {
	var answer = [];
	const incr = (p_incr ? p_incr : 1);
	for (var i = p_min ; i <= p_max ; i += incr) {
		answer.push(i);
	}
	return answer;
}