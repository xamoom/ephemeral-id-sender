/* eslint-env node */
'use strict';

module.exports = function(/* environment, appConfig */) {
  return { 
    EmberENV: {
      FEATURES: {
        'ds-improved-ajax': true,
      },
    },
  };
};
