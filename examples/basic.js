/* @flow */

import createPubChan from '../src';

const chan = createPubChan();

// subscribe to ALL events synchronously ($ prefix denotes a possible utility event)
chan
  .subscribe()
  .to('$all', '$close')
  .do((ref, ids) => {
    console.log('EVENTS EMITTED: ', ids);
    if (ids.has('$closed')) {
      // handle channel closure
      console.log('Channel Closed!');
    } else if (ref.chan.size === 2) {
      // when we are the only ones left, close the channel
      console.log('CLOSING CHANNEL!');
      ref.chan.close();
    }
    return '*';
  });

// subscribe to 'foo' and 'bar' events asynchronously and add two different
// callbacks which can be separately cancelled easily

// subscription.cancel() / subscription.do() / subscription.to() / subscription.size
// subscriptions can occur with anything since we use `Map` and `Set`
// under the hood.
const fn = () => {};

const subscription = chan
  .subscribe({
    async: true,
  })
  .to('foo', 'bar', fn)
  .do((ref, ids, ...args) => {
    console.log('First Callback! ', args);
    if (ids.has('kill')) {
      // cancel the entire subscription
      ref.subscription.cancel();
      return 'killed';
    }
  })
  .do((ref, ids, ...args) => {
    console.log('Second Callback! ');
    if (ids.has('foo')) {
      // handle foo
    }
    if (ids.has('bar')) {
      // handle bar
      // cancel this callback only
      ref.cancel();
      return 'cancelled';
    }
  });

// emit bar twice -- second callback will only happen twice but foo or bar
// will happen both times.
chan
  .emit('bar')
  .send()
  .then(results => {
    console.log('First Bar Emit Complete! ', results);
    // ['*', undefined, 'cancelled']
    return chan.emit('bar').send();
  })
  .then(results => {
    console.log('Second bar emit complete ', results);
    // ['*', undefined]
    // send 'foo' and 'kill' events with args 'one' and 'two'
    return chan.emit('foo', 'kill').send('one', 'two');
  })
  .then(results => {
    console.log('Subscription Killed!', results);
    // ['*', 'killed']
    return chan.emit('foo', 'bar', 'kill').send();
  })
  .then(results => {
    console.log('Only Match All is Left! ', results);
    // ['*']
  })
  .catch((err: Error) => {
    // handle any errors in the chain
    console.error(err);
  });
