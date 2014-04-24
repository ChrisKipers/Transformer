$(document).ready(function(){
	var elements = ['first', 'disable-demo', 'event-example', 'limit-example', 'hide-demo', 'alt-theme'];
	var initTransform = function(id) {
		var jElem = $('#' + id);
		var options = {
			state: {
				x: jElem.position().left,
				y: jElem.position().top,
				width: jElem.width(),
				height: 100,
				rotation: 0
			}
		}
		jElem.Transformer(options);
	}
	elements.forEach(function(item) {
		initTransform(item);
	})

	var updateDisabled = function() {
		var disabled = {
			scale: $('#disable-scale').is(':checked'),
			rotate: $('#disable-rotate').is(':checked'),
			translate: $('#disable-translate').is(':checked')
		};
		var disElem = $('#disable-demo');
		for (var prop in disabled) {
			if (disabled[prop]) {
				disElem.Transformer('disable', prop);
			} else {
				disElem.Transformer('enable', prop);
			}
		}
	}
	$('#disable-scale, #disable-rotate, #disable-translate').click(updateDisabled);
	var _eventExample = $('#event-example')
	_eventExample.Transformer('on','rotate',function(_event) {
		var color = '#D7000D';
		if (_event.state.rotation > 180) {
			color = 'blue';
		}
		_eventExample.css('background-color', color);
	})

	$('#limit-example').Transformer('on','beforerotate',function(_event) {
		if (_event.state.rotation > 45 && _event.state.rotation < 315) {
			_event.preventDefaults();
		}
	})
	var hideDemo = $('#hide-demo');
	hideDemo.Transformer('hide');
	hideDemo.dblclick(function() {
		if (hideDemo.hasClass('hide')) {
			hideDemo.Transformer('show');
		} else {
			hideDemo.Transformer('hide');
		}
	})
});

