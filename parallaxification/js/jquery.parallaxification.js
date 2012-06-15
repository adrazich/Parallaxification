/**
* Parallaxification is a jQuery gallery plugin for easy parallax scrolling including infinite scrolling.
* \version 0.6 alpha - this plugin is currently under development
* \author Anna Drazich
* \copyright (c) 2012 Anna Drazich
* Dual licensed under the MIT and GPL licenses.
* MIT License: https://github.com/adrazich/parallaxification/blob/master/MIT-License.txt
* GPL License: https://github.com/adrazich/parallaxification/blob/master/GPL-License.txt
* Website: http://www.initanna.com/parallaxification/
* Github: https://github.com/adrazich/parallaxification
*/

function CalculateSpeed(z){
  // convert to a range of 0-100
  var oldMin = -1000; var oldMax = 1000; var newMin = 0; var newMax = 200;
  var oldRange = oldMax - oldMin;
  var newRange = newMax - newMin;
  
  // limits the user to -100 thru 100
  if (z > oldMax) z = oldMax;
  if (z < oldMin) z = oldMin;
  
  return (((z - oldMin) * newRange) / oldRange) + newMin;
}

;(function($, window, document, undefined){
  
  $.fn.parallax = function(options){
    // parallax settings
    var settings = _defaults = $.extend({
      z:null,
      useZSpeed:false,
      direction:'horizontal',
      easing:'linear',
      useVelocity:false,
      speed:500,
      animationSpeed:500,
      repeat:false,
      selector:this.selector,
      onAnimationStart: function(){},
      onAnimationEnd: function(){}
    }, options);
    
    var object = viewport = null;
    
    return this.each(function(){
      var o = this;
      var clones = null;
      Init();
      
      function animationStart(){ settings.onAnimationStart.call(this); }
      function animationEnd(){ settings.onAnimationEnd.call(this); }
      
      // initialize
      function Init(){
        viewport = { width: $(window).width(), height: $(window).height() }
    
        object = {
          width: $(o).width(),
          totalWidth: 0,
          animating: false,
          offset:0,
          margin: { left:parseInt($(o).css('margin-left')), right: parseInt($(o).css('margin-right')) }
        };
        
        if (settings.useZSpeed) settings.speed = CalculateSpeed(settings.z);
        
        if (settings.direction == 'vertical') settings.offset = $(o).css('margin-top');
        else                                  settings.offset = $(o).css('margin-left');
        
        object.totalWidth = object.margin.left + object.margin.right + object.width;

        InitClones();
      }
      
      ////////////////////////////////////
      // Events
      ////////////////////////////////////
      
      // screen resized
      $(window).on('resize', function(){
        viewport.width = $(window).width();
        viewport.height = $(window).height();
        UpdateClones();
      });
      
      // mousewheel was used
      $(window).on('mousewheel', function(e, delta){
        // are we scrolling still?
        clearTimeout($.data(this, 'timer-'+settings.selector));
        $.data(this, 'timer-'+settings.selector, setTimeout(function(){
          // scrolling has stopped
          object.animating = false;
          animationEnd();
          $(settings.selector).stop(true, false);
        }, 100));
        
        var css = {};
        var dir = delta > 0 ? '-=' : '+=';
        var vel = 1;
        if (settings.useVelocity) vel = Math.abs(delta);
        
        if (settings.direction == 'vertical')  css = { marginTop: dir+(settings.speed*vel)+'px' };
        else                                   css = { marginLeft: dir+(settings.speed*vel)+'px' };
        
        UpdateClones();
        
        // animate only if the object isn't already animating
        if (!object.animating){
          object.animating = true;
          animationStart();
          
          $(settings.selector).animate(css, settings.animationSpeed, settings.easing, function(){
            object.animating = false;
            animationEnd();
          });
        }
      });
      
      ////////////////////////////////////
      // Updates
      ////////////////////////////////////
	  setInterval(function(){
		if (object.animating){
		  UpdateClones();
		}
	  }, 250);
      
      ////////////////////////////////////
      // Clones
      ////////////////////////////////////
      
      function InitClones(){
        // Create clones if this is a repeating object
        if (settings.repeat){
          clones = { begin:0, end:0, number: { side:0, screen:1 }, animate:{ to:0, curr:0 } };
          
		  UpdateClones();
          
          // adding extra comfy room
          AddClone(true);
          AddClone(false);
        }
      }
      
      // do our clones need to be updated?
      // do we need more? - the window resized since last time we checked
      function UpdateClones(){
        if (settings.repeat && clones !== null){
          var clonesNeeded = Math.ceil(viewport.width / object.totalWidth);
          var clonesNeededForSpeed = Math.ceil(viewport.width / settings.speed);

          // If we need more to fill the screen add them
          if (clones.number.screen < clonesNeeded){
            for(var i = 0; i < clonesNeeded - clones.number.screen; i++){
              AddClone(false);
            }
            clones.number.screen = clonesNeeded;
          }
          
          // If we need more on the sides add them
          if (clones.number.side < clonesNeededForSpeed){
            for (var i = 0; i < clonesNeededForSpeed - clones.number.side; i++){
              AddClone(true);
              AddClone(false);
            }
            clones.number.side = clonesNeededForSpeed;
          }
          
          UpdateClonesPosition();
        }
      }
      
      // Add a clone to the front or the back
      function AddClone(front){
        front = front === false ? false : true;
        
        var clone = $(o).clone(true);
        
        if (front){
          var old = $(settings.selector).eq(clones.begin);
          var offset = old.offset().left - object.totalWidth;
          clone.css('margin-left', offset+'px');
          clone.insertBefore(old);
          var index = clones.begin - 1;
          clones.begin = index < 0 ? 0 : index;
          clones.end++; // if another was added the end needs to move too
        }
        else {
          var old = $(settings.selector).eq(clones.end);
          var offset = old.offset().left + object.totalWidth;
          var temp = old.offset().left;
          clone.css('margin-left', offset+'px');
          clone.insertAfter(old);
          var index = clones.end + 1;
          clones.end = index > $(settings.selector).length-1 ? $(settings.selector).length-1 : index;
        }
      }
       
      // Update the clones positions if they scroll off the screen
      function UpdateClonesPosition(){
        // check beginning
        if ($(settings.selector).eq(clones.begin).offset().left + (object.totalWidth*clones.number.side) < 0){
          // move begin to end
          tmp = $(settings.selector).eq(clones.end).offset().left + object.totalWidth;
          $(settings.selector).eq(clones.begin).stop().css('margin-left', tmp+'px');
          
          // update positions
          var next = clones.begin+1 > $(settings.selector).length-1 ? 0 : clones.begin+1;
          clones.end = clones.begin;
          clones.begin = next;
        }

        // check end
        if ($(settings.selector).eq(clones.end).offset().left - (object.totalWidth*(clones.number.side-1)+object.totalWidth) > viewport.width){
          // move end to begin
          tmp = $(settings.selector).eq(clones.begin).offset().left - object.totalWidth;
          $(settings.selector).eq(clones.end).stop().css('margin-left', tmp+'px');

          // update positions
          var prev = clones.end-1 < 0 ? $(settings.selector).length-1 : clones.end-1;   
          clones.begin = clones.end;
          clones.end = prev;
        }
      }
      
    });
  };
})(jQuery, window, document);