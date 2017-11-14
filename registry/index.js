'use strict';Object.defineProperty(exports,'__esModule',{value:!0}),exports.pubChanEntries=exports.pubChanValues=exports.pubChanKeys=exports.hasPubChan=exports.getPubChan=void 0;var _pubchan=require('pubchan'),_pubchan2=_interopRequireDefault(_pubchan);function _interopRequireDefault(a){return a&&a.__esModule?a:{default:a}}const PUBCHANS=new Map;function handleChanCreate(a,b){PUBCHANS.set(a,b),b.subscribe().to('$closed').do((b)=>{PUBCHANS.delete(a),b.cancel()})}function getPubChan(a,b=!1){let c=PUBCHANS.get(a);return c||b||(c=(0,_pubchan2.default)(),handleChanCreate(a,c)),c}function hasPubChan(a){return PUBCHANS.has(a)}function pubChanKeys(){return[...PUBCHANS.keys()]}function pubChanValues(){return[...PUBCHANS.entries()]}function pubChanEntries(){return[...PUBCHANS.entries()]}const PubChanRegistry=Object.freeze({has:hasPubChan,get:getPubChan,keys:pubChanKeys,create:getPubChan,values:pubChanValues,entries:pubChanEntries});exports.default=PubChanRegistry,exports.getPubChan=getPubChan,exports.hasPubChan=hasPubChan,exports.pubChanKeys=pubChanKeys,exports.pubChanValues=pubChanValues,exports.pubChanEntries=pubChanEntries;