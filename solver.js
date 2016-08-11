var courier = require('./usps');
var rates = require('./uspsrates');
var problem = require('./instance');

console.log('CSP shipping rates calculator');
console.log('v0.0.1 by marek.narozniak@gmail.com');

console.log('');
console.log('Problem instance:');
console.log('- Zone:', problem.zone);
console.log('- Weight:', problem.weight, problem.unit_weight);
console.log('- Length:', problem.dimensions.l, problem.unit_dimensions);
console.log('- Width:', problem.dimensions.w, problem.unit_dimensions);
console.log('- Depth:', problem.dimensions.d, problem.unit_dimensions);

var best_price = 999999.99; // set of reals, ideally start with something infinitely large
var solutions = [];
var domain_packaging = [];

console.log('');
console.log('Applicable packaging:');

for (var i = 0; i < courier.class.length; i++) {
	var packaging = courier.class[i];
	if (!packaging.max_dimensions) {
		domain_packaging.push(packaging.name);
	} else if (fits(problem.dimensions, packaging.max_dimensions)) {
		domain_packaging.push(packaging.name);
	}
}

console.log(domain_packaging);
console.log('');
console.log('Optimal solutions:');

// ----- init max weight
var maximum_weight = 0;
for (var i = 0; i < rates.length; i++) {
	var rate = rates[i];
	if (maximum_weight < rate.max_weight) {
		maximum_weight = rate.max_weight;
	}
}

if (problem.weight > maximum_weight) {
	problem.weight = maximum_weight;
}

// ----- solve, search space of this CSP is linear O(n) where n is number of rate entries
for (var i = 0; i < rates.length; i++) {
	var rate = rates[i];
	var service_type;
	var service_packaging;
	if (rate.price > best_price) {
		continue;
	}
	if (rate.zone) {
		if (rate.zone != problem.zone) {
			continue;
		}
	}
	if (problem.weight > rate.max_weight) {
		continue;
	}
	// console.log('not');
	if (rate.criteria.length > 0) {
		var satisfied = true;
		for (var j = 0; j < rate.criteria.length; j++) {
			var criterium = rate.criteria[j];
			if (criterium.key == 'class') {
				if (!contains(criterium.value, domain_packaging)) {
					satisfied = false;
				} else {
					service_packaging = criterium.value;
				}
			}
			if (criterium.key == 'service') {
				service_type = criterium.value;
			}
		}
		if (!satisfied) {
			continue;
		}
	}
	// check if price improves
	if (rate.price < best_price) {
		solutions = [];
		best_price = rate.price;
	}
	solutions.push({
		price: rate.price,
		service: service_type,
		packaging: service_packaging
	});
//	console.log(i, 'didnt break');
}

console.log(solutions);

// ----- utilities
// checks if cuboid A fits inside cuboid B with all possible
// 90 degrees rotations
function fits(A, B) {
	var min_a = minimum(A);
	var min_b = minimum(B);
	var max_a = maximum(A);
	var max_b = maximum(B);
	var med_a = median(A);
	var med_b = median(B);
	return (min_a <= min_b && med_a <= med_b && max_a <= max_b);
}

function minimum(o) {
	var min = o.w;
	if (o.l < min) {
		min = o.l;
	}
	if (o.d < min) {
		min = o.d;
	}
	return min;
}

function maximum(o) {
	var max = o.w;
	if (o.l > max) {
		max = o.l;
	}
	if (o.d > max) {
		max = o.d;
	}
	return max;
}

function median(o) {
	var values = [o.w, o.l, o.d];
	values.sort( function(a,b) {return a - b;} );
	var half = Math.floor(values.length/2);
	if(values.length % 2) {
		return values[half];
	} else {
		return (values[half-1] + values[half]) / 2.0;
	}
}

function contains(value, array) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] === value) {
			return true;
		}
	}
	return false;
}

// console.log(fits({w: 12.0, l: 13.0, d: 12.0}, {w: 13.0, l: 12.0, d: 12.0}))
