const assert = require('assert')
const http = require('http')
const url = require('url')
const publisher = require('../lib/index')

const createMockRouter = (withOn = false) => {
  return {
    peerList: {
        on: withOn ? function (selector, fn) {
        if (this._on[selector]) {
          this._on[selector].push(fn)
        } else {
          this._on[selector] = [fn]
        }
      } : undefined,
      _on: {}
    },
    all: function (selector, fn) {
      if (this._bound[selector]) {
        this._bound[selector].push(fn)
      } else {
        this._bound[selector] = [fn]
      }
    },
    _bound: {}
  }
}

describe('webrtc-signal-http-publisher', () => {
  it('should bind to the router (old version)', () => {
    const router = createMockRouter()

    publisher(router)

    assert.strictEqual(router._bound['*'].length, 1)
    assert.strictEqual(router.peerList._on['addPeer:post'], undefined)
    assert.strictEqual(router.peerList._on['removePeer:post'], undefined)
  })

  it('should bind events (new version)', () => {
    const router = createMockRouter(true)

    publisher(router)

    assert.strictEqual(router._bound['*'], undefined)
    assert.strictEqual(router.peerList._on['addPeer:post'].length, 1)
    assert.strictEqual(router.peerList._on['removePeer:post'].length, 1)
  })

  describe('http', () => {
    let uri = ""
    let server = null

    before(() => {
      server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json'})
        res.end(JSON.stringify({status: 'OK'}))
      }).listen()

      const addr = server.address()
      uri = url.format({
        host: addr.address == '::' ? '[::]' : addr.address,
        port: addr.port,
        protocol: 'http',
        pathname: '/status'
      })
      console.log(uri)
    })

    it('should post', () => {

    })

    after(() => {
      server.close()
    })
  })
})