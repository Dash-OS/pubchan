/* @flow */

import type {
  PubChan$EmitIDs,
  PubChan$Ref,
  PubChan$Callback,
  PubChan$SubscriberSet,
  PubChan$Pipeline,
  PubChan$EmitID,
  PubChan$Options,
  PubChan$CompleteCallback,
  PubChan$IDSet,
} from '../types';

import type PubChan from './pubchan';

// import { ACTIVE } from '../context';

function addSubscriberToEvent(sub, e) {
  const set = sub.PubChan.listeners.get(e) || new Set();
  set.add(sub);
  sub.pathrefs.set(e, set);
  sub.PubChan.listeners.set(e, set);
}
//
function removeSubscriber(sub) {
  // console.log('Removing Subscriber! ');
  // ACTIVE.delete(sub);
  sub.pathrefs.forEach((set, e) => {
    set.delete(sub);
    sub.pathrefs.delete(e);
    if (set.size === 0) {
      // cleanup the PubChan map when no other listeners on this event exist
      sub.PubChan.listeners.delete(e);
    }
  });
}
//
const getSubscriberOptions = (
  options: $Shape<PubChan$Options>,
): $StrictObject<PubChan$Options> => ({
  async: typeof options.async === 'boolean' ? options.async : false,
  // PubChan: options.PubChan,
});
//
function addCallbackToSubscriber(sub: Subscriber, ref: PubChan$Ref) {
  sub.callbacks.add(ref);
}

function handleRefCancellation(sub: Subscriber, ref: PubChan$Ref) {
  sub.callbacks.delete(ref);
  if (sub.callbacks.size === 0) {
    removeSubscriber(sub);
  }
}

function handleAsyncCallback(
  ref: PubChan$Ref,
  ids: PubChan$IDSet,
  args: Array<*>,
): Promise<*> {
  return new Promise(resolve => {
    if (typeof process.nextTick === 'function') {
      process.nextTick(() => resolve(executeCallback(ref, ids, args)));
    } else {
      setImmediate(() => resolve(executeCallback(ref, ids, args)));
    }
  });
}
//
function executeCallback(
  ref: PubChan$Ref,
  ids: PubChan$IDSet,
  args: Array<any>,
) {
  if (Array.isArray(ref.callback)) {
    const results = ref.callback.map(cb => cb(ref, ids, ...args));
    return results;
  }
  return ref.callback(ref, ids, ...args);
}

export default class Subscriber {
  +PubChan: PubChan;
  +callbacks: Set<PubChan$Ref> = new Set();
  // hold refs to the sets which we are subscribed to for
  // easy access and unsubscribe.
  +pathrefs: Map<PubChan$EmitID, PubChan$SubscriberSet> = new Map();

  +options: $StrictObject<PubChan$Options>;

  constructor(PubChan: PubChan, options: $Shape<PubChan$Options>): Subscriber {
    this.options = getSubscriberOptions(options);
    this.PubChan = PubChan;
    return this;
  }

  get length(): number {
    return this.callbacks.size;
  }

  get keys(): Array<PubChan$EmitID> {
    return [...this.pathrefs.keys()];
  }
  //
  to = (...args: Array<PubChan$EmitIDs>) => {
    // ACTIVE.add(this);
    args.forEach(
      el =>
        Array.isArray(el) ? this.to(...el) : addSubscriberToEvent(this, el),
    );
    return this;
  };
  //
  once = (
    callback: PubChan$Callback,
    onComplete?: PubChan$CompleteCallback,
  ) => {
    const ref = {
      once: true,
      state: {},
      callback,
      subscription: this,
      cancel: () => handleRefCancellation(this, ref),
    };
    addCallbackToSubscriber(this, ref);
    if (onComplete && typeof onComplete === 'function') {
      onComplete(ref);
    }
    return this;
  };

  do = (callback: PubChan$Callback, onComplete?: PubChan$CompleteCallback) => {
    const ref = {
      state: {},
      subscription: this,
      cancel: () => handleRefCancellation(this, ref),
      callback,
    };
    addCallbackToSubscriber(this, ref);
    if (onComplete && typeof onComplete === 'function') {
      onComplete(ref);
    }
    return this;
  };

  trigger = (pipeline: PubChan$Pipeline) => {
    const results = [];
    this.callbacks.forEach(ref => {
      let result;
      if (ref.once) {
        ref.cancel();
      }
      // const args = [ref, pipeline.emit, ...pipeline.with];
      if (!this.options.async) {
        result = executeCallback(ref, pipeline.emit, pipeline.with);
      } else {
        result = handleAsyncCallback(ref, pipeline.emit, pipeline.with);
      }
      results.push(result);
    });
    return results;
  };
}
