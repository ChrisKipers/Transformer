Transformer = require './transformer.js'
events = ['scale', 'rotate', 'translate', 'beforescale', 'beforerotate', 'beforetranslate']

angular.module('CK.UI', [])
	.directive 'transformer', ($parse) ->
		scope:
			listen: '&'
			enabled: '='
			options: '@'
		link: (scope, element, attrs) ->
			options = scope.options || '{}'
			options = JSON.parse options
			scope.transformer = new Transformer element[0], options
			listener = $parse(attrs.listener)
			for e in events
				scope.transformer.on e, (_e) ->
					scope.$apply () ->
						scope.listen 
							'_e': _e

			scope.$watch 'enabled', (newValue, oldValue) ->
				for prop, value of newValue
					if !value
						scope.transformer.disable prop
					else
						scope.transformer.enable prop
			, true
		transclude: true
		template: '<div ng-transclude></div>'