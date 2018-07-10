# webrtc-signal-http-publisher

[![Build Status](https://travis-ci.org/bengreenier/webrtc-signal-http-publisher.svg?branch=master)](https://travis-ci.org/bengreenier/webrtc-signal-http-publisher) [![Greenkeeper badge](https://badges.greenkeeper.io/bengreenier/webrtc-signal-http-publisher.svg)](https://greenkeeper.io/)


publish the status from webrtc-signal-http servers.

## Configuration

> Note: the following configuration values should be set in environment variables

+ `WEBRTC_PUBLISH_URI` - The uri that we will POST `json` data to when the state of the world changes. 

## Why?

You may wish to observe the state of the world. This module enables that!

It does so by hooking on the `addPeer:post` and `removePeer:post` events on a peerList attached to a router (if it's a [new](https://github.com/bengreenier/webrtc-signal-http/issues/11) peerList)
or by hooking the `/sign_in` and `/sign_out` requests (if it's an old peerList). When the hook is fired, we emit the following message:

```
{
    "totalClients": number,
    "totalSlots": number,
    "servers": {
        "<id>": {
            "slots": number
        },
        ...
    }
}
```

As documented [here](https://github.com/3DStreamingToolkit/cloud-deploy/issues/41).

## License

MIT