(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
  var Transformer, events;

  Transformer = require('./transformer.js');

  events = ['scale', 'rotate', 'translate', 'beforescale', 'beforerotate', 'beforetranslate'];

  angular.module('CK.UI', []).directive('transformer', function($parse) {
    return {
      scope: {
        listen: '&',
        enabled: '=',
        options: '@'
      },
      link: function(scope, element, attrs) {
        var e, listener, options, _i, _len;
        options = scope.options || '{}';
        options = JSON.parse(options);
        scope.transformer = new Transformer(element[0], options);
        listener = $parse(attrs.listener);
        for (_i = 0, _len = events.length; _i < _len; _i++) {
          e = events[_i];
          scope.transformer.on(e, function(_e) {
            return scope.$apply(function() {
              return scope.listen({
                '_e': _e
              });
            });
          });
        }
        return scope.$watch('enabled', function(newValue, oldValue) {
          var prop, value, _results;
          _results = [];
          for (prop in newValue) {
            value = newValue[prop];
            if (!value) {
              _results.push(scope.transformer.disable(prop));
            } else {
              _results.push(scope.transformer.enable(prop));
            }
          }
          return _results;
        }, true);
      },
      transclude: true,
      template: '<div ng-transclude></div>'
    };
  });

}).call(this);

},{"./transformer.js":2}],2:[function(require,module,exports){
(function() {
  var Transformer, Vector, defaultState, enabledDefaults, handles, shallowClone;

  Vector = require('./vector.js');

  handles = {
    'th-topLeft': {
      vectors: [new Vector(-1, 0), new Vector(0, -1)]
    },
    'th-topCenter': {
      vectors: [new Vector(0, -1)]
    },
    'th-topRight': {
      vectors: [new Vector(0, -1), new Vector(1, 0)]
    },
    'th-bottomLeft': {
      vectors: [new Vector(0, 1), new Vector(-1, 0)]
    },
    'th-bottomCenter': {
      vectors: [new Vector(0, 1)]
    },
    'th-bottomRight': {
      vectors: [new Vector(0, 1), new Vector(1, 0)]
    },
    'th-right': {
      vectors: [new Vector(1, 0)]
    },
    'th-left': {
      vectors: [new Vector(-1, 0)]
    }
  };

  shallowClone = function(_obj, _newObj) {
    var clone, prop, value;
    clone = _newObj || {};
    for (prop in _obj) {
      value = _obj[prop];
      if (clone[prop] == null) {
        clone[prop] = value;
      }
    }
    return clone;
  };

  defaultState = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0
  };

  enabledDefaults = {
    scale: true,
    rotate: true,
    translate: true
  };

  Transformer = function(_element, _options) {
    var element, enabled, executeEvent, handlers, init, start, startState, state, sub, _this;
    _this = this;
    state = null;
    enabled = null;
    element = null;
    sub = {};
    startState = null;
    init = function(_element, _options) {
      var handle, newChild, options, prop, value, vector;
      element = _element;
      element.classList.add('ck-transformable');
      options = _options || {};
      state = options.state || {};
      shallowClone(defaultState, state);
      _this.setState(state);
      enabled = options.enabled || {};
      shallowClone(enabledDefaults, enabled);
      for (prop in enabled) {
        value = enabled[prop];
        if (!value) {
          _this.disable(prop);
        }
      }
      for (handle in handles) {
        vector = handles[handle];
        newChild = document.createElement('div');
        newChild.classList.add('handle');
        newChild.classList.add(handle);
        newChild.setAttribute('name', handle);
        element.appendChild(newChild);
      }
      newChild = document.createElement('div');
      newChild.classList.add('handle');
      newChild.classList.add('rotHandle');
      newChild.setAttribute('name', 'rotHandle');
      element.appendChild(newChild);
      return _element.addEventListener('mousedown', function(_event) {
        var handler, mouseUpListener;
        _event.stopPropagation();
        start(_event);
        if (_event.target.classList.contains('rotHandle')) {
          if (enabled.rotate) {
            handler = handlers.rotationHandleMove;
            startState.activeClass = 'active-rotHandle';
          }
        } else if (_event.target.classList.contains('handle')) {
          if (enabled.scale) {
            handler = handlers.scaleHandleMove;
            startState.activeClass = 'active-' + _event.target.getAttribute('name');
          }
        } else {
          if (enabled.translate) {
            handler = handlers.handleBoxMove;
            startState.activeClass = 'active-translate';
          }
        }
        if (handler != null) {
          if (startState.activeClass) {
            element.classList.add(startState.activeClass);
          }
          document.addEventListener('mousemove', handler);
          mouseUpListener = function(_event) {
            _event.stopPropagation();
            document.removeEventListener('mousemove', handler);
            document.removeEventListener('mouseup', mouseUpListener);
            if (startState.activeClass) {
              return element.classList.remove(startState.activeClass);
            }
          };
          return document.addEventListener('mouseup', mouseUpListener);
        }
      });
    };
    _this.setState = function(_state) {
      var rotateStyle;
      state = _state;
      element.style['top'] = state.y + 'px';
      element.style['left'] = state.x + 'px';
      element.style['width'] = state.width + 'px';
      element.style['height'] = state.height + 'px';
      rotateStyle = "rotate(" + state.rotation + "deg)";
      element.style['-webkit-transform'] = rotateStyle;
      element.style['-ms-transform'] = rotateStyle;
      element.style['transform'] = rotateStyle;
      return _this;
    };
    _this.getState = function() {
      return shallowClone(state);
    };
    _this.getElement = function() {
      return element;
    };
    executeEvent = function(_eventName, _originalEvent, _state) {
      var postEvent, preEvent, preventDefault;
      preventDefault = false;
      preEvent = {
        name: 'before' + _eventName,
        originalEvent: _originalEvent,
        state: _state,
        preventDefault: function() {
          return preventDefault = true;
        }
      };
      _this.trigger(preEvent.name, preEvent);
      if (!preventDefault) {
        _this.setState(_state);
      } else {
        return;
      }
      postEvent = {
        name: _eventName,
        originalEvent: _originalEvent,
        state: _state
      };
      return _this.trigger(postEvent.name, postEvent);
    };
    start = function(_event) {
      var currentScaleVectors, handle, leftCornerVector, vector, _i, _len, _ref;
      currentScaleVectors = [];
      if (handle = handles[_event.target.getAttribute('name')]) {
        _ref = handle.vectors;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          vector = _ref[_i];
          currentScaleVectors.push({
            original: vector,
            rotated: vector.rotate(state.rotation)
          });
        }
      }
      leftCornerVector = new Vector(state.width / -2, state.height / -2).rotate(state.rotation);
      return startState = {
        x: _event.pageX,
        y: _event.pageY,
        vectors: currentScaleVectors,
        origin: {
          x: state.x + state.width / 2,
          y: state.y + state.height / 2
        },
        leftCorner: {
          x: leftCornerVector.x + (state.x + state.width / 2),
          y: leftCornerVector.y + (state.y + state.height / 2)
        },
        state: shallowClone(state)
      };
    };
    handlers = {
      scaleHandleMove: function(_event) {
        var cDiff, center, changes, cos, dragVector, hDiff, leftCornerVector, rXOffset, rYOffset, radians, sin, vector, wDiff, xDiff, yDiff, _i, _len, _ref;
        _event.stopPropagation();
        dragVector = new Vector(_event.pageX - startState.x, _event.pageY - startState.y);
        wDiff = 0;
        hDiff = 0;
        cDiff = 0;
        xDiff = 0;
        yDiff = 0;
        _ref = startState.vectors;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          vector = _ref[_i];
          cDiff = dragVector.dotProduct(vector.rotated);
          if (vector.original.x !== 0) {
            if (cDiff + startState.state.width < 0) {
              wDiff = 0 - startState.state.width;
            } else {
              wDiff = cDiff;
            }
            if (vector.original.x < 0) {
              xDiff = -1 * wDiff;
            }
          } else if (vector.original.y !== 0) {
            if (cDiff + startState.state.height < 0) {
              hDiff = 0 - startState.state.height;
            } else {
              hDiff = cDiff;
            }
            if (vector.original.y < 0) {
              yDiff = -1 * hDiff;
            }
          }
        }
        changes = {
          x: startState.state.x,
          y: startState.state.y,
          width: startState.state.width + wDiff,
          height: startState.state.height + hDiff
        };
        if (startState.state.rotation) {
          radians = startState.state.rotation * Math.PI / 180;
          sin = Math.sin(radians);
          cos = Math.cos(radians);
          rXOffset = (cos * changes.width / 2) - (sin * changes.height / 2);
          rYOffset = (cos * changes.height / 2) + (sin * changes.width / 2);
          center = {
            x: startState.leftCorner.x + rXOffset,
            y: startState.leftCorner.y + rYOffset
          };
          leftCornerVector = new Vector(startState.leftCorner.x - center.x, startState.leftCorner.y - center.y).rotate(-1 * startState.state.rotation);
          changes.x = leftCornerVector.x + center.x;
          changes.y = leftCornerVector.y + center.y;
          if (xDiff || yDiff) {
            rXOffset = (cos * xDiff) - (sin * yDiff);
            rYOffset = (cos * yDiff) + (sin * xDiff);
            changes.x += rXOffset;
            changes.y += rYOffset;
          }
        } else if (xDiff || yDiff) {
          changes.x += xDiff;
          changes.y += yDiff;
        }
        return executeEvent('scale', _event, shallowClone(startState.state, changes));
      },
      rotationHandleMove: function(_event) {
        var changes, point, rotation;
        _event.stopPropagation();
        point = {
          x: _event.pageX - startState.origin.x,
          y: _event.pageY - startState.origin.y
        };
        rotation = (Math.atan(point.y / point.x) * 180 / Math.PI) + 90;
        if (point.x < 0) {
          rotation += 180;
        }
        changes = {
          rotation: rotation
        };
        return executeEvent('rotate', _event, shallowClone(startState.state, changes));
      },
      handleBoxMove: function(_event) {
        var changes;
        _event.stopPropagation();
        changes = {
          x: startState.state.x + _event.pageX - startState.x,
          y: startState.state.y + _event.pageY - startState.y
        };
        return executeEvent('translate', _event, shallowClone(startState.state, changes));
      }
    };
    _this.on = function(_type, _handle) {
      if (sub[_type] == null) {
        sub[_type] = [];
      }
      if (!~sub[_type].indexOf(_handle)) {
        sub[_type].push(_handle);
      }
      return _this;
    };
    _this.off = function(_type, _handle) {
      var index;
      if (sub[_type] == null) {
        return;
      }
      if (_handle == null) {
        sub[_type] = null;
      } else {
        index = sub[_type].indexOf(_handle);
        if (~index) {
          sub[_type].splice(index, 1);
        }
      }
      return _this;
    };
    _this.trigger = function(_type, _event) {
      var handler, _i, _len, _ref;
      if (sub[_type] == null) {
        return;
      } else {
        _ref = sub[_type];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          handler = _ref[_i];
          handler(_event);
        }
      }
      return _this;
    };
    _this.enable = function(_feature) {
      if (enabled[_feature] != null) {
        enabled[_feature] = true;
        element.classList.remove('disable-' + _feature);
      }
      return _this;
    };
    _this.disable = function(_feature) {
      if (enabled[_feature] != null) {
        enabled[_feature] = false;
        element.classList.add('disable-' + _feature);
      }
      return _this;
    };
    return init(_element, _options);
  };

  Transformer.prototype.getOrigin = function(_state) {
    if (_state == null) {
      _state = this.getState();
    }
    return {
      x: _state.x + _state.width / 2,
      y: _state.y + _state.height / 2
    };
  };

  Transformer.prototype.getBoundingBox = function(_state) {
    var bottom, left, origin, right, rotatedCorners, top, vector, _i, _len;
    if (_state == null) {
      _state = this.getState();
    }
    origin = this.getOrigin();
    rotatedCorners = [new Vector(_state.x - origin.x, _state.y - origin.y).rotate(_state.rotation), new Vector(_state.x + _state.width - origin.x, _state.y - origin.y).rotate(_state.rotation), new Vector(_state.x - origin.x, _state.y + _state.height - origin.y).rotate(_state.rotation), new Vector(_state.x + _state.width - origin.x, _state.y + _state.height - origin.y).rotate(_state.rotation)];
    top = Number.MAX_VALUE;
    left = Number.MAX_VALUE;
    bottom = Number.MIN_VALUE;
    right = Number.MIN_VALUE;
    for (_i = 0, _len = rotatedCorners.length; _i < _len; _i++) {
      vector = rotatedCorners[_i];
      if (vector.x < left) {
        left = vector.x;
      }
      if (vector.x > right) {
        right = vector.x;
      }
      if (vector.y < top) {
        top = vector.y;
      }
      if (vector.y > bottom) {
        bottom = vector.y;
      }
    }
    return {
      x: left + origin.x,
      y: top + origin.y,
      width: right - left,
      height: bottom - top
    };
  };

  Transformer.prototype.show = function() {
    return this.getElement().classList.remove('hide');
  };

  Transformer.prototype.hide = function() {
    return this.getElement().classList.add('hide');
  };

  module.exports = Transformer;

}).call(this);

},{"./vector.js":3}],3:[function(require,module,exports){
(function() {
  var Vector;

  Vector = (function() {
    function Vector(x, y) {
      this.x = x;
      this.y = y;
    }

    Vector.prototype.rotate = function(_degree) {
      var cos, radian, sin, x, y;
      radian = _degree * Math.PI / 180;
      cos = Math.cos(radian);
      sin = Math.sin(radian);
      x = this.x * cos - this.y * sin;
      y = this.x * sin + this.y * cos;
      return new Vector(x, y);
    };

    Vector.prototype.dotProduct = function(_otherVector) {
      return this.x * _otherVector.x + this.y * _otherVector.y;
    };

    return Vector;

  })();

  module.exports = Vector;

}).call(this);

},{}]},{},[1])