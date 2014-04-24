Vector = require('./vector.js');

# handles represent the 6 draggable elements on the outside of the element.
# The vectors relate to what direction the element will expend in when the handle
# is being dragged.

handles =
	'th-topLeft':
		vectors: [
			new Vector -1, 0
			new Vector 0, -1
		]
	'th-topCenter':
		vectors: [
			new Vector 0, -1
		]
	'th-topRight':
		vectors: [
			new Vector 0, -1
			new Vector 1, 0
		]
	'th-bottomLeft':
		vectors: [
			new Vector 0, 1
			new Vector -1, 0
		]
	'th-bottomCenter':
		vectors: [
			new Vector 0, 1
		]
	'th-bottomRight':
		vectors: [
			new Vector 0, 1
			new Vector 1, 0
		]
	'th-right':
		vectors: [
			new Vector 1, 0
		]
	'th-left':
		vectors: [
			new Vector -1, 0
		]

# Minimalistic clone method
shallowClone = (_obj, _newObj) ->
	clone = _newObj || {}
	for prop, value of _obj
		if !clone[prop]?
			clone[prop] = value
	clone;

# Default state of the element
defaultState =
	x: 0
	y: 0
	width: 100
	height: 100
	rotation: 0

# Default enabled features
enabledDefaults =
	scale: true
	rotate: true
	translate: true

