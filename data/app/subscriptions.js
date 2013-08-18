var YTG = YTG || {};

YTG.subscriptions = (function (YTG, subscriptions) {
	subscriptions.setup = function()
	{
		YTG.subscriptions.markVideos();

		// YT loads in more videos on big screens.
		// We wait a few seconds so we can mark those videos too.
		//
		//  I'd much prefer to bind to an AJAX event if
		//  possible.
		//
		YTG.subscriptions.timedVideoMark(2000);

		// Drop in to a longer monitoring loop
		// to mark videos watched while away
		// from the page as watched.
		YTG.subscriptions.timedVideoMark(10000, true);


		$('.feed-list-item').on('mousedown', function(e)
		{
			// We do this beause we can't directly trap
			// new tab clicks - this will make sure if someone
			// opens a video in a new tab it'll be marked
			// pretty quickly so we don't have to wait
			// for the main mark loop.
			YTG.subscriptions.timedVideoMark(2000);
		});

		// Append our show/hide toggle
		$('#channel-navigation-menu').append('<li><p> Watched videos: <span class="yt-uix-button-group vm-view-toggle" data-button-toggle-group="required"><button aria-label="Show watched videos" type="button" class="start view-toggle-button yt-uix-button yt-uix-button-default yt-uix-button-size-default yt-uix-button-empty" data-button-toggle="true" role="button" id="showVideos"><span class="yt-uix-button-content">Show</span></button></span><span class="yt-uix-button-group vm-view-toggle" data-button-toggle-group="required"><button aria-label="Hide watched videos" type="button" class="end view-toggle-button yt-uix-button yt-uix-button-default yt-uix-button-size-default yt-uix-button-empty" data-button-toggle="true" role="button" id="hideVideos"><span class="yt-uix-button-content">Hide</span></button></p></li>');

		$('#channel-navigation-menu').on('click', '.view-toggle-button', YTG.subscriptions.toggleVideos);

		YTG.subscriptions.setViewToggle();

		// Add mark all videos as watched button.
		$('#channel-navigation-menu').append('<li><p><button aria-label="Show watched videos" type="button" class="yt-uix-button yt-uix-button-default yt-uix-button-size-default yt-uix-button-empty" role="button" id="markAllVideos"><span class="yt-uix-button-content">Mark all videos as watched</span></button></p></li>');

		$('#channel-navigation-menu').on('click', '#markAllVideos', YTG.subscriptions.markAllVisibleVideos);
	};

	subscriptions.markAllVisibleVideos = function()
	{
		var videos = $('.feed-list-item');

		var videoArray = [];
		videos.each(function(idx, video)
		{
			var videoId = $(video).find('[data-context-item-type="video"]').attr('data-context-item-id');

			videoArray.push(videoId);
		});

		YTG.history.massAddToHistory(videoArray);
	};

	subscriptions.markVideos = function()
	{
		var videos = $('.feed-list-item');

		videos.each(function(idx, video)
		{
			var videoId = $(video).find('[data-context-item-type="video"]').attr('data-context-item-id');

			YTG.subscriptions.cleanVideo(video);

			if (YTG.history.videoIsInHistory(videoId))
			{
				subscriptions.markVideo(video);
			}
			else
			{
				subscriptions.unmarkVideo(video);
			}
		});
	};

	subscriptions.markVideo = function(videoElm)
	{
		if (!$(videoElm).hasClass('watched'))
		{
			$(videoElm).addClass('watched');
			$(videoElm).find('a.ux-thumb-wrap').prepend('<div class="watched-message">WATCHED</div>');
			$(videoElm).find('.ytg-mark-watched').attr('data-tooltip-text', 'Mark as unwatched');
		}

		if(subscriptions.hideVideos)
		{
			$(videoElm).hide();
		}
		else
		{
			$(videoElm).show();
		}
	};

	subscriptions.unmarkVideo = function(videoElm)
	{
		if ($(videoElm).hasClass('watched'))
		{
			$(videoElm).removeClass('watched');
			$(videoElm).find('.watched-message').remove();
			$(videoElm).find('.ytg-mark-watched').attr('data-tooltip-text', 'Mark as watched');

			$(videoElm).show();
		}
	};

	subscriptions.cleanVideo = function(videoElm)
	{
		if (!$(videoElm).hasClass('ytg-cleaned'))
		{
			var uploadString = $(videoElm).find('.feed-item-time').text() + ' by ' + $(videoElm).find('.feed-item-owner').html();

			$(videoElm).find('.feed-item-header').remove();

			var views = $(videoElm).find('[data-context-item-type="video"]').attr('data-context-item-views');

			$(videoElm).find('.yt-lockup-meta-info').html('<li><p>'+uploadString+'</p></li>');
			$(videoElm).find('.yt-lockup-meta-info').append('<li><p>'+views+'</p></li>');
			$(videoElm).find('.yt-user-name-icon-verified').remove();

			// Set up the mark as watched button. 
			var button = $(videoElm).find('.addto-watch-later-button').clone();

			button.removeClass('addto-watch-later-button');
			button.addClass('ytg-mark-watched');
			button.attr('data-tooltip-text', 'Mark as watched');

			$(videoElm).find('.contains-addto').append(button);

			$(videoElm).addClass('ytg-cleaned');
		}
	};

	subscriptions.timedVideoMark = function(ms, loop)
	{
		setTimeout(function()
		{
			// Refetch the watch history in case it changed
			YTG.platform.getStorageItem('watchHistory', function(data)
			{
				YTG.history.setHistory(data.watchHistory);
				YTG.subscriptions.markVideos();

				if (loop)
				{
					subscriptions.timedVideoMark(ms, loop);
				}
			});
		}, ms);
	};

	subscriptions.setHideVideos = function(hideVideos)
	{
		subscriptions.hideVideos = hideVideos || false;
	};

	subscriptions.toggleVideos = function()
	{
		if ($(this).hasClass('yt-uix-button-toggled'))
		{
			return false;
		}

		subscriptions.hideVideos = !subscriptions.hideVideos;
		subscriptions.setViewToggle();

		YTG.platform.setStorageItem('hideVideos', subscriptions.hideVideos);
	};

	subscriptions.setViewToggle = function()
	{
		$('#channel-navigation-menu .view-toggle-button').removeClass('yt-uix-button-toggled');

		if (subscriptions.hideVideos)
		{
			$('#hideVideos').addClass('yt-uix-button-toggled');
		}
		else
		{
			$('#showVideos').addClass('yt-uix-button-toggled');
		}

		subscriptions.markVideos();
	};

	return subscriptions;
}(YTG, YTG.subscriptions || {}));