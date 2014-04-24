$(document).ready(function(){
	$('.transformed').Transformer();
	$('#scale').Transformer('setState', {
		rotation: 0,
		x: 50,
		y: 200,
		height: 200,
		width: 100
	});
	$('#rotate').Transformer('setState', {
		rotation: 20,
		x: 250,
		y: 200,
		height: 100,
		width: 100
	});
	$('#translate').Transformer('setState', {
		rotation: 0,
		x: 500,
		y: 300,
		height: 100,
		width: 100
	});
});