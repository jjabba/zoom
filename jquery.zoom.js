/*
	jQuery Zoom v1.7.1 - 2013-03-12
	(c) 2013 Jack Moore - jacklmoore.com/zoom
	license: http://www.opensource.org/licenses/mit-license.php
*/
(function ($) {
	var defaults = {
		url: false,
		callback: false,
		target: false,
		duration: 120,
		on: 'mouseover', // other options: 'grab', 'click', 'toggle'
		zoomOptions: {
			maxlevel: 1.0, // Between 1.0 and 5.0. Where 1.0 denotes 'natural size'
			width: Math.infinity,
			height: Math.infinity,
			maintainAspectRatio: true // zoom.width & zoom.height will be recalculated accordingly if true
		}
	};

	// Core Zoom Logic, independent of event listeners.
	$.zoom = function(target, source, img, settings) {
		var outerWidth,
			outerHeight,
			xRatio,
			yRatio,
			offset,
			position = $(target).css('position');

		// The parent element needs positioning so that the zoomed element can be correctly positioned within.
		$(target).css({
			position: /(absolute|fixed)/.test() ? position : 'relative',
			overflow: 'hidden'
		});

		// Calculate zoomed image dimentions
		var w = settings.zoomOptions.level > 1.0 ? Math.round( w * Math.min(5, Math.max( 1, settings.zoomOptions.level)) ) : img.naturalWidth;
		var h = settings.zoomOptions.level > 1.0 ? Math.round( h * Math.min(5, Math.max( 1, settings.zoomOptions.level)) ) : img.naturalHeight;

		if( settings.zoomOptions.maintainAspectRatio ) {
			if( isFinite(settings.zoomOptions.width) && !isFinite(settings.zoomOptions.height) ){
				// re-size with respect to width, maintaining aspect ratio
				var scalefactor = Math.round( settings.zoomOptions.width/img.naturalWidth );
				w = Math.round(settings.zoomOptions.width);
				h = Math.round(img.naturalHeight * scalefactor);

			}else if( isFinite(settings.zoomOptions.height) && !isFinite(settings.zoomOptions.width)){
				// re-size with respect to height, maintaining aspect ratio
				var scalefactor = Math.round( settings.zoomOptions.height/img.naturalHeight );
				h = Math.round(settings.zoomOptions.height);
				w = Math.round(img.naturalWidth * scalefactor);

			}else if(isFinite(settings.zoomOptions.width) && isFinite(settings.zoomOptions.height)){
				// width and height specified (honor aspect ratio). Let's find limiting factor.
				var scalefactor = Math.min( (Math.round( settings.zoomOptions.width/img.naturalWidth )), (Math.round( settings.zoomOptions.height/img.naturalHeight )))
				w = Math.round(scalefactor * img.naturalWidth)
				h = Math.round(scalefactor * img.naturalHeight);
			}
		}else{
			// simply force the zoom size independently for width and height (if they are set...)
			w = isFinite(settings.zoomOptions.width)  ? settings.zoomOptions.width  : w;
			h = isFinite(settings.zoomOptions.height) ? settings.zoomOptions.height : h;
		}

		$(img)
			.addClass('zoomImg')
			.css({
				position: 'absolute',
				top: 0,
				left: 0,
				opacity: 0,
				width:  w,
				height: h,
				border: 'none',
				maxWidth: 'none'
			})
			.appendTo(target);

		return {
			init: function() {
				outerWidth = $(target).outerWidth();
				outerHeight = $(target).outerHeight();
				xRatio = (img.width - outerWidth) / $(source).outerWidth();
				yRatio = (img.height - outerHeight) / $(source).outerHeight();
				offset = $(source).offset();
			},
			move: function (e) {
				var left = (e.pageX - offset.left),
					top = (e.pageY - offset.top);

				top = Math.max(Math.min(top, outerHeight), 0);
				left = Math.max(Math.min(left, outerWidth), 0);

				img.style.left = (left * -xRatio) + 'px';
				img.style.top = (top * -yRatio) + 'px';
			}
		};
	};

	$.fn.zoom = function (options) {
		return this.each(function () {
			var
			settings = $.extend(true, {}, defaults, options || {}),
			//target will display the zoomed iamge
			target = settings.target || this,
			//source will provide zoom location info (thumbnail)
			source = this,
			img = new Image(),
			$img = $(img),
			mousemove = 'mousemove',
			clicked = false;

			// If a url wasn't specified, look for an image element.
			if (!settings.url) {
				settings.url = $(source).find('img').attr('src');
				if (!settings.url) {
					return;
				}
			}

			img.onload = function () {
				var zoom = $.zoom(target, source, img, settings);

				function start(e) {
					zoom.init();
					zoom.move(e);

					// Skip the fade-in for IE8 and lower since it chokes on fading-in
					// and changing position based on mousemovement at the same time.
					$img.stop()
					.fadeTo($.support.opacity ? settings.duration : 0, 1);
				}

				function stop() {
					$img.stop()
					.fadeTo(settings.duration, 0);
				}

				if (settings.on === 'grab') {
					$(source).on('mousedown',
						function (e) {
							$(document).one('mouseup',
								function () {
									stop();

									$(document).off(mousemove, zoom.move);
								}
							);

							start(e);

							$(document).on(mousemove, zoom.move);

							e.preventDefault();
						}
					);
				} else if (settings.on === 'click') {
					$(source).on('click',
						function (e) {
							if (clicked) {
								// bubble the event up to the document to trigger the unbind.
								return;
							} else {
								clicked = true;
								start(e);
								$(document).on(mousemove, zoom.move);
								$(document).one('click',
									function () {
										stop();
										clicked = false;
										$(document).off(mousemove, zoom.move);
									}
								);
								return false;
							}
						}
					);
				} else if (settings.on === 'toggle') {
					$(source).on('click',
						function (e) {
							if (clicked) {
								stop();
							} else {
								start(e);
							}
							clicked = !clicked;
						}
					);
				} else {
					zoom.init(); // Pre-emptively call init because IE7 will fire the mousemove handler before the hover handler.

					$(source)
						.on('mouseenter', start)
						.on('mouseleave', stop)
						.on(mousemove, zoom.move);
				}

				if ($.isFunction(settings.callback)) {
					settings.callback.call(img);
				}
			};

			img.src = settings.url;
		});
	};

	$.fn.zoom.defaults = defaults;
}(window.jQuery));