Transformer = (_element, _options) ->
	# Private variables that we do not want plugin users to have access to
	_this = @
	state = null
	enabled = null
	element = null
	sub = {}
	startState = null

	# Initialization function that will be called after all the private methods
	# have been defined
	init = (_element, _options) ->
		element = _element
		element.classList.add 'ck-transformable'
		options = _options || {}

		# Set state of object
		state = options.state || {}
		shallowClone defaultState, state
		_this.setState state

		# Set enabled features
		enabled = options.enabled || {}
		shallowClone enabledDefaults, enabled
		for prop, value of enabled
			if !value
				_this.disable prop

		# Add all the scalling handles to the element
		for handle, vector of handles
			newChild = document.createElement 'div'
			newChild.classList.add 'handle'
			newChild.classList.add handle
			newChild.setAttribute 'name', handle
			element.appendChild newChild

		# Add the rotation handle to the element
		newChild = document.createElement 'div'
		newChild.classList.add 'handle'
		newChild.classList.add 'rotHandle'
		newChild.setAttribute 'name', 'rotHandle'
		element.appendChild newChild

		# Add mouse down listener. The purpose of the mouse down listener is to determine
		# What element is the target and attach the correct mouse moe listener to the document.
		_element.addEventListener 'mousedown', (_event) ->
			_event.stopPropagation();
			start _event

			if _event.target.classList.contains 'rotHandle'
				if enabled.rotate
					handler = handlers.rotationHandleMove;
					startState.activeClass = 'active-rotHandle';

			else if _event.target.classList.contains 'handle'
				if enabled.scale
					handler = handlers.scaleHandleMove;
					startState.activeClass = 'active-' + _event.target.getAttribute 'name'
			else
				if enabled.translate
					handler = handlers.handleBoxMove;
					startState.activeClass = 'active-translate';

			if handler?
				if startState.activeClass
					element.classList.add startState.activeClass

				document.addEventListener 'mousemove',handler
				# When mouse is released remove mousemove and mouseup listener

				mouseUpListener = (_event) ->
					_event.stopPropagation();
					document.removeEventListener 'mousemove', handler
					document.removeEventListener 'mouseup', mouseUpListener
					if startState.activeClass
						element.classList.remove startState.activeClass
				
				document.addEventListener 'mouseup', mouseUpListener

	# Sets the state of the object and updates the correct style attributes
	_this.setState = (_state) ->
		state = _state;
		element.style['top'] = state.y + 'px'
		element.style['left'] = state.x + 'px'
		element.style['width'] = state.width + 'px'
		element.style['height'] = state.height + 'px'
		rotateStyle = "rotate(#{state.rotation}deg)"
		element.style['-webkit-transform'] = rotateStyle
		element.style['-ms-transform'] = rotateStyle
		element.style['transform'] = rotateStyle
		_this;

	# Returns a clone of the state object
	_this.getState = ->
		shallowClone state

	# Returns the element object
	_this.getElement = ->
		element;

	# Sets the state of the object if the before event is not canceled
	executeEvent = (_eventName, _originalEvent, _state) ->
		preventDefault = false;
		# Create before event with required information
		preEvent =
			name: 'before' + _eventName
			originalEvent: _originalEvent
			state: _state
			preventDefault: ->
				preventDefault = true

		# Trigger before event
		_this.trigger preEvent.name, preEvent
		# If before event is not canceled, set the state of the object
		if !preventDefault
			_this.setState _state
		else
			return

		postEvent =
			name: _eventName
			originalEvent: _originalEvent
			state: _state

		# Trigger after event
		_this.trigger postEvent.name, postEvent

	# Gathers are the relivant initial event information for computing state changes.
	start = (_event) ->
		# Get the vectors for the given handle and rotate them based on the states rotation
		# Only do this if vectors are found for the handle
		currentScaleVectors = [];
		if handle = handles[_event.target.getAttribute('name')]
			for vector in handle.vectors
				currentScaleVectors.push
					original: vector
					rotated: vector.rotate(state.rotation)

        # Get the top left corner vector. This is the corner after it is rotated
		leftCornerVector = new Vector(state.width / -2, state.height / -2).rotate(state.rotation);

		# Persist a combination of computed values, event values and current state
		startState =
			x: _event.pageX
			y: _event.pageY
			vectors: currentScaleVectors
			origin:
				x: state.x + state.width / 2
				y: state.y + state.height / 2
			leftCorner:
				x: leftCornerVector.x + (state.x + state.width / 2)
				y: leftCornerVector.y + (state.y + state.height / 2)
			state: shallowClone(state)

	# Define the handlers for the 3 different features. We define them here instead of during
	# the event attaching that way we can save memory and have a specific reference to use when we
	# need to remove the listener.
	handlers =
		scaleHandleMove : (_event) ->
			_event.stopPropagation();
			# Calculate vector from handle to current mouse position
			dragVector = new Vector _event.pageX - startState.x, _event.pageY - startState.y
			wDiff = 0
			hDiff = 0
			cDiff = 0
			xDiff = 0
			yDiff = 0
			# For each vector associated with the handle, project the mouse vector onto it to get
			# Either the width or height difference
			for vector in startState.vectors
				# Get drag vectors distance along rotated handle vector
				cDiff = dragVector.dotProduct vector.rotated
				# If original x component has a value other than 0, then we change the width
				if vector.original.x != 0
					# Prevent width from being less than 0
					if cDiff + startState.state.width < 0
						wDiff = 0 - startState.state.width
					else
						wDiff = cDiff
					# If original x component is negative we need to move the position
					# As well as increase the width to make interaction look natural
					if vector.original.x < 0
						xDiff = -1 * wDiff
				# If original vectors y component has a value, that means we are changing the height
				else if vector.original.y != 0
					# Make sure height is not less than 0
					if cDiff + startState.state.height < 0
						hDiff = 0 - startState.state.height
					else
						hDiff = cDiff
                    # If original y component is negative then we have to adjust position
                    # So interaction looks natural
					if vector.original.y < 0
						yDiff = -1 * hDiff

			changes =
				x: startState.state.x
				y: startState.state.y
				width: startState.state.width + wDiff
				height: startState.state.height + hDiff

			# If the box has a rotation then we need to adjust the position so that the 
			# Dragging appears natural. We do this by calcuating a vector from the origin
			# Of the new box to the rotated left hand corner. We then rotate that vector by
			# The negative rotation which will give us the correct left corner for the unroated element.
			if startState.state.rotation
				radians = startState.state.rotation * Math.PI / 180
				sin = Math.sin radians
				cos = Math.cos radians
				rXOffset = (cos * changes.width / 2) - (sin * changes.height / 2)
				rYOffset = (cos * changes.height / 2) + (sin * changes.width / 2)
				center =
					x: startState.leftCorner.x + rXOffset
					y: startState.leftCorner.y + rYOffset
				leftCornerVector = new Vector(startState.leftCorner.x - center.x, startState.leftCorner.y - center.y).rotate -1 * startState.state.rotation
				changes.x = leftCornerVector.x + center.x
				changes.y = leftCornerVector.y + center.y
				if xDiff || yDiff
					rXOffset = (cos * xDiff) - (sin * yDiff)
					rYOffset = (cos * yDiff) + (sin * xDiff)
					changes.x += rXOffset
					changes.y += rYOffset
			else if xDiff || yDiff
				changes.x += xDiff
				changes.y += yDiff
			executeEvent 'scale', _event, shallowClone(startState.state, changes)
		rotationHandleMove: (_event) ->
			_event.stopPropagation();
			# Get the point from the origin of the object to the mouse
			point =
				x: _event.pageX - startState.origin.x
				y: _event.pageY - startState.origin.y
			# Calculate the rotation from the point 0, -1 to the calculated point
			rotation = (Math.atan(point.y / point.x) * 180 / Math.PI) + 90
			if point.x < 0
				rotation += 180
			changes =
				rotation: rotation
			executeEvent 'rotate', _event, shallowClone(startState.state, changes)
		handleBoxMove: (_event) ->
			_event.stopPropagation();
			# Calculate the difference from the initial mouse starting position and the current mouse position
			# Add the difference to the states x and y position
			changes =
				x: startState.state.x + _event.pageX - startState.x
				y: startState.state.y + _event.pageY - startState.y
			executeEvent 'translate', _event, shallowClone(startState.state, changes)

	_this.on = (_type, _handle) ->
		if !sub[_type]?
			sub[_type] = [];
		if !~sub[_type].indexOf(_handle)
			sub[_type].push(_handle);
		_this;

	_this.off = (_type, _handle) ->
		if !sub[_type]?
			return
		if !_handle?
			sub[_type] = null
		else
			index = sub[_type].indexOf _handle
			if ~index
				sub[_type].splice index, 1
		_this;

	_this.trigger = (_type, _event) ->
		if !sub[_type]?
			return
		else 
			for handler in sub[_type]
				handler(_event)
		_this

	_this.enable = (_feature) ->
		if enabled[_feature]?
			enabled[_feature] = true;
			element.classList.remove 'disable-' + _feature
		_this;

	_this.disable = (_feature) ->
		if enabled[_feature]?
			enabled[_feature] = false;
			element.classList.add 'disable-' + _feature
		_this;

	init _element, _options

