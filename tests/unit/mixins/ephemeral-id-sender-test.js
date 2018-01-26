// import { moduleFor, test } from 'ember-qunit';
import EmberObject, { get } from '@ember/object';
import { module, test } from 'qunit';

import EphemeralIdSenderMixin from 'ephemeral-id-sender/mixins/ephemeral-id-sender';

const EPHEMERAL_ID_COOKIE_KEY = 'x-ephemeral-id';

module('Unit | Mixin | ephemeral id sender');

test('should compute property headersWithEphemeralId correctly', function(assert) {
  assert.expect(1);

  const EphemeralIdSenderObject = EmberObject.extend(EphemeralIdSenderMixin);
  const subject = EphemeralIdSenderObject.create({
    headers: {
      what: 'ever',
    },
    cookies: {
      read() {
        return 'ephemeralId';
      },
    },
  });

  assert.deepEqual(
    get(subject, 'headersWithEphemeralId'),
    {
      what: 'ever',
      'x-ephemeral-id': 'ephemeralId',
    },
    'property headersWithEphemeralId computed correctly');
});

test('should override init() to set ephemeralId taking its value from the cookies service', function(assert) {
  assert.expect(2);

  const ephemeralIdMock = 'ephemeralIdMock';

  const EphemeralIdSenderObject = EmberObject.extend(EphemeralIdSenderMixin);
  const subject = EphemeralIdSenderObject.create({
    ephemeralIDFromCookies() {
      assert.ok(true, 'ephemeralIDFromCookies() was called on init()');
      return ephemeralIdMock;
    },
  });

  assert.equal(
    get(subject, 'ephemeralId'), ephemeralIdMock,
    'property ephemeralId has been set correctly');
});

test('should use ephemeralIDFromCookies() to retrieve the ephemeral ID cookie value', function(assert) {
  // assert.expect(5); 2 from init(), 2 from explicit cal + 1 as final assert

  const ephemeralIdMock = 'ephemeralIdMock';

  const EphemeralIdSenderObject = EmberObject.extend(EphemeralIdSenderMixin);
  const subject = EphemeralIdSenderObject.create({
    cookies: {
      read(key) {
        assert.ok(true, 'read() was called');
        assert.equal(key, EPHEMERAL_ID_COOKIE_KEY, 'key the ephemeral ID is stored in the cookies passed to the read() function is ok');
        return ephemeralIdMock;
      },
    },
  });

  assert.equal(
    subject.ephemeralIDFromCookies(), ephemeralIdMock,
    'ephemeralIDFromCookies() delegates to read() method of the cookies service passing its return value further');
});

test('should override headersForRequest() to retrieve the enriched headers instead of the default headers', function(assert) {
  assert.expect(1);

  const EphemeralIdSenderObject = EmberObject.extend(EphemeralIdSenderMixin);
  const subject = EphemeralIdSenderObject.create({
    headers: {},
    cookies: {
      read() {
        return 'ephemeralIdMock';
      },
    },
  });

  assert.equal(
    subject.headersForRequest(),
    get(subject, 'headersWithEphemeralId'),
    'headersForRequest() returns the (value of) CP headersWithEphemeralId');
});


test('should do nothing if x-ephemeral-id is absent in the received headers', function(assert) {
  assert.expect(1);

  const headers = {}; // empty headers, no ephemeral ID provided

  const EphemeralIdSenderObject = EmberObject.extend(EphemeralIdSenderMixin);
  const subject = EphemeralIdSenderObject.create({
    cookies: {
      read() {
        return 'ephemeralIdMock';
      },
    },
  });

  subject.handleResponse(null, headers);

  assert.equal(
    'ephemeralIdMock',
    get(subject, 'ephemeralId'),
    'handleResponse() does not update ephemeralId class member if headers do not contain it');
});


test('should do nothing if x-ephemeral-id is present in the received headers but it is already set', function(assert) {
  assert.expect(1);

  const headers = {
    'x-ephemeral-id': 'new-ephemeral-id',
  };

  const EphemeralIdSenderObject = EmberObject.extend(EphemeralIdSenderMixin);
  const subject = EphemeralIdSenderObject.create({
    cookies: {
      read() {
        return 'ephemeralIdMock';
      },
    },
    updateEphemeralIDInCookies() {
      assert.ok(false, 'updateEphemeralIDInCookies() was called but was not supposed to be called');
    },
  });

  subject.handleResponse(null, headers);

  assert.equal(
    'ephemeralIdMock',
    get(subject, 'ephemeralId'),
    'handleResponse() does not update ephemeralId class member if ephemeralId is already set even though headers contain it');
});


test('should take the given x-ephemeral-id if not set yet', function(assert) {
  assert.expect(3);

  const headers = {
    'x-ephemeral-id': 'new-ephemeral-id',
  };

  const EphemeralIdSenderObject = EmberObject.extend(EphemeralIdSenderMixin);
  const subject = EphemeralIdSenderObject.create({
    cookies: {
      read() {
        return null;
      },
    },
    updateEphemeralIDInCookies(newEphemeralId) {
      assert.ok(true, 'updateEphemeralIDInCookies() was called');
      assert.equal(newEphemeralId, headers['x-ephemeral-id'],
        'the new ephemeral ID as arg passed to updateEphemeralIDInCookies() is correct');
    },
  });

  subject.handleResponse(null, headers);

  assert.equal(
    get(subject, 'ephemeralId'),
    'new-ephemeral-id',
    'handleResponse()pdates ephemeralId class member if it was not set yet and received headers contain it');
});
