import Mixin from '@ember/object/mixin';
import { computed, get, set } from '@ember/object';
import { isBlank } from '@ember/utils';
import { inject as service } from '@ember/service';

const EPHEMERAL_ID_COOKIE_KEY = 'x-ephemeral-id';

export default Mixin.create({
  /**
   * Cookies service.
   * @property cookies
   * @type Ember.Service
   * @public
   */
  cookies: service(),

  /**
   * A CP that results in a hash representing request headers.
   * Basically, it's an extension to the headers object enriched
   * with the ephemeral ID.
   * @property headersWithEphemeralId
   * @type Computed<Object>
   * @tested
   */
  headersWithEphemeralId: computed('headers', 'ephemeralId', function() {
    const headers = get(this, 'headers');
    const ephemeralId = get(this, 'ephemeralId');

    if (isBlank(ephemeralId)) {
      return headers;
    }

    set(headers, 'x-ephemeral-id', ephemeralId);

    return headers;
  }),

  /**
   * Overrides init() to retrieve the value of ephemeral ID
   * from the cookies and assign it to its class member for a latter use.
   * @method init
   * @private
   * @overrides
   * @tested
   */
  init() {
    this._super(...arguments);
    this.ephemeralId = this.ephemeralIDFromCookies();
  },

  /**
   * Reads the ephemeral ID from the cookie determined by key {EPHEMERAL_ID_COOKIE_KEY}.
   * @method ephemeralIDFromCookies
   * @returns String value of ephemeral ID taken from the cookies
   * @public
   * @tested
   */
  ephemeralIDFromCookies() {
    return get(this, 'cookies').read(EPHEMERAL_ID_COOKIE_KEY);
  },

  /**
   * Updates the ephemeral ID using a new value {newEphemeralId}
   * upon the cookie determined by key {EPHEMERAL_ID_COOKIE_KEY}.
   * @method updateEphemeralIDInCookies
   * @param {String} newEphemeralId new value of ephemeral ID
   * @public
   * @tested
   */
  updateEphemeralIDInCookies(newEphemeralId) {
    get(this, 'cookies').write(EPHEMERAL_ID_COOKIE_KEY, newEphemeralId, {
      path: '/' // explicitly set path to the root to assure unique cookies lookup on refressh
    });
  },

  /**
   * Overrides headersForRequest() to return value of CP headersWithEphemeralId
   * instead of the default CP headers.
   * @method headersForRequest
   * @returns Object value of a CP headersWithEphemeralId
   * @private
   * @overrides
   * @tested
   */
  headersForRequest() {
    return get(this, 'headersWithEphemeralId');
  },

  /**
   * Overrides handleResponse() to read ephemeral ID from the response.
   * If backend provides the ephemeral ID, the method stores the value
   * as it's class member and sets the cookie.
   * @method handleResponse
   * @param {Number} status
   * @param {Object} headers
   * @param {Object} payload
   * @param {Object} requestData
   * @returns Object
   * @overrides
   * @tested
   */
  handleResponse(status, headers, payload, requestData) {
    if ('x-ephemeral-id' in headers) {
      const freshXEphemeralId = get(headers, 'x-ephemeral-id');
      const ephemeralId = get(this, 'ephemeralId');
      const ephemeralIdFromCookie = this.ephemeralIDFromCookies();

      if (isBlank(ephemeralId)) {
        set(this, 'ephemeralId', freshXEphemeralId);
      }

      if (isBlank(ephemeralIdFromCookie)) {
        this.updateEphemeralIDInCookies(freshXEphemeralId);
      }
    }

    return this._super(status, headers, payload, requestData);
  },
});
