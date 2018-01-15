;(function () {

  // Mock company details for debugging purpose
  var mockDetails = {
    'company_name': 'Brett C Clark',
    'company_tagline': 'Cambridge, MA\nCambridge, MA\nCambridge, MA\nCambridge, MA\n', /* optional: */
    'has_logo': true,
    'address': '245 First Street\nCambridge, MA 02142', /* optional: */
    'email_address': 'brett@prowork.io', /* optional: */
    'phone_number': '(802) 339-4600', /* optional: */
    'phone_number_e164' : "+18027458031", /* optional: */
    'allow_question': true,
    'question_prompt': 'Ask a Question', /* optional: */
    'facebook': 'https://facebook.com', /* optional: */
    'facebook_prompt': 'Follow Us on Facebook', /* optional: */
    'empty_gallery_prompt': 'No photos here yet...\nStay tuned!', /* optional: */
    'photos': /*[] ||*/ function () {
      var groups = [7, 9, 10, 11].map(function (monthNumber) {
        var photosNumber = Math.floor(Math.random() * 5 + 2);
        var date = new Date();
        date.setMonth(monthNumber);
        var elem = {
          date: date.toString()
        };
        var result = [];
        for (var i = 0; i < photosNumber; i++) {
          result.push(Object.assign({}, elem, {
            id: '8bf89d83-c900-4680-aa97-de095cd6255e'
/*
          '22137bcd-5097-9ae9-cba1-fb109ff313f7' id is missing, can't get image
          result.push(Object.assign({}, elem, {
            id: Math.random() > 0.4
                ? '22137bcd-5097-9ae9-cba1-fb109ff313f7'
                : '8bf89d83-c900-4680-aa97-de095cd6255e'
*/
          }))
        }
        return result;
      });
      return groups.reduce(function (a, b) { return a.concat(b)}, []);
    }()
  };
  // --


  $(document).ready(function () {
    var windowUrl = window.location.href;
    var isLocalHost = true || /localhost:/.test(windowUrl);
    var isMockDetails = true || /\?mock-details/.test(windowUrl);
    window._proworkApiUrl = isLocalHost
        ? 'https://prowork.io/brettclark/api/'
        : windowUrl.split('index.html')[0] + 'api/';
    window._isFormOpened = false;
    console.log('isLocalHost:', isLocalHost);
    console.log('isMockDetails:', isMockDetails);
    console.log('API url:', window._proworkApiUrl);
    return isMockDetails
        ? fillCompanyData(mockDetails) && showLoader(false)
        : loadCompanyData(fillCompanyData, showLoader)
  });


  function loadCompanyData(successFn, loaderFn) {
    if (loaderFn) {
      loaderFn(true)
    }
    $.ajax({
      type: 'POST',
      url: window._proworkApiUrl + 'details',
      success: function (data) {
        if (data.ok) {
          successFn(data.result)
        }
      },
      complete: function () {
        if (loaderFn) {
          loaderFn(false)
        }
      },
      error: function (err) {
        console.error('loadCompanyData - Error:', err)
      }
    })
  }


  function fillCompanyData(details) {
    console.log('fillCompanyData: ', details);
    // no images
    if (!details.photos.length) {
      details.emptyGallery = true;
      $('.page').addClass('page-empty-gallery');
      details.photos = [1, 2, 3, 4].map(function (val) {
        return {
          id: 'stock-' + val + '.jpg',
          date: (new Date()).toString()
        }
      })
    }
    details.photos = details.photos
        .map(function (v) {
          return {date: v.date, id: v.id, dateJS: new Date(v.date)}
        })
        .sort(function (a, b) {
          return b.dateJS - a.dateJS
        });
    var toggleHelperFn = function ($elem, value) {
      if (value) {
        $elem.show()
      } else {
        $elem.hide()
      }
      return value;
    };
    var transformFields = {
      'company_name': function (companyName) {
        document.title = companyName;
        return companyName;
      },
      'company_tagline': function (tagline, elemId) {
        toggleHelperFn($(elemId), tagline);
        setTimeout(function () {
          $(window).trigger('resize');
        }, 300);
        $(window).trigger('resize');
        return tagline.replace(/\n/ig, '<br>');
      },
      'email_address': function (email, elemId) {
        var $emailBlock = $(elemId).closest('.list-contact-item');
        return toggleHelperFn($emailBlock, email);
      },
      'address': function (address, elemId) {
        var $addressBlock = $(elemId).closest('.list-contact-item');
        toggleHelperFn($addressBlock, address);
        return address.replace(/\n/ig, '<br>');
      },
      'empty_gallery_prompt': function (egPrompt, elemId) {
        return egPrompt.replace(/\n/ig, '<br>');
      },
      'phone_number': function (phoneNumber, elemId) {
        var $emailBlock = $(elemId).closest('.list-contact-item');
        toggleHelperFn($emailBlock, phoneNumber);
        // $(elemId).attr('href', 'tel:+1' + phoneNumber.replace(/\D+/g, ''));
        return phoneNumber;
      },
      'phone_number_e164': function (phoneNumberE164) {
        $('#details_phone_number').attr('href', 'tel:' + phoneNumberE164);
      },
      'allow_question': function(isQuestionAllowed) {
        var $questionBlock = $('#details_question_prompt')
            .closest('.sidebar-action-holder');
        return toggleHelperFn($questionBlock, isQuestionAllowed);
      },
      'question_prompt': function (questionPrompt, elemId) {
        return questionPrompt || $(elemId).html();
      },
      'has_logo': function (hasLogo) {
        var $imgElem = $('#company_logo');
        return $imgElem.attr('src', hasLogo
            ? window._proworkApiUrl + 'photo?photo_id=logo'
            : 'images/logo.png');
      },
      'facebook': function (url) {
        var $facebookElem = $('#facebook-actions');
        $facebookElem.find('a')
            .attr('href', url);
        return toggleHelperFn($facebookElem, url);
      },
      'facebook_prompt': function (fbPrompt, elemId) {
        return fbPrompt || $(elemId).html();
      }
    };
    for (var key in details) {
      if (details.hasOwnProperty(key)) {
        var elemId = '#details_' + key;
        var elemText = transformFields[key]
            ? transformFields[key](details[key], elemId)
            : details[key];
        $(elemId).html(elemText);
      }
    }
    var groups = getImagesGroups(details);
    var isEmptyGallery = groups[0].isEmptyGallery;
    if (!isEmptyGallery) {
      fillAnchors(groups);
    }
    fillImagesGroups(groups);
    setTimeout(function () {
      initAnchors();
      initStickyScrollBlock();
      initDataRelated();
      if (isEmptyGallery && details['allow_question'] && !isMobile()) {
        $('.sidebar-action-toggle-form').trigger('click');
      }
    }, 500);
    return true;
  }


  function getMonthName(date) {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ][date.getMonth()]
  }


  function isMobile() {
    return $(window).width() < 768;
  }


  function getImagesGroups(details) {
    return details.photos.reduce(function (result, photo) {
      var month = getMonthName(photo.dateJS) + ' ' + photo.dateJS.getFullYear();
      var found = result.find(function (v) {
        return v.month === month
      });
      var elem = {
        isEmptyGallery: details.emptyGallery,
        month: month,
        monthId: month.replace(/\s/g, '').toLowerCase(),
        photos: []
      };
      if (!found) {
        result.push(elem);
        found = elem;
      }
      found.photos.push(photo);
      return result;
    }, []);
  }


  function fillAnchors(groups) {
    var templateClass = 'anchor-template';
    var $anchorTemplate = $('.' + templateClass);
    var $anchorParent = $anchorTemplate.parent();
    groups.forEach(function (item) {
      var $anchorBlock = $anchorTemplate
          .clone()
          .removeClass(templateClass);
      $anchorBlock.find('a')
          .attr('href', '#' + item.monthId)
          .html(item.month);
      $anchorParent.append($anchorBlock);
      $anchorBlock.show();
    });
  }


  function fillImagesGroups(groups) {
    var templateGroupClass = 'gallery-section-template';
    var $groupTemplate = $('.' + templateGroupClass);
    var $groupsParent = $('.gallery');
    var templatePhotoClass = 'gallery-item-template';
    var carouselItemClass = 'owl-carousel-item-template';

    groups.forEach(function (group) {
      var $groupBlock = $groupTemplate
          .clone()
          .attr('id', group.monthId)
          .removeClass(templateGroupClass);
      $groupBlock.find('.gallery-section-title').html(group.month);

      var $photoBlockTemplate = $groupBlock.find('.' + templatePhotoClass);
      var $carouselItemTemplate = $groupBlock.find('.' + carouselItemClass);
      group.photos.forEach(function (photo) {
        var $photoBlock = $photoBlockTemplate
            .clone()
            .removeClass(templatePhotoClass);
        var $carouselItem = $carouselItemTemplate
            .clone()
            .removeClass(carouselItemClass);
        var imgSrc = !group.isEmptyGallery
            ? window._proworkApiUrl + 'photo?photo_id=' + photo.id
            : 'images/' + photo.id;
        $photoBlock.find('img')
            .attr('src', imgSrc)
            .attr('data-image-id', photo.id);
        $carouselItem.find('img')
            .attr('src', imgSrc)
            .attr('data-image-id', photo.id);
        $groupBlock.find('.row').append($photoBlock);
        $groupBlock.find('.carousel-gallery').append($carouselItem);
        $photoBlock.show();
      });
      $photoBlockTemplate.remove();
      $carouselItemTemplate.remove();

      $groupsParent.append($groupBlock);
      $groupBlock.show();
    });
    $groupTemplate.remove();
  }


  function sendMessage() {
    /*
      first_name : string.  Required field.
      last_name : string.  Required field.
      email_address : string.  Either email or phone is required
      phone_number : string.  Either email or phone is required
      message : string.  Optional.
      g_recaptcha_response : string (not mentioned, considered as Required)
      zoomed_image : string.  Optional.
    */
    var captcha = grecaptcha.getResponse();
    var ids = ['first_name', 'last_name', 'email_address', 'phone_number', 'message'];
    var params = ids.reduce(function (result, id) {
      result[id] = $('#' + id).val() || '';
      return result;
    }, {});
    params['g_recaptcha_response'] = captcha;
    params['zoomed_image'] = '';
    var isFormValid = params[ids[0]]
        && params[ids[1]]
        && ( params[ids[2]] || params[ids[3]] );
    if (!captcha) {
      alert('Are you a human? Check the grecaptcha!')
    } else if(!isFormValid) {
      alert('You\'ve missed some fields')
    } else {
      showLoader(true);
      console.log('params to send:', params);
      // don't work for unknown reason, gives 400
      $.ajax({
        type: "POST",
        url: window._proworkApiUrl + 'message',
        data: JSON.stringify(params),
        // contentType: 'application/json',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success:  function () {
          showConfirmation(true, 'success');
          grecaptcha.reset();
          ids.forEach(function (id) {
            $('#' + id).val('').blur();
          });
        },
        error: function (err)  {
          console.error('error', err);
          showConfirmation(true, 'error');
        },
        complete: function ()     {
          showLoader(false, true);
        }
      });
    }
  }


  function toggleOverlayFn(isVisible, $elem) {
    $('body').toggleClass('overflow-hidden', isVisible);
    return isVisible ? $elem.show() : $elem.hide();
  }

  function showConfirmation(isVisible, type) {
    var $modal = $('.modal-container');
    $('.modal-content').hide();
    $('.modal-content-' + type).show();
    return toggleOverlayFn(isVisible, $modal);
  }

  function showLoader(isVisible, noDelay) {
    var $loader = $('.loader');
    var fn = toggleOverlayFn.bind(null, isVisible, $loader);
    return isVisible
        ? fn()
        : setTimeout(fn, noDelay ? 0 : 1000)
  }


  function openForm() {
    var formSelector = '.form-contact';
    if (isMobile()) {
      $(formSelector).show();
      $('.panel-bottom').toggleClass('panel-bottom-opened', true);
      $('body').toggleClass('overflow-hidden', true);
      window._isFormOpenedOnMobile = true;
    } else {
      $('.sidebar-action-toggle-form').hide();
      $(formSelector).show();
      window._isFormOpenedOnMobile = false;
    }
    window._isFormOpened = true;
  }


  function closeForm(forMobile) {
    var formSelector = '.form-contact';
    if (forMobile) {
      $(formSelector).hide();
      $('.panel-bottom').toggleClass('panel-bottom-opened', false);
      $('body').toggleClass('overflow-hidden', false);
    } else {
      $('.sidebar-action-toggle-form').show();
      $(formSelector).hide();
    }
    window._isFormOpened = false;
  }


  function initDataRelated() {
    objectFitImages('img.gallery-photo');

    $('.sidebar').stick_in_parent({
      parent: '.page'
    });

    $('.sidebar-action-toggle-form, .form-contact-button.close-form').on('click', function () {
      if (window._isFormOpened) {
        closeForm(isMobile())
      } else {
        openForm()
      }
      $('.sidebar').trigger('sticky_kit:recalc');
    });

    $('.sidebar-company').on('click', function () {
      if (isMobile()) {
        $('.sidebar-action-toggle-info').trigger('click');
      }
    });

    $('.sidebar-action-toggle-info').on('click', function () {
      $(this).toggleClass('sidebar-action-toggle-info-active');
      $('.sidebar-header-toggle-area').toggleClass('d-none');
      $('.sidebar-header').toggleClass('sidebar-header-expanded');
    });

    $('.input input, .input textarea').focus(function () {
      $(this).closest('.input').addClass('input-active');
    }).blur(function () {
      if (!$(this).val()) {
        $(this).closest('.input').removeClass('input-active');
      }
    });

    $('.gallery-item-tile').on('click', function () {
      var $self = $(this);
      var imageId = $self.find('img')
          .attr('data-image-id');
      var imgSrc = window._proworkApiUrl + 'photo?photo_id=' + imageId;
      var isSmall = $self.parent()
          .hasClass('col-6');
      var $carouselElem = $self.closest('.gallery-items')
          .find('.carousel-gallery');
      var $bigImage = $self.closest('.row')
          .find('.gallery-item-big-image');
      var $tiles = $self.closest('.gallery-items')
          .find('.col-6');
      if (isSmall) {
        $bigImage.find('img')
            .attr('src', imgSrc)
            .end()
            .show();
        $tiles.hide();
        $carouselElem.show();
      } else {
        $bigImage.hide();
        $tiles.show();
        $carouselElem.hide();
      }
      setTimeout(function () {
        $(window).trigger('resize');
        // $('.sidebar').trigger('sticky_kit:recalc');
      }, 500);
    });

    $('.owl-carousel > .gallery-item').on('click', function () {
      var imageId = $(this).find('img').attr('data-image-id');
      var imageSrc = window._proworkApiUrl + 'photo?photo_id=' + imageId;
      $(this).closest('.gallery-items')
          .find('.gallery-item-big-image img')
          .attr('src', imageSrc);
    });

    $('.owl-carousel').owlCarousel({
      items: 4,
      margin: 40,
      nav: true,
      navText: [
        "<i class='icon ci-caret-left'></i>",
        "<i class='icon ci-caret-right'></i>"],
      dots: false,
      responsive: {
        0: {margin: 15},
        768: {margin: 30},
        1200: {margin: 40}
      }
    });
  }


  $('#btn-send-message').on('click', function (evt) {
    evt.preventDefault();
    return sendMessage();
  });


  $('#btn-close-confirmation').on('click', function (evt) {
    evt.preventDefault();
    return showConfirmation(false);
  });

  // fallback for logo (gives wrong image now, 500 error)
  $('#company_logo').on('error', function (err) {
    $(this).unbind('error').attr('src', 'images/logo.png');
  });


  // initialize smooth anchor links
  function initAnchors() {
    new SmoothScroll({
      anchorLinks: '.timeline-link',
      activeClasses: 'parent',
      anchorActiveClass: 'timeline-item-selected'
    });
  }

  // initialize fixed blocks on scroll
  function initStickyScrollBlock() {
    jQuery('.gallery-section-header').stickyScrollBlock({
      setBoxHeight: true,
      activeClass: 'gallery-section-header-active',
      container: '.gallery-section',
      positionType: 'fixed',
      extraTop: function () {
        var totalHeight = $(window).width() > 767
            ? 0 : $('.sidebar-header').height();
        jQuery('0').each(function () {
          totalHeight += jQuery(this).outerHeight();
        });
        return totalHeight;
      }
    });
  }

  $(window).resize(function() {
    $('.page').css('padding-top',
        isMobile() ? $('.sidebar-header').height() : 0);
    if (window._isFormOpened) {
      if ((isMobile() && !window._isFormOpenedOnMobile)
          ||
          (!isMobile() && window._isFormOpenedOnMobile)) {
        window._isFormOpenedOnMobile = isMobile();
        closeForm(!isMobile());
        setTimeout(function () { openForm() }, 100);
      }
    }
  });

  // workaround for disabling `pinch to zoom`
  // https://stackoverflow.com/a/37859168/4828875
  document.addEventListener('touchmove', function (event) {
    if (event.scale !== 1) {
      event.preventDefault();
    }
  }, false);
  var lastTouchEnd = 0;
  document.addEventListener('touchend', function (event) {
    var now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

})();