Transformer.prototype.getOrigin = (_state) ->
	if !_state?
		_state = this.getState()

	x: _state.x + _state.width / 2
	y: _state.y + _state.height / 2

Transformer.prototype.getBoundingBox = (_state) ->
	if !_state?
		_state = this.getState()

	origin = this.getOrigin()
	rotatedCorners = [
		new Vector(_state.x - origin.x, _state.y - origin.y).rotate(_state.rotation) #top left
		new Vector(_state.x + _state.width - origin.x, _state.y - origin.y).rotate(_state.rotation) #top right
		new Vector(_state.x - origin.x, _state.y + _state.height - origin.y).rotate(_state.rotation) #bottom left
		new Vector(_state.x + _state.width - origin.x, _state.y + _state.height - origin.y).rotate(_state.rotation) #bottom right
	]

	top = Number.MAX_VALUE
	left = Number.MAX_VALUE
	bottom = Number.MIN_VALUE
	right = Number.MIN_VALUE
	for vector in rotatedCorners
		if vector.x < left
			left = vector.x
		if vector.x > right
			right = vector.x
		if vector.y < top
			top = vector.y
		if vector.y > bottom
			bottom = vector.y

	x: left + origin.x
	y: top + origin.y
	width: right - left
	height: bottom - top

Transformer.prototype.show = ->
	this.getElement().classList.remove 'hide'

Transformer.prototype.hide = ->
	this.getElement().classList.add 'hide'

module.exports = Transformer
