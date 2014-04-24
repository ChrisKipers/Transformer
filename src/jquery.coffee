do ($) ->
	Transformer = require './transformer.js'
	existingTransformer = []
	$.fn.Transformer = () ->
		if arguments.length == 0 || ((options = arguments[0]) && typeof options == 'object')
			options = options || {}
			@each (_index, _value) ->
				exists = existingTransformer.some (_item, _index, _array) ->
					if _item.getElement() == _value
						true
					else
						false
				if !exists
					existingTransformer.push new Transformer(_value, options)
		else if arguments.length > 0
			args = arguments
			@each (_index, _value) ->
				for et in existingTransformer
					if et.getElement() == _value
						transformer = et
						break
				if transformer?
					transformer[args[0]].apply transformer, Array.prototype.slice.call(args, 1, args.length)
		return @
		
	$(document).on 'DOMNodeRemoved', (_e) ->
		index = -1
		for item, i in existingTransformer
			if item.getElement() == _e.target
				index = i
				break
		if ~i
			existingTransformer.splice i, 1
