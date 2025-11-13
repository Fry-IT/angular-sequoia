(function() {
  'use strict';

  function focusTrap($timeout, $document) {
    return {
      restrict: 'A',
      scope: {
        onDeactivate: '&'
      },
      link: function (scope, element) {
        var focusableEls, firstFocusableEl, lastFocusableEl;

        var keydownHandler = function(e) {
          var isEscapePressed = (e.key === 'Escape' || e.keyCode === 27);
          var isTabPressed = (e.key === 'Tab' || e.keyCode === 9);

          if (isEscapePressed) {
            if (scope.onDeactivate) {
              scope.$apply(function() {
                scope.onDeactivate();
              });
            }
            return;
          }

          if (!isTabPressed) {
            return;
          }

          if (e.shiftKey) { // Shift + Tab
            if ($document[0].activeElement === firstFocusableEl) {
              lastFocusableEl.focus();
              e.preventDefault();
            }
          } else { // Tab
            if ($document[0].activeElement === lastFocusableEl) {
              firstFocusableEl.focus();
              e.preventDefault();
            }
          }
        };

        $timeout(function() {
          focusableEls = element[0].querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
          firstFocusableEl = focusableEls[0];
          lastFocusableEl = focusableEls[focusableEls.length - 1];

          if (firstFocusableEl) {
            firstFocusableEl.focus();
          }

          element.on('keydown', keydownHandler);
        });

        scope.$on('$destroy', function() {
          element.off('keydown', keydownHandler);
        });
      }
    };
  }

  focusTrap.$inject = ['$timeout', '$document'];

  angular.module('ngSequoia')
    .directive('focusTrap', focusTrap);
})();

